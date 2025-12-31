Local SVC demo server for MediBot

Overview
--------
This folder contains a minimal demo to run classical ML (SVC) models locally and serve predictions over HTTP.

Files
-----
- train_models.py  - trains three toy SVC classifiers and saves them to local_server/models/
- server.py        - FastAPI server that loads saved models and exposes /predict/{name}
- requirements.txt - Python deps for the demo

Quick start (Windows PowerShell)
-------------------------------
# create venv and activate
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# install deps
pip install -r local_server/requirements.txt

# train demo models (writes local_server/models/*.joblib)
python local_server/train_models.py

# run the server
python local_server/server.py

The server will run at http://127.0.0.1:8001 and expose:
- POST /predict/diabetes
- POST /predict/heart
- POST /predict/anemia

Request body: either a JSON object of numeric fields (keys are sorted and numeric values used),
or { "features": [num1, num2, ...] } to pass a numeric feature vector explicitly.

How to wire with the frontend
-----------------------------
Set environment variable USE_LOCAL_SVC=true and LOCAL_SVC_URL if needed (defaults to http://127.0.0.1:8001).

In PowerShell (for Vite dev):
$env:USE_LOCAL_SVC = "true"; npm run dev

Notes
-----
These models are synthetic and for integration/demo only. They are NOT medically accurate and should not be used for clinical decisions.

Datasets used for training
-------------------------
- Pima Indians Diabetes (CSV mirror): https://raw.githubusercontent.com/jbrownlee/Datasets/master/pima-indians-diabetes.data.csv
- Heart disease (common processed mirror): https://raw.githubusercontent.com/anshulsingh03/heart-disease-dataset/master/heart.csv

The training script will attempt to download the above CSVs. If download fails, it will fall back to synthetic data for that dataset.
