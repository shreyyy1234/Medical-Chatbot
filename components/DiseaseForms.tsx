import React, { useState } from 'react';
import { PredictionResult, DiseaseType } from '../types';
import { predictDiabetes, predictHeartDisease, predictAnemia } from '../services/geminiService';
import { AlertTriangle, CheckCircle, Activity, Stethoscope } from 'lucide-react';

// Feature definitions matching CSV columns (excluding target column)
const FEATURE_DEFINITIONS = {
  [DiseaseType.DIABETES]: [
    'Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness', 
    'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age'
  ],
  [DiseaseType.HEART]: [
    'age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 
    'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal'
  ],
  [DiseaseType.ANEMIA]: [
    'Gender', 'Hemoglobin', 'MCH', 'MCHC', 'MCV'
  ]
};

// Categorical features with their options and descriptions
const CATEGORICAL_FEATURES: Record<string, Record<string, {values: string[], labels: string[]}>> = {
  [DiseaseType.HEART]: {
    'sex': {
      values: ['0', '1'],
      labels: ['0 - Female', '1 - Male']
    },
    'cp': {
      values: ['0', '1', '2', '3'],
      labels: ['0 - Typical Angina', '1 - Atypical Angina', '2 - Non-anginal Pain', '3 - Asymptomatic']
    },
    'fbs': {
      values: ['0', '1'],
      labels: ['0 - ≤120 mg/dl', '1 - >120 mg/dl']
    },
    'restecg': {
      values: ['0', '1', '2'],
      labels: ['0 - Normal', '1 - ST-T Abnormality', '2 - LV Hypertrophy']
    },
    'exang': {
      values: ['0', '1'],
      labels: ['0 - No Exercise Angina', '1 - Exercise Angina Present']
    },
    'slope': {
      values: ['0', '1', '2'],
      labels: ['0 - Upsloping', '1 - Flat', '2 - Downsloping']
    },
    'ca': {
      values: ['0', '1', '2', '3', '4'],
      labels: ['0 - No Vessels', '1 - 1 Vessel', '2 - 2 Vessels', '3 - 3 Vessels', '4 - 4 Vessels']
    },
    'thal': {
      values: ['0', '1', '2', '3'],
      labels: ['0 - Unknown', '1 - Normal', '2 - Fixed Defect', '3 - Reversible Defect']
    }
  },
  [DiseaseType.ANEMIA]: {
    'Gender': {
      values: ['0', '1'],
      labels: ['0 - Female', '1 - Male']
    }
  }
};

const DiseaseForms: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DiseaseType>(DiseaseType.DIABETES);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  
  // Dynamic form data storage
  const [formData, setFormData] = useState<Record<string, number | string>>({});

  // Initialize form data with default values
  React.useEffect(() => {
    const features = FEATURE_DEFINITIONS[activeTab];
    const newFormData: Record<string, number | string> = {};
    features.forEach(feature => {
      newFormData[feature] = 0;
    });
    setFormData(newFormData);
  }, [activeTab]);


  const handlePredict = async () => {
    setLoading(true);
    setResult(null);
    try {
      const features = FEATURE_DEFINITIONS[activeTab];
      const featureArray = features.map(f => Number(formData[f]) || 0);
      
      let res: PredictionResult;
      if (activeTab === DiseaseType.DIABETES) {
        res = await predictDiabetes({ features: featureArray } as any);
      } else if (activeTab === DiseaseType.HEART) {
        res = await predictHeartDisease({ features: featureArray } as any);
      } else {
        res = await predictAnemia({ features: featureArray } as any);
      }
      setResult(res);
    } catch (error) {
      console.error(error);
      setResult({
        riskPercentage: 0,
        diagnosis: 'Error',
        recommendedSpecialist: 'General Practitioner',
        recommendations: ['Please try again or consult a healthcare provider'],
        disclaimer: 'Prediction failed. Please check your input values.'
      });
    } finally {
      setLoading(false);
    }
  };


  const InputField = ({ label, feature, value, onChange }: any) => {
    const categoryOptions = CATEGORICAL_FEATURES[activeTab]?.[feature];
    
    return (
      <div className="flex flex-col space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
        {categoryOptions ? (
          <select 
            value={value}
            onChange={e => onChange(e.target.value)}
            className="p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 outline-none bg-white text-sm"
          >
            <option value="">-- Select --</option>
            {categoryOptions.values.map((optValue, idx) => (
              <option key={optValue} value={optValue}>
                {categoryOptions.labels[idx]}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="number"
            step="0.01"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 outline-none"
          />
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden min-h-[600px]">
      <div className="bg-slate-900 text-white p-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Activity className="mr-2" /> Disease Prediction
        </h2>
      </div>

      <div className="flex border-b border-slate-200">
        {[DiseaseType.DIABETES, DiseaseType.HEART, DiseaseType.ANEMIA].map(type => (
          <button
            key={type}
            onClick={() => { setActiveTab(type); setResult(null); }}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${
              activeTab === type ? 'bg-teal-50 text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="p-6 grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Enter Patient Vitals</h3>
            <div className="grid grid-cols-2 gap-4">
              {FEATURE_DEFINITIONS[activeTab].map(feature => (
                <InputField 
                  key={feature}
                  label={feature}
                  feature={feature}
                  value={formData[feature]}
                  onChange={(v: string) => setFormData({...formData, [feature]: v})}
                />
              ))}
            </div>
            
            <button 
                onClick={handlePredict}
                disabled={loading}
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors mt-6"
            >
                {loading ? "Analyzing..." : `Predict ${activeTab} Risk`}
            </button>
        </div>

        <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 flex flex-col items-center justify-center text-center">
            {result ? (
                <div className="animate-fade-in w-full">
                    <div className="flex items-center justify-center mb-4">
                        {result.riskPercentage > 50 ? (
                            <AlertTriangle className="text-red-500 w-16 h-16" />
                        ) : (
                            <CheckCircle className="text-green-500 w-16 h-16" />
                        )}
                    </div>
                    <h3 className="text-2xl font-bold mb-2">
                        Risk Probability: <span className={result.riskPercentage > 50 ? 'text-red-600' : 'text-green-600'}>{result.riskPercentage}%</span>
                    </h3>
                    <p className="text-lg font-medium text-slate-700 mb-4">{result.diagnosis}</p>
                    
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-900 mb-4">
                        <Stethoscope size={20} className="mr-2" />
                        <span className="font-bold text-sm">Consult: {result.recommendedSpecialist}</span>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm text-left w-full">
                        <h4 className="font-bold text-slate-800 mb-2">Recommendations:</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                            {result.recommendations?.map((rec, i) => (
                                <li key={i}>{rec}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="mt-4 p-2 bg-red-50 border border-red-100 rounded text-[10px] text-red-500">
                        {result.disclaimer}
                    </div>
                </div>
            ) : (
                <div className="text-slate-400">
                    <Activity className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>Enter patient data and click predict to see results.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DiseaseForms;