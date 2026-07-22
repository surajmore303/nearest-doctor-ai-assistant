const express = require('express');
const axios = require('axios');
const router = express.Router();

let BedrockClient = null;
let InvokeModelCommand = null;
try {
  const bedrock = require('@aws-sdk/client-bedrock-runtime');
  BedrockClient = bedrock.BedrockRuntimeClient;
  InvokeModelCommand = bedrock.InvokeModelCommand;
} catch (e) {}

const SYSTEM_PROMPT = `You are HealthAI, a GenAI-powered Medical Assistant and Smart Healthcare Guide integrated into NearestDoctor platform.
Your role: provide reliable, evidence-based health awareness, explain symptoms, suggest preventive care, answer health questions with empathy.
Rules: Always add disclaimer you are NOT a replacement for professional medical advice. Never diagnose definitively. Never prescribe medications. For emergencies say call 112/911 immediately. Be concise and use bullet points.`;

router.post('/chat', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  // 1. Try Gemini API if key is provided
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (geminiApiKey) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          contents: [
            {
              role: 'user',
              parts: [{ text: `${SYSTEM_PROMPT}\n\nUser Question: ${message}` }]
            }
          ]
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      );
      const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) {
        return res.json({ reply });
      }
    } catch (err) {
      console.error('Gemini API error:', err.message);
    }
  }

  // 2. Try AWS Bedrock if configured
  if (BedrockClient && InvokeModelCommand && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_ID !== 'your_aws_access_key_here') {
    try {
      const client = new BedrockClient({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
      const messages = [
        ...history.map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message }
      ];
      const command = new InvokeModelCommand({
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({ anthropic_version: 'bedrock-2023-05-31', max_tokens: 1024, system: SYSTEM_PROMPT, messages }),
      });
      const response = await client.send(command);
      const result = JSON.parse(Buffer.from(response.body).toString('utf8'));
      return res.json({ reply: result.content[0].text });
    } catch (err) {
      console.error('Bedrock error:', err.message);
    }
  }

  // 3. Structured Medical Database Response Fallback
  const reply = getFallbackResponse(message);
  res.json({ reply, fallback: true });
});

function getFallbackResponse(message) {
  const msg = message.toLowerCase();

  // ── EMERGENCY ──────────────────────────────────────────────────────────────
  if (/chest pain|heart attack|stroke|can't breathe|cannot breathe|severe bleeding|unconscious|overdose/.test(msg))
    return `🚨 **This sounds like a medical emergency!**\n\n**Please call emergency services (112 / 911) immediately or go to the nearest emergency room.**\n\nDo not drive yourself. Stay calm, sit or lie down, and wait for help.\n\n> ⚠️ Do NOT rely on AI in emergencies. Call for help NOW.`;

  // ── FLU / COLD / COUGH / SORE THROAT / BUKHAR / KHASI ─────────────────────
  if (/flu|influenza|common symptoms of flu/.test(msg))
    return `## 🤧 Common Symptoms of Flu (Influenza)\n\n**Flu symptoms include:**\n- High fever (38–40°C / 100–104°F)\n- Severe body aches and muscle pain\n- Headache\n- Dry cough\n- Sore throat\n- Runny or stuffy nose\n- Fatigue and weakness\n- Chills and sweating\n- Loss of appetite\n\n**How flu differs from a cold:**\n- Flu comes on suddenly; cold develops gradually\n- Flu causes more severe fatigue and body aches\n\n**Home care & Prevention:**\n- Rest adequately and stay well hydrated\n- Take paracetamol/ibuprofen for fever and body pain\n- Warm soups, herbal teas, and steam inhalation help relieve symptoms\n- Annual flu vaccination is recommended\n\n**See a doctor if:**\n- Difficulty breathing or chest pressure\n- Symptoms worsen after 5–7 days\n- High-risk groups: elderly, young children, pregnant women\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  if (/cough|cold|sore throat|khasi|zukaam/.test(msg))
    return `## 🤒 Cold & Cough Information\n\n**Common symptoms:**\n- Runny or stuffy nose\n- Sore throat\n- Cough (dry or chesty)\n- Mild fever\n- Body fatigue\n\n**Home care:**\n- Rest and drink plenty of warm fluids\n- Honey + warm water or ginger tea for sore throat\n- Steam inhalation for nasal congestion\n- Gargle with warm salt water\n- Vitamin C and zinc supplements may aid recovery\n\n**See a doctor if:**\n- Symptoms worsen after 7 days\n- High fever or difficulty breathing\n- Coughing up blood or dark phlegm\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── FEVER / BUKHAR ────────────────────────────────────────────────────────
  if (/fever|temperature|bukhar|what should i do if i have a fever/.test(msg))
    return `## 🌡️ What To Do If You Have a Fever\n\n**A fever is a body temperature above 38°C (100.4°F).**\n\n**Immediate steps to take:**\n- Stay hydrated — drink water, oral rehydration solutions (ORS), or warm broth\n- Rest as much as possible\n- Apply a cool, damp cloth to your forehead and neck\n- Wear light, breathable clothing and keep room temperature comfortable\n- Take paracetamol or ibuprofen according to package instructions\n\n**Temperature guidelines:**\n- Mild: 38–38.9°C — rest and fluids\n- Moderate: 39–39.4°C — anti-fever medication recommended\n- High: 39.5°C+ — consult a doctor promptly\n\n**See a doctor immediately if:**\n- Fever exceeds 39.5°C (103°F)\n- Fever persists for more than 3 days\n- Accompanied by severe headache, stiff neck, rash, or confusion\n- Difficulty breathing or chest pain\n- Fever in infants under 3 months\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── HIGH BLOOD PRESSURE / HYPERTENSION / BP ───────────────────────────────
  if (/blood pressure|hypertension|prevent high blood pressure|\bbp\b/.test(msg))
    return `## 💓 How to Prevent & Manage High Blood Pressure (Hypertension)\n\n**Blood Pressure Categories:**\n- **Normal:** Below 120/80 mmHg\n- **Elevated:** 120-129 / <80 mmHg\n- **High Blood Pressure:** 130/80 mmHg or higher\n\n**Prevention & Lifestyle Measures:**\n- 🥗 Eat a low-sodium, heart-healthy diet rich in potassium (DASH diet)\n- 🏃 Engage in 30 minutes of moderate exercise most days\n- ⚖️ Maintain a healthy body weight and BMI\n- 🚭 Avoid tobacco and smoking\n- 🍷 Limit alcohol consumption\n- 😌 Practice stress reduction (meditation, yoga, deep breathing)\n- 💤 Aim for 7–9 hours of restful sleep daily\n- ☕ Limit excessive caffeine\n\n**Warning signs (High BP is often silent):**\n- Morning headaches\n- Dizziness or lightheadedness\n- Blurred vision\n- Shortness of breath\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── DIABETES / BLOOD SUGAR ─────────────────────────────────────────────────
  if (/diabetes|blood sugar|insulin|sugar level|early signs of diabetes/.test(msg))
    return `## 🩸 Early Signs & Prevention of Diabetes\n\n**Common early warning signs:**\n- 🚽 Frequent urination (polyuria), especially at night\n- 💧 Excessive thirst (polydipsia)\n- 😴 Constant fatigue and weakness\n- 👁️ Blurred or hazy vision\n- ⚖️ Unexplained weight loss\n- 🐢 Slow-healing cuts or bruises\n- 🦶 Tingling, pain, or numbness in hands/feet\n- 🍽️ Frequent extreme hunger\n\n**Key Diabetes Types:**\n- **Type 1:** Autoimmune condition where pancreas produces little/no insulin\n- **Type 2:** Metabolic condition where cells become insulin resistant (85-90% of cases)\n- **Gestational:** High blood sugar developing during pregnancy\n\n**Prevention Tips for Type 2 Diabetes:**\n- Exercise regularly (at least 150 minutes per week)\n- Choose whole grains, legumes, and high-fiber foods over refined sugars\n- Monitor blood glucose levels regularly if at high risk\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── STRESS & ANXIETY / MENTAL HEALTH ──────────────────────────────────────
  if (/stress|anxiety|manage stress|mental health|worry|panic|tension/.test(msg))
    return `## 🧘 Managing Stress and Anxiety\n\n**Effective techniques for immediate and long-term relief:**\n\n**Quick calming exercises:**\n- 🌬️ **4-7-8 Breathing:** Inhale for 4s, hold for 7s, exhale slowly for 8s\n- 🚶 Take a 10-minute walk outdoors\n- 💧 Drink a glass of cold water\n- 🎵 Listen to relaxing music or nature sounds\n\n**Long-term wellness habits:**\n- 🏃 Exercise daily to naturally boost endorphins\n- 😴 Maintain a consistent 7-9 hour sleep routine\n- 🥗 Limit caffeine, sugar, and processed foods\n- 📓 Keep a journal to express and organize thoughts\n- 🧘 Practice daily mindfulness meditation\n- 👥 Connect regularly with supportive family or friends\n\n**When to seek professional support:**\n- Anxiety interfering with daily work or sleep\n- Panic attacks or overwhelming fear\n- Prolonged low mood lasting more than 2 weeks\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── HEADACHE / MIGRAINE / SIR DARD ───────────────────────────────────────
  if (/headache|head pain|migraine|frequent headache|sir dard|causes.*headache/.test(msg))
    return `## 🤕 Causes & Relief for Frequent Headaches\n\n**Common triggers of headaches:**\n- 💧 Dehydration (one of the primary causes!)\n- 😰 Stress and muscular tension in neck/shoulders\n- 😴 Poor sleep patterns or fatigue\n- 👁️ Digital eye strain from screen time\n- ☕ Caffeine withdrawal or excessive intake\n- 🌡️ Sinus congestion or fever\n- 🧠 Hormonal fluctuations\n\n**Types of headaches:**\n- **Tension Headache:** Constant dull ache around whole head\n- **Migraine:** Throbbing, intense pain often on one side with light/sound sensitivity or nausea\n- **Sinus Headache:** Pressure around forehead, cheeks, and eyes\n\n**Immediate relief tips:**\n- Drink 2 large glasses of water\n- Rest in a quiet, darkened room\n- Apply a cool compress to forehead or neck\n- Gentle neck and shoulder stretching\n- Over-the-counter paracetamol or ibuprofen\n\n**Seek immediate medical attention if:**\n- Sudden, severe "thunderclap" headache\n- Headache accompanied by fever, stiff neck, confusion, or numbness\n- Headache following a head injury\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── SLEEP / INSOMNIA / NEEND ──────────────────────────────────────────────
  if (/sleep|insomnia|how much sleep|tired|fatigue|rest|neend/.test(msg))
    return `## 😴 How Much Sleep Do Adults Need & Improving Sleep Quality\n\n**Recommended Sleep Duration:**\n- 👶 Infants (4-12 mos): 12–16 hours\n- 🧒 Children (6-12 yrs): 9–12 hours\n- 🧑 Teens (13-18 yrs): 8–10 hours\n- 🧑‍💼 Adults (18–64 yrs): **7–9 hours**\n- 👴 Seniors (65+ yrs): 7–8 hours\n\n**Tips for Better Sleep (Sleep Hygiene):**\n- 🕙 Go to bed and wake up at the exact same time daily\n- 📵 Turn off screens (phones, TV) 1 hour before bed\n- 🌡️ Keep bedroom dark, quiet, and cool (around 18-20°C / 65-68°F)\n- ☕ Avoid caffeine after 2:00 PM\n- 🍷 Avoid alcohol and heavy meals near bedtime\n- 🧘 Practice wind-down activities like reading or gentle stretching\n\n**When to see a sleep specialist:**\n- Persistent insomnia lasting over a month\n- Loud snoring or gasping for air during sleep (sleep apnea signs)\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── DEHYDRATION / WATER / PANI ────────────────────────────────────────────
  if (/dehydration|dehydrated|water|thirst|signs of dehydration|pani/.test(msg))
    return `## 💧 Signs of Dehydration & Hydration Tips\n\n**Common early signs:**\n- 🌵 Dry or sticky mouth and lips\n- 🟡 Dark yellow or strong-smelling urine\n- 😴 Unexplained fatigue or sluggishness\n- 🤕 Headache or lightheadedness\n- 😵 Muscle cramps\n- 😤 Irritability and low focus\n\n**Severe dehydration signs (seek emergency medical help):**\n- Sunken eyes\n- Extreme thirst with no urine output for 8+ hours\n- Rapid heart rate and breathing\n- Confusion, dizziness, or fainting\n\n**Daily Water Recommendations:**\n- 💧 Men: ~3.7 liters (13 cups) total fluid per day\n- 💧 Women: ~2.7 liters (9 cups) total fluid per day\n- Drink extra during exercise, hot weather, or fever/illness\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── DENGUE / MALARIA / TYPHOID / VIRAL FEVER ─────────────────────────────
  if (/dengue|malaria|typhoid|viral fever/.test(msg))
    return `## 🦟 Vector-Borne & Viral Fevers (Dengue, Malaria, Typhoid)\n\n**Key Symptoms:**\n- **Dengue:** High sudden fever, severe headache, severe retro-orbital (behind eye) pain, joint/muscle pain, skin rash, low blood platelets\n- **Malaria:** High fever with shaking chills, sweating, headache, nausea, muscle aches\n- **Typhoid:** Sustained high fever, stomach pain, weakness, headache, rose-colored spots\n\n**Immediate Precautions:**\n- Take a blood test (CBC, Dengue NS1/IgM, Malaria Smear, Widal) as advised by a doctor\n- Take paracetamol for fever — **Avoid NSAIDs like Aspirin/Ibuprofen in Dengue as they increase bleeding risk!**\n- Drink plenty of fluids (ORS, coconut water, fresh juices)\n- Rest completely\n\n**Red Flag Symptoms (Hospitalize immediately):**\n- Bleeding from nose/gums or dark blood in stool\n- Persistent vomiting or severe abdominal pain\n- Extreme weakness or difficulty waking up\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── ASTHMA / RESPIRATORY / BREATHING ──────────────────────────────────────
  if (/asthma|breathing|shortness of breath|wheezing|saans/.test(msg))
    return `## 🫁 Asthma & Respiratory Care\n\n**Common Asthma Symptoms:**\n- Wheezing (whistling sound when breathing)\n- Shortness of breath\n- Chest tightness or pain\n- Persistent coughing, especially at night or early morning\n\n**Common Triggers:**\n- Dust mites, pet dander, pollen, mold\n- Cold air, smoke, pollution\n- Physical exertion\n- Respiratory infections (cold/flu)\n\n**Management & Care:**\n- Keep quick-relief rescue inhaler (salbutamol/albuterol) accessible\n- Take prescribed controller inhalers regularly\n- Avoid known environmental triggers\n- Use air purifiers and maintain clean indoor air\n\n🚨 **Emergency Warning:** If breathing difficulty is severe, lips turn blue, or rescue inhaler gives no relief, call 112/911 immediately!\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── THYROID ───────────────────────────────────────────────────────────────
  if (/thyroid|hypothyroid|hyperthyroid|tsh/.test(msg))
    return `## 🦋 Thyroid Health Overview\n\n**Common Types:**\n- **Hypothyroidism (Underactive Thyroid):** Low thyroid hormone levels\n  - Symptoms: Fatigue, weight gain, cold sensitivity, dry skin, constipation, hair thinning\n- **Hyperthyroidism (Overactive Thyroid):** Excess thyroid hormone levels\n  - Symptoms: Rapid heartbeat, weight loss, heat intolerance, nervousness, sweating, tremors\n\n**Management:**\n- Regular blood tests (TSH, Free T3, Free T4)\n- Take prescribed thyroid medication (e.g. Levothyroxine) consistently on an empty stomach in the morning\n- Follow a nutritious, iodine-balanced diet\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── KIDNEY / UTI ──────────────────────────────────────────────────────────
  if (/kidney|uti|urinary|urine infection|burning urine/.test(msg))
    return `## 🚽 Kidney & Urinary Tract Health (UTI)\n\n**Common UTI Symptoms:**\n- Burning sensation or pain during urination\n- Strong, persistent urge to urinate\n- Cloudy, dark, or foul-smelling urine\n- Pelvic pain or lower abdominal discomfort\n- Mild fever\n\n**Prevention & Home Care:**\n- Drink 2.5–3 liters of water daily to flush bacteria\n- Don't hold back urine when you feel the urge\n- Maintain good personal hygiene\n- Drink unsweetened cranberry juice\n\n**When to see a doctor:**\n- Back or side pain (flank pain), high fever, or chills (may indicate kidney infection)\n- Blood in urine\n- Symptoms not improving after 48 hours\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── BACK PAIN / JOINT PAIN / ARTHRITIS ───────────────────────────────────
  if (/back pain|spine|lower back|backache|joint pain|arthritis/.test(msg))
    return `## 🦴 Back & Joint Pain Care\n\n**Common Causes:**\n- Poor posture (sitting for prolonged periods)\n- Muscle strain or sprain\n- Disc herniation or sciatica\n- Osteoarthritis or Rheumatoid Arthritis\n- Lack of regular physical activity\n\n**Home Relief Measures:**\n- Apply ice packs for acute injury (first 48h), then warm compresses for muscle stiffness\n- Maintain gentle walking and light stretching\n- Use ergonomic chairs with proper lumbar support\n- Over-the-counter topical pain gels or paracetamol\n\n**Preventative Tips:**\n- Core-strengthening exercises (planks, yoga)\n- Maintain a healthy body weight to reduce joint load\n- Always lift heavy objects using your knees/legs, not your back\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── STOMACH / DIGESTION / ACIDITY / PET DARD ─────────────────────────────
  if (/stomach|digestion|nausea|vomit|diarrhea|constipation|bloating|gastric|acidity|heartburn|pet dard/.test(msg))
    return `## 🫃 Digestive Health & Acidity Management\n\n**Acidity & Heartburn:**\n- Avoid lying down immediately after meals (wait 2–3 hours)\n- Reduce spicy, oily, acidic, and deep-fried foods\n- Eat smaller, more frequent meals\n- Antacids or cold milk can provide temporary relief\n\n**Nausea & Upset Stomach:**\n- Sip clear fluids (water, ORS, mint tea) slowly\n- Follow the BRAT diet: Bananas, Rice, Applesauce, Toast\n- Avoid dairy, caffeine, and spicy foods\n\n**Diarrhea & Constipation:**\n- Diarrhea: Drink ORS continuously to prevent electrolyte loss\n- Constipation: Increase dietary fiber (fruits, oats, vegetables) and drink 3L water daily\n\n**Consult a doctor if:**\n- Severe, sharp abdominal pain\n- Blood in vomit or stool\n- High fever or dehydration signs\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── WEIGHT / OBESITY / DIET ───────────────────────────────────────────────
  if (/weight|obesity|overweight|bmi|lose weight|diet/.test(msg))
    return `## ⚖️ Healthy Weight Management\n\n**Healthy BMI Range:** 18.5 – 24.9 kg/m²\n\n**Sustainable Weight Loss Tips:**\n- 🥗 Focus on high-protein, high-fiber whole foods that promote satiety\n- 🍽️ Practice portion control and mindful eating\n- 🚫 Avoid sugary beverages, processed snacks, and trans fats\n- 🏃 Combine 150 min cardio per week with 2 days of strength training\n- 💧 Drink a glass of water 30 minutes before meals\n- 😴 Aim for 7–9 hours of quality sleep daily\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── SKIN / ALLERGY / RASH ──────────────────────────────────────────────────
  if (/skin|rash|acne|eczema|psoriasis|itching|allergy/.test(msg))
    return `## 🧴 Skin Health & Allergy Guide\n\n**Common Conditions & Tips:**\n- **Acne:** Cleanse twice daily with a mild wash, avoid picking pimples, use non-comedogenic moisturizers\n- **Rashes & Itching:** Apply cool compresses, use gentle fragrance-free moisturizers, avoid hot showers\n- **Sun Care:** Apply broad-spectrum SPF 30+ sunscreen daily\n- **Hydration:** Drink 2.5–3L water daily for healthy skin barrier\n\n**Consult a dermatologist if:**\n- Rash spreads rapidly, blisters, or becomes painful\n- Signs of skin infection (pus, warmth, severe redness)\n- Moles changing shape, color, or size\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── HEART / CARDIAC / CHOLESTEROL ─────────────────────────────────────────
  if (/heart|cardiac|cholesterol|cardiovascular/.test(msg))
    return `## ❤️ Heart Health & Cholesterol Guide\n\n**Key Heart Health Factors:**\n- Keep Blood Pressure below 120/80 mmHg\n- Maintain Total Cholesterol < 200 mg/dL and LDL < 100 mg/dL\n- Maintain normal blood sugar levels\n\n**Heart-Healthy Lifestyle Habits:**\n- 🥗 Eat a Mediterranean-style diet (olive oil, nuts, fish, vegetables, oats)\n- 🏃 Exercise for 30 minutes daily\n- 🚭 Quit smoking completely\n- 🍷 Limit alcohol and sodium intake\n- 😌 Practice regular stress management\n\n🚨 **Heart Attack Red Flags:** Chest pressure/tightness, pain spreading to arm/jaw, cold sweats, nausea, shortness of breath. Call 112/911 immediately!\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── GENERAL / CATCH-ALL HEALTH ASSISTANT RESPONSE ─────────────────────────
  return `## 🏥 HealthAI Medical Assistant\n\nThank you for your question. I'm **HealthAI**, your Smart Healthcare Guide.\n\n**I can help you with health guidance on:**\n- 🤒 Symptoms & Common Diseases (Flu, Fever, Diabetes, Dengue, BP, Asthma, etc.)\n- 🛡️ Preventive Care & Healthy Lifestyle Tips\n- 💊 General Health Awareness & Nutrition\n- 🧘 Stress Management & Mental Well-being\n- 🏥 Knowing When to Consult a Doctor\n\n**Try asking about:**\n- *"What are common symptoms of flu?"*\n- *"How can I prevent high blood pressure?"*\n- *"What should I do if I have a fever?"*\n- *"What are early signs of diabetes?"*\n- *"How to manage stress and anxiety?"*\n- *"What causes frequent headaches?"*\n- *"How much sleep do adults need?"*\n- *"What are signs of dehydration?"*\n\nOr type any symptoms or health topics you'd like to learn about!\n\n> ⚠️ *I am NOT a replacement for professional medical advice. Always consult a qualified healthcare provider for diagnosis and treatment.*`;
}

module.exports = router;
