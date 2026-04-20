const BASE_URL = "http://127.0.0.1:5000";

export const getRegions = async () => {
  try {
    const res = await fetch(`${BASE_URL}/regions`);
    const data = await res.json();
    return data?.regions || [];
  } catch (err) {
    console.error("Regions API error:", err);
    return [];
  }
};

export const getSymptoms = async (region) => {
  try {
    const res = await fetch(`${BASE_URL}/symptoms?region=${encodeURIComponent(region)}`);
    const data = await res.json();
    return data?.symptoms || [];
  } catch (err) {
    console.error("Symptoms API error:", err);
    return [];
  }
};

export const predictDisease = async (payload) => {
  try {
    const res = await fetch(`${BASE_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return await res.json();
  } catch (err) {
    console.error("Predict API error:", err);
    return null;
  }
};

export const analyzeSideEffects = async (payload) => {
  try {
    const res = await fetch(`${BASE_URL}/analyze-side-effects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return await res.json();
  } catch (err) {
    console.error("Analyze Side Effects API error:", err);
    return null;
  }
};