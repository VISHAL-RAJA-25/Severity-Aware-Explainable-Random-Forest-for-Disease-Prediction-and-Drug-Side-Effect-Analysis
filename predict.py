# predict.py
# FULL PIPELINE — ALL IN ONE

import joblib
import numpy as np
import shap
from body_map import BODY_REGION_SYMPTOMS, get_all_regions

from recommend import recommend_medicine, display_recommendations

# Load model
model = joblib.load("model/rf_model.pkl")
symptom_cols = joblib.load("model/symptom_cols.pkl")


def predict_disease(region, symptom_severity_dict):

    input_vector = {col: 0 for col in symptom_cols}

    for symptom, severity in symptom_severity_dict.items():
        if symptom in input_vector:
            input_vector[symptom] = severity

    input_array = np.array([list(input_vector.values())])

    predicted_disease = model.predict(input_array)[0]
    probabilities = model.predict_proba(input_array)[0]
    classes = model.classes_

    top3_idx = np.argsort(probabilities)[::-1][:3]

    top3 = [
        (classes[i], round(probabilities[i] * 100, 2))
        for i in top3_idx
    ]

    return predicted_disease, top3, input_array


if __name__ == "__main__":

    print("\n" + "=" * 60)
    print("       FULL PIPELINE — TERMINAL TEST")
    print("=" * 60)

    # Select region
    regions = get_all_regions()

    print("\nAvailable body regions:")
    for i, r in enumerate(regions, 1):
        print(f"  {i}. {r}")

    choice = int(input("\nEnter region number: ")) - 1
    selected_region = regions[choice]

    print(f"\nSelected: {selected_region}")

    # Symptoms
    region_symptoms = BODY_REGION_SYMPTOMS[selected_region]

    print(f"\nSymptoms in '{selected_region}':")
    for i, s in enumerate(region_symptoms, 1):
        print(f"  {i}. {s}")

    print("\nEnter severity (0 / 0.5 / 1)\n")

    symptom_severity = {}

    for symptom in region_symptoms:
        val = input(f"  {symptom}: ").strip()
        symptom_severity[symptom] = float(val) if val in ["0.5", "1"] else 0.0

    # Prediction
    disease, top3, input_array = predict_disease(
        selected_region, symptom_severity
    )

    print("\n" + "=" * 60)
    print("            PREDICTION RESULTS")
    print("=" * 60)

    print(f"\n  Predicted Disease  :  {disease}")

    print("\n  Top 3 Confidence:")
    for i, (d, conf) in enumerate(top3, 1):
        bar = "█" * int(conf / 5)
        print(f"    {i}. {d:<30} {conf:>6.2f}% {bar}")

    # SHAP
    print("\n  Calculating SHAP...")

    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(input_array)

    class_index = list(model.classes_).index(disease)

    if isinstance(shap_values, list):
        shap_vals = shap_values[class_index][0]
    else:
        shap_vals = shap_values[0, :, class_index]

    pairs = list(zip(symptom_cols, shap_vals))

    reported = [s for s, v in symptom_severity.items() if v > 0]
    filtered = [(s, v) for s, v in pairs if s in reported]

    filtered.sort(key=lambda x: abs(x[1]), reverse=True)

    print(f"\n  Why '{disease}'?\n")

    for s, v in filtered[:5]:
        name = s.replace("_", " ").title()
        print(f"    • {name}")

    print("\n" + "=" * 60)

    # FINAL STEP 🔥
    data = recommend_medicine(disease)
    display_recommendations(disease, data)