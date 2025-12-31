MediBot Analysis

This folder contains scripts to compute evaluation metrics and generate comparison plots for the trained models.

Requirements

Install packages in your virtual environment (from project root):

```powershell
.\.venv\Scripts\python.exe -m pip install -r analysis\requirements.txt
```

Run analysis:

```powershell
.\.venv\Scripts\python.exe analysis\plot_metrics.py
```

Outputs

- `analysis/metrics_summary.csv` — CSV table with metrics for each disease and model
- `analysis/plots/` — PNG files with ROC, PR, confusion matrices, error histograms, boxplots, and comparison bar charts

If your CSV dataset paths or target column names differ, edit `analysis/plot_metrics.py` accordingly.
