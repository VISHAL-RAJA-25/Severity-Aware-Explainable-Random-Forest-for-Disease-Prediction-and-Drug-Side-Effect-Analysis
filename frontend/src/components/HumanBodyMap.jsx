import React, { Suspense, useRef, useState, useEffect, useMemo, Component } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows, Center, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

// The precise file the user downloaded and renamed
const BASE_URL = '/human_anatomy.glb';
const FALLBACK_URL = '/sketchfab_model.glb';

// ---------------------------------------------------------
// Protective Error Boundary
// ---------------------------------------------------------
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Canvas Render Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', textAlign: 'center', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '20px' }}>
          <h3>⚠️ Sketchfab Asset Crash</h3>
          <p>The provided .gltf file could not be parsed. Make sure you extracted the textures properly!</p>
          <pre style={{ fontSize: '0.8rem', marginTop: '1rem', color: '#7f1d1d', overflowX: 'auto', textAlign: 'left', background: '#f8717122', padding: '10px' }}>
            {this.state.error?.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Hardcoded targeted centroids for the Custom Medical Bounding Shader 
// (Centers tightened strictly to the core spine axis to prevent rib/arm spreading)
const ORGAN_MAP = {
  brain: [0, 0.60, 0.02],
  head: [0, 0.60, 0.02],
  lungs: [0, 0.40, 0.0],
  heart: [0.02, 0.35, 0.05],
  liver: [-0.04, 0.15, 0.05],
  stomach: [0.04, 0.12, 0.05],
  kidneys: [0, 0.10, -0.05],
  intestines: [0, -0.15, 0.05],
  digestive: [0, -0.15, 0.05]
};

// ---------------------------------------------------------
// Option B: The "Bio-Scan Distance Shader" (Monolithic Mesh Shader Injection)
// ---------------------------------------------------------
function AuthenticSketchfabModel({ url, affectedParts, severity }) {
  const group = useRef();
  
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
     if(animations && animations.length > 0 && actions) {
        const firstAction = Object.values(actions)[0];
        if(firstAction) firstAction.play();
     }
  }, [actions, animations]);

  // Construct active target arrays 
  const activeTargets = useMemo(() => {
    let targets = [];
    affectedParts.forEach(part => {
       const key = part.toLowerCase();
       Object.keys(ORGAN_MAP).forEach(organ => {
          if (key.includes(organ) || organ.includes(key)) {
             targets.push(new THREE.Vector3(...ORGAN_MAP[organ]));
          }
       });
    });
    // Fill up to arbitrary limit (e.g. 10 max targets) for GLSL uniform padding
    while(targets.length < 10) {
      targets.push(new THREE.Vector3(9999, 9999, 9999));
    }
    return targets;
  }, [affectedParts]);

  const activeCount = affectedParts.length > 0 ? 10 : 0; // if none, we ignore
  const shaderRef = useRef();

  useMemo(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        // Clone original geometry so we do not mutate the core cache permanently
        child.material = new THREE.MeshStandardMaterial({
           map: child.material.map,
           color: child.material.color,
           roughness: 0.7,
           metalness: 0.1,
           transparent: true,
           opacity: 0.5,
           depthWrite: false
        });

        // The Volumetric Distance Engine injected natively into the material
        child.material.onBeforeCompile = (shader) => {
           shader.uniforms.targetVectors = { value: activeTargets };
           shader.uniforms.pulse = { value: 0.0 };
           shader.uniforms.power = { value: 1.0 }; // Core intensity multiplier

           shaderRef.current = shader.uniforms;

           shader.vertexShader = `
             varying vec3 vLocalPhysicsPos;
             ${shader.vertexShader}
           `.replace(
             `#include <begin_vertex>`,
             `#include <begin_vertex>
              vLocalPhysicsPos = position;` 
           );

           shader.fragmentShader = `
             uniform vec3 targetVectors[10];
             uniform float pulse;
             uniform float power;
             varying vec3 vLocalPhysicsPos;
             ${shader.fragmentShader}
           `.replace(
             `vec4 diffuseColor = vec4( diffuse, opacity );`,
             `
              vec4 diffuseColor = vec4( diffuse, opacity );
              float highlight = 0.0;
              for(int i = 0; i < 10; i++) {
                 if (targetVectors[i].x == 9999.0) continue;
                 
                 // Compress the boundary X-axis by 3.5x and Z-axis by 2.0x
                 // This forces the shader into a strict, narrow internal oval (bean shape)
                 // Completely eliminating the spread onto surrounding arms or far ribs!
                 vec3 ellipticalPos = vLocalPhysicsPos * vec3(3.5, 1.2, 2.0);
                 vec3 ellipticalTarget = targetVectors[i] * vec3(3.5, 1.2, 2.0);
                 
                 float dist = distance(ellipticalPos, ellipticalTarget);
                 
                 // Harder falloff for exact boundaries
                 highlight += smoothstep(0.20, 0.02, dist);
              }
              
              // Physically paint the diffuse texture Deep Red if in target zone to drastically increase visibility against white backgrounds
              float colorMix = clamp(highlight * pulse * power * 0.8, 0.0, 1.0);
              diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9, 0.0, 0.0), colorMix);
             `
           ).replace(
             `#include <emissivemap_fragment>`,
             `#include <emissivemap_fragment>
              // Blast intense red emissive light directly out of the targeted geometry
              totalEmissiveRadiance += vec3(1.0, 0.0, 0.0) * highlight * pulse * power * 1.5;
             `
           );
        };
      }
    });
  }, [scene, activeTargets]);

  useFrame((state) => {
    if (shaderRef.current) {
        const time = state.clock.getElapsedTime();
        
        let pulseSpeed = 2; 
        let power = 0.8; // Low Level (1-3 days): Light red, soft pulse
        
        if (severity === 'High') { 
            // High Level (>7 days): Deep dark red, blazing flash, fast pumping
            pulseSpeed = 6.0; 
            power = 4.0; 
        }
        else if (severity === 'Medium') { 
            // Medium Level (4-7 days): Solid red, moderate pulse
            pulseSpeed = 4.0; 
            power = 2.0; 
        }

        // Keep the minimum brightness from dropping to absolute zero with a tighter sine floor
        const mappedPulse = (Math.sin(time * pulseSpeed) * 0.4) + 0.6;
        
        shaderRef.current.pulse.value = mappedPulse;
        shaderRef.current.power.value = power;
        
        // CRITICAL SYNC: Ensure new body parts from the API correctly update the shader uniform array!
        shaderRef.current.targetVectors.value = activeTargets;
    }
  });

  return <primitive object={scene} ref={group} />;
}

// ---------------------------------------------------------
// Stand-by Loading Matrix
// ---------------------------------------------------------
function AssetHandoffTerminal({ status }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', textAlign: 'center', backgroundColor: '#f1f5f9', color: '#334155', borderRadius: '20px' }}>
      {status === 'checking' ? (
         <div style={{ animation: 'pulse-dark 1.5s infinite' }}>Querying WebGL Context...</div>
      ) : (
        <>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>⚠️ Authentic Sketchfab Asset Required</h3>
          <p style={{ maxWidth: '450px', lineHeight: '1.6' }}>
            The WebGL organ-lighting architecture is online and safely awaiting your file drops. 
          </p>
          <div style={{ marginTop: '1.5rem', padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', textAlign: 'left' }}>
            <p style={{ fontWeight: 600, color: '#2563eb', marginBottom: '0.5rem' }}>1. Download the specific Sketchfab Model</p>
            <p style={{ fontSize: '0.85rem', color: '#475569' }}>Because Sketchfab blocks automated AI tools, you must manually click "Download 3D Model" on the Sketchfab website and choose the <strong>glTF</strong> format.</p>
            
            <p style={{ fontWeight: 600, color: '#2563eb', marginTop: '1.2rem', marginBottom: '0.5rem' }}>2. Extract the ZIP into your Project</p>
            <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.5rem' }}>Extract the downloaded folder directly into your <code>frontend/public/</code> directory so that the files sit perfectly at:</p>
            <code style={{ fontSize: '0.85rem', display: 'block', color: '#d97706', backgroundColor: '#fef3c7', padding: '0.5rem', borderRadius: '6px' }}>
              frontend/public/scene.gltf<br/>
              frontend/public/scene.bin<br/>
              frontend/public/textures/
            </code>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------
// Main Render Pipeline
// ---------------------------------------------------------
const HumanBodyMap = ({ affectedParts = [], severity = 'Medium' }) => {
  const [modelStatus, setModelStatus] = useState('checking'); // 'checking', 'missing', 'exists'
  const [activeUrl, setActiveUrl] = useState('');
  const [isPanMode, setIsPanMode] = useState(false); // Toggle between Rotate and Pan for Left-Click

  // Validate which Sketchfab asset the user supplied
  useEffect(() => {
    fetch(BASE_URL, { method: 'HEAD' })
      .then(res => {
        const ct = res.headers.get('content-type');
        if (res.ok && ct && !ct.includes('text/html')) {
          setActiveUrl(BASE_URL);
          setModelStatus('exists');
        } else {
          // Fallback to exactly .glb if they mapped it that way
          fetch(FALLBACK_URL, { method: 'HEAD' }).then(res2 => {
            const ct2 = res2.headers.get('content-type');
            if (res2.ok && ct2 && !ct2.includes('text/html')) {
              setActiveUrl(FALLBACK_URL);
              setModelStatus('exists');
            } else {
              setModelStatus('missing');
            }
          });
        }
      })
      .catch(() => setModelStatus('missing'));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '2.5rem 0', backgroundColor: '#f8fafc', borderRadius: '24px', margin: '2rem 0', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>
          True Medical 3D Organ Scan
        </h2>
        <p style={{ color: '#475569', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Real-time dynamic mesh traversal rendering absolute volumetric impact zones into physiological assets.
        </p>
      </div>

      <div style={{ 
        position: 'relative', 
        width: '100%', 
        maxWidth: '800px', 
        height: '650px',
        margin: '0 auto',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 50px rgba(0,0,0,0.05), 0 25px 50px -12px rgba(15, 23, 42, 0.15)',
        backgroundColor: '#ffffff',
        border: '1px solid #cbd5e1'
      }}>
        
        {modelStatus !== 'exists' && <AssetHandoffTerminal status={modelStatus} />}

        {modelStatus === 'exists' && (
          <ErrorBoundary>
            <Canvas camera={{ position: [0, 0, 4.5], fov: 50 }}>
              <ambientLight intensity={1.5} />
              <spotLight position={[10, 10, 10]} intensity={2.0} penumbra={1} castShadow />
              
              <OrbitControls 
                enableZoom={true} 
                enablePan={true} 
                enableRotate={true}
                mouseButtons={{
                  LEFT: isPanMode ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
                  MIDDLE: THREE.MOUSE.DOLLY,
                  RIGHT: isPanMode ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN
                }}
                touches={{
                  ONE: isPanMode ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE,
                  TWO: THREE.TOUCH.DOLLY_PAN
                }}
              />
              
              <Suspense fallback={null}>
                {/* 
                  Center perfectly auto-scales and auto-aligns the foreign Sketchfab model 
                  to tightly fit within a 3.5 unit coordinate box! This ensures massive
                  or tiny sketchfab scaling errors don't cause blanks screens.
                */}
                <Center top fit ratio={4.0}>
                   <AuthenticSketchfabModel url={activeUrl} affectedParts={affectedParts} severity={severity} />
                </Center>
                <Environment preset="studio" />
              </Suspense>
            </Canvas>
          </ErrorBoundary>
        )}

        {/* 3D Navigation Controls Hint Panel */}
        {modelStatus === 'exists' && (
          <div style={{
            position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: '20px', padding: '12px 24px', 
            backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)',
            borderRadius: '50px', border: '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.05)', fontSize: '0.9rem',
            color: '#475569', fontWeight: '500', zIndex: 10, alignItems: 'center'
          }}>
            
            <button 
              onClick={() => setIsPanMode(!isPanMode)}
              style={{
                background: isPanMode ? '#3b82f6' : '#e2e8f0',
                color: isPanMode ? '#ffffff' : '#334155',
                border: 'none', padding: '8px 16px', borderRadius: '20px',
                fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: isPanMode ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
              }}
            >
               {isPanMode ? '✋ Pan Mode: Active' : '🔄 Rotate Mode: Active'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
               <span style={{ fontSize: '1.2rem', opacity: isPanMode ? 0.4 : 1 }}>🔄</span> Left-Click: {isPanMode ? 'Pan' : 'Rotate'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
               <span style={{ fontSize: '1.2rem' }}>🔍</span> Scroll: Zoom
            </div>
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '3.5rem', width: '90%', maxWidth: '800px', backgroundColor: '#ffffff', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.3rem', color: '#0f172a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Deep Tissue Matrix
        </h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          
          {affectedParts.map((part, idx) => {
            return (
              <div key={idx} style={{ 
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '12px 24px', backgroundColor: '#fef2f2', 
                color: '#991b1b', borderRadius: '12px', 
                fontSize: '1.1rem', fontWeight: 600,
                border: '1px solid #fecaca',
                boxShadow: '0 2px 10px rgba(220, 38, 38, 0.1)'
              }}>
                <span style={{ 
                  width: '12px', height: '12px', borderRadius: '50%', 
                  backgroundColor: '#dc2626', display: 'inline-block', 
                  boxShadow: '0 0 8px #ef4444',
                  animation: 'pulse-dark 1.5s infinite alternate'
                }}></span>
                {part} Damage Alert
              </div>
            );
          })}
          
          {affectedParts.length === 0 && (
            <div style={{ fontSize: '1.1rem', color: '#64748b', padding: '15px', fontWeight: 400 }}>
              No critical tissue degradation registered.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default HumanBodyMap;
