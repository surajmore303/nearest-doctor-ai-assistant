const express = require('express');
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

  // Try Bedrock first
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

  // Full fallback
  const reply = getFallbackResponse(message);
  res.json({ reply, fallback: true });
});

function getFallbackResponse(message) {
  const msg = message.toLowerCase();

  // ── EMERGENCY ──────────────────────────────────────────────────────────────
  if (/chest pain|heart attack|stroke|can't breathe|cannot breathe|severe bleeding|unconscious|overdose/.test(msg))
    return `🚨 **This sounds like a medical emergency!**\n\n**Please call emergency services (112 / 911) immediately or go to the nearest emergency room.**\n\nDo not drive yourself. Stay calm, sit or lie down, and wait for help.\n\n> ⚠️ Do NOT rely on AI in emergencies. Call for help NOW.`;

  // ── FLU / COLD / COUGH / SORE THROAT ──────────────────────────────────────
  if (/flu|influenza|common symptoms of flu/.test(msg))
    return `## 🤧 Common Symptoms of Flu\n\n**Flu (Influenza) symptoms include:**\n- High fever (38–40°C / 100–104°F)\n- Severe body aches and muscle pain\n- Headache\n- Dry cough\n- Sore throat\n- Runny or stuffy nose\n- Fatigue and weakness\n- Chills and sweating\n- Loss of appetite\n\n**How flu differs from a cold:**\n- Flu comes on suddenly; cold develops gradually\n- Flu causes more severe fatigue and body aches\n\n**Home care:**\n- Rest and stay hydrated\n- Take paracetamol/ibuprofen for fever and aches\n- Warm soups and fluids help\n\n**See a doctor if:**\n- Difficulty breathing\n- Symptoms worsen after 5–7 days\n- High-risk groups: elderly, children, pregnant women\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  if (/cough|cold|sore throat/.test(msg))
    return `## 🤒 Cold & Cough Information\n\n**Common symptoms:**\n- Runny or stuffy nose\n- Sore throat\n- Cough (dry or productive)\n- Mild fever\n- Fatigue\n\n**Home care:**\n- Rest and drink plenty of fluids\n- Honey + warm water for sore throat\n- Steam inhalation for congestion\n- Gargle with warm salt water\n- Vitamin C and zinc may help recovery\n\n**See a doctor if:**\n- Symptoms worsen after 7 days\n- High fever or difficulty breathing\n- Chest pain or wheezing\n- Coughing up blood\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── FEVER ──────────────────────────────────────────────────────────────────
  if (/fever|temperature|what should i do if i have a fever/.test(msg))
    return `## 🌡️ What To Do If You Have a Fever\n\n**A fever is a temperature above 38°C (100.4°F).**\n\n**Immediate steps:**\n- Stay hydrated — drink water, juice, or electrolyte drinks\n- Rest as much as possible\n- Apply a cool, damp cloth to your forehead\n- Wear light clothing and keep the room cool\n- Take paracetamol or ibuprofen (follow dosage instructions)\n\n**Monitor your temperature:**\n- Mild: 38–38.9°C — rest and fluids\n- Moderate: 39–39.4°C — medication recommended\n- High: 39.5°C+ — seek medical attention\n\n**See a doctor immediately if:**\n- Fever exceeds 39.5°C (103°F)\n- Lasts more than 3 days\n- Accompanied by severe headache, stiff neck, or rash\n- Difficulty breathing or chest pain\n- Fever in infants under 3 months\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── HIGH BLOOD PRESSURE ────────────────────────────────────────────────────
  if (/blood pressure|hypertension|prevent high blood pressure/.test(msg))
    return `## 💓 How to Prevent High Blood Pressure\n\n**Normal blood pressure:** Below 120/80 mmHg\n**High blood pressure (Hypertension):** 130/80 mmHg or above\n\n**Prevention tips:**\n- 🥗 Eat a low-sodium, heart-healthy diet (DASH diet)\n- 🏃 Exercise at least 30 minutes most days\n- ⚖️ Maintain a healthy body weight\n- 🚭 Quit smoking\n- 🍷 Limit alcohol consumption\n- 😌 Manage stress through meditation, yoga, or deep breathing\n- 💤 Get 7–9 hours of quality sleep\n- ☕ Limit caffeine intake\n\n**Warning signs of high BP (often none — "silent killer"):**\n- Headaches (especially in the morning)\n- Dizziness or lightheadedness\n- Blurred vision\n- Nosebleeds\n- Shortness of breath\n\n**Get checked regularly** — especially if you have a family history of hypertension.\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── DIABETES ───────────────────────────────────────────────────────────────
  if (/diabetes|blood sugar|insulin|early signs of diabetes/.test(msg))
    return `## 🩸 Early Signs of Diabetes\n\n**Common early warning signs:**\n- 🚽 Frequent urination (especially at night)\n- 💧 Excessive thirst\n- 😴 Unexplained fatigue\n- 👁️ Blurred vision\n- ⚖️ Unexplained weight loss (Type 1)\n- 🐢 Slow-healing wounds or cuts\n- 🦶 Tingling or numbness in hands/feet\n- 🍽️ Increased hunger even after eating\n- 🔁 Frequent infections (skin, gum, bladder)\n\n**Types of Diabetes:**\n- **Type 1:** Body doesn't produce insulin (autoimmune)\n- **Type 2:** Body doesn't use insulin effectively (most common)\n- **Gestational:** Occurs during pregnancy\n\n**Prevention (Type 2):**\n- Maintain healthy weight\n- Exercise regularly (150 min/week)\n- Eat a balanced diet — reduce sugar and refined carbs\n- Avoid smoking\n- Regular blood sugar screening\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── STRESS & ANXIETY ───────────────────────────────────────────────────────
  if (/stress|anxiety|manage stress|mental health|worry|panic/.test(msg))
    return `## 🧘 How to Manage Stress and Anxiety\n\n**Effective stress management techniques:**\n\n**Immediate relief:**\n- 🌬️ Deep breathing — inhale 4 sec, hold 4 sec, exhale 6 sec\n- 🚶 Take a short walk outside\n- 🎵 Listen to calming music\n- 💧 Drink a glass of cold water\n\n**Daily habits:**\n- 🏃 Regular exercise (releases endorphins)\n- 😴 Prioritize 7–9 hours of sleep\n- 🥗 Eat a balanced, nutritious diet\n- 📵 Limit social media and news consumption\n- 📓 Journaling — write down your thoughts\n- 🧘 Practice mindfulness or meditation (apps: Headspace, Calm)\n- 👥 Talk to a trusted friend or family member\n\n**Signs you should seek professional help:**\n- Anxiety interfering with daily life\n- Panic attacks\n- Persistent sadness lasting 2+ weeks\n- Thoughts of self-harm\n\n**Resources:** Talk to a mental health professional or call a helpline.\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── HEADACHE ───────────────────────────────────────────────────────────────
  if (/headache|head pain|migraine|frequent headache|causes.*headache/.test(msg))
    return `## 🤕 What Causes Frequent Headaches?\n\n**Most common causes:**\n- 💧 Dehydration (most common!)\n- 😰 Stress and tension\n- 😴 Poor sleep or oversleeping\n- 👁️ Eye strain (screens)\n- ☕ Too much or too little caffeine\n- 🍷 Alcohol or certain foods\n- 🌡️ Fever or illness\n- 💊 Medication overuse\n- 🧠 Hormonal changes\n\n**Types of headaches:**\n- **Tension headache:** Dull pressure around the head\n- **Migraine:** Throbbing pain, often one side, with nausea/light sensitivity\n- **Cluster headache:** Severe pain around one eye\n\n**Relief tips:**\n- Drink 2 glasses of water immediately\n- Rest in a quiet, dark room\n- Apply cold or warm compress to forehead/neck\n- Over-the-counter pain relievers (paracetamol/ibuprofen)\n- Gentle neck stretches\n\n**See a doctor if:**\n- Sudden, severe "thunderclap" headache\n- Headache with fever, stiff neck, or confusion\n- Headaches becoming more frequent or severe\n- Headache after head injury\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── SLEEP ──────────────────────────────────────────────────────────────────
  if (/sleep|insomnia|how much sleep|tired|fatigue|rest/.test(msg))
    return `## 😴 How Much Sleep Do Adults Need?\n\n**Recommended sleep by age:**\n- 👶 Newborns (0–3 months): 14–17 hours\n- 🧒 School-age (6–13): 9–11 hours\n- 🧑 Teenagers (14–17): 8–10 hours\n- 🧑‍💼 Adults (18–64): **7–9 hours**\n- 👴 Older adults (65+): 7–8 hours\n\n**Tips for better sleep:**\n- 🕙 Keep a consistent sleep schedule (same time every day)\n- 📵 No screens 1 hour before bed\n- 🌡️ Keep bedroom cool, dark, and quiet\n- ☕ Avoid caffeine after 2 PM\n- 🏃 Exercise regularly (but not right before bed)\n- 🧘 Try relaxation techniques before sleep\n- 🛏️ Use your bed only for sleep\n\n**Signs of sleep deprivation:**\n- Difficulty concentrating\n- Mood changes and irritability\n- Weakened immune system\n- Weight gain\n- Increased risk of heart disease and diabetes\n\n**See a doctor if:**\n- You consistently can't fall or stay asleep\n- You snore loudly or stop breathing during sleep (sleep apnea)\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── DEHYDRATION ────────────────────────────────────────────────────────────
  if (/dehydration|dehydrated|water|thirst|signs of dehydration/.test(msg))
    return `## 💧 Signs of Dehydration\n\n**Early signs:**\n- 🌵 Dry mouth and lips\n- 🟡 Dark yellow urine\n- 😴 Fatigue and low energy\n- 🤕 Headache\n- 😵 Dizziness or lightheadedness\n- 😤 Difficulty concentrating\n\n**Severe signs (seek medical help):**\n- Very dark or no urine for 8+ hours\n- Rapid heartbeat\n- Sunken eyes\n- Confusion or disorientation\n- Fainting\n\n**How much water to drink:**\n- 💧 Adults: **8 glasses (2 litres) per day** minimum\n- More if exercising, hot weather, or illness\n- Eat water-rich foods: cucumber, watermelon, oranges\n\n**Quick rehydration tips:**\n- Sip water steadily throughout the day\n- Add electrolytes (ORS/sports drinks) if severely dehydrated\n- Avoid alcohol and excessive caffeine\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── BACK PAIN ──────────────────────────────────────────────────────────────
  if (/back pain|spine|lower back|backache/.test(msg))
    return `## 🦴 Back Pain Information\n\n**Common causes:**\n- Poor posture (sitting for long hours)\n- Muscle strain or sprain\n- Herniated disc\n- Arthritis\n- Osteoporosis\n\n**Home relief:**\n- Apply ice (first 48 hrs) then heat\n- Gentle stretching and walking\n- Over-the-counter pain relievers\n- Avoid bed rest — stay gently active\n\n**Prevention:**\n- Maintain good posture\n- Strengthen core muscles\n- Use ergonomic chair/desk setup\n- Lift objects with your legs, not your back\n- Maintain healthy weight\n\n**See a doctor if:**\n- Pain radiates down your leg\n- Numbness or weakness in legs\n- Pain after an injury\n- Bladder or bowel problems\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── STOMACH / DIGESTION ────────────────────────────────────────────────────
  if (/stomach|digestion|nausea|vomit|diarrhea|constipation|bloating|gastric|acidity|heartburn/.test(msg))
    return `## 🫃 Digestive Health Information\n\n**Common digestive issues:**\n\n**Nausea/Vomiting:**\n- Sip clear fluids slowly\n- Eat bland foods (toast, rice, bananas)\n- Avoid dairy and fatty foods\n- Rest in a semi-upright position\n\n**Diarrhea:**\n- Stay hydrated with ORS (oral rehydration solution)\n- Eat BRAT diet: Bananas, Rice, Applesauce, Toast\n- Avoid dairy, caffeine, and spicy foods\n\n**Constipation:**\n- Drink more water\n- Eat high-fiber foods (fruits, vegetables, whole grains)\n- Exercise regularly\n- Don't ignore the urge to go\n\n**Heartburn/Acidity:**\n- Avoid spicy, fatty, and acidic foods\n- Don't lie down right after eating\n- Eat smaller, more frequent meals\n- Antacids can provide quick relief\n\n**See a doctor if:**\n- Blood in stool or vomit\n- Severe abdominal pain\n- Symptoms lasting more than 2 days\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── WEIGHT / OBESITY ───────────────────────────────────────────────────────
  if (/weight|obesity|overweight|bmi|lose weight|diet/.test(msg))
    return `## ⚖️ Healthy Weight Management\n\n**Healthy BMI range:** 18.5 – 24.9\n\n**Tips for healthy weight:**\n- 🥗 Eat balanced meals — more vegetables, lean protein, whole grains\n- 🍽️ Control portion sizes\n- 🚫 Avoid processed foods, sugary drinks, and fast food\n- 🏃 Exercise 150 minutes per week (moderate intensity)\n- 💧 Drink water before meals\n- 😴 Get enough sleep (poor sleep increases hunger hormones)\n- 📊 Track your food intake\n\n**Avoid crash diets** — they cause muscle loss and rebound weight gain.\n\n**Health risks of obesity:**\n- Type 2 diabetes\n- Heart disease\n- High blood pressure\n- Sleep apnea\n- Joint problems\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── SKIN ───────────────────────────────────────────────────────────────────
  if (/skin|rash|acne|eczema|psoriasis|itching|allergy/.test(msg))
    return `## 🧴 Skin Health Information\n\n**Common skin conditions:**\n\n**Acne:**\n- Wash face twice daily with gentle cleanser\n- Don't pop pimples\n- Use non-comedogenic moisturizer\n- Avoid touching your face\n\n**Rash/Itching:**\n- Identify and avoid the trigger\n- Apply cool compress\n- Use fragrance-free moisturizer\n- Antihistamines can relieve itching\n\n**Eczema:**\n- Moisturize frequently\n- Avoid harsh soaps and hot showers\n- Wear soft, breathable fabrics\n\n**General skin care:**\n- 🌞 Use SPF 30+ sunscreen daily\n- 💧 Stay hydrated\n- 🥗 Eat antioxidant-rich foods\n- 😴 Get enough sleep\n\n**See a doctor if:**\n- Rash spreads rapidly or is painful\n- Skin changes color or texture suddenly\n- Mole changes shape, size, or color\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── HEART ──────────────────────────────────────────────────────────────────
  if (/heart|cardiac|cholesterol|cardiovascular/.test(msg))
    return `## ❤️ Heart Health Information\n\n**Risk factors for heart disease:**\n- High blood pressure\n- High cholesterol\n- Smoking\n- Diabetes\n- Obesity\n- Physical inactivity\n- Family history\n\n**Prevention tips:**\n- 🥗 Eat heart-healthy foods (Mediterranean diet)\n- 🏃 Exercise 30 min/day, 5 days/week\n- 🚭 Quit smoking\n- 🍷 Limit alcohol\n- 😌 Manage stress\n- 💊 Control blood pressure and cholesterol\n- 🩺 Regular health check-ups\n\n**Warning signs of heart attack:**\n- Chest pain or pressure\n- Pain radiating to arm, jaw, or back\n- Shortness of breath\n- Nausea and cold sweat\n- Sudden dizziness\n\n🚨 **If you suspect a heart attack — call 112/911 immediately!**\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── NUTRITION / VITAMINS ───────────────────────────────────────────────────
  if (/nutrition|vitamin|mineral|supplement|healthy eating|food|diet plan/.test(msg))
    return `## 🥗 Nutrition & Healthy Eating\n\n**Essential nutrients your body needs:**\n- 🥩 **Protein:** Meat, fish, eggs, legumes, dairy\n- 🌾 **Carbohydrates:** Whole grains, fruits, vegetables\n- 🥑 **Healthy fats:** Avocado, nuts, olive oil, fish\n- 🥦 **Vitamins & Minerals:** Colorful fruits and vegetables\n- 💧 **Water:** 2+ litres per day\n\n**Key vitamins:**\n- **Vitamin D:** Sunlight, fatty fish, fortified foods (bone health, immunity)\n- **Vitamin C:** Citrus, berries, peppers (immunity, skin)\n- **Iron:** Red meat, spinach, lentils (energy, blood)\n- **Calcium:** Dairy, leafy greens (bones, teeth)\n- **B12:** Meat, eggs, dairy (nerve function, energy)\n\n**Healthy eating tips:**\n- Eat 5 portions of fruit/vegetables daily\n- Choose whole grains over refined\n- Limit sugar, salt, and saturated fat\n- Don't skip breakfast\n- Eat mindfully — no screens while eating\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── EXERCISE / FITNESS ─────────────────────────────────────────────────────
  if (/exercise|workout|fitness|physical activity|gym/.test(msg))
    return `## 🏃 Exercise & Physical Activity\n\n**WHO recommended activity levels:**\n- Adults: **150–300 min moderate** or **75–150 min vigorous** activity per week\n- Plus muscle-strengthening 2+ days/week\n\n**Benefits of regular exercise:**\n- Reduces risk of heart disease, diabetes, cancer\n- Improves mental health and mood\n- Helps maintain healthy weight\n- Strengthens bones and muscles\n- Improves sleep quality\n- Boosts energy levels\n\n**Easy ways to start:**\n- 🚶 Walk 30 minutes daily\n- 🚴 Cycling or swimming\n- 🧘 Yoga or stretching\n- 🏠 Home workouts (no equipment needed)\n\n**Safety tips:**\n- Warm up before and cool down after\n- Stay hydrated\n- Start slowly and increase gradually\n- Listen to your body — rest if in pain\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── COVID / RESPIRATORY ────────────────────────────────────────────────────
  if (/covid|corona|respiratory|lung|pneumonia|tuberculosis/.test(msg))
    return `## 🫁 Respiratory Health Information\n\n**COVID-19 symptoms:**\n- Fever, cough, fatigue\n- Loss of taste or smell\n- Sore throat, headache\n- Difficulty breathing (severe cases)\n\n**General respiratory care:**\n- Stay up to date with vaccinations\n- Wash hands frequently\n- Wear a mask in crowded/enclosed spaces\n- Avoid smoking and secondhand smoke\n- Ventilate indoor spaces\n\n**When to seek emergency care:**\n- Difficulty breathing or shortness of breath\n- Persistent chest pain\n- Confusion or inability to stay awake\n- Bluish lips or face\n\n🚨 **These are emergency symptoms — call 112/911 immediately.**\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── PREGNANCY ──────────────────────────────────────────────────────────────
  if (/pregnant|pregnancy|prenatal|baby|trimester/.test(msg))
    return `## 🤰 Pregnancy Health Information\n\n**Key prenatal care tips:**\n- Start prenatal vitamins (especially folic acid) early\n- Attend all prenatal check-ups\n- Eat a balanced, nutritious diet\n- Stay hydrated\n- Avoid alcohol, smoking, and raw/undercooked foods\n- Gentle exercise (walking, prenatal yoga) is beneficial\n- Get adequate rest\n\n**Common pregnancy symptoms:**\n- Morning sickness (nausea/vomiting)\n- Fatigue\n- Back pain\n- Swollen feet\n- Heartburn\n\n**Warning signs — seek immediate care:**\n- Heavy bleeding\n- Severe abdominal pain\n- Sudden swelling of face/hands\n- Decreased fetal movement\n- High fever\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── CHILDREN'S HEALTH ──────────────────────────────────────────────────────
  if (/child|children|baby|infant|kid|pediatric|vaccination/.test(msg))
    return `## 👶 Children's Health Information\n\n**Key aspects of child health:**\n\n**Vaccinations:**\n- Follow your country's immunization schedule\n- Vaccines protect against measles, polio, hepatitis, and more\n- Keep vaccination records updated\n\n**Nutrition for children:**\n- Breastfeed exclusively for first 6 months\n- Introduce diverse foods gradually\n- Limit sugar, salt, and processed foods\n- Ensure adequate calcium and vitamin D\n\n**Development milestones:**\n- Regular check-ups help track growth\n- Early intervention is key for developmental delays\n\n**Common childhood illnesses:**\n- Fever, ear infections, stomach bugs\n- Most resolve with rest and fluids\n\n**When to see a doctor:**\n- Fever in infants under 3 months\n- Difficulty breathing\n- Persistent vomiting or diarrhea\n- Unusual rash\n- Behavioral changes\n\n> ⚠️ *This is general health information only — not a substitute for professional medical advice.*`;

  // ── GENERAL / CATCH-ALL ────────────────────────────────────────────────────
  return `## 🏥 Health Information\n\nThank you for your question. I'm **HealthAI**, your Medical Assistant and Smart Healthcare Guide.\n\n**I can provide information on:**\n- 🤒 Symptoms & what they might indicate\n- 🛡️ Preventive care & healthy lifestyle tips\n- 💊 General health awareness\n- 🧘 Mental health & stress management\n- 🥗 Nutrition & exercise guidance\n- 🏥 When to seek medical help\n\n**Try asking me about:**\n- "What are symptoms of flu?"\n- "How to manage stress and anxiety?"\n- "What are signs of dehydration?"\n- "How much sleep do adults need?"\n- "How to prevent diabetes?"\n\nOr describe your specific symptoms and I'll provide relevant health information.\n\n> ⚠️ *I am NOT a replacement for professional medical advice. Always consult a qualified healthcare provider for diagnosis and treatment.*`;
}

module.exports = router;
