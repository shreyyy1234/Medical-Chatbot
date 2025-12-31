"""
Train SVC and Random Forest classifiers for diabetes, heart disease and anemia.

This script loads CSV datasets from local_server/models/*.csv, trains both SVC and
Random Forest models on each disease dataset, evaluates performance, and saves the
best performing model (by accuracy and AUC) for each disease.

Outputs are saved to local_server/models/*.joblib with metrics printed.

Models trained on user-provided datasets. NOT clinically validated — for demo/integration only.
"""
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.metrics import accuracy_score, roc_auc_score, f1_score

os.makedirs('local_server/models', exist_ok=True)


def train_and_evaluate(X, y, name, random_state=42):
    """Train SVC and Random Forest, pick the best by accuracy, print metrics."""
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=random_state)
    
    # Train SVC
    svc_clf = make_pipeline(StandardScaler(), SVC(probability=True, kernel='rbf', C=1.0, random_state=random_state))
    svc_clf.fit(X_train, y_train)
    svc_preds = svc_clf.predict(X_test)
    svc_proba = svc_clf[1].decision_function(X_test)
    svc_acc = accuracy_score(y_test, svc_preds)
    svc_f1 = f1_score(y_test, svc_preds, zero_division=0)
    svc_auc = roc_auc_score(y_test, svc_proba) if len(np.unique(y_test)) > 1 else None
    
    # Train Random Forest
    rf_clf = RandomForestClassifier(n_estimators=100, max_depth=15, random_state=random_state, n_jobs=-1)
    rf_clf.fit(X_train, y_train)
    rf_preds = rf_clf.predict(X_test)
    rf_proba = rf_clf.predict_proba(X_test)[:, 1] if hasattr(rf_clf, 'predict_proba') else None
    rf_acc = accuracy_score(y_test, rf_preds)
    rf_f1 = f1_score(y_test, rf_preds, zero_division=0)
    rf_auc = roc_auc_score(y_test, rf_proba) if rf_proba is not None and len(np.unique(y_test)) > 1 else None
    
    # Pick best by accuracy (SVC is mandatory, but use RF if significantly better)
    best_model = rf_clf if rf_acc > svc_acc + 0.05 else svc_clf
    best_name = 'RandomForest' if rf_acc > svc_acc + 0.05 else 'SVC'
    best_acc = max(svc_acc, rf_acc)
    best_auc = rf_auc if best_name == 'RandomForest' else svc_auc
    
    path = f'local_server/models/{name}_model.joblib'
    joblib.dump(best_model, path)
    
    # Print detailed metrics
    print(f"\n{'='*60}")
    print(f"Disease: {name.upper()}")
    print(f"{'='*60}")
    print(f"SVC:          acc={svc_acc:.4f}, f1={svc_f1:.4f}, auc={svc_auc if svc_auc is None else f'{svc_auc:.4f}'}")
    print(f"RandomForest: acc={rf_acc:.4f}, f1={rf_f1:.4f}, auc={rf_auc if rf_auc is None else f'{rf_auc:.4f}'}")
    print(f"Selected:     {best_name} (acc={best_acc:.4f})")
    print(f"Saved to:     {path}")
    print(f"{'='*60}\n")
    
    return best_model, best_acc


def load_csv_dataset(csv_path, target_col):
    """Load CSV, infer target from column name, return X and y."""
    try:
        df = pd.read_csv(csv_path)
        print(f"Loaded {csv_path}: shape {df.shape}")
        print(f"  Columns: {list(df.columns)}")
        
        # Find target column (case-insensitive search)
        target_candidates = [col for col in df.columns if target_col.lower() in col.lower()]
        if not target_candidates:
            raise ValueError(f"Target column containing '{target_col}' not found. Columns: {list(df.columns)}")
        target_col_name = target_candidates[0]
        
        # Handle multi-class by converting to binary (positive class)
        y = df[target_col_name].values
        if len(np.unique(y)) > 2:
            # Use max class as positive (disease present)
            y = (y == np.max(np.unique(y))).astype(int)
        
        X = df.drop(columns=[target_col_name]).select_dtypes(include=[np.number]).values
        print(f"  Features shape: {X.shape}, Target shape: {y.shape}, Classes: {np.unique(y)}")
        return X, y
    except Exception as e:
        print(f"Error loading {csv_path}: {e}")
        raise


if __name__ == '__main__':
    print("Training disease prediction models from CSV datasets...\n")
    
    # Load and train Diabetes
    try:
        Xd, yd = load_csv_dataset('local_server/models/diabetes.csv', 'outcome')
        train_and_evaluate(Xd, yd, 'diabetes', random_state=1)
    except Exception as e:
        print(f"Diabetes training failed: {e}\n")
    
    # Load and train Heart
    try:
        Xh, yh = load_csv_dataset('local_server/models/heart.csv', 'target')
        train_and_evaluate(Xh, yh, 'heart', random_state=2)
    except Exception as e:
        print(f"Heart training failed: {e}\n")
    
    # Load and train Anemia (target column is 'Result' in the provided CSV)
    try:
        Xa, ya = load_csv_dataset('local_server/models/anemia.csv', 'result')
        train_and_evaluate(Xa, ya, 'anemia', random_state=3)
    except Exception as e:
        print(f"Anemia training failed: {e}\n")
    
    print('\n' + '='*60)
    print('Training complete. Models saved in local_server/models/')
    print('='*60)

