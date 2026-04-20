# recommend.py
# Disease → Medicine → Side Effects (MODULE ONLY)

import pandas as pd

import os

print("Loading datasets...")
sd_df  = pd.read_csv("data/S-D_1_.csv")
dm1_df = pd.read_csv("data/D-M_1_.csv")

if os.path.exists("links.csv"):
    links_df = pd.read_csv("links.csv")
    links_dict = dict(zip(links_df['medicine'], links_df['link']))
else:
    links_dict = {}

sd_df['prognosis']      = sd_df['prognosis'].str.strip()
sd_df['medicine']       = sd_df['medicine'].str.strip()
dm1_df['Medicine Name'] = dm1_df['Medicine Name'].str.strip()
dm1_df['med_lower']     = dm1_df['Medicine Name'].str.lower()

print("Datasets loaded ✓")


# 🔥 Verified keywords (copied from your complete 42 disease map)
DISEASE_KEYWORDS = {
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


def recommend_medicine(predicted_disease):

    disease_rows = sd_df[
        sd_df['prognosis'].str.lower() == predicted_disease.lower()
    ]

    generic_medicine = (
        disease_rows['medicine'].iloc[0]
        if not disease_rows.empty
        else "General care"
    )

    keywords = DISEASE_KEYWORDS.get(predicted_disease, [])

    for keyword in keywords:
        hits = dm1_df[dm1_df['med_lower'].str.contains(keyword, na=False)]
        if not hits.empty:
            row = hits.iloc[0]

            raw = str(row.get('Side_effects', ''))

            # 🔥 FIX SIDE EFFECT SPLIT (IMPORTANT)
            side_effects = [
                e.strip()
                for e in raw.replace(",", " ").split()
                if len(e.strip()) > 2
            ] if raw else ['No data available']

            medicine_name = row['Medicine Name']
            
            tata_1mg_link = links_dict.get(medicine_name)
            if pd.isna(tata_1mg_link) or not tata_1mg_link:
                # Fallback to search
                tata_1mg_link = f"https://www.1mg.com/search/all?name={medicine_name.replace(' ', '+')}"

            return {
                'generic_medicine': generic_medicine,
                'medicine_name': medicine_name,
                'composition': str(row.get('Composition', 'N/A')),
                'uses': str(row.get('Uses', 'N/A')),
                'manufacturer': str(row.get('Manufacturer', 'N/A')),
                'review_good': str(row.get('Excellent Review %', 'N/A')),
                'review_avg': str(row.get('Average Review %', 'N/A')),
                'review_poor': str(row.get('Poor Review %', 'N/A')),
                'side_effects': side_effects,
                'tata_1mg_link': tata_1mg_link,
            }

    # If no keyword matched
    tata_1mg_link = f"https://www.1mg.com/search/all?name={generic_medicine.replace(' ', '+')}"
    return {
        'generic_medicine': generic_medicine,
        'medicine_name': generic_medicine,
        'composition': 'N/A',
        'uses': 'N/A',
        'manufacturer': 'N/A',
        'review_good': 'N/A',
        'review_avg': 'N/A',
        'review_poor': 'N/A',
        'side_effects': ['Consult doctor'],
        'tata_1mg_link': tata_1mg_link,
    }


def display_recommendations(predicted_disease, data):

    print("\n" + "=" * 62)
    print("        MEDICINE RECOMMENDATION RESULTS")
    print("=" * 62)

    print(f"\n  Disease          : {predicted_disease}")
    print(f"  Generic Treatment: {data['generic_medicine']}")

    print(f"\n  {'─' * 56}")
    print(f"  Medicine Name    : {data['medicine_name']}")
    print(f"  Composition      : {data['composition']}")
    print(f"  Uses             : {data['uses']}")
    print(f"  Manufacturer     : {data['manufacturer']}")

    print(f"  Reviews          : Good {data['review_good']}%  |  "
          f"Avg {data['review_avg']}%  |  Poor {data['review_poor']}%")

    print(f"\n  ⚠  Side Effects :")
    for effect in data['side_effects'][:10]:
        print(f"      • {effect}")

    print("\n" + "=" * 62)
    