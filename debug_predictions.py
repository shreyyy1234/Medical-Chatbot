#!/usr/bin/env python3
"""Debug script to test model predictions directly and via server."""
import joblib
import numpy as np
import requests
import json

print("=" * 70)
print("DIRECT MODEL PREDICTION TEST (Loading .joblib files)")
print("=" * 70)

# Test diabetes model directly
try:
    model = joblib.load('local_server/models/diabetes_model.joblib')
    
    test_cases = [
        ("Low risk features", [0, 80, 70, 20, 0, 20.0, 0.2, 25]),
        ("High risk features", [5, 180, 90, 40, 200, 40.0, 0.8, 60]),
        ("Medium risk features", [2, 120, 80, 30, 100, 28.0, 0.5, 40]),
    ]
    
    print("\nDIABETES MODEL (Direct):")
    for label, features in test_cases:
        X = np.array([features])
        proba = model.predict_proba(X)
        pred = model.predict(X)
        risk_pct = proba[0][1] * 100
        print(f"  {label}: {risk_pct:.1f}% (pred={pred[0]}, proba={proba[0]})")
        
except Exception as e:
    print(f"Error loading diabetes model: {e}")

print("\n" + "=" * 70)
print("SERVER ENDPOINT TEST (HTTP requests)")
print("=" * 70)

test_cases = [
    ("Low risk", [0, 80, 70, 20, 0, 20.0, 0.2, 25]),
    ("High risk", [5, 180, 90, 40, 200, 40.0, 0.8, 60]),
    ("Medium risk", [2, 120, 80, 30, 100, 28.0, 0.5, 40]),
]

print("\nDIABETES SERVER ENDPOINT:")
for label, features in test_cases:
    try:
        data = {"features": features}
        res = requests.post("http://127.0.0.1:8001/predict/diabetes", json=data, timeout=5)
        if res.status_code == 200:
            result = res.json()
            risk = result.get('riskPercentage')
            diag = result.get('diagnosis')
            print(f"  {label}: {risk}% - {diag}")
        else:
            print(f"  {label}: HTTP {res.status_code} - {res.text}")
    except Exception as e:
        print(f"  {label}: Error - {e}")
