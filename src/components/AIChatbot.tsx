import React, { useState, useRef, useEffect } from 'react';
import { RegionalData } from '../types';
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatbot({ data }: { data: RegionalData[] }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Halo! Saya adalah Pakar Fiskal Daerah AI Anda. Saya dapat menganalisis kondisi fiskal, kapasitas pendapatan, dan indikator stres dari daerah yang telah Anda unggah. Ada yang bisa saya bantu hari ini?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Kunci API Gemini tidak ditemukan. Silakan konfigurasikan di pengaturan AI Studio.');
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // Prepare context from data (up to 50 records to avoid token limits while providing good context)
      const contextData = data.slice(0, 50).map(d => 
        `Daerah: ${d.Region}, Tahun: ${d.Year}, Pertumbuhan PDRB: ${d.GDP_Growth}%, Pendapatan: ${d.Revenue}, PAD: ${d.PAD}, Transfer: ${d.Transfer}, Belanja: ${d.Expenditure}, Keseimbangan Fiskal: ${d.Fiscal_Balance}, Skor Stres: ${d.Fiscal_Stress_Score}, Risiko: ${d.Fiscal_Risk}`
      ).join('\n');

      const systemInstruction = `Anda adalah pakar keuangan publik daerah yang mengkhususkan diri pada keberlanjutan fiskal subnasional. 
      Analisis kondisi fiskal pemerintah daerah.
      Gunakan data konteks berikut jika relevan dengan pertanyaan pengguna:
      ${contextData || 'Belum ada data yang diunggah.'}
      
      Berikan analisis terstruktur termasuk: Tinjauan Ekonomi Daerah, Posisi Fiskal Daerah, Kinerja Pendapatan, Struktur Belanja, Ketergantungan Transfer Fiskal, Keberlanjutan Anggaran, Prioritas Pembangunan Daerah, dan Rekomendasi Kebijakan.
      Format respons Anda menggunakan Markdown. Buatlah profesional, analitis, dan ringkas dalam Bahasa Indonesia.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: input,
        config: {
          systemInstruction,
        }
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || 'Saya tidak dapat menghasilkan respons.'
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
      console.error('Chatbot error:', err);
      setError(err.message || 'Terjadi kesalahan saat berkomunikasi dengan AI.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center space-x-3">
        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
          <Bot size={24} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Pakar Fiskal Daerah AI</h3>
          <p className="text-xs text-slate-500">Diberdayakan oleh Gemini API</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                msg.role === 'user' ? 'bg-indigo-600 text-white ml-4' : 'bg-slate-200 text-slate-600 mr-4'
              }`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={`px-5 py-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-slate-100 text-slate-800 rounded-tl-none'
              }`}>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex flex-row max-w-[80%]">
              <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 mr-4">
                <Bot size={20} />
              </div>
              <div className="px-5 py-4 rounded-2xl bg-slate-100 text-slate-800 rounded-tl-none flex items-center space-x-2">
                <Loader2 className="animate-spin text-indigo-500" size={20} />
                <span className="text-sm text-slate-500">Menganalisis data fiskal...</span>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-center">
            <div className="px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-sm flex items-center space-x-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Tanyakan tentang kapasitas fiskal daerah, ketergantungan transfer, atau indikator stres..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple markdown formatter for the prototype
function formatMessage(text: string) {
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
  
  // Format lists
  formatted = formatted.replace(/^- (.*?)(<br\/>|$)/gm, '<li>$1</li>');
  if (formatted.includes('<li>')) {
    formatted = formatted.replace(/(<li>.*?<\/li>)/s, '<ul class="list-disc pl-5 my-2">$1</ul>');
  }
  
  return formatted;
}
