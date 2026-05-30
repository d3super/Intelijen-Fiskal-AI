import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  X, 
  Send, 
  Trash2, 
  Bot, 
  User as UserIcon, 
  Loader2, 
  ChevronDown, 
  HelpCircle,
  Globe
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { RegionalData } from '../types';

interface AISandboxAssistantProps {
  data: RegionalData[];
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export default function AISandboxAssistant({ data }: AISandboxAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Halo! Saya adalah **Asisten Sandbox AI Fiscalia**. 

Saya siap mendampingi Anda menganalisis postur APBD, mengevaluasi stres fiskal, hingga mensimulasikan dampak makro-ekonomi daerah Anda di Provinsi Lampung.

Ada yang bisa saya bantu hari ini? Anda juga bisa menggunakan tombol pertanyaan cepat di bawah!`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRegionIndex, setSelectedRegionIndex] = useState<number | 'general'>('general');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Handle quick questions
  const quickPrompts = [
    {
      label: '💡 Saran Kebijakan',
      prompt: 'Berikan rekomendasi strategi optimalisasi fiskal dan pengamanan sosial-ekonomi untuk meningkatkan perekonomian daerah.'
    },
    {
      label: '🔍 Analisis Kerentanan',
      prompt: 'Lakukan analisis kerentanan APBD dan tunjukkan anomali utama struktur belanja daerah saat ini.'
    },
    {
      label: '📊 Konsep Multiplier',
      prompt: 'Jelaskan bagaimana indeks efisiensi belanja dan regional leakage memengaruhi multiplier fiskal pembangunan daerah.'
    }
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Find region data if a specific one is selected
      const currentRegionData = selectedRegionIndex !== 'general' && data[selectedRegionIndex] 
        ? data[selectedRegionIndex] 
        : (data.length > 0 ? data[0] : null);

      // Map to Gemini expected format: list of messages with role/parts
      // Filter out any leading 'model' messages (like the welcome message) to satisfy the Gemini system requirement
      const fullHistory = messages.concat(userMessage);
      const firstUserIndex = fullHistory.findIndex(m => m.role === 'user');
      const validHistory = firstUserIndex !== -1 ? fullHistory.slice(firstUserIndex) : [userMessage];

      const apiMessages = validHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          currentRegionData: selectedRegionIndex !== 'general' ? currentRegionData : null,
          allRegionsCount: data.length
        }),
      });

      if (!response.ok) {
        let serverErrorMsg = 'Gagal berkomunikasi dengan asisten.';
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            serverErrorMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(serverErrorMsg);
      }

      const resData = await response.json();
      const replyText = resData.reply || 'Maaf, saya tidak menerima respons yang valid dari model.';

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: replyText,
        timestamp: new Date(),
      }]);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: error.message && error.message.includes('**') 
          ? error.message 
          : `⚠️ **Gagal terhubung dengan server AI**:\n\n${error.message || 'Silakan coba lagi beberapa saat.'}`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: `Halo kembali! Saya telah menyegarkan percakapan kita. 

Apakah ada simulasi postur fiskal daerah lain yang ingin kita diskusikan?`,
        timestamp: new Date(),
      }
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans" id="fiscalia-ai-assistant">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition duration-300 flex items-center justify-center group relative border border-indigo-500 animate-pulse-subtle"
          title="Tanya Asisten AI Fiscalia"
        >
          <Bot size={24} className="group-hover:rotate-12 transition-transform duration-300" />
          <span className="absolute -top-1 -right-1 flex h-3.  w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out whitespace-nowrap font-medium text-sm ml-0 group-hover:ml-2">
            Asisten AI Sandbox
          </span>
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="bg-white w-[350px] sm:w-[420px] h-[480px] sm:h-[580px] max-h-[calc(100vh-48px)] max-w-[calc(100vw-32px)] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Header */}
          <div className="bg-slate-900 p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20 text-indigo-400">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  Asisten AI Fiscalia
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block block-ring animate-pulse" />
                </h3>
                <p className="text-[10px] text-slate-400">Pakar Kebijakan & Perbendaharaan Lampung</p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              <button 
                onClick={handleClear}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
                title="Bersihkan Obrolan"
              >
                <Trash2 size={16} />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
                title="Tutup Panel"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Context Selector Bar */}
          <div className="bg-slate-50 border-b border-slate-200 py-2 px-3.5 flex items-center justify-between text-xs text-slate-600 gap-2">
            <div className="flex items-center whitespace-nowrap gap-1">
              <Globe size={14} className="text-indigo-600" />
              <span>Fokus Daerah:</span>
            </div>
            <div className="relative flex-1 max-w-[240px]">
              <select
                value={selectedRegionIndex}
                onChange={(e) => setSelectedRegionIndex(e.target.value === 'general' ? 'general' : Number(e.target.value))}
                className="w-full bg-white border border-slate-200 text-slate-700 py-1 pl-2.5 pr-8 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-all appearance-none font-medium text-xs cursor-pointer"
              >
                <option value="general">Global/Semua Daerah</option>
                {data.map((region, idx) => (
                  <option key={idx} value={idx}>
                    {region.Region} ({region.Year})
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Messaging Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((message) => {
              const isAI = message.role === 'model';
              return (
                <div key={message.id} className={`flex ${isAI ? 'justify-start' : 'justify-end'} gap-2.5 max-w-[85%] ${isAI ? '' : 'ml-auto'}`}>
                  {isAI && (
                    <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 border border-indigo-200">
                      <Bot size={16} />
                    </div>
                  )}
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    isAI 
                      ? 'bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-sm' 
                      : 'bg-indigo-600 text-white rounded-tr-none shadow-sm'
                  }`}>
                    {isAI ? (
                      <div className="prose prose-slate max-w-none prose-sm font-sans text-xs flex flex-col gap-1.5">
                        <ReactMarkdown>{message.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-line">{message.text}</p>
                    )}
                  </div>
                </div>
              );
            })}
            
            {isLoading && (
              <div className="flex justify-start gap-2.5 max-w-[85%]">
                <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 border border-indigo-200">
                  <Bot size={16} />
                </div>
                <div className="p-3 bg-white text-slate-500 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm text-xs flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-indigo-600" />
                  <span>AI sedang mengetik...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick-Prompt Suggestions */}
          {messages.length < 4 && (
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider w-full mb-0.5 flex items-center gap-1">
                <HelpCircle size={12} className="text-indigo-400" /> Contoh Pertanyaan Cepat:
              </span>
              {quickPrompts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(item.prompt)}
                  disabled={isLoading}
                  className="bg-white hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 font-medium px-2.5 py-1 rounded-full border border-slate-200 hover:border-indigo-200 text-[11px] transition duration-200 shadow-sm disabled:opacity-50 text-left truncate"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Panel */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder="Ketik pertanyaan Anda ke asisten AI..."
              disabled={isLoading}
              className="flex-1 bg-slate-100 focus:bg-white text-slate-800 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none transition"
            />
            <button
              onClick={() => handleSend(input)}
              disabled={isLoading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition flex-shrink-0"
              title="Kirim Pesan"
            >
              <Send size={16} />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
