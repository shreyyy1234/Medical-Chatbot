import requests
import json

diseases = [
    ('diabetes', [1, 95, 70, 30, 100, 28.0, 0.3, 45]),
    ('heart', [45, 1, 0, 120, 200, 0, 0, 150, 0, 0, 1, 0, 2]),
    ('anemia', [0, 14.0, 28, 32, 85])
]

print("Testing all disease prediction endpoints:\n")
for disease, features in diseases:
    try:
        data = {'features': features}
        res = requests.post(f'http://127.0.0.1:8001/predict/{disease}', json=data, timeout=5)
        result = res.json()
        risk = result.get("riskPercentage")
        diag = result.get("diagnosis")
        print(f'✓ {disease.upper()}: {risk}% - {diag}')
    except Exception as e:
        print(f'✗ {disease.upper()} Error: {e}')
