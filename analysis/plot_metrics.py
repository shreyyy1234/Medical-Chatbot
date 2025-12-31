"""
Analysis script for MediBot: computes model metrics and generates comparison plots.
Saves outputs to `analysis/plots/` and metrics to `analysis/metrics_summary.csv`.

Run:
  .\\.venv\\Scripts\\python.exe analysis\\plot_metrics.py

Outputs:
 - analysis/metrics_summary.csv
 - analysis/plots/*.png
"""
import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, mean_squared_error, mean_absolute_error,
    precision_recall_curve, roc_curve, auc
)

sns.set(style='whitegrid')

BASE = os.path.dirname(__file__)
PLOTS_DIR = os.path.join(BASE, 'plots')
os.makedirs(PLOTS_DIR, exist_ok=True)

# Datasets and target column names (adjust if your CSVs differ)
DATASETS = [
    ('diabetes', os.path.join(BASE, '..', 'local_server', 'models', 'diabetes.csv'), 'Outcome'),
    ('heart', os.path.join(BASE, '..', 'local_server', 'models', 'heart.csv'), 'target'),
    ('anemia', os.path.join(BASE, '..', 'local_server', 'models', 'anemia.csv'), 'Result')
]

rows = []

for name, csv_path, target_col in DATASETS:
    print(f'Processing {name}...')
    df = pd.read_csv(csv_path)
    # Ensure target column exists
    if target_col not in df.columns:
        # try case-insensitive match
        matches = [c for c in df.columns if c.lower() == target_col.lower()]
        if matches:
            target_col = matches[0]
        else:
            raise ValueError(f'Target column {target_col} not found in {csv_path}')

    y = df[target_col].values
    # convert multi-class target to binary (positive = max class)
    if len(np.unique(y)) > 2:
        y = (y == np.max(np.unique(y))).astype(int)
    X = df.drop(columns=[target_col]).select_dtypes(include=[np.number]).values

    # split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y if len(np.unique(y))>1 else None)

    # SVC
    svc = make_pipeline(StandardScaler(), SVC(probability=True, kernel='rbf', C=1.0, random_state=42))
    svc.fit(X_train, y_train)
    svc_pred = svc.predict(X_test)
    svc_proba = svc.predict_proba(X_test)[:, 1]

    # Random Forest
    rf = RandomForestClassifier(n_estimators=100, max_depth=15, random_state=42)
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)
    rf_proba = rf.predict_proba(X_test)[:, 1]

    # compute metrics helper
    def compute_metrics(y_true, y_pred, y_proba):
        acc = accuracy_score(y_true, y_pred)
        prec = precision_score(y_true, y_pred, zero_division=0)
        rec = recall_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)
        auc_roc = roc_auc_score(y_true, y_proba) if len(np.unique(y_true))>1 else float('nan')
        mse = mean_squared_error(y_true, y_proba)
        mae = mean_absolute_error(y_true, y_proba)
        cm = confusion_matrix(y_true, y_pred)
        tn, fp, fn, tp = (cm.ravel() if cm.size==4 else (0,0,0,0))
        return dict(
            accuracy=acc, precision=prec, recall=rec, f1=f1,
            auc_roc=auc_roc, mse=mse, mae=mae, tn=tn, fp=fp, fn=fn, tp=tp
        )

    svc_metrics = compute_metrics(y_test, svc_pred, svc_proba)
    rf_metrics = compute_metrics(y_test, rf_pred, rf_proba)

    # collect rows
    rows.append({'disease': name, 'model': 'SVC', **svc_metrics})
    rows.append({'disease': name, 'model': 'RandomForest', **rf_metrics})

    # Plot ROC curves
    if len(np.unique(y_test))>1:
        fpr_s, tpr_s, _ = roc_curve(y_test, svc_proba)
        fpr_r, tpr_r, _ = roc_curve(y_test, rf_proba)
        plt.figure(figsize=(6,5))
        plt.plot(fpr_s, tpr_s, label=f'SVC (AUC={svc_metrics["auc_roc"]:.3f})')
        plt.plot(fpr_r, tpr_r, label=f'RF (AUC={rf_metrics["auc_roc"]:.3f})')
        plt.plot([0,1],[0,1],'k--',alpha=0.5)
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title(f'ROC Curve - {name.capitalize()}')
        plt.legend()
        plt.tight_layout()
        plt.savefig(os.path.join(PLOTS_DIR, f'roc_{name}.png'))
        plt.close()

    # Precision-Recall curve
    prec_s, rec_s, _ = precision_recall_curve(y_test, svc_proba)
    prec_r, rec_r, _ = precision_recall_curve(y_test, rf_proba)
    plt.figure(figsize=(6,5))
    plt.plot(rec_s, prec_s, label='SVC')
    plt.plot(rec_r, prec_r, label='RandomForest')
    plt.xlabel('Recall')
    plt.ylabel('Precision')
    plt.title(f'Precision-Recall Curve - {name.capitalize()}')
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(PLOTS_DIR, f'pr_{name}.png'))
    plt.close()

    # Confusion matrix heatmaps
    for model, pred in [('SVC', svc_pred), ('RandomForest', rf_pred)]:
        cm = confusion_matrix(y_test, svc_pred if model=='SVC' else rf_pred)
        plt.figure(figsize=(4,3))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
        plt.xlabel('Predicted')
        plt.ylabel('Actual')
        plt.title(f'Confusion Matrix - {name.capitalize()} - {model}')
        plt.tight_layout()
        plt.savefig(os.path.join(PLOTS_DIR, f'confmat_{name}_{model}.png'))
        plt.close()

    # Error distribution histograms (predicted probability minus true label)
    for model, proba in [('SVC', svc_proba), ('RandomForest', rf_proba)]:
        residuals = proba - y_test
        plt.figure(figsize=(6,4))
        sns.histplot(residuals, bins=30, kde=True)
        plt.xlabel('Predicted Probability - True Label')
        plt.title(f'Error Distribution - {name.capitalize()} - {model}')
        plt.tight_layout()
        plt.savefig(os.path.join(PLOTS_DIR, f'errorhist_{name}_{model}.png'))
        plt.close()

    # Boxplot of predicted probabilities grouped by true label
    df_probs = pd.DataFrame({
        'y': y_test,
        'svc_prob': svc_proba,
        'rf_prob': rf_proba
    })
    plt.figure(figsize=(8,4))
    plt.subplot(1,2,1)
    sns.boxplot(x='y', y='svc_prob', data=df_probs)
    plt.title('SVC Prob by True Label')
    plt.xlabel('True Label')
    plt.subplot(1,2,2)
    sns.boxplot(x='y', y='rf_prob', data=df_probs)
    plt.title('RF Prob by True Label')
    plt.xlabel('True Label')
    plt.tight_layout()
    plt.savefig(os.path.join(PLOTS_DIR, f'prob_box_{name}.png'))
    plt.close()

# Summary metrics CSV
metrics_df = pd.DataFrame(rows)
metrics_csv = os.path.join(BASE, 'metrics_summary.csv')
metrics_df.to_csv(metrics_csv, index=False)
print('\nSaved metrics to', metrics_csv)
print('Saved plots to', PLOTS_DIR)

# Create overall comparative bar charts
metrics_plot_df = metrics_df.melt(id_vars=['disease','model'], value_vars=['accuracy','precision','recall','f1','auc_roc','mse','mae'], var_name='metric', value_name='value')
plt.figure(figsize=(12,6))
sns.barplot(data=metrics_plot_df, x='metric', y='value', hue='model')
plt.title('Model Metrics Comparison (All Diseases Combined)')
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig(os.path.join(PLOTS_DIR, 'metrics_comparison_all.png'))
plt.close()

# Per-disease grouped bar charts
for disease in metrics_df['disease'].unique():
    df_sub = metrics_df[metrics_df['disease']==disease]
    df_melt = df_sub.melt(id_vars=['model'], value_vars=['accuracy','precision','recall','f1','auc_roc','mse','mae'], var_name='metric', value_name='value')
    plt.figure(figsize=(10,5))
    sns.barplot(data=df_melt, x='metric', y='value', hue='model')
    plt.title(f'Metrics Comparison - {disease.capitalize()}')
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig(os.path.join(PLOTS_DIR, f'metrics_comparison_{disease}.png'))
    plt.close()

print('All plots generated.')
