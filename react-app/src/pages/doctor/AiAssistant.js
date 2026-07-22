import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import API_BASE_URL from '../../api-config';
import Iconify from '../../components/common/Iconify';
import AuthService from '../../services/auth.service';
import Swal from 'sweetalert2';

const CATEGORIZED_QUESTIONS = [
  {
    category: "🤒 Symptoms & Illness",
    questions: [
      "What are common symptoms of flu?",
      "What should I do if I have a fever?",
      "What causes frequent headaches?",
    ]
  },
  {
    category: "🩸 Chronic Care (BP & Diabetes)",
    questions: [
      "How can I prevent high blood pressure?",
      "What are early signs of diabetes?",
    ]
  },
  {
    category: "🧘 Wellness & Mind",
    questions: [
      "How to manage stress and anxiety?",
      "How much sleep do adults need?",
      "What are signs of dehydration?",
    ]
  }
];

const getOfflineDiseaseResponse = (query) => {
  const msg = query.toLowerCase();

  if (/chest pain|heart attack|stroke|can't breathe|cannot breathe|severe bleeding|unconscious|overdose/.test(msg)) {
    return `🚨 **EMERGENCY TRIAGE ALERT!**\n\n**This sounds like a severe medical emergency!**\n\n**Immediate Actions:**\n- 📞 Call emergency response services (**112 / 108 / 911**) immediately.\n- 🏥 Transport patient to nearest emergency room.\n- 🧘 Stay calm, sit or lie down with elevated head.\n\n> ⚠️ *Do NOT rely on AI in emergencies. Emergency medical attention required NOW.*`;
  }

  if (/flu|influenza|common symptoms of flu/.test(msg)) {
    return `## 🤧 Common Symptoms of Flu (Influenza)\n\n**Flu symptoms include:**\n- High fever (38–40°C / 100–104°F)\n- Severe body aches and muscle pain\n- Headache\n- Dry cough & Sore throat\n- Runny or stuffy nose\n- Fatigue and weakness\n\n**Home care & Recovery:**\n- Rest adequately and drink 3L water/hydrating fluids daily\n- Take paracetamol/ibuprofen for fever and body pain\n- Warm soups, herbal teas, and steam inhalation help relieve symptoms\n\n**See a doctor if:**\n- Difficulty breathing or chest pressure\n- Symptoms worsen after 5–7 days\n\n> ⚠️ *General health information — not a substitute for professional medical advice.*`;
  }

  if (/cough|cold|sore throat|khasi|zukaam/.test(msg)) {
    return `## 🤒 Cold & Cough Information\n\n**Common symptoms:**\n- Runny or stuffy nose\n- Sore throat\n- Cough (dry or chesty)\n- Mild fever & fatigue\n\n**Home care:**\n- Rest and drink warm fluids\n- Honey + warm water or ginger tea for sore throat\n- Steam inhalation for nasal congestion\n- Gargle with warm salt water\n\n> ⚠️ *General health information — not a substitute for professional medical advice.*`;
  }

  if (/fever|temperature|bukhar|what should i do if i have a fever/.test(msg)) {
    return `## 🌡️ What To Do If You Have a Fever\n\n**Immediate steps to take:**\n- Stay hydrated — drink water, oral rehydration solutions (ORS)\n- Apply cool, damp cloth to forehead and neck\n- Wear light, breathable clothing\n- Take paracetamol according to dosage instructions\n\n**Temperature guidelines:**\n- Mild: 38–38.9°C — rest and fluids\n- Moderate: 39–39.4°C — fever medication recommended\n- High: 39.5°C+ — consult a doctor promptly\n\n> ⚠️ *General health information — not a substitute for professional medical advice.*`;
  }

  if (/blood pressure|hypertension|prevent high blood pressure|\bbp\b/.test(msg)) {
    return `## 💓 How to Prevent & Manage High Blood Pressure (Hypertension)\n\n**Prevention & Lifestyle Measures:**\n- 🥗 Low-sodium, heart-healthy diet (DASH diet)\n- 🏃 30 minutes of moderate exercise daily\n- ⚖️ Maintain healthy body weight\n- 🚭 Avoid tobacco and smoking\n- 😌 Practice stress reduction (yoga, deep breathing)\n\n> ⚠️ *General health information — not a substitute for professional medical advice.*`;
  }

  if (/diabetes|blood sugar|insulin|sugar level|early signs of diabetes/.test(msg)) {
    return `## 🩸 Early Signs & Prevention of Diabetes\n\n**Common early warning signs:**\n- 🚽 Frequent urination, especially at night\n- 💧 Excessive thirst & dry mouth\n- 😴 Constant fatigue and weakness\n- 👁️ Blurred vision\n- ⚖️ Unexplained weight loss\n\n**Prevention Tips:**\n- Exercise regularly (150 mins/week)\n- High-fiber diet over refined sugars\n- Monitor blood glucose levels periodically\n\n> ⚠️ *General health information — not a substitute for professional medical advice.*`;
  }

  if (/stress|anxiety|manage stress|mental health|worry|panic|tension/.test(msg)) {
    return `## 🧘 Managing Stress and Anxiety\n\n**Quick calming exercises:**\n- 🌬️ **4-7-8 Breathing:** Inhale 4s, hold 7s, exhale 8s\n- 🚶 10-minute walk outdoors\n- 💧 Drink a glass of cold water\n- 🎵 Listen to relaxing music\n\n**Long-term wellness:**\n- Daily exercise & 7-9 hours sleep\n- Practice daily mindfulness meditation\n- Connect regularly with family or friends\n\n> ⚠️ *General health information — not a substitute for professional medical advice.*`;
  }

  if (/headache|head pain|migraine|frequent headache|sir dard/.test(msg)) {
    return `## 🤕 Causes & Relief for Headaches\n\n**Common triggers:**\n- 💧 Dehydration (most common!)\n- 😰 Stress and neck muscle tension\n- 😴 Poor sleep or screen eye strain\n\n**Immediate relief:**\n- Drink 2 large glasses of water\n- Rest in a quiet, dark room\n- Cold compress on forehead\n\n> ⚠️ *General health information — not a substitute for professional medical advice.*`;
  }

  return `## 🏥 HealthAI Clinical & Health Assistant\n\nThank you for asking about **"${query}"**.\n\n**Key Health Guidance:**\n- 🤒 **Symptoms Awareness:** Monitor temperature changes and symptom duration.\n- 💧 **Hydration & Rest:** Rest adequately and drink 2.5–3 liters of water daily.\n- 🥗 **Balanced Nutrition:** Eat vitamin-rich foods and avoid excess processed sugar.\n- 🏥 **Medical Consultation:** Seek doctor evaluation if symptoms persist or worsen.\n\n> ⚠️ *I am NOT a replacement for professional medical advice.*`;
};

const MessageBubble = ({ msg, onCopy }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start group`}>
      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md ${isUser ? 'bg-sky-500' : 'bg-gradient-to-br from-slate-800 to-slate-900'}`}>
        <Iconify icon={isUser ? 'mdi:account-badge-outline' : 'mdi:robot-happy-outline'} className="w-5 h-5 text-white" />
      </div>
      <div className={`relative max-w-[80%] px-5 py-4 rounded-3xl text-sm leading-relaxed ${
        isUser
          ? 'bg-sky-500 text-white rounded-tr-sm'
          : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm'
      }`}>
        {isUser ? (
          <p>{msg.content}</p>
        ) : (
          <div>
            <div className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-slate-800 prose-strong:text-slate-800 prose-ul:my-1 prose-li:my-0.5 prose-p:my-1">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
            <button
              onClick={() => onCopy(msg.content)}
              className="mt-3 flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-sky-500 transition-colors"
              title="Copy Response"
            >
              <Iconify icon="eva:copy-fill" className="w-3.5 h-3.5" />
              <span>Copy Response</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const AiAssistant = () => {
  const currentUser = AuthService.getCurrentUser();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `👋 Doctor ${currentUser?.username || ''}! I'm **HealthAI Clinical Assistant**.\n\nI can assist with:\n- 🩺 Symptom Triage & Differential Diagnosis Calculator\n- 💊 Drug Interactions & Prescription Jargon Decoder\n- 📄 1-Click Consultation PDF Report Export\n\n> ⚠️ **Clinical Notice:** AI outputs serve as clinical decision support only.`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showTriageModal, setShowTriageModal] = useState(false);
  const [showJargonModal, setShowJargonModal] = useState(false);

  const [symptoms, setSymptoms] = useState({
    fever: false,
    chestPain: false,
    shortBreath: false,
    headache: false,
    cough: false,
    fatigue: false,
  });

  const [jargonInput, setJargonInput] = useState('');

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      Swal.fire({
        icon: 'warning',
        title: 'Voice Not Supported',
        text: 'Speech recognition is not supported in this browser. Try Chrome or Edge.'
      });
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => (prev ? prev + ' ' + transcript : transcript));
    };

    recognition.start();
  };

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const history = newMessages.slice(1, -1).map(m => ({ role: m.role, content: m.content }));
      const { data } = await axios.post(`${API_BASE_URL}/api/ai/chat`, { message: userMsg, history });
      if (data && data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        throw new Error('Empty response');
      }
    } catch (err) {
      const fallbackReply = getOfflineDiseaseResponse(userMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: fallbackReply }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Copied to clipboard!',
      showConfirmButton: false,
      timer: 1500
    });
  };

  const calculateTriageRisk = () => {
    let score = 0;
    const selected = [];
    if (symptoms.chestPain) { score += 4; selected.push('Chest Pain / Tightness'); }
    if (symptoms.shortBreath) { score += 4; selected.push('Shortness of Breath'); }
    if (symptoms.fever) { score += 2; selected.push('Fever'); }
    if (symptoms.headache) { score += 1; selected.push('Severe Headache'); }
    if (symptoms.cough) { score += 1; selected.push('Cough / Cold'); }
    if (symptoms.fatigue) { score += 1; selected.push('Extreme Fatigue'); }

    if (selected.length === 0) {
      Swal.fire({ icon: 'info', title: 'Select Symptoms', text: 'Please check at least one symptom to analyze.' });
      return;
    }

    let riskLevel = 'LOW RISK 🟢';
    let advice = 'Mild symptoms detected. Monitor patient vitals.';
    if (score >= 4) {
      riskLevel = 'EMERGENCY / HIGH RISK 🔴';
      advice = 'Urgent emergency evaluation required immediately.';
    } else if (score >= 2) {
      riskLevel = 'MODERATE RISK 🟡';
      advice = 'General physician consultation recommended within 24 hours.';
    }

    const triagePrompt = `[CLINICAL TRIAGE REPORT]\nSymptoms: ${selected.join(', ')}.\nRisk Category: ${riskLevel}.\nClinical Note: ${advice}.\n\nPlease provide differential diagnosis and recommended treatment protocol.`;

    setShowTriageModal(false);
    setSymptoms({ fever: false, chestPain: false, shortBreath: false, headache: false, cough: false, fatigue: false });
    sendMessage(triagePrompt);
  };

  const handleJargonSubmit = (e) => {
    e.preventDefault();
    if (!jargonInput.trim()) return;
    const prompt = `Please simplify and explain this prescription / medical term in clear terms:\n"${jargonInput}"`;
    setShowJargonModal(false);
    setJargonInput('');
    sendMessage(prompt);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: `👋 Session reset! **HealthAI Clinical Assistant** ready.`
    }]);
  };

  const downloadReport = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = margin;

    doc.setFillColor(14, 165, 233);
    doc.rect(0, 0, pageW, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('NearestDoctor - Clinical AI Report', margin, 13);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`Doctor: Dr. ${currentUser?.username || 'Specialist'}   |   Generated: ${new Date().toLocaleString()}`, margin, 23);
    y = 42;

    const chatMessages = messages.slice(1);
    chatMessages.forEach((msg, idx) => {
      const isUser = msg.role === 'user';
      const cleanText = msg.content.replace(/[*#>`]/g, '').trim();
      doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.setTextColor(isUser ? 14 : 30, isUser ? 165 : 41, isUser ? 233 : 59);
      doc.text(`${idx + 1}. ${isUser ? 'Doctor Inquiry' : 'HealthAI Clinical'}:`, margin, y);
      y += 5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(51, 65, 85);
      const lines = doc.splitTextToSize(cleanText, pageW - margin * 2);
      doc.text(lines, margin + 4, y);
      y += lines.length * 4.5 + 6;
      if (y > 270) { doc.addPage(); y = margin; }
    });

    doc.save(`Clinical_AI_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const hasChat = messages.length > 1;

  return (
    <div className="flex flex-col h-[calc(100vh-110px)] max-w-5xl mx-auto space-y-4">
      {/* Symptom Triage Modal */}
      {showTriageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-slate-100 relative">
            <button onClick={() => setShowTriageModal(false)} className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:bg-slate-100">
              <Iconify icon="eva:close-fill" className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center font-black">
                <Iconify icon="eva:activity-fill" className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Clinical Triage Tool</h3>
                <p className="text-xs text-rose-500 font-bold uppercase tracking-widest">Select patient symptoms</p>
              </div>
            </div>

            <div className="space-y-3 my-6">
              {[
                { id: 'fever', label: '🌡️ High Fever / Temperature' },
                { id: 'chestPain', label: '🚨 Chest Pain / Tightness' },
                { id: 'shortBreath', label: '🫁 Shortness of Breath' },
                { id: 'headache', label: '🤕 Severe Headache / Dizziness' },
                { id: 'cough', label: '🤧 Dry or Chesty Cough' },
                { id: 'fatigue', label: '😴 Extreme Fatigue / Body Pain' },
              ].map((item) => (
                <label key={item.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-sky-50 border border-slate-100 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={symptoms[item.id]}
                    onChange={(e) => setSymptoms({ ...symptoms, [item.id]: e.target.checked })}
                    className="w-5 h-5 rounded-lg text-sky-500 focus:ring-sky-400"
                  />
                  <span className="text-sm font-bold text-slate-700">{item.label}</span>
                </label>
              ))}
            </div>

            <button
              onClick={calculateTriageRisk}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-sky-500 text-white font-black text-xs uppercase tracking-widest hover:opacity-95 shadow-lg shadow-rose-200"
            >
              Analyze Differential Triage
            </button>
          </div>
        </div>
      )}

      {/* Jargon Simplifier Modal */}
      {showJargonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-slate-100 relative">
            <button onClick={() => setShowJargonModal(false)} className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:bg-slate-100">
              <Iconify icon="eva:close-fill" className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center font-black">
                <Iconify icon="eva:file-text-fill" className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Rx Jargon Decoder</h3>
                <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest">Decode Medical Terminology</p>
              </div>
            </div>

            <form onSubmit={handleJargonSubmit} className="space-y-4">
              <textarea
                rows={4}
                required
                placeholder="Enter prescription terminology or medical jargon..."
                value={jargonInput}
                onChange={(e) => setJargonInput(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none text-sm font-medium resize-none"
              />
              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-200"
              >
                Decode Terminology
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center shadow-lg shadow-sky-200 shrink-0">
            <Iconify icon="mdi:robot-happy-outline" className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">HealthAI Clinical Assistant</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase border border-emerald-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-slate-400 text-xs font-medium">Clinical Decision Support & Disease Intelligence</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowTriageModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs transition-all border border-rose-100"
          >
            <Iconify icon="eva:activity-fill" className="w-4 h-4" />
            <span>Clinical Triage</span>
          </button>
          <button
            onClick={() => setShowJargonModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold text-xs transition-all border border-emerald-100"
          >
            <Iconify icon="eva:file-text-fill" className="w-4 h-4" />
            <span>Rx Decoder</span>
          </button>
          {hasChat && (
            <button
              onClick={downloadReport}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs transition-all shadow-md shadow-sky-200"
            >
              <Iconify icon="eva:download-fill" className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
          )}
          <button
            onClick={clearChat}
            className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
            title="Clear Chat"
          >
            <Iconify icon="eva:trash-2-outline" className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Categorized Quick Question Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIZED_QUESTIONS.map(cat => (
          <div key={cat.category} className="flex items-center gap-2 shrink-0">
            {cat.questions.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50 transition-all shadow-sm whitespace-nowrap disabled:opacity-40"
              >
                {q}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 bg-slate-50/80 rounded-[2.5rem] border border-slate-100 overflow-y-auto p-6 space-y-5 shadow-inner">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} onCopy={handleCopy} />
        ))}
        {loading && (
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-2xl bg-slate-800 flex items-center justify-center shrink-0">
              <Iconify icon="mdi:robot-happy-outline" className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white border border-slate-100 rounded-3xl rounded-tl-sm px-5 py-4 shadow-sm">
              <div className="flex gap-1.5 items-center">
                <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Bottom Input Area */}
      <div className="flex gap-3 items-end">
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-sky-400 focus-within:border-sky-400 transition-all flex items-center px-4">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={1}
            placeholder="Type clinical query or speak... (Enter to send)"
            className="w-full bg-transparent py-4 text-slate-800 text-sm outline-none resize-none disabled:opacity-60"
            style={{ minHeight: '54px', maxHeight: '100px' }}
          />
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            className={`p-2.5 rounded-xl transition-all ml-2 ${
              isListening ? 'bg-rose-500 text-white animate-pulse' : 'text-slate-400 hover:text-sky-500 hover:bg-slate-50'
            }`}
            title={isListening ? 'Listening...' : 'Voice Input'}
          >
            <Iconify icon={isListening ? 'eva:mic-fill' : 'eva:mic-outline'} className="w-6 h-6" />
          </button>
        </div>

        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="w-14 h-14 rounded-2xl bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200 text-white flex items-center justify-center transition-all shadow-lg shadow-sky-200 disabled:shadow-none shrink-0 active:scale-95"
        >
          <Iconify icon="eva:paper-plane-fill" className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default AiAssistant;
