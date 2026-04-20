from flask import Flask, jsonify, request
from flask_cors import CORS
import shap

from body_map import get_all_regions, get_symptoms_for_region, get_affected_body_parts
from predict import predict_disease, model, symptom_cols
from recommend import recommend_medicine
import csv
import os

# ── LOAD DISEASE DESCRIPTIONS ────────────────────────────
disease_desc_dict = {}
desc_path = os.path.join("data", "disease_description.csv")
if os.path.exists(desc_path):
    with open(desc_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            disease_desc_dict[row['disease'].strip().lower()] = row['description'].strip()

def get_disease_description(disease):
    return disease_desc_dict.get(disease.strip().lower(), "Description not available.")

# ── INIT APP ─────────────────────────────────────────────
app = Flask(__name__)
CORS(app)   # Allow frontend connection

# ── HOME ROUTE ───────────────────────────────────────────
@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "status": "online",
        "message": "MedAI Backend Running",
        "endpoints": ["/regions", "/symptoms", "/predict"]
    })

# ── GET ALL REGIONS ──────────────────────────────────────
@app.route('/regions', methods=['GET'])
def get_regions():
    return jsonify({
        "regions": get_all_regions()
    })

# ── GET SYMPTOMS BY REGION ───────────────────────────────
@app.route('/symptoms', methods=['GET'])
def get_symptoms():
    region = request.args.get('region')

    if not region:
        return jsonify({"error": "Region is required"}), 400

    symptoms = get_symptoms_for_region(region)

    return jsonify({
        "symptoms": symptoms
    })

# ── PREDICT API ──────────────────────────────────────────
@app.route('/predict', methods=['POST'])
def predict():

    data = request.json

    region = data.get('region')
    symptom_severity = data.get('symptoms', {})
    days = data.get('days', 0)

    if not region or not symptom_severity:
        return jsonify({"error": "Region and symptoms are required"}), 400

    # ── 1. Disease Prediction ─────────────────────────────
    disease, top3, input_array = predict_disease(region, symptom_severity)

    # ── 2. SHAP Explanation ──────────────────────────────
    try:
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

        shap_explanation = [
            {
                "symptom": s.replace("_", " ").title(),
                "impact": float(v)
            }
            for s, v in filtered[:5]
        ]

    except Exception as e:
        print("SHAP Error:", e)
        shap_explanation = []

    # ── 3. Medicine + Side Effects ───────────────────────
    recommendation_data = recommend_medicine(disease)

    # ── 4. Duration Severity and Body Parts Mapping ──────
    try:
        days_int = int(days)
        if days_int == 0:
            duration_severity = "None"
        elif days_int <= 3:
            duration_severity = "Low"
        elif days_int <= 7:
            duration_severity = "Medium"
        else:
            duration_severity = "High"
    except (ValueError, TypeError):
        duration_severity = "None"

    side_effects_list = recommendation_data.get('side_effects', [])
    affected_parts = get_affected_body_parts(side_effects_list)

    # ── FINAL RESPONSE ──────────────────────────────────
    return jsonify({
        "disease": disease,
        "description": get_disease_description(disease),
        "top3": [
            {"disease": d, "confidence": float(conf)}
            for d, conf in top3
        ],
        "shap_explanation": shap_explanation,
        "recommendation": recommendation_data,
        "duration_severity": duration_severity,
        "affected_parts": affected_parts
    })

# ── ANALYZE SIDE EFFECTS ─────────────────────────────────
@app.route('/analyze-side-effects', methods=['POST'])
def analyze_side_effects():
    data = request.json
    days = data.get('days', 0)
    side_effects_list = data.get('side_effects', [])

    try:
        days_int = int(days)
        if days_int == 0:
            duration_severity = "None"
        elif days_int <= 3:
            duration_severity = "Low"
        elif days_int <= 7:
            duration_severity = "Medium"
        else:
            duration_severity = "High"
    except (ValueError, TypeError):
        duration_severity = "None"

    affected_parts = get_affected_body_parts(side_effects_list)

    return jsonify({
        "duration_severity": duration_severity,
        "affected_parts": affected_parts
    })


# ── RUN SERVER ───────────────────────────────────────────
if __name__ == '__main__':
    app.run(debug=True, port=5001)