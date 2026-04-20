import pandas as pd
import requests
import re
import time

def fetch_links():
    try:
        df = pd.read_csv('data/D-M_1_.csv')
        meds = df['Medicine Name'].dropna().unique()
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return

    out = []
    # Only fetching first 20 due to time/rate limit constraints for this live session
    for med in meds[:20]:
        med_clean = med.replace(" ", "+")
        # 1mg search URL as fallback
        url = f"https://www.1mg.com/search/all?name={med_clean}"
        
        # Try to find direct drug URL via duckduckgo html search
        query = f"site:1mg.com/drugs/ \"{med}\""
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
            res = requests.get(f"https://html.duckduckgo.com/html/?q={requests.utils.quote(query)}", headers=headers, timeout=5)
            # Find first 1mg drug link
            match = re.search(r'href="(https://www\.1mg\.com/drugs/[^"]+)"', res.text)
            if match:
                url = match.group(1)
            else:
                # Direct try to 1mg search API or just fallback
                pass
        except Exception:
            pass
            
        out.append(f"\"{med}\",\"{url}\"")
        time.sleep(1) # polite delay

    with open('links.csv', 'w') as f:
        f.write("medicine,link\n")
        for line in out:
            f.write(line + "\n")
            
    print("DONE")

if __name__ == "__main__":
    fetch_links()
