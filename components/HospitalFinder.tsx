
import React, { useState } from 'react';
import { MapPin, Phone, Navigation, Stethoscope, Pill, LocateFixed } from 'lucide-react';
import { findNearbyHospitals } from '../services/geminiService';
import { Hospital, GeoLocation } from '../types';

interface PlaceCardProps {
  place: Hospital;
  type: 'hospital' | 'pharmacy';
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place, type }) => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div className="flex-1">
            <div className="flex items-center">
                {type === 'hospital' ? <MapPin className="text-blue-600 mr-2" size={20} /> : <Pill className="text-green-600 mr-2" size={20} />}
                <h3 className="font-bold text-lg text-slate-800">{place.name}</h3>
            </div>
            <p className="text-slate-500 text-sm mt-1 ml-7">{place.address}</p>
            <div className="ml-7 mt-2 flex flex-wrap gap-3">
                 <div className="flex items-center text-sm font-medium text-slate-700">
                    <Phone size={14} className="mr-1 text-blue-500" />
                    <span>{place.phone}</span>
                </div>
            </div>
        </div>
        
        <div className="flex flex-col items-end min-w-[100px]">
             <span className="text-xs bg-slate-100 px-3 py-1 rounded-full font-bold text-slate-600 mb-2 whitespace-nowrap">
                {place.distance}
             </span>
             <a href={place.googleMapsUri || "#"} target="_blank" rel="noreferrer" className="flex items-center text-blue-600 hover:underline text-sm font-bold">
                 <Navigation size={14} className="mr-1" /> Navigate
             </a>
        </div>
    </div>
);

const HospitalFinder: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [pharmacies, setPharmacies] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [groundingText, setGroundingText] = useState('');
  const [location, setLocation] = useState<GeoLocation | null>(null);

  const getLocationAndSearch = () => {
    setLoading(true);
    if (navigator.geolocation) {
      // First try with high accuracy
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          await executeSearch(loc);
        },
        (error) => {
          console.warn("High accuracy location failed, retrying with low accuracy...", error);
          // Fallback to low accuracy if GPS fails or timeout
          navigator.geolocation.getCurrentPosition(
             async (position) => {
                 const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
                 await executeSearch(loc);
             },
             (err2) => {
                 console.error(err2);
                 alert("Location access failed. Showing default location (Chennai) for demonstration.");
                 searchFallback();
             },
             { enableHighAccuracy: false, timeout: 20000, maximumAge: 0 }
          );
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 } // Force fresh location
      );
    } else {
      alert("Geolocation not supported. Showing defaults.");
      searchFallback();
    }
  };

  const executeSearch = async (loc: GeoLocation) => {
      setLocation(loc);
      // Search for both Hospitals and Pharmacies
      const res = await findNearbyHospitals(loc, 'English', true);
      setHospitals(res.hospitals);
      setPharmacies(res.pharmacies);
      setGroundingText(res.text);
      setLoading(false);
  };

  const searchFallback = async () => {
      const chennaiLoc = { lat: 13.0827, lng: 80.2707 };
      setLocation(chennaiLoc);
      const res = await findNearbyHospitals(chennaiLoc, 'English', true);
      setHospitals(res.hospitals);
      setPharmacies(res.pharmacies);
      setGroundingText(res.text);
      setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
            <div className="p-6 bg-blue-600 text-white flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div>
                    <h2 className="text-2xl font-bold flex items-center">
                        <MapPin className="mr-2" /> Hospital & Pharmacy Locator
                    </h2>
                    <p className="text-blue-100">Find nearest medical centers and pharmacies.</p>
                </div>
                <button 
                    onClick={getLocationAndSearch}
                    disabled={loading}
                    className="bg-white text-blue-600 px-6 py-2 rounded-full font-bold hover:bg-blue-50 transition-colors flex items-center shadow-lg"
                >
                    {loading ? "Locating..." : (
                        <>
                            <LocateFixed size={18} className="mr-2" /> Find Near Me
                        </>
                    )}
                </button>
            </div>
            
            <div className="p-6 bg-slate-50 min-h-[400px]">
                {location && (
                    <div className="mb-4 flex items-center justify-center md:justify-start">
                        <span className="bg-blue-100 text-blue-800 text-xs font-mono px-3 py-1 rounded-full flex items-center">
                            <LocateFixed size={12} className="mr-2" />
                            Searching near: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </span>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center h-48 flex-col space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="text-slate-500 text-sm">Accessing Google Maps...</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        
                        {/* Hospitals Section */}
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                                <MapPin className="mr-2 text-blue-600" /> Nearest Hospitals
                            </h3>
                            {hospitals.length > 0 ? (
                                <div className="space-y-4">
                                    {hospitals.map((h, i) => <PlaceCard key={i} place={h} type="hospital" />)}
                                </div>
                            ) : (
                                <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
                                    <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                                    <p className="text-slate-500 italic">Click "Find Near Me" to locate hospitals.</p>
                                </div>
                            )}
                        </div>

                        {/* Pharmacies Section */}
                        {pharmacies.length > 0 && (
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center pt-4 border-t border-slate-200">
                                    <Pill className="mr-2 text-green-600" /> Nearest Pharmacies
                                </h3>
                                <div className="space-y-4">
                                    {pharmacies.map((p, i) => <PlaceCard key={i} place={p} type="pharmacy" />)}
                                </div>
                            </div>
                        )}
                        
                        {hospitals.length > 0 && (
                             <div className="prose max-w-none text-slate-600 bg-white p-4 rounded-lg shadow-sm text-xs md:text-sm border border-slate-100 mt-4">
                                <p><strong>AI Summary:</strong> {groundingText}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default HospitalFinder;
