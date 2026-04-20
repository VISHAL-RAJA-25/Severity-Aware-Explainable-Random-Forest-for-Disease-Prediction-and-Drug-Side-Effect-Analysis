# body_map.py
# NOVELTY: Category-First Symptom Filtering
# Maps each body region to its relevant symptoms (exact names from dataset)

BODY_REGION_SYMPTOMS = {

    "Stomach & Digestive": [
        "stomach_pain", "acidity", "vomiting", "indigestion",
        "nausea", "loss_of_appetite", "constipation", "abdominal_pain",
        "diarrhoea", "pain_during_bowel_movements", "pain_in_anal_region",
        "bloody_stool", "irritation_in_anus", "passage_of_gases",
        "internal_itching", "belly_pain", "stomach_bleeding",
        "distention_of_abdomen", "swelling_of_stomach", "Heartburn"
    ],

    "Head & Brain": [
        "headache", "dizziness", "loss_of_balance", "unsteadiness",
        "spinning_movements", "slurred_speech", "weakness_of_one_body_side",
        "altered_sensorium", "lack_of_concentration", "visual_disturbances",
        "blurred_and_distorted_vision", "pain_behind_the_eyes",
        "loss_of_smell", "coma", "stiff_neck"
    ],

    "Chest & Heart": [
        "chest_pain", "fast_heart_rate", "breathlessness", "palpitations",
        "sweating", "phlegm", "blood_in_sputum", "mucoid_sputum",
        "rusty_sputum", "cough", "congestion"
    ],

    "Skin": [
        "itching", "skin_rash", "nodal_skin_eruptions", "yellowish_skin",
        "red_spots_over_body", "dischromic _patches", "pus_filled_pimples",
        "blackheads", "scurring", "skin_peeling", "silver_like_dusting",
        "blister", "red_sore_around_nose", "yellow_crust_ooze",
        "bruising", "swollen_blood_vessels", "prominent_veins_on_calf"
    ],

    "Joints & Muscles": [
        "joint_pain", "knee_pain", "hip_joint_pain", "muscle_weakness",
        "muscle_wasting", "muscle_pain", "swelling_joints",
        "movement_stiffness", "neck_pain", "back_pain",
        "weakness_in_limbs", "painful_walking", "cramps",
        "swollen_legs", "swollen_extremeties"
    ],

    "Eyes & ENT": [
        "redness_of_eyes", "watering_from_eyes", "yellowing_of_eyes",
        "throat_irritation", "patches_in_throat", "ulcers_on_tongue",
        "sinus_pressure", "runny_nose", "continuous_sneezing",
        "loss_of_smell"
    ],

    "Urinary & Reproductive": [
        "burning_micturition", "spotting_ urination", "bladder_discomfort",
        "foul_smell_of urine", "continuous_feel_of_urine",
        "yellow_urine", "dark_urine", "Urinating_a_lot",
        "abnormal_menstruation", "polyuria"
    ],

    "General & Whole Body": [
        "fatigue", "weight_gain", "weight_loss", "high_fever",
        "mild_fever", "chills", "shivering", "dehydration",
        "malaise", "lethargy", "restlessness", "anxiety",
        "mood_swings", "depression", "irritability",
        "cold_hands_and_feets", "sunken_eyes", "puffy_face_and_eyes",
        "obesity", "swelled_lymph_nodes", "toxic_look_(typhos)",
        "family_history", "receiving_blood_transfusion",
        "receiving_unsterile_injections", "history_of_alcohol_consumption",
        "extra_marital_contacts"
    ],

    "Endocrine & Metabolic": [
        "enlarged_thyroid", "brittle_nails", "excessive_hunger",
        "increased_appetite", "irregular_sugar_level",
        "drying_and_tingling_lips", "fluid_overload", "fluid_overload.1",
        "acute_liver_failure", "small_dents_in_nails",
        "inflammatory_nails"
    ]
}


def get_symptoms_for_region(region_name):
    """Returns list of symptoms for a given body region"""
    return BODY_REGION_SYMPTOMS.get(region_name, [])


def get_all_regions():
    """Returns list of all body region names"""
    return list(BODY_REGION_SYMPTOMS.keys())


# ── Quick test ──────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 50)
    print("       BODY REGION SYMPTOM MAP")
    print("=" * 50)
    for region, symptoms in BODY_REGION_SYMPTOMS.items():
        print(f"\n{region}  ({len(symptoms)} symptoms)")
        for s in symptoms:
            print(f"   - {s}")
    print("\n" + "=" * 50)
    print(f"Total regions  : {len(BODY_REGION_SYMPTOMS)}")
    total = sum(len(v) for v in BODY_REGION_SYMPTOMS.values())
    print(f"Total symptoms : {total}")
    print("=" * 50)


# ── NOVELTY: Side Effect to Body Organ Mapping ───────────────────────
SIDE_EFFECT_TO_ORGAN = {
    # Brain / Head
    "headache": "Head", "dizziness": "Head", "drowsiness": "Head", "insomnia": "Head",
    "hallucinations": "Head", "depression": "Head", "anxiety": "Head", "seizures": "Head",
    "ringing": "Head", "vision": "Head", "confusion": "Head", "memory": "Head", "mood": "Head",

    # Stomach / Digestion
    "nausea": "Stomach", "vomit": "Stomach", "diarrhea": "Stomach", "diarrhoea": "Stomach",
    "constipation": "Stomach", "stomach": "Stomach", "indigestion": "Stomach",
    "appetite": "Stomach", "heartburn": "Stomach", "stool": "Stomach", "bowel": "Stomach",

    # Liver
    "dark urine": "Liver", "jaundice": "Liver", "yellowing": "Liver",
    "liver": "Liver", "hepatitis": "Liver",

    # Skin
    "rash": "Skin", "itch": "Skin", "dry skin": "Skin", "hives": "Skin",
    "peel": "Skin", "redness": "Skin", "sweating": "Skin", "acne": "Skin", "blister": "Skin",

    # Heart & Blood
    "chest pain": "Heart", "heart rate": "Heart", "palpitation": "Heart",
    "blood pressure": "Heart", "bleeding": "Blood", "bruis": "Blood",

    # Lungs & Respiratory
    "breath": "Lungs", "cough": "Lungs", "wheez": "Lungs",
    "throat": "Lungs",

    # Kidneys / Urinary
    "urinat": "Kidneys", "kidney": "Kidneys",

    # Muscles / Joints
    "muscle": "Joints", "joint": "Joints", "bone": "Joints",
    "back pain": "Joints", "weakness": "Joints"
}

def get_affected_body_parts(side_effects_list):
    """
    Given a list of side effects, returns a unique list of affected body organs.
    e.g., ['Head', 'Stomach', 'Skin']
    """
    affected = set()
    for effect in side_effects_list:
        effect_lower = effect.lower()
        for key, organ in SIDE_EFFECT_TO_ORGAN.items():
            if key in effect_lower:
                affected.add(organ)
                
    return list(affected)