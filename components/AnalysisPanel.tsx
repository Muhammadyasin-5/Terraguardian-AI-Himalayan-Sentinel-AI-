import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { IconCpu, IconDownload, IconSave, IconCopy, IconCheck, IconAlertTriangle } from './Icons';

interface AnalysisPanelProps {
  title: string;
  markdown: string;
  loading: boolean;
  onAnalyze: () => void;
  onExport?: () => void;
  onSave?: () => void;
  isThinking?: boolean;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ title, markdown, loading, onAnalyze, onExport, onSave, isThinking }) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCopy = () => {
    if (markdown) {
      navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveWrapper = () => {
    if (onSave) {
      onSave();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleExportClick = () => {
      setShowConfirm(true);
  };

  const confirmExport = () => {
      if (onExport) onExport();
      setShowConfirm(false);
  };

  return (
    <div className="flex flex-col h-full bg-sentinel-800 border border-sentinel-700 rounded-xl overflow-hidden shadow-2xl relative">
      <div className="p-4 border-b border-sentinel-700 flex justify-between items-center bg-sentinel-900/50">
        <h3 className="text-lg font-semibold text-sky-400 flex items-center gap-2">
          <IconCpu className="w-5 h-5" />
          {title}
        </h3>
        <div className="flex items-center gap-2">
            <div className="flex bg-sentinel-900 rounded-lg p-0.5 border border-sentinel-700 mr-2">
                {onSave && (
                    <button
                        onClick={handleSaveWrapper}
                        disabled={loading || !markdown}
                        className={`p-2 rounded-md transition-all relative group ${
                            saved 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'text-slate-400 hover:text-white hover:bg-sentinel-700'
                        } disabled:opacity-30 disabled:cursor-not-allowed`}
                        title="Save to Reports (Local)"
                    >
                        {saved ? <IconCheck className="w-5 h-5" /> : <IconSave className="w-5 h-5" />}
                    </button>
                )}
                
                <button
                    onClick={handleCopy}
                    disabled={loading || !markdown}
                    className={`p-2 rounded-md transition-all relative group ${
                        copied 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'text-slate-400 hover:text-white hover:bg-sentinel-700'
                    } disabled:opacity-30 disabled:cursor-not-allowed`}
                    title="Copy to Clipboard"
                >
                    {copied ? <IconCheck className="w-5 h-5" /> : <IconCopy className="w-5 h-5" />}
                </button>

                {onExport && (
                    <button
                        onClick={handleExportClick}
                        disabled={loading || !markdown}
                        className="p-2 text-slate-400 hover:text-white hover:bg-sentinel-700 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Download JSON Report"
                    >
                        <IconDownload className="w-5 h-5" />
                    </button>
                )}
            </div>

            <button
            onClick={onAnalyze}
            disabled={loading}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-300 flex items-center gap-2
                ${loading 
                ? 'bg-sentinel-700 text-slate-400 cursor-not-allowed' 
                : 'bg-sky-600 hover:bg-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(14,165,233,0.5)]'
                }`}
            >
            {loading ? (isThinking ? 'Thinking...' : 'Processing...') : 'Generate Insight'}
            </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 bg-sentinel-800 scroll-smooth">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-6 animate-pulse">
            <div className="relative">
              <div className={`w-20 h-20 border-4 ${isThinking ? 'border-indigo-500/30 border-t-indigo-400' : 'border-sky-500/30 border-t-sky-400'} rounded-full animate-spin`}></div>
              {isThinking && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-full animate-ping"></div>
                </div>
              )}
            </div>
            
            <div className="text-center space-y-2">
              <p className={`font-mono text-sm ${isThinking ? 'text-indigo-300' : 'text-sky-300'}`}>
                {isThinking ? "Gemini 3 Pro Active" : "Analyzing Data Stream"}
              </p>
              <p className="text-xs text-slate-500 max-w-[200px]">
                {isThinking 
                  ? "Running complex reasoning & physics simulations..." 
                  : "Processing satellite telemetry..."}
              </p>
            </div>
          </div>
        ) : markdown ? (
          <div className="prose prose-invert prose-sky max-w-none prose-headings:font-sans prose-p:font-light prose-strong:text-sky-300">
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <IconCpu className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm">Initiate analysis to receive AI-generated insights.</p>
          </div>
        )}
      </div>

      {/* Confirmation Overlay */}
      {showConfirm && (
          <div className="absolute inset-0 z-50 bg-sentinel-900/95 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
              <div className="bg-sentinel-800 border border-sentinel-600 rounded-xl p-6 max-w-sm w-full shadow-2xl ring-1 ring-white/10">
                  <div className="flex items-center gap-3 mb-4 text-warning-500">
                      <IconAlertTriangle className="w-6 h-6 text-orange-500" />
                      <h4 className="text-white font-bold text-lg">Confirm Export</h4>
                  </div>
                  <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                      Are you sure you want to download the current analysis report? This will generate a JSON file containing the full dataset and AI insights.
                  </p>
                  <div className="flex justify-end gap-3">
                      <button 
                          onClick={() => setShowConfirm(false)}
                          className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-sentinel-900 border border-sentinel-700 rounded-lg hover:bg-sentinel-700"
                      >
                          CANCEL
                      </button>
                      <button 
                          onClick={confirmExport}
                          className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-lg shadow-lg hover:shadow-sky-500/20 transition-all border border-sky-500 flex items-center gap-2"
                      >
                          <IconDownload className="w-4 h-4" />
                          DOWNLOAD
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AnalysisPanel;