# side_effects.py
# Medicine → Side Effects
# Uses D-M_1_.csv with verified keyword matching for all 42 diseases

import pandas as pd

# ── Load Dataset ─────────────────────────────────────────────────────
print("Loading D-M_1_ dataset...")
dm1 = pd.read_csv("data/D-M_1_.csv")
dm1['med_lower'] = dm1['Medicine Name'].str.lower().str.strip()
print("Dataset loaded ✓")

# ── Verified keyword map for all 42 diseases ─────────────────────────
# Every keyword below is CONFIRMED to exist in D-M_1_.csv
DISEASE_MEDICINE_KEYWORDS = {
    "Fungal infection"                        : ["antifungal", "fluconazole", "clotrimazole"],
    "Allergy"                                 : ["cetirizine", "levocetirizine", "loratadine"],
    "GERD"                                    : ["pantop", "nexpro", "razo"],
    "Chronic cholestasis"                     : ["udiliv", "ursodeoxycholic"],
    "Drug Reaction"                           : ["cetirizine", "levocetirizine", "prednisolone"],
    "Peptic ulcer diseae"                     : ["pantop", "omez", "nexpro"],
    "AIDS"                                    : ["lamivir", "nevimune", "tenof"],
    "Diabetes"                                : ["metformin", "insulin", "glimepiride"],
    "Gastroenteritis"                         : ["eldoper", "lopamide", "norflox"],
    "Bronchial Asthma"                        : ["asthalin", "seroflo", "foracort"],
    "Hypertension"                            : ["amlodipine", "enalapril", "telmisartan"],
    "Migraine"                                : ["suminat", "migranil", "vasograin"],
    "Cervical spondylosis"                    : ["diclofenac", "thiocolchicoside", "etoricoxib"],
    "Paralysis (brain hemorrhage)"            : ["ecosprin", "clopilet", "deplatt"],
    "Jaundice"                                : ["hepamerz", "udiliv", "silymarin"],
    "Malaria"                                 : ["lariago", "hydroxychloroquine"],
    "Chicken pox"                             : ["acyclovir", "calamine", "valacyclovir"],
    "Dengue"                                  : ["paracetamol", "dolo"],
    "Typhoid"                                 : ["taxim", "oflox", "monocef"],
    "hepatitis A"                             : ["hepamerz", "udiliv", "silymarin"],
    "Hepatitis B"                             : ["hepbest", "lamivir", "tenof"],
    "Hepatitis C"                             : ["myhep", "sofosvel", "ledifos"],
    "Hepatitis D"                             : ["hepamerz", "udiliv"],
    "Hepatitis E"                             : ["hepamerz", "paracetamol"],
    "Alcoholic hepatitis"                     : ["wysolone", "omnacortil", "silymarin"],
    "Tuberculosis"                            : ["forair", "akurit", "rif"],
    "Common Cold"                             : ["paracetamol", "cetirizine", "ambroxol"],
    "Pneumonia"                               : ["augmentin", "azithral", "levoflox"],
    "Dimorphic hemmorhoids(piles)"            : ["anovate", "proctosedyl", "softovac"],
    "Heart attack"                            : ["ecosprin", "atorva", "metolar"],
    "Varicose veins"                          : ["ecosprin", "trental", "pentox"],
    "Hypothyroidism"                          : ["eltroxin", "levothyroxine", "thyroxine"],
    "Hyperthyroidism"                         : ["inderal", "neomercazole", "carbimazole"],
    "Hypoglycemia"                            : ["dextrose", "glucagon", "glucose"],
    "Osteoarthristis"                         : ["diclofenac", "etoricoxib", "paracetamol"],
    "Arthritis"                               : ["hcqs", "methotrexate", "wysolone"],
    "(vertigo) Paroymsal  Positional Vertigo" : ["vertin", "stemetil", "stugeron"],
    "Acne"                                    : ["deriva", "clindac", "benzac"],
    "Urinary tract infection"                 : ["norflox", "taxim", "oflox"],
    "Psoriasis"                               : ["betnovate", "clobetasol", "calcipotriol"],
    "Impetigo"                                : ["amoxyclav", "bactroban", "fusidic"],
    "Chikungunya"                             : ["paracetamol", "ibuprofen", "naproxen"],
}


def get_side_effects(predicted_disease):
    """
    Input  : predicted_disease — string (from predict.py)
    Output : dict with medicine name, side effects list,
             manufacturer, composition, reviews
    """
    keywords = DISEASE_MEDICINE_KEYWORDS.get(predicted_disease, [])

    # Search D-M_1_ using keywords
    for keyword in keywords:
        hits = dm1[dm1['med_lower'].str.contains(keyword, na=False)]
        if not hits.empty:
            row = hits.iloc[0]

            # Parse side effects into clean list
            raw_effects = str(row.get('Side_effects', ''))
            side_effects = [
                e.strip() for e in raw_effects.split()
                if len(e.strip()) > 2
            ] if raw_effects else ['No data available']

            return {
                'medicine_name' : row['Medicine Name'],
                'composition'   : row.get('Composition',        'N/A'),
                'uses'          : row.get('Uses',                'N/A'),
                'manufacturer'  : row.get('Manufacturer',       'N/A'),
                'review_good'   : row.get('Excellent Review %', 'N/A'),
                'review_avg'    : row.get('Average Review %',   'N/A'),
                'review_poor'   : row.get('Poor Review %',      'N/A'),
                'side_effects'  : side_effects,
                'found'         : True
            }

    # Fallback if nothing found
    return {
        'medicine_name' : 'General supportive care',
        'composition'   : 'N/A',
        'uses'          : 'N/A',
        'manufacturer'  : 'N/A',
        'review_good'   : 'N/A',
        'review_avg'    : 'N/A',
        'review_poor'   : 'N/A',
        'side_effects'  : ['Consult a doctor for specific side effects'],
        'found'         : False
    }


def display_side_effects(predicted_disease, data):
    """Pretty print side effects in terminal"""

    print("\n" + "=" * 60)
    print("           MEDICINE & SIDE EFFECTS")
    print("=" * 60)
    print(f"\n  Disease        : {predicted_disease}")
    print(f"  Medicine       : {data['medicine_name']}")
    print(f"  Composition    : {data['composition'][:70]}")
    print(f"  Manufacturer   : {data['manufacturer']}")
    print(f"  Reviews        : Good {data['review_good']}%  |  "
          f"Avg {data['review_avg']}%  |  Poor {data['review_poor']}%")

    print(f"\n  ⚠  Side Effects :")
    for effect in data['side_effects'][:10]:
        print(f"      • {effect}")

    print("\n" + "=" * 60)


# ── Terminal Test ────────────────────────────────────────────────────
if __name__ == "__main__":

    print("\n" + "=" * 60)
    print("       SIDE EFFECTS — FULL TEST (ALL 42 DISEASES)")
    print("=" * 60)

    choice = input("\n  1 = Test one disease\n  2 = Test ALL 42 diseases\n\n  Enter choice: ").strip()

    if choice == "1":
        disease = input("\n  Enter disease name: ").strip()
        data    = get_side_effects(disease)
        display_side_effects(disease, data)

    elif choice == "2":
        print("\n  Testing all 42 diseases...\n")
        matched = 0
        not_found = []

        for disease in DISEASE_MEDICINE_KEYWORDS.keys():
            data = get_side_effects(disease)
            if data['found']:
                matched += 1
                effects_preview = ', '.join(data['side_effects'][:3])
                print(f"  ✓ {disease:<45} → {data['medicine_name'][:30]}")
                print(f"    Effects: {effects_preview}")
            else:
                not_found.append(disease)
                print(f"  ✗ {disease} — not found")
            print()

        print("=" * 60)
        print(f"  Matched   : {matched}/42")
        print(f"  Not found : {len(not_found)}")
        if not_found:
            for d in not_found:
                print(f"    - {d}")
        print("=" * 60)