# train_model.py
# Loads dataset → cleans → trains Random Forest → evaluates → saves model

import pandas as pd
import numpy as np
import joblib
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (accuracy_score, precision_score,
                             recall_score, f1_score)

# ── 1. Load Dataset ─────────────────────────────────────────────────
print("\nLoading dataset...")
df = pd.read_csv("data/S-D_1_.csv")
print(f"Dataset loaded — {df.shape[0]} rows, {df.shape[1]} columns")

# ── 2. Clean Data ───────────────────────────────────────────────────
df['prognosis'] = df['prognosis'].str.strip()
print(f"Unique diseases after cleaning: {df['prognosis'].nunique()}")

# ── 3. Prepare Features & Target ────────────────────────────────────
symptom_cols = df.columns[:-2].tolist()
X = df[symptom_cols]
y = df['prognosis']

# Save symptom column order
os.makedirs("model", exist_ok=True)
joblib.dump(symptom_cols, "model/symptom_cols.pkl")
print(f"Symptom columns saved  : {len(symptom_cols)} symptoms")

# ── 4. Filter out singleton classes (only 1 sample) ─────────────────
class_counts   = y.value_counts()
valid_classes  = class_counts[class_counts >= 2].index
singleton_classes = class_counts[class_counts < 2].index.tolist()

if singleton_classes:
    print(f"\nWarning: Removed singleton classes (too few samples to split):")
    for c in singleton_classes:
        print(f"   - {c}")

mask       = y.isin(valid_classes)
X_filtered = X[mask]
y_filtered = y[mask]

print(f"\nRows after filtering : {len(y_filtered)}  (removed {len(y) - len(y_filtered)} rows)")
print(f"Diseases remaining   : {y_filtered.nunique()}")

# ── 5. Train / Test Split ───────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X_filtered, y_filtered,
    test_size=0.2,
    random_state=42,
    stratify=y_filtered       # safe now — all classes have >= 2 samples
)
print(f"\nTraining samples : {len(X_train)}")
print(f"Testing  samples : {len(X_test)}")

# ── 6. Train Random Forest ──────────────────────────────────────────
print("\nTraining Random Forest model...")
model = RandomForestClassifier(
    n_estimators=100,
    max_depth=None,
    random_state=42,
    n_jobs=-1
)
model.fit(X_train, y_train)
print("Training complete!")

# ── 7. Evaluate ─────────────────────────────────────────────────────
y_pred    = model.predict(X_test)
accuracy  = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
recall    = recall_score(y_test, y_pred,    average='weighted', zero_division=0)
f1        = f1_score(y_test, y_pred,        average='weighted', zero_division=0)

print("\n" + "=" * 45)
print("       MODEL EVALUATION RESULTS")
print("=" * 45)
print(f"  Accuracy  : {accuracy  * 100:.2f}%")
print(f"  Precision : {precision * 100:.2f}%")
print(f"  Recall    : {recall    * 100:.2f}%")
print(f"  F1 Score  : {f1        * 100:.2f}%")
print("=" * 45)

# ── 8. Save Model ───────────────────────────────────────────────────
joblib.dump(model, "model/rf_model.pkl")
print("\nModel saved     → model/rf_model.pkl")
print("Columns saved   → model/symptom_cols.pkl")
print("\nDone! Now run predict.py")