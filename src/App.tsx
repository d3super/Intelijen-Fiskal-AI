import React, { useState, useRef } from 'react';
import { 
  BarChart3, 
  Upload, 
  MessageSquare, 
  Activity, 
  SlidersHorizontal,
  FileText,
  Download,
  Loader2,
  Menu,
  ChevronLeft
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import DataUpload from './components/DataUpload';
import AIChatbot from './components/AIChatbot';
import FiscalAnalysis from './components/FiscalAnalysis';
import PolicySimulation from './components/PolicySimulation';
import { RegionalData } from './types';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [regionalData, setRegionalData] = useState<RegionalData[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleDataUpload = (newData: RegionalData[]) => {
    setRegionalData(prev => [...prev, ...newData]);
  };

  const handleExportPDF = async () => {
    if (!contentRef.current || regionalData.length === 0) return;
    
    setIsExporting(true);
    try {
      const dataUrl = await htmlToImage.toPng(contentRef.current, {
        quality: 1,
        pixelRatio: 2,
        style: {
          backgroundColor: '#f8fafc' // slate-50
        }
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      // We need to get the image dimensions to calculate the height properly
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      const pdfHeight = (img.height * pdfWidth) / img.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Laporan_Fiskal_Daerah_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Gagal mengekspor PDF. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard data={regionalData} />;
      case 'upload':
        return <DataUpload onUpload={handleDataUpload} />;
      case 'analysis':
        return <FiscalAnalysis data={regionalData} />;
      case 'simulation':
        return <PolicySimulation data={regionalData} />;
      case 'chatbot':
        return <AIChatbot data={regionalData} />;
      default:
        return <Dashboard data={regionalData} />;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dasbor';
      case 'upload': return 'Unggah Data';
      case 'analysis': return 'Analisis Fiskal';
      case 'simulation': return 'Simulasi Kebijakan';
      case 'chatbot': return 'Chatbot AI';
      default: return 'Dasbor';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <div className={`bg-slate-900 text-slate-100 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-4 flex items-center justify-between">
          {isSidebarOpen && (
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-tight">
                Intelijen Fiskal AI
              </h1>
              <p className="text-[10px] text-slate-400 mt-1">Sistem Prediksi Stres Daerah</p>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors mx-auto"
          >
            {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        <nav className="flex-1 px-3 space-y-2 mt-4">
          <NavItem 
            icon={<BarChart3 size={20} />} 
            label="Dasbor" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            isOpen={isSidebarOpen}
          />
          <NavItem 
            icon={<Upload size={20} />} 
            label="Unggah Data" 
            active={activeTab === 'upload'} 
            onClick={() => setActiveTab('upload')}
            isOpen={isSidebarOpen}
          />
          <NavItem 
            icon={<Activity size={20} />} 
            label="Analisis Fiskal" 
            active={activeTab === 'analysis'} 
            onClick={() => setActiveTab('analysis')}
            isOpen={isSidebarOpen}
          />
          <NavItem 
            icon={<SlidersHorizontal size={20} />} 
            label="Simulasi Kebijakan" 
            active={activeTab === 'simulation'} 
            onClick={() => setActiveTab('simulation')}
            isOpen={isSidebarOpen}
          />
          <NavItem 
            icon={<MessageSquare size={20} />} 
            label="Chatbot AI" 
            active={activeTab === 'chatbot'} 
            onClick={() => setActiveTab('chatbot')}
            isOpen={isSidebarOpen}
          />
        </nav>
        
        <div className="p-3 border-t border-slate-800">
          <button 
            onClick={handleExportPDF}
            disabled={isExporting || regionalData.length === 0}
            className={`flex items-center text-sm text-slate-400 hover:text-white transition-colors w-full p-2 rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed ${isSidebarOpen ? 'space-x-2' : 'justify-center'}`}
            title="Ekspor Laporan (PDF)"
          >
            {isExporting ? <Loader2 size={20} className="animate-spin flex-shrink-0" /> : <Download size={20} className="flex-shrink-0" />}
            {isSidebarOpen && <span>{isExporting ? 'Mengekspor...' : 'Ekspor Laporan'}</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-semibold text-slate-800 capitalize">
              {getTabTitle()}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {regionalData.length} Daerah Dimuat
            </span>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-8" ref={contentRef}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, isOpen }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, isOpen: boolean }) {
  return (
    <button
      onClick={onClick}
      title={!isOpen ? label : undefined}
      className={`flex items-center w-full p-3 rounded-lg transition-colors ${
        active 
          ? 'bg-indigo-600 text-white' 
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      } ${isOpen ? 'space-x-3' : 'justify-center'}`}
    >
      <div className="flex-shrink-0">{icon}</div>
      {isOpen && <span className="font-medium truncate">{label}</span>}
    </button>
  );
}
