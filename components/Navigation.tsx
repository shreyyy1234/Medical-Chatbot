import React from 'react';
import { Activity, MessageSquare, MapPin, HeartPulse, FileText } from 'lucide-react';

interface NavigationProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentTab, setCurrentTab }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Activity },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'report', label: 'Report Analysis', icon: FileText },
    { id: 'disease', label: 'Disease Prediction', icon: HeartPulse },
    { id: 'hospitals', label: 'Hospital Locator', icon: MapPin },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 z-50 md:relative md:border-t-0 md:bg-transparent md:w-auto">
      <div className="flex justify-around md:justify-start md:space-x-8 p-4 md:p-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-2 rounded-lg transition-colors ${
                isActive 
                  ? 'text-teal-600 bg-teal-50 font-semibold' 
                  : 'text-slate-500 hover:text-teal-500 hover:bg-slate-50'
              }`}
            >
              <Icon size={24} />
              <span className="text-xs md:text-sm">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;