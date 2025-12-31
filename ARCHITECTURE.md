MediBot — Project Architecture Summary

This document replaces the generic stack diagram with details specific to this project implementation.

1) Frontend
- Tech: React (with Vite) + TypeScript
- Components: `ChatInterface`, `DiseaseForms`, `HospitalFinder`, `Navigation`, `ReportAnalysis`.
- Features: dynamic form generation (fields derived from CSV column names), multilingual UI, inline validation, and fetch-based calls to local ML server and conversational API.

2) Backend
- Tech: FastAPI (Python) serving local classical ML inference and model endpoints.
- Endpoints: `/predict/diabetes`, `/predict/heart`, `/predict/anemia`, and status endpoints.
- Model serving: joblib-deserialized scikit-learn models (Random Forest or SVC depending on best performance).
- CORS enabled for local development.

3) ML Models
- Algorithms: Support Vector Classifier (SVC) and Random Forest. Both are trained during `local_server/train_models.py` and the best performing model is saved as `*_model.joblib`.
- Training: Uses user-provided CSV datasets in `local_server/models/` with stratified splits, scaling, and evaluation across accuracy, precision, recall, F1, AUC-ROC, MSE, MAE.
- Local inference: Predictions are served locally to preserve privacy and reduce latency.

4) Conversational & NLP
- Cloud NLP: Google Gemini (via `@google/genai`) for text understanding, symptom analysis, and conversation.
- Tasks: translate responses, generate medical guidance, and optionally use Google Maps tool via Gemini for place search.

5) Multilingual Support
- Language detection and translation are handled by Gemini; UI and responses are delivered in the user's preferred language.
- All static UX text supports localization via in-app strings.

6) Data & Datasets
- Structured symptom-disease datasets stored in `local_server/models/` (e.g., `diabetes.csv`, `heart.csv`, `anemia.csv`).
- The frontend auto-inspects these CSVs' columns to construct forms matching model inputs.

7) Location Services
- Client-side: Browser Geolocation API (`navigator.geolocation`) to get user coordinates (with high/low accuracy fallback and demo fallback location).
- Place lookup: Google Maps is queried via Gemini's tool configurations (the project uses Gemini's `googleMaps` tool integration to find and rank nearby hospitals and pharmacies). Outputs include place name, distance, Google Maps URI, and short AI-generated summary.

8) Privacy and Security
- Sensitive patient data used for predictions is processed locally when `VITE_USE_LOCAL_SVC=true` to avoid sending PII to cloud services.
- Optional cloud features (conversational analysis, Google Maps searches) can be disabled for maximum privacy.

9) Deployment & Dev
- Environment: `.env.local` controls `VITE_USE_LOCAL_SVC` and `VITE_LOCAL_SVC_URL` for the frontend.
- Local server: Run `local_server/server.py` (FastAPI) and start frontend with `npm run dev`.

Notes & Differences from the generic diagram provided:
- Backend is FastAPI (Python) not Flask.
- ML models include both SVC and Random Forest; the system selects the best model rather than exclusively SVM.
- Location services use the browser Geolocation API + Gemini/Google Maps tool, not only a pure Geolocation API.
- Dynamic form generation based on dataset columns is implemented to ensure the UI always matches model inputs.

If you'd like, I can also update the README to include this architecture summary and add a small diagram image replacing the generic one in your attachments. Which would you prefer next?