
export enum DiseaseType {
  DIABETES = 'DIABETES',
  HEART = 'HEART',
  ANEMIA = 'ANEMIA'
}

export interface DiabetesInput {
  pregnancies: number;
  glucose: number;
  bloodPressure: number;
  skinThickness: number;
  insulin: number;
  bmi: number;
  diabetesPedigreeFunction: number;
  age: number;
}

export interface HeartInput {
  age: number;
  sex: 'M' | 'F';
  chestPainType: string;
  restingBP: number;
  cholesterol: number;
  fastingBS: boolean;
  restingECG: string;
  maxHR: number;
  exerciseAngina: boolean;
  oldpeak: number;
  stSlope: string;
}

export interface AnemiaInput {
  hemoglobin: number;
  rbcCount: number;
  mcv: number;
  mch: number;
  mchc: number;
  age: number;
  gender: 'M' | 'F';
}

export interface PredictionResult {
  riskPercentage: number;
  diagnosis: string;
  recommendations: string[];
  recommendedSpecialist: string;
  disclaimer: string;
}

export interface MedicalResponse {
  isMedical: boolean; // Differentiates between medical advice and chit-chat
  generalReply?: string; // For non-medical responses
  diagnosis?: string;
  description?: string;
  symptoms?: string[];
  medications?: string[];
  diet?: string[];
  workout?: string[];
  precautions?: string[];
  recommendedSpecialist?: string;
  locationQuestion?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: {
    original: string; 
    english?: string; 
    structured?: MedicalResponse; 
    isHospitalResult?: boolean; 
    hospitals?: Hospital[];
    pharmacies?: Hospital[];
    hospitalSpecialist?: string;
    attachment?: { name: string; type: string };
  };
  timestamp: number;
  isLoading?: boolean;
}

export interface Hospital {
  name: string;
  address: string;
  distance?: string;
  phone?: string;
  googleMapsUri?: string;
  type?: 'HOSPITAL' | 'PHARMACY';
  specialistAvailable?: boolean;
}

export interface GeoLocation {
  lat: number;
  lng: number;
}
