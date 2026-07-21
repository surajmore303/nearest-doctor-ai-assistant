import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import API_BASE_URL from '../../api-config';
import Iconify from '../../components/common/Iconify';
import AuthService from '../../services/auth.service';

const QUICK_QUESTIONS = [
  "What are common symptoms of flu?",
  "How can I prevent high blood pressure?",
  "What should I do if I have a fever?",
  "What are early signs of diabetes?",
  "How to manage stress and anxiety?",
  "What causes frequent headaches?",
  "How much sleep do adults need?",
  "What are signs of dehydration?",
];

const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start`}>
      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${isUser ? 'bg-sky-500' : 'bg-gradient-to-br from-slate-700 to-slate-900'}`}>
        <Iconify icon={isUser ? 'mdi:account' : 'mdi:robot-happy-outline'} className="w-5 h-5 text-white" />
      </div>
      <div className={`max-w-[78%] px-5 py-4 rounded-3xl text-sm leading-relaxed ${
        isUser
          ? 'bg-sky-500 text-white rounded-tr-sm'
          : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm'
      }`}>
        {isUser ? (
          <p>{msg.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-slate-800 prose-strong:text-slate-800 prose-ul:my-1 prose-li:my-0.5 prose-p:my-1">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
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
      content: `👋 Hello! I'm **HealthAI**, your Smart Healthcare Guide.\n\nI can help you with:\n- 🤒 Understanding symptoms\n- 🛡️ Preventive care tips\n- 💊 General health awareness\n- 🏥 When to see a doctor\n\n> ⚠️ **Important:** I am NOT a replacement for professional medical advice. Always consult a qualified doctor for diagnosis and treatment.\n\nHow can I help you today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ I'm having trouble connecting right now. Please try again.\n\nFor urgent health concerns, please contact a healthcare professional directly or call emergency services.`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: `👋 Chat cleared! I'm **HealthAI**, ready to help with your health questions.\n\n> ⚠️ I am NOT a replacement for professional medical advice.`
    }]);
  };

  // ── PDF REPORT DOWNLOAD ────────────────────────────────────────────────────
  const downloadReport = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentW = pageW - margin * 2;
    let y = margin;

    const addPage = () => { doc.addPage(); y = margin; };
    const checkY = (needed = 10) => { if (y + needed > pageH - margin) addPage(); };

    // Remove emojis and clean markdown for PDF rendering
    const cleanForPdf = (text) => text
      .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FEFF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA9F}]/gu, '')
      .replace(/#{1,6}\s*/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/^>\s*/gm, '')
      .replace(/^[-*+]\s+/gm, '  - ')
      .replace(/&[a-z]+;/gi, '')
      .replace(/[^\x00-\x7F]/g, '')
      .trim();

    // ── HEADER ──
    doc.setFillColor(14, 165, 233);
    doc.rect(0, 0, pageW, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('NearestDoctor', margin, 13);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Medical Assistant - Smart Healthcare Guide', margin, 21);
    doc.setFontSize(9);
    doc.text('Report generated: ' + new Date().toLocaleString(), margin, 28);
    y = 40;

    // ── PATIENT INFO ──
    doc.setTextColor(30, 41, 59);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentW, 18, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Patient:', margin + 4, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(currentUser?.username || 'Guest User', margin + 22, y + 7);
    doc.setFont('helvetica', 'bold');
    doc.text('Role:', margin + 4, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.text((currentUser?.role || 'patient').toUpperCase(), margin + 22, y + 13);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Messages:', pageW / 2, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(String(messages.length), pageW / 2 + 32, y + 7);
    y += 24;

    // ── DISCLAIMER ──
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(251, 191, 36);
    doc.roundedRect(margin, y, contentW, 14, 2, 2, 'FD');
    doc.setTextColor(146, 64, 14);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('! MEDICAL DISCLAIMER:', margin + 3, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text('This report is for informational purposes only and is NOT a substitute for professional medical advice,', margin + 3, y + 10);
    doc.text('diagnosis, or treatment. Always consult a qualified healthcare provider.', margin + 3, y + 14.5);
    y += 20;

    // ── SECTION TITLE ──
    doc.setTextColor(14, 165, 233);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Consultation Transcript', margin, y);
    doc.setDrawColor(14, 165, 233);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 2, pageW - margin, y + 2);
    y += 8;

    // ── MESSAGES ──
    const chatMessages = messages.slice(1);
    chatMessages.forEach((msg) => {
      const isUser = msg.role === 'user';
      const cleanText = cleanForPdf(msg.content);
      const label = isUser ? 'You' : 'HealthAI';
      const lines = doc.splitTextToSize(cleanText, contentW - 8);
      const blockH = Math.max(lines.length * 5 + 14, 16);

      checkY(blockH + 4);

      if (isUser) {
        doc.setFillColor(224, 242, 254);
        doc.setDrawColor(186, 230, 253);
      } else {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
      }
      doc.roundedRect(margin, y, contentW, blockH, 3, 3, 'FD');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(isUser ? 14 : 71, isUser ? 165 : 85, isUser ? 233 : 105);
      doc.text(label, margin + 4, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(8.5);
      doc.text(lines, margin + 4, y + 12);

      y += blockH + 4;
    });

    // ── FOOTER ──
    checkY(16);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 5;
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'italic');
    doc.text('Generated by NearestDoctor - Medical Assistant (HealthAI) - Not a medical diagnosis tool', margin, y);
    doc.text('Page ' + doc.internal.getNumberOfPages(), pageW - margin, y, { align: 'right' });

    doc.save('HealthAI_Report_' + new Date().toISOString().slice(0, 10) + '.pdf');
  };

  const hasChat = messages.length > 1;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center shadow-lg shadow-sky-200">
            <Iconify icon="mdi:robot-happy-outline" className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">Medical Assistant</h1>
            <p className="text-sky-500 text-xs font-bold uppercase tracking-widest">Smart Healthcare Guide</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            AI Online
          </span>
          {hasChat && (
            <button
              onClick={downloadReport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold transition-all shadow-md shadow-sky-200 active:scale-95"
            >
              <Iconify icon="eva:download-fill" className="w-4 h-4" />
              Download Report
            </button>
          )}
          <button
            onClick={clearChat}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold transition-all"
          >
            <Iconify icon="eva:trash-2-outline" className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 mb-4">
        <Iconify icon="eva:alert-triangle-fill" className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-amber-800 text-xs font-medium leading-relaxed">
          <strong>Medical Disclaimer:</strong> This AI provides general health awareness only. It is <strong>NOT</strong> a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.
        </p>
      </div>

      {/* Quick Questions */}
      <div className="flex gap-2 flex-wrap mb-4">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => sendMessage(q)}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50 transition-all disabled:opacity-40 shadow-sm"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Window */}
      <div className="flex-1 bg-slate-50/80 rounded-3xl border border-slate-100 overflow-y-auto p-6 space-y-5 shadow-inner">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {loading && (
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center flex-shrink-0 shadow-sm">
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

      {/* Input */}
      <div className="mt-4 flex gap-3 items-end">
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-sky-400 focus-within:border-sky-400 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={1}
            placeholder="Describe your symptoms or ask a health question... (Enter to send)"
            className="w-full bg-transparent px-5 py-4 text-slate-800 text-sm outline-none resize-none disabled:opacity-60 rounded-2xl"
            style={{ minHeight: '56px', maxHeight: '120px' }}
          />
        </div>
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="w-14 h-14 rounded-2xl bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200 text-white flex items-center justify-center transition-all shadow-lg shadow-sky-200 disabled:shadow-none active:scale-95 flex-shrink-0"
        >
          <Iconify icon="eva:paper-plane-fill" className="w-5 h-5" />
        </button>
      </div>

      <p className="text-center text-slate-400 text-xs mt-3">
        Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-xs">Enter</kbd> to send ·{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-xs">Shift+Enter</kbd> for new line
        {hasChat && <span className="ml-3 text-sky-400 font-semibold">· Click "Download Report" to save this session as PDF</span>}
      </p>
    </div>
  );
};

export default AiAssistant;
