import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously,
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  Store, 
  User, 
  MapPin, 
  Sparkles, 
  LayoutDashboard, 
  Heart,
  ChevronRight,
  Star,
  Coffee,
  Gift,
  Smartphone
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "AIzaSyBqCo-N8hJo61cksLdW9JgJySSfEFJke64",
      authDomain: "fidelizacionapp-d3e8e.firebaseapp.com",
      projectId: "fidelizacionapp-d3e8e",
      storageBucket: "fidelizacionapp-d3e8e.firebasestorage.app",
      messagingSenderId: "86470097031",
      appId: "1:86470097031:web:fee57a2a8e6d471ccda022"
    };

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

const appIdRaw = typeof __app_id !== 'undefined' ? __app_id : "dulce-sal-app";
const appIdSaaS = appIdRaw.replace(/\//g, '_'); 
const DULCE_SAL_ID = "dulce-sal-id"; 

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Error Auth:", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const businessDocRef = doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'businesses', DULCE_SAL_ID);
    const unsub = onSnapshot(businessDocRef, (snap) => {
      if (snap.exists()) setBusiness(snap.data());
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#fdf2f8' }}>
      <div style={{ width: '48px', height: '48px', border: '4px solid #ec4899', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <p style={{ color: '#ec4899', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.3em', fontSize: '11px', marginTop: '16px' }}>Cargando Dulce Sal</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div className="ds-wrapper">
      <style dangerouslySetInnerHTML={{ __html: `
        .ds-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background-color: #f8fafc;
          padding: 24px;
          box-sizing: border-box;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .ds-card {
          background-color: #ffffff;
          padding: 48px;
          border-radius: 4rem;
          box-shadow: 0 25px 50px -12px rgba(236, 72, 153, 0.15);
          border: 1px solid #f1f5f9;
          max-width: 450px;
          width: 100%;
          text-align: center;
          box-sizing: border-box;
        }
        .ds-logo-box {
          background-color: #ec4899;
          width: 100px;
          height: 100px;
          border-radius: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 32px auto;
          box-shadow: 0 20px 25px -5px rgba(236, 72, 153, 0.3);
          color: #ffffff;
          border: 4px solid #ffffff;
        }
        .ds-title {
          font-size: 3.5rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 16px 0;
          letter-spacing: -0.05em;
          font-style: italic;
        }
        .ds-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: #f8fafc;
          padding: 10px 24px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          border: 1px solid #f1f5f9;
          margin-bottom: 40px;
        }
        .ds-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 40px;
        }
        .ds-feature-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .ds-feature-icon {
          width: 56px;
          height: 56px;
          background-color: #ffffff;
          border-radius: 1.25rem;
          border: 1px solid #fce7f3;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ec4899;
          box-shadow: 0 4px 6px -1px rgba(236, 72, 153, 0.05);
        }
        .ds-feature-label {
          font-size: 9px;
          font-weight: 900;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .ds-buttons-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 40px;
        }
        .ds-btn {
          width: 100%;
          padding: 18px 24px;
          border-radius: 2rem;
          font-weight: 900;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          transition: transform 0.1s ease;
          border: none;
          box-sizing: border-box;
        }
        .ds-btn:active { transform: scale(0.98); }
        .ds-btn-primary {
          background-color: #ec4899;
          color: #ffffff;
          box-shadow: 0 20px 25px -5px rgba(236, 72, 153, 0.2);
        }
        .ds-btn-dark {
          background-color: #0f172a;
          color: #ffffff;
          box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.15);
        }
        .ds-footer {
          border-top: 1px solid #f1f5f9;
          padding-top: 32px;
        }
        .ds-footer-text {
          font-size: 10px;
          font-weight: 900;
          color: #cbd5e1;
          text-transform: uppercase;
          letter-spacing: 0.4em;
          margin: 0 0 16px 0;
        }
        .ds-footer-sub {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 10px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-style: italic;
        }
      ` }} />

      <div className="ds-card">
        <header>
          <div className="ds-logo-box">
            <Store size={48} />
          </div>
          <h1 className="ds-title">Dulce Sal</h1>
          <div className="ds-badge">
            <MapPin size={12} style={{ color: '#ec4899' }} />
            <span>{business?.address || 'URQUIZA 830'}</span>
          </div>
        </header>

        {/* Rejilla de Módulos */}
        <div className="ds-grid">
          <div className="ds-feature-item">
            <div className="ds-feature-icon"><Star size={22} /></div>
            <span className="ds-feature-label">Puntos</span>
          </div>
          <div className="ds-feature-item">
            <div className="ds-feature-icon"><Gift size={22} /></div>
            <span className="ds-feature-label">Regalos</span>
          </div>
          <div className="ds-feature-item">
            <div className="ds-feature-icon"><Coffee size={22} /></div>
            <span className="ds-feature-label">Club</span>
          </div>
          <div className="ds-feature-item">
            <div className="ds-feature-icon"><Smartphone size={22} /></div>
            <span className="ds-feature-label">App</span>
          </div>
        </div>

        {/* Botones de Navegación */}
        <div className="ds-buttons-stack">
          <button className="ds-btn ds-btn-primary" onClick={() => window.location.href = '/customer'}>
            <User size={18} />
            <span style={{ flex: 1, textAlign: 'center' }}>Portal Cliente</span>
            <ChevronRight size={14} style={{ opacity: 0.5 }} />
          </button>
          
          <button className="ds-btn ds-btn-dark" onClick={() => window.location.href = '/admin'}>
            <LayoutDashboard size={18} />
            <span style={{ flex: 1, textAlign: 'center' }}>Administración</span>
            <ChevronRight size={14} style={{ opacity: 0.5 }} />
          </button>
        </div>

        {/* Pie de la Tarjeta */}
        <footer className="ds-footer">
          <p className="ds-footer-text">Membresía Exclusiva</p>
          <div className="ds-footer-sub">
            <Heart size={12} style={{ color: '#ec4899', fill: '#ec4899' }} />
            <span>Experience the sweetness</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
