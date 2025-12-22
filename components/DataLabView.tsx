
import React, { useState, useRef } from 'react';
import AnalysisPanel from './AnalysisPanel';
import { generateDeepThinkingInsight, generateMultimodalInsight } from '../services/geminiService';
import { AiResponse } from '../types';
import { 
  IconUpload, IconFileText, IconTable, IconCheck, IconX, IconCpu, 
  IconLayers, IconBeaker, IconActivity, IconHammer, IconDiamond,
  IconSnowflake, IconAlertTriangle, IconLeaf, IconWind, IconGlobe
} from './Icons';

type AnalysisContextType = 'general' | 'structural' | 'mineral' | 'geophysics' | 'glacier' | 'avalanche' | 'ecosystem' | 'weather' | 'visual';

interface FileState {
  name: string;
  type: string;
  content: string; // Base64 or Text
  size: number;
  previewUrl?: string;
  isMultimodal: boolean;
}

const DataLabView: React.FC = () => {
  const [file, setFile] = useState<FileState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analysisContext, setAnalysisContext] = useState<AnalysisContextType>('general');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [aiState, setAiState] = useState<AiResponse>({
    markdown: '',
    loading: false,
    isThinking: false
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (fileObj: File) => {
    const reader = new FileReader();
    const isImage = fileObj.type.startsWith('image/');
    const isPdf = fileObj.type === 'application/pdf';
    const isText = fileObj.type.startsWith('text/') || fileObj.name.endsWith('.csv') || fileObj.name.endsWith('.json') || fileObj.name.endsWith('.log');

    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFile({
        name: fileObj.name,
        type: fileObj.type,
        content: result,
        size: fileObj.size,
        previewUrl: isImage ? result : undefined,
        isMultimodal: isImage || isPdf
      });
      
      // Auto-set context for images
      if (isImage) setAnalysisContext('visual');
    };

    if (isImage || isPdf) {
      reader.readAsDataURL(fileObj);
    } else {
      reader.readAsText(fileObj);
    }
  };

  const loadSampleData = (type: AnalysisContextType) => {
      setAnalysisContext(type);
      const mockText = (name: string, content: string) => {
          setFile({
              name,
              type: 'text/csv',
              content,
              size: content.length,
              isMultimodal: false
          });
      };

      if (type === 'geophysics') {
        mockText("sample_seismic_log.csv", `Timestamp,Magnitude,Depth_km,Lat,Long,Region\n2024-05-01T08:30:00Z,4.2,12.5,35.2,74.5,Nanga Parbat Massif`);
      } else if (type === 'structural') {
        mockText("structural_fault_log.csv", `FaultID,Strike,Dip,Rake,Slip_Type,Displacement_m,Depth_km\nF1,045,60,90,Reverse,150,2.5`);
      } else if (type === 'mineral') {
        mockText("assay_geochem.csv", `SampleID,Au_ppm,Ag_ppm,Lithology\nS-101,0.05,0.2,Gneiss`);
      } else if (type === 'glacier') {
        mockText("glacier_mass.csv", `Year,Mass_Balance_mwe,ELA_m\n2015,-0.45,4800`);
      } else if (type === 'visual') {
         // Clear if context switched to visual but no file
         setFile(null);
      }
  };

  const clearData = () => {
    setFile(null);
    setAiState({ markdown: '', loading: false, isThinking: false });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalysis = async () => {
    if (!file) return;

    setAiState({ ...aiState, loading: true, isThinking: true });

    let contextPrompt = "";
    switch(analysisContext) {
        case 'visual':
            contextPrompt = `
            **CONTEXT: VISUAL GEOLOGICAL INSPECTION**
            **Role:** Field Geologist.
            **Directives:**
            1. **Feature Recognition**: Identify geological features, rock types, or terrain hazards in the image.
            2. **Scale Estimation**: Estimate dimensions if a reference object is present.
            3. **Condition Assessment**: Flag signs of instability or rapid change.
            `;
            break;
        case 'structural':
            contextPrompt = `**CONTEXT: STRUCTURAL GEOLOGY**. Analyze strike/dip/displacement for kinematic stress regimes.`;
            break;
        case 'mineral':
            contextPrompt = `**CONTEXT: MINERAL EXPLORATION**. Identify geochemical anomalies and deposit vectors.`;
            break;
        case 'glacier':
            contextPrompt = `**CONTEXT: GLACIOLOGY**. Evaluate mass balance trends and ELA shifts.`;
            break;
        default:
            contextPrompt = `**CONTEXT: GENERAL SCIENTIFIC ANALYSIS**. Summarize trends and scientific implications.`;
            break;
    }

    const prompt = `
      **CUSTOM DATASET ANALYSIS REQUEST**
      **Filename:** ${file.name}
      **Domain:** ${analysisContext.toUpperCase()}
      
      ${contextPrompt}
      
      Analyze the attached ${file.isMultimodal ? 'document/image' : 'dataset'} and provide a detailed SITREP.
      ${!file.isMultimodal ? `\nDATA CONTENT:\n\`\`\`\n${file.content.slice(0, 10000)}\n\`\`\`` : ''}
    `;

    try {
      let result = "";
      if (file.isMultimodal) {
        result = await generateMultimodalInsight(prompt, { data: file.content, mimeType: file.type });
      } else {
        result = await generateDeepThinkingInsight(prompt);
      }
      setAiState({ markdown: result, loading: false, isThinking: false });
    } catch (error) {
      setAiState({ markdown: "Error processing laboratory data. Link timeout.", loading: false, isThinking: false });
    }
  };

  const handleExport = () => {
    if (!file) return;
    const report = {
        type: "DATA_LAB_REPORT",
        context: analysisContext,
        timestamp: new Date().toISOString(),
        source: file.name,
        analysis: aiState.markdown
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentinel_lab_${file.name.split('.')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full p-6 overflow-hidden">
      {/* Input Column */}
      <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
        
        <div className="bg-sentinel-800 p-6 rounded-xl border border-sentinel-700 shadow-lg flex-shrink-0">
          <div className="mb-6">
             <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <IconCpu className="w-6 h-6 text-purple-400" />
                Data Lab
             </h3>
             <p className="text-slate-400 text-sm font-mono uppercase tracking-tighter">Multimodal Research Interface</p>
          </div>

          {/* Context Selector */}
          <div className="mb-6">
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">AI Analysis Mode</label>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                 <button 
                   onClick={() => setAnalysisContext('general')}
                   className={`p-2 rounded-lg border text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${analysisContext === 'general' ? 'bg-purple-500/20 border-purple-500 text-purple-200' : 'bg-sentinel-900 border-sentinel-700 text-slate-400 hover:bg-sentinel-700'}`}
                 >
                    <IconCpu className="w-4 h-4" /> General
                 </button>
                 <button 
                   onClick={() => setAnalysisContext('visual')}
                   className={`p-2 rounded-lg border text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${analysisContext === 'visual' ? 'bg-sky-500/20 border-sky-500 text-sky-200' : 'bg-sentinel-900 border-sentinel-700 text-slate-400 hover:bg-sentinel-700'}`}
                 >
                    <IconGlobe className="w-4 h-4" /> Visual
                 </button>
                 <button 
                   onClick={() => setAnalysisContext('structural')}
                   className={`p-2 rounded-lg border text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${analysisContext === 'structural' ? 'bg-orange-500/20 border-orange-500 text-orange-200' : 'bg-sentinel-900 border-sentinel-700 text-slate-400 hover:bg-sentinel-700'}`}
                 >
                    <IconHammer className="w-4 h-4" /> Structural
                 </button>
                 <button 
                   onClick={() => setAnalysisContext('mineral')}
                   className={`p-2 rounded-lg border text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${analysisContext === 'mineral' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200' : 'bg-sentinel-900 border-sentinel-700 text-slate-400 hover:bg-sentinel-700'}`}
                 >
                    <IconDiamond className="w-4 h-4" /> Mineral
                 </button>
             </div>
          </div>

          {/* Dropzone */}
          <div 
             className={`border-2 border-dashed rounded-xl p-8 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer group
             ${isDragging 
                ? 'border-purple-500 bg-purple-500/10' 
                : file 
                   ? 'border-emerald-500/50 bg-emerald-500/5'
                   : 'border-sentinel-600 hover:border-purple-400 hover:bg-sentinel-700/50'
             }`}
             onDragOver={handleDragOver}
             onDragLeave={handleDragLeave}
             onDrop={handleDrop}
             onClick={() => !file && fileInputRef.current?.click()}
          >
             <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv,.json,.txt,.log,.png,.jpg,.jpeg,.pdf,.docx,.xlsx" 
                onChange={handleFileInput}
             />
             
             {file ? (
                 <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-3">
                        <IconCheck className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h4 className="text-white font-bold text-sm truncate max-w-[200px]">{file.name}</h4>
                    <p className="text-[10px] text-slate-500 uppercase font-mono mt-1 mb-4">{(file.size / 1024).toFixed(1)} KB | {file.type || 'Binary'}</p>
                    <button 
                        onClick={(e) => { e.stopPropagation(); clearData(); }}
                        className="px-4 py-2 bg-sentinel-700 hover:bg-sentinel-600 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-2"
                    >
                        <IconX className="w-3 h-3" /> EJECT FILE
                    </button>
                 </div>
             ) : (
                 <>
                    <div className="w-12 h-12 bg-sentinel-700 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-500/20 transition-colors">
                        <IconUpload className="w-6 h-6 text-slate-400 group-hover:text-purple-400" />
                    </div>
                    <h4 className="text-slate-200 font-medium group-hover:text-white">Upload Mission Data</h4>
                    <p className="text-[10px] text-slate-500 mt-2 max-w-xs uppercase leading-tight">Supports Screenshots, PDF, Word, Excel, CSV, JSON</p>
                 </>
             )}
          </div>

          {!file && (
             <div className="mt-6">
                 <p className="text-[10px] text-slate-500 text-center mb-2 uppercase tracking-widest font-bold">Scientific Templates</p>
                 <div className="flex flex-wrap justify-center gap-2">
                     <button onClick={() => loadSampleData('structural')} className="px-3 py-1.5 bg-sentinel-900 border border-sentinel-700 hover:border-orange-400 text-orange-400 text-[10px] rounded-lg transition-colors font-mono uppercase">Fault_Log.csv</button>
                     <button onClick={() => loadSampleData('mineral')} className="px-3 py-1.5 bg-sentinel-900 border border-sentinel-700 hover:border-emerald-400 text-emerald-400 text-[10px] rounded-lg transition-colors font-mono uppercase">Assay_Data.csv</button>
                     <button onClick={() => loadSampleData('glacier')} className="px-3 py-1.5 bg-sentinel-900 border border-sentinel-700 hover:border-cyan-400 text-cyan-400 text-[10px] rounded-lg transition-colors font-mono uppercase">Mass_Trend.csv</button>
                 </div>
             </div>
          )}
        </div>

        {/* Data/Asset Preview */}
        {file && (
            <div className="bg-sentinel-800 p-6 rounded-xl border border-sentinel-700 shadow-lg flex-1 min-h-[300px] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                        {file.isMultimodal ? <IconGlobe className="w-4 h-4 text-sky-400" /> : <IconTable className="w-4 h-4 text-emerald-400" />}
                        Preview Interface
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500 bg-sentinel-900 px-2 py-1 rounded">
                        {file.isMultimodal ? 'MULTIMODAL_ASSET' : 'RAW_TELEMETRY'}
                    </span>
                </div>
                
                <div className="flex-1 bg-sentinel-900 rounded-lg p-4 overflow-auto border border-sentinel-700 custom-scrollbar flex items-center justify-center">
                    {file.previewUrl ? (
                        <div className="relative group">
                            <img src={file.previewUrl} alt="Laboratory Asset" className="max-w-full max-h-[300px] rounded-lg shadow-2xl border border-white/10" />
                            <div className="absolute inset-0 bg-sky-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <span className="bg-black/50 text-white text-[10px] px-2 py-1 rounded border border-white/20">VISUAL_INSPECTION_READY</span>
                            </div>
                        </div>
                    ) : file.isMultimodal ? (
                        <div className="text-center p-8">
                             <IconFileText className="w-12 h-12 text-sky-400/50 mx-auto mb-3" />
                             <p className="text-xs text-slate-400 font-mono">NON-TEXT DOCUMENT DETECTED</p>
                             <p className="text-[10px] text-slate-600 mt-1 italic uppercase">Ready for AI document reasoning</p>
                        </div>
                    ) : (
                        <pre className="w-full h-full font-mono text-[10px] text-slate-300 whitespace-pre-wrap break-all">
                            {file.content.slice(0, 5000)}
                            {file.content.length > 5000 && <span className="text-slate-500 block mt-2 italic font-sans">... [TRUNCATED]</span>}
                        </pre>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* Analysis Column */}
      <div className="h-full min-h-[500px]">
        <AnalysisPanel 
          title="Data Intelligence Hub" 
          markdown={aiState.markdown} 
          loading={aiState.loading} 
          onAnalyze={handleAnalysis}
          onExport={handleExport}
          isThinking={aiState.isThinking}
        />
      </div>
    </div>
  );
};

export default DataLabView;
