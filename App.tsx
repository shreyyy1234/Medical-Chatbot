import React, { useState } from 'react';
import Navigation from './components/Navigation';
import ChatInterface from './components/ChatInterface';
import DiseaseForms from './components/DiseaseForms';
import HospitalFinder from './components/HospitalFinder';
import ReportAnalysis from './components/ReportAnalysis';
import { HeartPulse, MessageSquare, FileText, Activity, MapPin } from 'lucide-react';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('home');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      
      {/* Top Bar - Minimal */}
      {currentTab !== 'chat' && (
        <header className="bg-white shadow-sm border-b border-slate-200 py-4 px-6 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2 text-teal-600">
                <HeartPulse size={32} />
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">MediBot <span className="text-teal-600">AI</span></h1>
            </div>
            </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`flex-1 w-full mx-auto ${currentTab === 'chat' ? 'max-w-5xl' : 'max-w-7xl p-4 md:p-6'} mb-20 md:mb-0`}>
        {currentTab === 'home' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-fade-in mt-6">
             <div className="max-w-3xl space-y-4">
                <h1 className="text-5xl font-extrabold text-slate-900 leading-tight">
                  Your Personal <span className="text-teal-600">AI Medical Assistant</span>
                </h1>
                
                {/* 4 Main Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full pt-8 px-4">
                  <button 
                    onClick={() => setCurrentTab('chat')} 
                    className="flex flex-col items-center justify-center p-6 bg-teal-600 text-white rounded-xl shadow-lg hover:bg-teal-700 transition-all hover:scale-105"
                  >
                    <MessageSquare size={32} className="mb-2" />
                    <span className="font-bold">AI Chat</span>
                  </button>
                  
                  <button 
                    onClick={() => setCurrentTab('report')} 
                    className="flex flex-col items-center justify-center p-6 bg-white text-slate-800 border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-teal-500 transition-all hover:scale-105"
                  >
                    <FileText size={32} className="mb-2 text-blue-600" />
                    <span className="font-bold">Report Analysis</span>
                  </button>

                  <button 
                    onClick={() => setCurrentTab('disease')} 
                    className="flex flex-col items-center justify-center p-6 bg-white text-slate-800 border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-red-500 transition-all hover:scale-105"
                  >
                    <Activity size={32} className="mb-2 text-red-600" />
                    <span className="font-bold">Disease Prediction</span>
                  </button>

                  <button 
                    onClick={() => setCurrentTab('hospitals')} 
                    className="flex flex-col items-center justify-center p-6 bg-white text-slate-800 border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-500 transition-all hover:scale-105"
                  >
                    <MapPin size={32} className="mb-2 text-indigo-600" />
                    <span className="font-bold">Hospital Locator</span>
                  </button>
                </div>
             </div>
             
             <div className="grid md:grid-cols-4 gap-6 w-full max-w-6xl mt-12 px-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-lg mb-2">Multilingual Text</h3>
                  <p className="text-sm text-slate-500">Type in your native language. Our AI translates, thinks in English, and responds back to you in your language.</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-lg mb-2">Disease Risk Probability</h3>
                  <p className="text-sm text-slate-500">Diabetes, Heart Disease, and Anemia prediction using fine-tuned Support Vector Classifiers.</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-lg mb-2">Report Analysis</h3>
                  <p className="text-sm text-slate-500">Upload PDF medical reports. The AI identifies deficiencies and suggests supplements instantly.</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-lg mb-2">Hospital Locator</h3>
                  <p className="text-sm text-slate-500">Find the nearest medical centers in Chennai instantly using Geolocation and Maps.</p>
                </div>
             </div>
          </div>
        )}

        {currentTab === 'chat' && <ChatInterface />}
        {currentTab === 'disease' && <DiseaseForms />}
        {currentTab === 'report' && <ReportAnalysis />}
        {currentTab === 'hospitals' && <HospitalFinder />}
      </main>

      {/* Navigation */}
      <Navigation currentTab={currentTab} setCurrentTab={setCurrentTab} />

    </div>
  );
};

export default App;