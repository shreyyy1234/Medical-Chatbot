
import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Loader2, MapPin, Globe, User, Bot, Phone, Map, RefreshCcw, Stethoscope, ShieldAlert } from 'lucide-react';
import { ChatMessage, GeoLocation } from '../types';
import { getGeminiChatResponse, findNearbyHospitals } from '../services/geminiService';

const LANGUAGES = [
  "English", "Tamil", "Hindi", "Telugu", "Malayalam", "Kannada", "Spanish", "French", "German", "Mandarin"
];

const LANGUAGE_CODES: Record<string, string> = {
  "English": "en-US",
  "Tamil": "ta-IN",
  "Hindi": "hi-IN",
  "Telugu": "te-IN",
  "Malayalam": "ml-IN",
  "Kannada": "kn-IN",
  "Spanish": "es-ES",
  "French": "fr-FR",
  "German": "de-DE",
  "Mandarin": "zh-CN"
};

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(""); 
  const [showLocateButton, setShowLocateButton] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showLocateButton]);

  const toggleListening = () => {
    if (!selectedLanguage) {
      alert("Please select a language first.");
      return;
    }

    // Stop listening if already active
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      // CONFIGURATION FOR STABILITY
      recognition.continuous = false; // Set to false to prevent "repeating" bug
      recognition.interimResults = false; // Set to false to prevent "typos" / flickering
      recognition.lang = LANGUAGE_CODES[selectedLanguage] || 'en-US'; 

      recognition.onstart = () => setIsListening(true);
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.onresult = (event: any) => {
        // Only grab the final result
        const transcript = event.results[0][0].transcript;
        if (transcript) {
            setInput(prev => {
                const trimmed = prev.trim();
                // Smart append: Add space if there is existing text
                return trimmed ? `${trimmed} ${transcript}` : transcript;
            });
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
             // Only stop UI state for actual errors, not normal aborts
             setIsListening(false);
        }
      };

      try {
        recognition.start();
      } catch (e) {
        console.error("Failed to start recognition", e);
        setIsListening(false);
      }
    } else {
      alert("Browser does not support speech recognition.");
    }
  };

  const handleReset = () => {
    setMessages([]);
    setInput("");
    setShowLocateButton(false);
    // Keep language selected
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !selectedLanguage) return;

    setShowLocateButton(false);

    const userMsgId = Date.now().toString();
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: { 
        original: input
      },
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMsg]);
    
    // Store data to send
    const textToSend = input;

    // Clear inputs immediately
    setInput('');
    
    setIsLoading(true);

    try {
      const response = await getGeminiChatResponse(
          textToSend, 
          selectedLanguage
      );

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: {
          original: response.structuredResponse.generalReply || "Structured Response",
          structured: response.structuredResponse,
          english: response.englishInput
        },
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMsg]);
      // Only show hospital button if it was a medical response
      if (response.structuredResponse.isMedical) {
        setShowLocateButton(true); 
      }
    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocateHospitals = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      setShowLocateButton(false);
      
      // Temporary message while acquiring location
      const loadingMsgId = Date.now().toString();
      setMessages(prev => [...prev, {
        id: loadingMsgId,
        role: 'model',
        content: { original: `Acquiring your precise location...` },
        timestamp: Date.now(),
        isLoading: true
      }]);

      navigator.geolocation.getCurrentPosition(async (position) => {
        const loc: GeoLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
        
        // Update message to show we found the location
        setMessages(prev => prev.map(m => m.id === loadingMsgId ? {
            ...m, 
            content: { original: `Searching near [${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}]...` }
        } : m));

        // Chat only needs hospitals (not pharmacies), generic search
        const res = await findNearbyHospitals(loc, selectedLanguage, false);

        const hospitalMsg: ChatMessage = {
          id: (Date.now() + 100).toString(),
          role: 'model',
          content: {
            original: res.text,
            isHospitalResult: true,
            hospitals: res.hospitals
          },
          timestamp: Date.now()
        };
        
        // Remove the temporary loading message and add the result
        setMessages(prev => prev.filter(m => m.id !== loadingMsgId).concat(hospitalMsg));
        setIsLoading(false);
      }, (error) => {
        console.error("Geolocation error", error);
        alert(`Location access denied or failed: ${error.message}`);
        setIsLoading(false);
        setMessages(prev => prev.filter(m => m.id !== loadingMsgId));
      }, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const InfoCard = ({ title, items, colorClass, icon: Icon }: any) => (
    <div className={`p-3 rounded-xl border ${colorClass} h-full`}>
      <h4 className="font-bold text-sm mb-2 uppercase tracking-wide opacity-80 flex items-center">
        {Icon && <Icon size={14} className="mr-1" />} {title}
      </h4>
      <ul className="space-y-1">
        {items?.map((item: string, idx: number) => (
          <li key={idx} className="text-sm flex items-start">
            <span className="mr-2">•</span> {item}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-slate-50 relative">
      
      {/* 1. Language Selection Overlay */}
      {!selectedLanguage && (
        <div className="absolute inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
            <Globe className="w-12 h-12 text-teal-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to MediBot</h2>
            <p className="text-slate-500 mb-6">Please select your preferred language.</p>
            <div className="grid grid-cols-2 gap-3">
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
        </div>
      )}

      {/* 2. Top Bar */}
      <div className="bg-white px-6 py-3 shadow-sm flex justify-between items-center z-10">
        <div className="flex items-center space-x-2">
          <Bot className="text-teal-600" />
          <div>
            <h2 className="font-bold text-slate-800 leading-tight">MediBot AI</h2>
            <p className="text-xs text-slate-400">Online • Doctor Assistant</p>
          </div>
        </div>
        {/* Medical disclaimer banner */}
        <div className="ml-4 flex-1 text-center">
          <div className="text-xs text-yellow-800 bg-yellow-50 border border-yellow-100 px-3 py-1 rounded-md inline-block">
            Medical advice is for informational purposes only and not a substitute for professional care. Consult a qualified healthcare professional for diagnosis and treatment.
          </div>
        </div>
        <div className="flex items-center space-x-2">
            {selectedLanguage && (
            <div className="flex items-center text-sm font-medium text-teal-700 bg-teal-50 px-3 py-1 rounded-full">
                <Globe size={14} className="mr-2" />
                {selectedLanguage}
            </div>
            )}
            <button onClick={handleReset} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full" title="New Chat">
                <RefreshCcw size={18} />
            </button>
        </div>
      </div>

      {/* 3. Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {selectedLanguage && messages.length === 0 && (
            <div className="flex justify-start">
                <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm max-w-[80%]">
                    <p className="text-slate-700">
                        Hello! I am your AI medical assistant. Tell me your symptoms, and I will analyze them to provide diagnosis, diet, and medication suggestions.
                    </p>
                </div>
            </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-2 ${msg.role === 'model' ? 'bg-teal-100 text-teal-600' : 'order-2 ml-2 bg-slate-200 text-slate-600'}`}>
                {msg.role === 'model' ? <Bot size={18} /> : <User size={18} />}
            </div>

            <div className={`max-w-[95%] md:max-w-[85%] ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
              
              {msg.role === 'user' && (
                <div className="bg-teal-600 text-white p-3 rounded-2xl rounded-tr-none shadow-md">
                   <p>{msg.content.original}</p>
                </div>
              )}

              {msg.role === 'model' && msg.isLoading && (
                  <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-none flex items-center space-x-2">
                    <Loader2 className="animate-spin text-teal-600" size={18} />
                    <span className="text-xs text-slate-500 font-medium">{msg.content.original}</span>
                  </div>
              )}

              {/* RENDER MEDICAL STRUCTURED RESPONSE */}
              {msg.role === 'model' && msg.content.structured && msg.content.structured.isMedical && (
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-sm overflow-hidden animate-fade-in">
                  <div className="bg-slate-900 text-white p-4">
                    <h3 className="text-lg font-bold flex items-center">
                        🩺 {msg.content.structured.diagnosis}
                    </h3>
                    <p className="text-slate-300 text-sm mt-1 leading-relaxed">
                        {msg.content.structured.description}
                    </p>
                  </div>

                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700">
                    <InfoCard 
                        title="Symptoms / Deficiencies" 
                        items={msg.content.structured.symptoms} 
                        colorClass="bg-red-50 border-red-100 text-red-800" 
                    />
                     <InfoCard 
                        title="Meds / Supplements" 
                        items={msg.content.structured.medications} 
                        colorClass="bg-blue-50 border-blue-100 text-blue-800" 
                    />
                    <InfoCard 
                        title="Diet Recommendations" 
                        items={msg.content.structured.diet} 
                        colorClass="bg-green-50 border-green-100 text-green-800" 
                    />
                    <InfoCard 
                        title="Workout / Lifestyle" 
                        items={msg.content.structured.workout} 
                        colorClass="bg-orange-50 border-orange-100 text-orange-800" 
                    />
                    <div className="md:col-span-2">
                        <InfoCard 
                            title="Precautions" 
                            items={msg.content.structured.precautions} 
                            colorClass="bg-yellow-50 border-yellow-100 text-yellow-800"
                            icon={ShieldAlert}
                        />
                    </div>
                  </div>
                  
                  {/* Doctor Recommendation */}
                  <div className="px-4 pb-2">
                     <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center text-indigo-900">
                        <Stethoscope size={20} className="mr-2" />
                        <span className="font-bold text-sm">Recommended Specialist: {msg.content.structured.recommendedSpecialist}</span>
                     </div>
                  </div>

                  <div className="bg-slate-50 p-3 border-t border-slate-100 flex items-center justify-between">
                     <span className="text-xs text-slate-500 italic">
                        {msg.content.structured.locationQuestion}
                     </span>
                  </div>
                </div>
              )}

              {/* RENDER GENERAL CONVERSATION (Non-Medical) */}
              {msg.role === 'model' && msg.content.structured && !msg.content.structured.isMedical && (
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm text-slate-800">
                      {msg.content.structured.generalReply}
                  </div>
              )}

              {/* Bot Response - Hospital List (List Layout One Below Another) */}
              {msg.role === 'model' && msg.content.isHospitalResult && (
                  <div className="bg-transparent w-full">
                      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-sm p-4 mb-3">
                          <p className="font-semibold text-slate-700">
                            Here are the top 4 nearest hospitals based on your location:
                          </p>
                      </div>
                      
                      {/* Vertical List Layout */}
                      <div className="space-y-3">
                          {msg.content.hospitals?.map((h, idx) => (
                              <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                  <div className="flex justify-between items-start mb-2">
                                      <div>
                                          <h4 className="font-bold text-teal-800 text-lg">{h.name}</h4>
                                          <p className="text-sm text-slate-500 mt-1">{h.address}</p>
                                      </div>
                                      <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold whitespace-nowrap">
                                        {h.distance}
                                      </span>
                                  </div>
                                  
                                  <div className="mt-3 bg-slate-50 p-3 rounded-lg flex items-center justify-between">
                                      <div className="flex items-center text-sm text-slate-700">
                                        <Phone size={16} className="mr-2 text-blue-500" />
                                        <span>{h.phone}</span>
                                      </div>
                                  </div>

                                  <div className="mt-4 flex space-x-2">
                                    <a href={h.googleMapsUri || "#"} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition-colors">
                                        <Map size={16} className="mr-2" /> Navigate
                                    </a>
                                    <button className="flex-1 flex items-center justify-center py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors">
                                        <Phone size={16} className="mr-2" /> Call Now
                                    </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

               {msg.role === 'model' && !msg.content.structured && !msg.content.isHospitalResult && !msg.isLoading && (
                   <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm">
                       {msg.content.original}
                   </div>
               )}

            </div>
          </div>
        ))}
        
        {isLoading && !messages.some(m => m.isLoading) && (
          <div className="flex justify-start ml-10">
            <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-none flex items-center space-x-2">
              <Loader2 className="animate-spin text-teal-600" size={18} />
              <span className="text-xs text-slate-500 font-medium">Processing...</span>
            </div>
          </div>
        )}

        {showLocateButton && !isLoading && (
            <div className="flex justify-center mt-2 animate-bounce-in">
                <button 
                    onClick={handleLocateHospitals}
                    className="flex items-center space-x-2 bg-teal-600 text-white px-6 py-2 rounded-full shadow-lg hover:bg-teal-700 transition-transform hover:scale-105"
                >
                    <MapPin size={18} />
                    <span>Find Nearest Hospitals</span>
                </button>
            </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Input Area */}
      <div className="bg-white border-t border-slate-200 p-4">

        <div className="flex items-center space-x-2 max-w-4xl mx-auto">
          
          <button 
            onClick={toggleListening}
            disabled={!selectedLanguage}
            className={`p-3 rounded-full transition-colors ${
              isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50 disabled:opacity-50'
            }`}
          >
            <Mic size={22} />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={!selectedLanguage}
            placeholder={
                !selectedLanguage ? "Select language to start" : 
                isListening ? "Listening... Speak now" : 
                "Type your symptoms here..."
            }
            className="flex-1 bg-slate-100 border-none rounded-full px-5 py-3 focus:ring-2 focus:ring-teal-500 outline-none text-slate-800 placeholder:text-slate-400 disabled:bg-slate-50"
          />

          <button
            onClick={handleSend}
            disabled={(!input.trim()) || isLoading || !selectedLanguage}
            className="p-3 bg-teal-600 text-white rounded-full hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-teal-200"
          >
            <Send size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
