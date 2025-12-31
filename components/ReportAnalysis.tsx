import React, { useState, useRef } from 'react';
import { Upload, FileText, Loader2, ShieldAlert, Globe, Stethoscope, CheckCircle, AlertTriangle } from 'lucide-react';
import { getGeminiChatResponse } from '../services/geminiService';
import { MedicalResponse } from '../types';

const LANGUAGES = [
  "English", "Tamil", "Hindi", "Telugu", "Malayalam", "Kannada", "Spanish", "French", "German", "Mandarin"
];

const ReportAnalysis: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [file, setFile] = useState<{ name: string, type: string, data: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MedicalResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      if (f.type !== "application/pdf") {
        alert("Please upload a PDF file.");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = (ev.target?.result as string).split(',')[1];
        setFile({
          name: f.name,
          type: f.type,
          data: base64
        });
        setResult(null); // Reset previous result on new file
      };
      reader.readAsDataURL(f);
    }
  };

  const handleAnalyze = async () => {
    if (!file || !selectedLanguage) return;

    setLoading(true);
    try {
      // Reusing the Gemini Service with a specific prompt context
      const response = await getGeminiChatResponse(
        "Analyze this medical report deeply. Focus on finding deficiencies, abnormalities, and suggest supplements and diet.",
        selectedLanguage,
        { mimeType: file.type, data: file.data }
      );
      setResult(response.structuredResponse);
    } catch (error) {
      console.error("Analysis failed", error);
      alert("Failed to analyze the report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const InfoCard = ({ title, items, colorClass, icon: Icon }: any) => (
    <div className={`p-4 rounded-xl border ${colorClass} h-full`}>
      <h4 className="font-bold text-sm mb-3 uppercase tracking-wide opacity-90 flex items-center">
        {Icon && <Icon size={16} className="mr-2" />} {title}
      </h4>
      {items && items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item: string, idx: number) => (
            <li key={idx} className="text-sm flex items-start">
              <span className="mr-2 mt-1">•</span> <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm opacity-60 italic">No specific data found.</p>
      )}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 min-h-[calc(100vh-100px)]">
      
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center">
            <FileText className="mr-3 text-teal-600" size={32} /> Medical Report Analyzer
        </h2>
        <p className="text-slate-500 mt-2">Upload your lab reports (PDF) for AI-driven analysis of deficiencies and supplement recommendations.</p>
      </div>

      {/* Language Selection - IF not selected */}
      {!selectedLanguage && (
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto text-center border border-slate-100">
            <Globe className="w-16 h-16 text-teal-600 mx-auto mb-6 opacity-20" />
            <h3 className="text-xl font-bold text-slate-900 mb-4">Select Output Language</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {LANGUAGES.map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className="p-3 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-slate-700 font-medium transition-all"
                >
                  {lang}
                </button>
              ))}
            </div>
        </div>
      )}

      {/* Main Analysis Area */}
      {selectedLanguage && (
        <div className="space-y-6">
            
            {/* Upload Section */}
            {!result && (
                <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-8 text-center transition-all">
                    <input 
                        type="file" 
                        accept="application/pdf" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileChange}
                    />
                    
                    {!file ? (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-300 rounded-xl p-10 cursor-pointer hover:border-teal-500 hover:bg-slate-50 transition-colors group"
                        >
                            <Upload className="w-16 h-16 text-slate-300 mx-auto mb-4 group-hover:text-teal-500 transition-colors" />
                            <h3 className="text-lg font-bold text-slate-700">Click to Upload Medical Report</h3>
                            <p className="text-slate-400 text-sm mt-2">Supported Format: PDF Only</p>
                        </div>
                    ) : (
                        <div className="bg-teal-50 border border-teal-100 rounded-xl p-6 mb-6">
                             <div className="flex items-center justify-center mb-4 text-teal-800">
                                <FileText size={32} className="mr-3" />
                                <div className="text-left">
                                    <p className="font-bold text-lg">{file.name}</p>
                                    <p className="text-xs text-teal-600">Ready for analysis</p>
                                </div>
                             </div>
                             
                             <div className="flex justify-center gap-4">
                                <button 
                                    onClick={handleAnalyze} 
                                    disabled={loading}
                                    className="bg-teal-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-teal-700 transition-transform hover:scale-105 disabled:opacity-70 flex items-center"
                                >
                                    {loading ? <Loader2 className="animate-spin mr-2" /> : <Stethoscope className="mr-2" />}
                                    {loading ? "Analyzing..." : "Analyze Report"}
                                </button>
                                <button 
                                    onClick={handleReset}
                                    disabled={loading}
                                    className="px-6 py-3 text-slate-500 hover:text-red-500 font-medium"
                                >
                                    Cancel
                                </button>
                             </div>
                        </div>
                    )}
                </div>
            )}

            {/* Results Dashboard */}
            {result && (
                <div className="animate-fade-in space-y-6">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center space-x-2">
                             <div className="bg-teal-100 p-2 rounded-full text-teal-600"><CheckCircle size={20} /></div>
                             <h3 className="font-bold text-slate-800">Analysis Complete</h3>
                        </div>
                        <button onClick={handleReset} className="text-sm text-teal-600 font-bold hover:underline">Analyze Another</button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                        <div className="bg-slate-900 text-white p-6">
                            <h2 className="text-2xl font-bold flex items-center">
                                📑 {result.diagnosis || "Report Analysis Findings"}
                            </h2>
                            <p className="text-slate-300 mt-2 leading-relaxed max-w-3xl">
                                {result.description}
                            </p>
                        </div>

                        <div className="p-6 grid md:grid-cols-2 gap-6">
                            <InfoCard 
                                title="Identified Deficiencies / Symptoms" 
                                items={result.symptoms} 
                                colorClass="bg-red-50 border-red-100 text-red-900" 
                                icon={AlertTriangle}
                            />
                            <InfoCard 
                                title="Suggested Supplements / Meds" 
                                items={result.medications} 
                                colorClass="bg-blue-50 border-blue-100 text-blue-900" 
                                icon={Stethoscope}
                            />
                            <InfoCard 
                                title="Recommended Diet" 
                                items={result.diet} 
                                colorClass="bg-green-50 border-green-100 text-green-900" 
                            />
                            <InfoCard 
                                title="Lifestyle & Workout" 
                                items={result.workout} 
                                colorClass="bg-orange-50 border-orange-100 text-orange-900" 
                            />
                            <div className="md:col-span-2">
                                <InfoCard 
                                    title="Important Precautions" 
                                    items={result.precautions} 
                                    colorClass="bg-yellow-50 border-yellow-100 text-yellow-900"
                                    icon={ShieldAlert}
                                />
                            </div>
                        </div>

                         <div className="px-6 pb-6">
                             <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center text-indigo-900">
                                <Stethoscope size={24} className="mr-3 text-indigo-600" />
                                <div>
                                    <p className="text-xs uppercase tracking-wide font-bold text-indigo-400">Recommended Specialist</p>
                                    <p className="font-bold text-lg">{result.recommendedSpecialist || "General Physician"}</p>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default ReportAnalysis;