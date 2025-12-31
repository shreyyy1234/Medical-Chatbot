"""
A small FastAPI server that loads pre-trained joblib SVC models and exposes prediction endpoints.
Endpoints:
  POST /predict/diabetes  - accepts any JSON object; server will extract numeric features in key order
  POST /predict/heart
  POST /predict/anemia

Request body: JSON object containing numeric fields OR a single key "features" with a list of numbers.
Response: JSON with keys: riskPercentage, diagnosis, recommendations, recommendedSpecialist, disclaimer

CORS enabled for convenience (development only).
"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import joblib
import os
import numpy as np
from typing import Any, Dict

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models')

MODELS = {}

# load models if available
for name in ['diabetes', 'heart', 'anemia']:
    p = os.path.join(MODEL_PATH, f"{name}_model.joblib")
    if os.path.exists(p):
        MODELS[name] = joblib.load(p)
    else:
        MODELS[name] = None

app = FastAPI(title='Local SVC Server (Demo)')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def extract_features(payload: Dict[str, Any]):
    # If payload contains a 'features' key with a list, use it directly
    if 'features' in payload and isinstance(payload['features'], list):
        return np.array(payload['features'], dtype=float).reshape(1, -1)

    # Otherwise, collect numeric values from the object in sorted key order
    keys = sorted(payload.keys())
    vals = []
    for k in keys:
        try:
            v = float(payload[k])
            vals.append(v)
        except Exception:
            # skip non-numeric
            pass
    if not vals:
        raise ValueError('No numeric features found in payload. Provide numeric fields or a "features" list.')
    return np.array(vals, dtype=float).reshape(1, -1)


def make_response(prob: float, name: str):
    # Simple mapping for demo purposes
    diagnosis = 'Low Risk'
    if prob >= 0.7:
        diagnosis = 'High Risk'
    elif prob >= 0.4:
        diagnosis = 'Moderate Risk'

    return {
        'riskPercentage': round(prob * 100, 1),
        'diagnosis': diagnosis,
        'recommendations': [f'Follow up with a {"Endocrinologist" if name=="diabetes" else "Cardiologist" if name=="heart" else "Hematologist"}'],
        'recommendedSpecialist': 'Endocrinologist' if name=='diabetes' else 'Cardiologist' if name=='heart' else 'Hematologist',
        'disclaimer': 'This is a demo classifier. Consult a physician for medical advice.'
    }


@app.post('/predict/{name}')
async def predict(name: str, request: Request):
    if name not in MODELS:
        raise HTTPException(status_code=404, detail='Unknown model')
    model = MODELS[name]
    if model is None:
        raise HTTPException(status_code=503, detail=f'Model {name} not trained. Run train_models.py first.')
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail='Invalid JSON payload')
    try:
        X = extract_features(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    # If feature length mismatches, try to pad/trim (demo-friendly)
    try:
        proba = model.predict_proba(X)
        # probability of positive class assumed to be column 1
        prob_pos = float(proba[0][1])
    except Exception as e:
        # fallback: use predict (0/1)
        pred = int(model.predict(X)[0])
        prob_pos = 0.9 if pred==1 else 0.1
    return make_response(prob_pos, name)


@app.get('/')
async def root():
    return {'status': 'ok', 'models': {k: (v is not None) for k, v in MODELS.items()}}

if __name__ == '__main__':
    import uvicorn
    uvicorn.run('server:app', host='127.0.0.1', port=8001, reload=True)
