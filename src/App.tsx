import React, { useState, useRef, useEffect } from 'react';
import { 
  BarChart3, 
  Upload, 
  Activity, 
  SlidersHorizontal,
  FileText,
  Download,
  Loader2,
  Menu,
  ChevronLeft,
  Database,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Library
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import DataUpload from './components/DataUpload';
import FiscalAnalysis from './components/FiscalAnalysis';
import PolicySimulation from './components/PolicySimulation';
import Glossary from './components/Glossary';
import ScenarioLibrary from './components/ScenarioLibrary';
import { RegionalData, CustomScenario } from './types';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';
import { getFromGoogleSheets, saveToGoogleSheetsBulk } from './services/googleSheets';
import { initAuth, googleSignIn, logout, getAccessToken } from './utils/auth';
import { User } from 'firebase/auth';

import ExportReportModal from './components/ExportReportModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [regionalData, setRegionalData] = useState<RegionalData[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | CustomScenario | null>(null);
  
  // Auth & Sync state
  const [isLoading, setIsLoading] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle'|'success'|'error'>('idle');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = initAuth(
      async (user, token) => {
        setUser(user);
        setNeedsAuth(false);
        try {
          const data = await getFromGoogleSheets(token);
          if (data && data.length > 0) {
            setRegionalData(data);
          }
        } catch (error) {
          console.error("Failed to load data from Google Sheets:", error);
        } finally {
          setIsLoading(false);
        }
      },
      () => {
        setNeedsAuth(true);
        setUser(null);
        setIsLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, []);

  const handleDataUpload = async (newData: RegionalData[]) => {
    const updatedData = [...regionalData, ...newData];
    setRegionalData(updatedData);
    
    if (user) {
      await performSync(updatedData);
    }
  };

  const performSync = async (dataToSync: RegionalData[]) => {
    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      const success = await saveToGoogleSheetsBulk(dataToSync);
      if (success) {
        setSyncStatus('success');
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('Error syncing:', error);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
        const data = await getFromGoogleSheets(result.accessToken);
        if (data && data.length > 0) {
          setRegionalData(data);
        }
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <Loader2 size={48} className="animate-spin text-indigo-600" />
          <p className="text-slate-500 font-medium">Memuat data dari Google Sheets...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard data={regionalData} setActiveTab={setActiveTab} />;
      case 'upload':
        return <DataUpload onUpload={handleDataUpload} />;
      case 'analysis':
        return <FiscalAnalysis data={regionalData} />;
      case 'simulation':
        return (
          <PolicySimulation 
            data={regionalData} 
            initialPreset={selectedPreset}
            onClearPreset={() => setSelectedPreset(null)}
            user={user}
            onLogin={handleLogin}
          />
        );
      case 'scenarioLibrary':
        return (
          <ScenarioLibrary 
            onApplyScenario={(scenario) => {
              setSelectedPreset(scenario);
              setActiveTab('simulation');
            }}
            user={user}
            onLogin={handleLogin}
          />
        );
      case 'glossary':
        return <Glossary />;
      default:
        return <Dashboard data={regionalData} setActiveTab={setActiveTab} />;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dasbor';
      case 'upload': return 'Unggah Data';
      case 'analysis': return 'Analisis Fiskal';
      case 'simulation': return 'Simulasi Kebijakan';
      case 'scenarioLibrary': return 'Pustaka Skenario';
      case 'glossary': return 'Glosarium Formulasi & Metodologi';
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
                Fiscalia
              </h1>
              <p className="text-[10px] text-slate-400 mt-1">Fiscal Intelligence and Analytics</p>
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
            icon={<Library size={20} />} 
            label="Pustaka Skenario" 
            active={activeTab === 'scenarioLibrary'} 
            onClick={() => setActiveTab('scenarioLibrary')}
            isOpen={isSidebarOpen}
          />
          <NavItem 
            icon={<BookOpen size={20} />} 
            label="Glosarium Metodologi" 
            active={activeTab === 'glossary'} 
            onClick={() => setActiveTab('glossary')}
            isOpen={isSidebarOpen}
          />
        </nav>
        
        <div className="p-3 border-t border-slate-800">
          <button 
            onClick={() => setIsExportModalOpen(true)}
            disabled={regionalData.length === 0}
            className={`flex items-center text-sm text-slate-400 hover:text-white transition-colors w-full p-2 rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed ${isSidebarOpen ? 'space-x-2' : 'justify-center'}`}
            title="Ekspor Laporan (PDF)"
          >
            <Download size={20} className="flex-shrink-0" />
            {isSidebarOpen && <span>Ekspor Laporan</span>}
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
            
            {/* Sync Status / Action */}
            {user ? (
              <div className="flex items-center space-x-3 text-sm">
                <span className="text-slate-600 flex items-center space-x-1 border border-slate-200 bg-slate-50 px-3 py-1.5 rounded-lg">
                  <Database size={14} className="text-indigo-600 mr-1" /> Google Sheets Sync
                  {isSyncing && <Loader2 size={12} className="ml-2 animate-spin text-indigo-500" />}
                  {!isSyncing && syncStatus === 'success' && <CheckCircle2 size={12} className="ml-2 text-emerald-500" />}
                  {!isSyncing && syncStatus === 'error' && <AlertCircle size={12} className="ml-2 text-rose-500" />}
                </span>
                <button 
                  onClick={() => performSync(regionalData)}
                  disabled={isSyncing || regionalData.length === 0}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium px-3 py-1.5 rounded-lg transition-colors border border-indigo-100"
                >
                  Sinkronkan
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="gsi-material-button bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium px-4 py-1.5 rounded-lg flex items-center space-x-2 transition-colors cursor-pointer"
              >
                 <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 mr-1" xmlnsXlink="http://www.w3.org/1999/xlink">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                 </svg>
                 <span>Hubungkan Google Sheets</span>
              </button>
            )}

            <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full font-medium">
              {regionalData.length} Daerah Dimuat
            </span>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-8" ref={contentRef}>
          {renderContent()}
        </main>
        
        <footer className="bg-white border-t border-slate-200 py-3 px-8 text-center text-xs text-slate-400 font-medium">
          2026@Kantor Wilayah DJPb Provinsi Lampung
        </footer>
      </div>

      {isExportModalOpen && (
        <ExportReportModal 
          data={regionalData} 
          onClose={() => setIsExportModalOpen(false)} 
          user={user}
        />
      )}

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
