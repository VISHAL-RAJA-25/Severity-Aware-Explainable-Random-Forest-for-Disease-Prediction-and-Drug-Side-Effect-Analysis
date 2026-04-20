# Severity-Aware-Explainable-Random-Forest-for-Disease-Prediction-and-Drug-Side-Effect-Analysis
Overview
This project is an AI-based medical decision support system that predicts diseases based on user symptoms and provides medicine recommendations along with side-effect analysis. The system improves prediction accuracy by considering symptom severity and ensures transparency using explainable AI techniques.

Key Features

* Symptom input based on body region selection
* Severity-weighted symptom analysis (None, Mild, Severe)
* Disease prediction using Random Forest algorithm
* Top-3 disease predictions with confidence scores
* Explainable AI using SHAP for feature importance
* Medicine recommendation based on predicted disease
* External medicine reference links (Tata 1mg)
* Side-effect analysis based on selected medicine
* Duration-based risk assessment (Low, Medium, High)
* 3D human body visualization of affected organs
* Simple disease explanations for better user understanding

System Workflow

1. User selects body region
2. Relevant symptoms are displayed
3. User provides symptom severity
4. Model predicts disease
5. Confidence scores and explanations are shown
6. Recommended medicines are displayed
7. User enters medication duration
8. Side effects and risk level are calculated
9. Affected body parts are visualized in 3D

Technologies Used
Frontend: React.js
Backend: Flask (Python)
Machine Learning: Scikit-learn (Random Forest)
Explainability: SHAP
Visualization: Three.js / React Three Fiber
Data Handling: CSV datasets

Datasets Used

* Symptom to Disease mapping
* Disease to Medicine mapping
* Medicine to Side effects mapping
* Side effect to Body part mapping
* Disease description dataset

Project Structure
MP_MRS/
│── frontend/
│── backend/
│── data/
│── models/
│── README.md

How to Run

Backend
cd backend
pip install -r requirements.txt
python app.py

Frontend
cd frontend
npm install
npm start

Applications

* Health assistance systems
* Medical decision support tools
* Educational healthcare platforms
* Telemedicine support systems

Future Enhancements

* Real-time doctor consultation integration
* Advanced deep learning models
* Personalized treatment recommendations
* Mobile application support
