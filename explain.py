# explain.py
# NOVELTY: SHAP Explainability — shows WHY the disease was predicted
# Runs SHAP on prediction → top symptoms that caused the result

import joblib
import numpy as np
import shap
from body_map import BODY_REGION_SYMPTOMS, get_all_regions
from predict import predict_disease

# ── Load saved model & symptom columns ──────────────────────────────
model        = joblib.load("model/rf_model.pkl")
symptom_cols = joblib.load("model/symptom_cols.pkl")


def explain_prediction(region, symptom_severity_dict):
    """
    Inputs:
        region                : string — body region selected by user
        symptom_severity_dict : dict   — { symptom_name: severity_value }

    Returns:
        predicted_disease : string
        top3_confidence   : list of (disease, confidence%) tuples
        shap_explanation  : list of (symptom, contribution%) tuples — top 5
    """
    # Build input vector
    input_vector = {col: 0 for col in symptom_cols}
    for symptom, severity in symptom_severity_dict.items():
        if symptom in input_vector:
            input_vector[symptom] = severity

    input_array = np.array([list(input_vector.values())])

    # Get prediction + confidence
    predicted_disease, top3_confidence = predict_disease(
        region, symptom_severity_dict
    )

    # ── SHAP values ──────────────────────────────────────────────────
    print("\n  Calculating SHAP explanation...")
    explainer   = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(input_array)

    # Find index of predicted class
    class_index = list(model.classes_).index(predicted_disease)

    # Handle both old SHAP (list) and new SHAP (3D array)
    if isinstance(shap_values, list):
        shap_for_class = shap_values[class_index][0]
    else:
        shap_for_class = shap_values[0, :, class_index]

    # Pair symptom names with their SHAP values
    symptom_shap = list(zip(symptom_cols, shap_for_class))

    # Keep only symptoms the user actually reported (severity > 0)
    reported = [s for s, v in symptom_severity_dict.items() if v > 0]
    filtered = [(s, v) for s, v in symptom_shap if s in reported]

    # Sort by highest contribution (absolute SHAP value)
    filtered.sort(key=lambda x: abs(x[1]), reverse=True)

    # Top 5 contributing symptoms
    top5  = filtered[:5]
    total = sum(abs(v) for _, v in top5) or 1

    shap_explanation = [
        (symptom, round((abs(val) / total) * 100, 1))
        for symptom, val in top5
    ]

    return predicted_disease, top3_confidence, shap_explanation


# ── Terminal test ────────────────────────────────────────────────────
if __name__ == "__main__":

    print("\n" + "=" * 55)
    print("   DISEASE PREDICTION + SHAP EXPLANATION — TEST")
    print("=" * 55)

    # Show all regions
    regions = get_all_regions()
    print("\nAvailable body regions:")
    for i, r in enumerate(regions, 1):
        print(f"  {i}. {r}")

    # Pick region
    choice          = int(input("\nEnter region number: ")) - 1
    selected_region = regions[choice]
    print(f"\nSelected: {selected_region}")

    # Show symptoms for that region
    region_symptoms = BODY_REGION_SYMPTOMS[selected_region]
    print(f"\nSymptoms in '{selected_region}':")
    for i, s in enumerate(region_symptoms, 1):
        print(f"  {i}. {s}")

    # Collect severity
    print("\nEnter severity for each symptom:")
    print("  0   = Not present")
    print("  0.5 = Mild")
    print("  1   = Severe\n")

    symptom_severity = {}
    for symptom in region_symptoms:
        val = input(f"  {symptom}: ").strip()
        symptom_severity[symptom] = float(val) if val in ["0.5", "1"] else 0.0

    # Run explanation
    disease, top3, shap_exp = explain_prediction(
        selected_region, symptom_severity
    )

    # ── Display full output ──────────────────────────────────────────
    print("\n" + "=" * 55)
    print("             PREDICTION RESULTS")
    print("=" * 55)

    print(f"\n  Predicted Disease  :  {disease}")

    print(f"\n  Top 3 Confidence Scores:")
    for rank, (d, conf) in enumerate(top3, 1):
        bar = "█" * int(conf / 5)
        print(f"    {rank}. {d:<40} {conf:>6.2f}%  {bar}")

    print(f"\n  Why was '{disease}' predicted?")
    print(f"  (Symptoms that contributed most)\n")
    for symptom, pct in shap_exp:
        bar          = "█" * int(pct / 5)
        symptom_name = symptom.replace("_", " ").title()
        print(f"    {symptom_name:<35} {pct:>5.1f}%  {bar}")

    print("\n" + "=" * 55)