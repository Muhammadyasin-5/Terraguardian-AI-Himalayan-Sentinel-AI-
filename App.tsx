import React, { useState } from 'react';
import { AnalysisMode } from './types';
import Dashboard from './components/Dashboard';
import GlacierView from './components/GlacierView';
import AvalancheView from './components/AvalancheView';
import EcosystemView from './components/EcosystemView';
import WeatherView from './components/WeatherView';
import TectonicsView from './components/TectonicsView';
import { IconMountain, IconActivity, IconAlertTriangle, IconLeaf, IconWind, IconLayers } from './components/Icons';

const App: React.FC = () => {
  const [mode, setMode] = useState<AnalysisMode>(AnalysisMode.DASHBOARD);

  const renderContent = () => {
    switch (mode) {
      case AnalysisMode.DASHBOARD: return <Dashboard />;
      case AnalysisMode.GLACIER: return <GlacierView />;
      case AnalysisMode.AVALANCHE: return <AvalancheView />;
      case AnalysisMode.ECOSYSTEM: return <EcosystemView />;
      case AnalysisMode.WEATHER: return <WeatherView />;
      case AnalysisMode.TECTONICS: return <TectonicsView />;
      default: return <Dashboard />;
    }
  };

  const NavButton = ({ target, icon, label }: { target: AnalysisMode, icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => setMode(target)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        mode === target 
          ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/50' 
          : 'text-slate-400 hover:bg-sentinel-800 hover:text-white'
      }`}
    >
      <span className={mode === target ? 'text-white' : 'text-slate-500 group-hover:text-sky-400 transition-colors'}>
        {icon}
      </span>
      <span className="font-medium text-sm">{label}</span>
      {mode === target && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />}
    </button>
  );

  return (
    <div className="flex h-screen w-full bg-sentinel-900 text-slate-200 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-sentinel-900 border-r border-sentinel-800 flex flex-col z-10">
        <div className="p-6">
          <div className="flex items-center gap-3 text-white mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(14,165,233,0.4)]">
              <IconMountain className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight leading-tight">HIMALAYAN<br/><span className="text-sky-400">SENTINEL</span> AI</h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-1">MULTIMODAL INTELLIGENCE</p>
            </div>
          </div>

          <nav className="space-y-2">
            <NavButton target={AnalysisMode.DASHBOARD} icon={<IconMountain />} label="Overview" />
            <div className="pt-4 pb-2 px-4 text-xs font-mono text-slate-600 uppercase tracking-widest">Analytics Modules</div>
            <NavButton target={AnalysisMode.GLACIER} icon={<IconActivity />} label="Glacier Health" />
            <NavButton target={AnalysisMode.AVALANCHE} icon={<IconAlertTriangle />} label="Avalanche Risk" />
            <NavButton target={AnalysisMode.TECTONICS} icon={<IconLayers />} label="Plate Tectonics" />
            <NavButton target={AnalysisMode.WEATHER} icon={<IconWind />} label="Atmospheric" />
            <NavButton target={AnalysisMode.ECOSYSTEM} icon={<IconLeaf />} label="Ecosystem Model" />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-sentinel-800">
          <div className="bg-sentinel-800/50 rounded-lg p-3 text-xs text-slate-400 flex items-center gap-2 border border-sentinel-700/50">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            System Online • Gemini 3 Pro
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden bg-sentinel-900 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sentinel-800/50 via-sentinel-900 to-sentinel-900">
        {/* Top Bar Decoration */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-500 opacity-50"></div>
        
        {renderContent()}
      </main>

    </div>
  );
};

export default App;