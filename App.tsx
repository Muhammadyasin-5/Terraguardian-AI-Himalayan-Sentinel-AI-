
import React, { useState } from 'react';
import { AnalysisMode } from './types';
import Dashboard from './components/Dashboard';
import GlacierView from './components/GlacierView';
import AvalancheView from './components/AvalancheView';
import EcosystemView from './components/EcosystemView';
import WeatherView from './components/WeatherView';
import TectonicsView from './components/TectonicsView';
import DataLabView from './components/DataLabView';
import TerrainView from './components/TerrainView';
import { IconMountain, IconActivity, IconAlertTriangle, IconLeaf, IconWind, IconLayers, IconCpu, IconWifi, IconWifiOff, IconLock, IconCheck, IconX, IconCube } from './components/Icons';

interface Network {
  ssid: string;
  signal: number;
  secure: boolean;
  type: 'satellite' | 'local' | 'relay';
}

const App: React.FC = () => {
  const [mode, setMode] = useState<AnalysisMode>(AnalysisMode.DASHBOARD);
  
  // Connectivity State
  const [wifiModalOpen, setWifiModalOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connected');
  const [currentNetwork, setCurrentNetwork] = useState('Sentinel-Sat-Link');
  const [selectedNetworkToConnect, setSelectedNetworkToConnect] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [connectError, setConnectError] = useState('');

  const availableNetworks: Network[] = [
    { ssid: 'Sentinel-Sat-Link', signal: 95, secure: true, type: 'satellite' },
    { ssid: 'Base-Camp-Relay-1', signal: 82, secure: true, type: 'relay' },
    { ssid: 'Nanga-Research-Outpost', signal: 65, secure: true, type: 'local' },
    { ssid: 'Rescue-Chopper-Net', signal: 40, secure: true, type: 'satellite' },
    { ssid: 'Guest-WiFi', signal: 70, secure: false, type: 'local' },
  ];

  const handleConnect = () => {
    if (!selectedNetworkToConnect) return;
    
    const network = availableNetworks.find(n => n.ssid === selectedNetworkToConnect);
    
    // Simulate password check
    if (network?.secure && password.length < 4) {
      setConnectError('Invalid Password Sequence');
      return;
    }

    setConnectError('');
    setConnectionStatus('connecting');
    
    // Simulate handshake
    setTimeout(() => {
      setConnectionStatus('connected');
      setCurrentNetwork(selectedNetworkToConnect);
      setSelectedNetworkToConnect(null);
      setPassword('');
      setWifiModalOpen(false);
    }, 2500);
  };

  const handleDisconnect = () => {
      setConnectionStatus('disconnected');
      setCurrentNetwork('');
      setWifiModalOpen(false);
  };

  const renderContent = () => {
    switch (mode) {
      case AnalysisMode.DASHBOARD: return <Dashboard />;
      case AnalysisMode.GLACIER: return <GlacierView />;
      case AnalysisMode.AVALANCHE: return <AvalancheView />;
      case AnalysisMode.ECOSYSTEM: return <EcosystemView />;
      case AnalysisMode.WEATHER: return <WeatherView />;
      case AnalysisMode.TECTONICS: return <TectonicsView />;
      case AnalysisMode.DATA_LAB: return <DataLabView />;
      case AnalysisMode.TERRAIN_3D: return <TerrainView />;
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
            <NavButton target={AnalysisMode.TERRAIN_3D} icon={<IconCube />} label="3D Terrain" />
            <NavButton target={AnalysisMode.GLACIER} icon={<IconActivity />} label="Glacier Health" />
            <NavButton target={AnalysisMode.AVALANCHE} icon={<IconAlertTriangle />} label="Avalanche Risk" />
            <NavButton target={AnalysisMode.TECTONICS} icon={<IconLayers />} label="Plate Tectonics" />
            <NavButton target={AnalysisMode.WEATHER} icon={<IconWind />} label="Atmospheric" />
            <NavButton target={AnalysisMode.ECOSYSTEM} icon={<IconLeaf />} label="Ecosystem Model" />
            
            <div className="my-2 border-t border-sentinel-800"></div>
            <NavButton target={AnalysisMode.DATA_LAB} icon={<IconCpu />} label="Data Lab" />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-sentinel-800">
           {/* Connection Status Button */}
          <button 
            onClick={() => setWifiModalOpen(true)}
            className={`w-full bg-sentinel-800/50 hover:bg-sentinel-700/50 transition-all rounded-lg p-3 text-xs flex items-center gap-3 border ${
                connectionStatus === 'connected' ? 'border-emerald-500/30' : 
                connectionStatus === 'connecting' ? 'border-amber-500/30' : 'border-red-500/30'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                connectionStatus === 'connected' ? 'bg-emerald-500/20' : 
                connectionStatus === 'connecting' ? 'bg-amber-500/20' : 'bg-red-500/20'
            }`}>
               {connectionStatus === 'connected' ? (
                   <IconWifi className="w-4 h-4 text-emerald-400" />
               ) : (
                   <IconWifiOff className={`w-4 h-4 ${connectionStatus === 'connecting' ? 'text-amber-400 animate-pulse' : 'text-red-400'}`} />
               )}
            </div>
            <div className="flex flex-col items-start">
               <span className={`font-bold ${
                   connectionStatus === 'connected' ? 'text-emerald-400' : 
                   connectionStatus === 'connecting' ? 'text-amber-400' : 'text-red-400'
               }`}>
                   {connectionStatus === 'connected' ? 'SYSTEM ONLINE' : 
                    connectionStatus === 'connecting' ? 'CONNECTING...' : 'OFFLINE'}
               </span>
               <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                   {connectionStatus === 'connected' ? currentNetwork : 'No Uplink'}
               </span>
            </div>
          </button>

          {/* Creator Attribution */}
          <div className="mt-6 pt-6 border-t border-sentinel-800 text-[10px] leading-relaxed text-slate-500 font-mono overflow-y-auto max-h-[200px] custom-scrollbar">
            <div className="mb-2">
              <span className="block font-bold text-slate-600 mb-0.5">APP NAME</span>
              <span className="text-sky-400 block font-bold">Himalayan Sentinel AI</span>
            </div>
            <div className="mb-2">
              <span className="block font-bold text-slate-600 mb-0.5">Built and developed by</span>
              <span className="text-slate-400 block font-bold">Muhammad Yasin Khan</span>
              <span className="text-slate-500 block text-[9px] mt-0.5">Institute of Geology; University of Azad Jammu and Kashmir, Muzaffarbad, Pakistan</span>
            </div>
            <div className="mb-2">
              <span className="block font-bold text-slate-600 mb-0.5">ADDRESS</span>
              <span className="text-slate-400 block">Village Chatter No.1, Tehsil & District Bagh, Azad Jammu & Kashmir, Pakistan</span>
            </div>
            <div className="mb-2">
              <span className="block font-bold text-slate-600 mb-0.5">App Building Platform</span>
              <span className="text-slate-400 block">Google AI Studio with<br/>Google Gemini 3 Pro</span>
            </div>
            <div>
              <span className="block font-bold text-slate-600 mb-0.5">CONTACT</span>
              <a href="mailto:yasin.khan@ajku.edu.pk" className="text-sky-500 hover:text-sky-400 transition-colors block truncate" title="yasin.khan@ajku.edu.pk">
                yasin.khan@ajku.edu.pk
              </a>
              <a href="mailto:rajayasinkhan@gmail.com" className="text-sky-500 hover:text-sky-400 transition-colors block truncate mt-0.5" title="rajayasinkhan@gmail.com">
                rajayasinkhan@gmail.com
              </a>
              <a href="https://wa.me/923255683321" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-400 transition-colors block mt-0.5 truncate" title="WhatsApp">
                WhatsApp: +923255683321
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden bg-sentinel-900 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sentinel-800/50 via-sentinel-900 to-sentinel-900">
        {/* Top Bar Decoration */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-500 opacity-50"></div>
        
        {renderContent()}

        {/* WIFI CONNECTIVITY MODAL */}
        {wifiModalOpen && (
            <div className="absolute inset-0 z-50 bg-sentinel-900/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
                <div className="bg-sentinel-800 border border-sentinel-600 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                    <div className="p-4 bg-sentinel-900/50 border-b border-sentinel-700 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                           <IconWifi className="w-5 h-5 text-sky-400" />
                           <h3 className="text-white font-bold">Network Interface</h3>
                        </div>
                        <button onClick={() => {
                            setWifiModalOpen(false); 
                            setSelectedNetworkToConnect(null); 
                            setPassword('');
                            setConnectError('');
                        }} className="text-slate-400 hover:text-white">
                            <IconX className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="p-6">
                        {connectionStatus === 'connecting' ? (
                            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-sky-500/30 border-t-sky-400 rounded-full animate-spin"></div>
                                    <IconWifi className="w-6 h-6 text-sky-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                                </div>
                                <p className="text-sky-300 font-mono text-sm">Establishing Handshake...</p>
                                <p className="text-xs text-slate-500">Authenticating with {selectedNetworkToConnect}</p>
                            </div>
                        ) : selectedNetworkToConnect ? (
                            <div className="animate-in slide-in-from-right-4">
                                <button 
                                   onClick={() => { setSelectedNetworkToConnect(null); setConnectError(''); }}
                                   className="text-xs text-slate-400 hover:text-white mb-4 flex items-center gap-1"
                                >
                                   ← Back to Networks
                                </button>
                                <h4 className="text-white font-bold mb-1">{selectedNetworkToConnect}</h4>
                                <p className="text-xs text-slate-400 mb-4">Enter secure credentials to establish uplink.</p>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Password</label>
                                        <input 
                                           type="password" 
                                           value={password}
                                           onChange={(e) => setPassword(e.target.value)}
                                           placeholder="••••••••"
                                           className="w-full bg-sentinel-900 border border-sentinel-700 rounded-lg p-2.5 text-white focus:border-sky-500 focus:outline-none transition-colors"
                                           autoFocus
                                        />
                                    </div>
                                    
                                    {connectError && (
                                        <div className="text-red-400 text-xs flex items-center gap-2 bg-red-500/10 p-2 rounded">
                                            <IconAlertTriangle className="w-3 h-3" />
                                            {connectError}
                                        </div>
                                    )}

                                    <button 
                                       onClick={handleConnect}
                                       disabled={!password}
                                       className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition-all shadow-lg shadow-sky-900/20"
                                    >
                                        CONNECT
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Networks</span>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                </div>
                                
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                    {availableNetworks.map((net, i) => (
                                        <button 
                                           key={i}
                                           onClick={() => net.ssid === currentNetwork && connectionStatus === 'connected' ? null : setSelectedNetworkToConnect(net.ssid)}
                                           className={`w-full p-3 rounded-lg border transition-all flex items-center justify-between group ${
                                               currentNetwork === net.ssid && connectionStatus === 'connected'
                                               ? 'bg-emerald-500/10 border-emerald-500/30' 
                                               : 'bg-sentinel-900 border-sentinel-700 hover:border-sky-500/50 hover:bg-sentinel-700'
                                           }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 rounded-lg ${currentNetwork === net.ssid && connectionStatus === 'connected' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sentinel-800 text-slate-400 group-hover:text-white'}`}>
                                                    <IconWifi className="w-4 h-4" />
                                                </div>
                                                <div className="text-left">
                                                    <div className={`text-sm font-bold ${currentNetwork === net.ssid && connectionStatus === 'connected' ? 'text-emerald-400' : 'text-slate-200'}`}>
                                                        {net.ssid}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                                        <span>{net.type.toUpperCase()}</span>
                                                        <span>•</span>
                                                        <span>Signal: {net.signal}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                {net.secure && <IconLock className="w-3 h-3 text-slate-500" />}
                                                {currentNetwork === net.ssid && connectionStatus === 'connected' && <IconCheck className="w-4 h-4 text-emerald-400" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {connectionStatus === 'connected' && (
                                    <button 
                                       onClick={handleDisconnect}
                                       className="w-full mt-4 border border-red-500/30 text-red-400 hover:bg-red-500/10 py-2 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        DISCONNECT FROM CURRENT NETWORK
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
      </main>

    </div>
  );
};

export default App;
