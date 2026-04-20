import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, AlertCircle, ArrowRight, ActivitySquare, CheckCircle, Search, Beaker, Zap, Calendar, ExternalLink } from 'lucide-react';
import HumanBodyMap from '../components/HumanBodyMap';

const API_BASE = 'http://localhost:5001';

export default function Dashboard() {
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [symptoms, setSymptoms] = useState([]);
  const [severities, setSeverities] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [days, setDays] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    // Fetch regions on mount
    axios.get(`${API_BASE}/regions`)
      .then(res => setRegions(res.data.regions))
      .catch(err => {
        console.error("Error fetching regions:", err);
        let msg = "Failed to connect to backend API. Is the server running on port 5000?";
        if (err.response) {
          msg = err.response?.data?.error || `API Error: ${err.response.status}`;
        }
        setError(msg);
      });
  }, []);

  useEffect(() => {
    if (selectedRegion) {
      setLoading(true);
      axios.get(`${API_BASE}/symptoms?region=${encodeURIComponent(selectedRegion)}`)
        .then(res => {
          setSymptoms(res.data.symptoms);
          setSeverities({}); // Reset choices
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setSymptoms([]);
    }
  }, [selectedRegion]);

  const handleSeverityChange = (symptom, value) => {
    setSeverities(prev => ({
      ...prev,
      [symptom]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (Object.keys(severities).length === 0) {
      setError("Please select severity for at least one symptom.");
      return;
    }
    setError("");
    setLoading(true);

    axios.post(`${API_BASE}/predict`, {
      region: selectedRegion,
      symptoms: severities,
      days: 0
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        setResult(res.data);
        setAnalysisResult(null); // Reset side effect analysis if predicted again
      })
      .catch(err => {
        console.error("Prediction Error:", err);
        let msg = "Failed to connect to backend API. Please make sure the Flask server is running.";
        if (err.response) {
          msg = err.response?.data?.error || `API Error: ${err.response.status} - ${err.message}`;
        }
        setError(msg);
      })
      .finally(() => setLoading(false));
  };

  const handleAnalyze = (e) => {
    e.preventDefault();
    if (!days || isNaN(days) || Number(days) <= 0) {
      setError("Please enter a valid number of days (greater than 0).");
      return;
    }
    setError("");
    setAnalyzing(true);
    axios.post(`${API_BASE}/analyze-side-effects`, {
      days: Number(days),
      side_effects: result.recommendation.side_effects
    }, {
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => setAnalysisResult(res.data))
      .catch(err => {
        console.error("Analysis Error:", err);
        setError("Failed to analyze side effects.");
      })
      .finally(() => setAnalyzing(false));
  };

  const getSeverityOptions = (symptom) => {
    const currentVal = severities[symptom] || 0;

    return (
      <div style={severityContainer}>
        {[
          { label: 'None', val: 0 },
          { label: 'Mild/Average', val: 0.5 },
          { label: 'Heavy', val: 1.0 }
        ].map(opt => (
          <label
            key={opt.val}
            className="severity-pill"
            style={{
              ...pillStyle,
              backgroundColor: currentVal === opt.val ? (opt.val > 0 ? 'var(--primary)' : 'var(--text-muted)') : 'transparent',
              borderColor: currentVal === opt.val ? 'transparent' : 'var(--border-color)',
              color: currentVal === opt.val ? 'white' : 'var(--text-muted)'
            }}
          >
            <input
              type="radio"
              name={symptom}
              value={opt.val}
              checked={currentVal === opt.val}
              onChange={() => handleSeverityChange(symptom, opt.val)}
              style={{ display: 'none' }}
            />
            {opt.label}
          </label>
        ))}
      </div>
    );
  };

  return (
    <div style={containerStyle} className="animate-fade-in">
      <div style={headerStyle}>
        <h1 style={{ fontSize: '1.75rem', color: 'var(--secondary)' }}>Symptom Checker</h1>
        <p className="text-muted">Analyze your symptoms with AI for quick insights and recommendations.</p>
      </div>

      {error && (
        <div style={errorBanner}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div style={gridContainer}>
        {/* Left Column: Input Form */}
        <div className="card" style={{ flex: '1 1 500px', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ActivitySquare color="var(--primary)" size={24} />
            Enter Symptoms
          </h2>

          <div className="form-group">
            <label className="form-label">Body Region</label>
            <select
              className="form-control"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              <option value="">-- Select a body region --</option>
              {regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Duration input removed from here */}

          {symptoms.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-dark)' }}>Rate Severe Symptoms</h3>
                <span className="text-muted" style={{ fontSize: '0.875rem' }}>{symptoms.length} symptoms found</span>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={symptomList}>
                  {symptoms.map(symp => (
                    <div key={symp} style={symptomItem}>
                      <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>
                        {symp.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      {getSeverityOptions(symp)}
                    </div>
                  ))}
                </div>

                <div style={submitContainer}>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={loading}>
                    {loading ? 'Analyzing...' : (
                      <>
                        <Search size={20} /> Analyze Symptoms
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Results */}
        {result && (
          <div className="card animate-fade-in" style={{ flex: '1 1 400px', backgroundColor: 'var(--primary-light)', borderColor: 'var(--primary-light)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-dark)' }}>
              <CheckCircle color="var(--primary)" size={24} />
              AI Diagnosis Results
            </h2>

            <div style={resultSection}>
              <h3 style={sectionTitle}>Predicted Condition</h3>
              <div style={diagnosisCard}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>Disease: {result.disease}</div>
                {result.description && (
                  <div style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.95)', lineHeight: '1.5', textAlign: 'left', marginTop: '0.75rem', padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: '8px' }}>
                    <strong>Description:</strong> {result.description}
                  </div>
                )}
              </div>
            </div>

            <div style={resultSection}>
              <h3 style={sectionTitle}><Zap size={18} /> Top Probabilities</h3>
              <div style={statsContainer}>
                {result.top3.map((t, idx) => (
                  <div key={idx} style={statRow}>
                    <span style={{ fontWeight: 500 }}>{t.disease}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{t.confidence.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={resultSection}>
              <h3 style={sectionTitle}><Activity size={18} /> Key Indicators</h3>
              <ul style={shapList}>
                {result.shap_explanation.map((shap, idx) => (
                  <li key={idx} style={shapItem}>
                    • Highly influenced by <strong>{shap.symptom}</strong>
                  </li>
                ))}
              </ul>
            </div>

            <div style={resultSection}>
              <h3 style={sectionTitle}><Beaker size={18} /> Recommended Treatment</h3>
              <div style={medCard}>
                <div style={{ marginBottom: '1rem' }}>
                  <span style={medTag}>Primary Medicine</span>
                  <p style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                    {result.recommendation.medicine_name}
                  </p>
                  <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Generic: {result.recommendation.generic_medicine}
                  </p>
                  
                  {result.recommendation.tata_1mg_link && (
                    <a
                      href={result.recommendation.tata_1mg_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        backgroundColor: '#ff6f61', // Tata 1mg brand color approx
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontWeight: '500',
                        fontSize: '0.95rem',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(255, 111, 97, 0.2)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#e85d4f';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(255, 111, 97, 0.3)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#ff6f61';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(255, 111, 97, 0.2)';
                      }}
                    >
                      {result.recommendation.tata_1mg_link.includes('/search/') ? "Search on Tata 1mg" : "View on Tata 1mg"}
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <p style={{ fontWeight: 500, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} color="var(--warning)" /> Potential Side Effects
                  </p>
                  <ul style={sideEffectList}>
                    {result.recommendation.side_effects.slice(0, 5).map((eff, i) => (
                      <li key={i}>{eff}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* NEW STEP: Duration Input & Risk Analysis */}
      {result && (
        <div className="card animate-fade-in" style={{ marginTop: '2rem', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ActivitySquare color="var(--primary)" size={24} />
            Step 4: Analyze Risk
          </h2>
          <form onSubmit={handleAnalyze}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={16} /> How many days are you taking this medicine?
              </label>
              <input
                type="number"
                className="form-control"
                min="1"
                placeholder="e.g. 5"
                value={days}
                onChange={(e) => setDays(e.target.value)}
              />
              <small className="text-muted" style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.8rem' }}>
                Used to predict side effect severity over time and generate a body impact map.
              </small>
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={analyzing}>
                {analyzing ? 'Analyzing Risks...' : 'Analyze Risks'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MASSIVE 3D VISUALIZATION AT THE BOTTOM (Only when analysis is done) */}
      {analysisResult && (
        <div className="animate-fade-in" style={{ width: '100%', marginTop: '3rem' }}>
          <div className="card" style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h3 style={sectionTitle} className="justify-center">
              <Activity size={18} /> Side Effect Safety Analysis
            </h3>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600 }}>Duration Severity:</span>
              <span style={{
                padding: '4px 12px',
                borderRadius: '16px',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                backgroundColor: analysisResult.duration_severity === 'High' ? '#fee2e2' : analysisResult.duration_severity === 'Medium' ? '#fef3c7' : analysisResult.duration_severity === 'Low' ? '#dcfce3' : '#e2e8f0',
                color: analysisResult.duration_severity === 'High' ? '#dc2626' : analysisResult.duration_severity === 'Medium' ? '#d97706' : analysisResult.duration_severity === 'Low' ? '#16a34a' : '#475569',
                border: `1px solid ${analysisResult.duration_severity === 'High' ? '#fca5a5' : analysisResult.duration_severity === 'Medium' ? '#fcd34d' : analysisResult.duration_severity === 'Low' ? '#86efac' : '#cbd5e1'}`
              }}>
                {analysisResult.duration_severity} Impact
              </span>
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                based on {days} days continuous usage
              </span>
            </div>
          </div>
          
          <HumanBodyMap affectedParts={analysisResult.affected_parts || []} severity={analysisResult.duration_severity} />
        </div>
      )}
    </div>
  );
}

// Inline Styles
const containerStyle = {
  maxWidth: '1000px',
  margin: '0 auto',
};

const headerStyle = {
  marginBottom: '2rem',
  textAlign: 'center'
};

const errorBanner = {
  backgroundColor: '#fef2f2',
  color: 'var(--danger)',
  padding: '1rem',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '2rem',
  border: '1px solid #fecaca'
};

const gridContainer = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2rem',
  alignItems: 'flex-start'
};

const symptomList = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  maxHeight: '400px',
  overflowY: 'auto',
  paddingRight: '0.5rem',
  marginBottom: '2rem'
};

const symptomItem = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.75rem',
  backgroundColor: 'var(--bg-page)',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  flexWrap: 'wrap',
  gap: '1rem'
};

const severityContainer = {
  display: 'flex',
  gap: '0.5rem'
};

const pillStyle = {
  padding: '0.4rem 0.8rem',
  borderRadius: '20px',
  fontSize: '0.85rem',
  fontWeight: 500,
  cursor: 'pointer',
  border: '1px solid',
  transition: 'all 0.2s'
};

const submitContainer = {
  borderTop: '1px solid var(--border-color)',
  paddingTop: '1rem',
};

const resultSection = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '1.25rem',
  marginBottom: '1rem',
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
};

const sectionTitle = {
  fontSize: '1rem',
  fontWeight: 600,
  color: 'var(--secondary)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '1rem'
};

const diagnosisCard = {
  background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
  padding: '1.5rem',
  borderRadius: '8px',
  textAlign: 'center',
  boxShadow: '0 4px 6px rgba(12, 165, 165, 0.2)'
};

const statsContainer = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const statRow = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '0.5rem',
  backgroundColor: 'var(--bg-page)',
  borderRadius: '6px'
};

const shapList = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const shapItem = {
  fontSize: '0.9rem',
  color: 'var(--text-dark)'
};

const medCard = {
  backgroundColor: 'var(--bg-page)',
  padding: '1rem',
  borderRadius: '8px',
  border: '1px solid var(--border-color)'
};

const medTag = {
  backgroundColor: 'var(--primary-light)',
  color: 'var(--primary-dark)',
  padding: '0.2rem 0.6rem',
  borderRadius: '4px',
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase'
};

const sideEffectList = {
  paddingLeft: '1.2rem',
  fontSize: '0.85rem',
  color: 'var(--text-muted)',
  marginBottom: 0
};
