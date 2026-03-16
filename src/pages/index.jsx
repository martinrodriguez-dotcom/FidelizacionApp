import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc 
} from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { 
  Store, 
  User, 
  MapPin, 
  Sparkles, 
  Download, 
  LayoutDashboard, 
  Heart 
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
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

// Identificadores fijos unificados para Dulce Sal
const appIdSaaS = "dulce-sal-app"; 
const DULCE_SAL_ID = "dulce-sal-id"; 

// --- COMPONENTES UI AUXILIARES ---
const Input = ({ label, type = "text", value, onChange, placeholder, required = false }) => (
  <div className="w-full space-y-1">
    {label && <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">{label}</label>}
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold text-slate-700"
    />
  </div>
);

const Button = ({ children, onClick, variant = 'primary', fullWidth = false, disabled = false, type = "button" }) => {
  const base = "px-6 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100",
    dark: "bg-slate-900 text-white hover:bg-black shadow-xl",
    outline: "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''}`}>
      {children}
    </button>
  );
};

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [view, setView] = useState('loading'); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Manejo de Autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        signInAnonymously(auth);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Detección de Negocio Dulce Sal
  useEffect(() => {
    if (!user) return;

    const businessDocRef = doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'businesses', DULCE_SAL_ID);

    const unsubscribeBusiness = onSnapshot(businessDocRef, (snap) => {
      if (snap.exists()) {
        setBusiness(snap.data());
        setView('main');
      } else {
        setView('setup');
      }
      setLoading(false);
    }, (err) => {
      console.error("Firestore Error:", err);
      setError("Error de permisos en Firestore.");
      setLoading(false);
    });

    return () => unsubscribeBusiness();
  }, [user]);

  // --- Lógica de Configuración Inicial (Setup) ---
  const [setupData, setSetupData] = useState({ address: '', lat: '', lng: '', radius: '200' });
  
  const handleSetup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const autoEmail = "admin@dulcesal.com";
      const autoPass = "dulcesal123";
      
      let finalUser = user;
      try {
        const cred = await createUserWithEmailAndPassword(auth, autoEmail, autoPass);
        finalUser = cred.user;
      } catch (e) {
        try {
          const cred = await signInWithEmailAndPassword(auth, autoEmail, autoPass);
          finalUser = cred.user;
        } catch (innerError) {
          console.error("Auth Error:", innerError);
        }
      }

      const businessDocRef = doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'businesses', DULCE_SAL_ID);
      await setDoc(businessDocRef, {
        name: "Dulce Sal",
        address: setupData.address,
        lat: parseFloat(setupData.lat) || 0,
        lng: parseFloat(setupData.lng) || 0,
        radius: parseInt(setupData.radius) || 200,
        ownerId: finalUser?.uid || '',
        adminEmail: autoEmail,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
      setError("No se pudo configurar el negocio.");
    } finally {
      setLoading(false);
    }
  };

  if (view === 'loading' || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Cargando Dulce Sal</p>
      </div>
    );
  }

  // --- VISTA A: CONFIGURACIÓN INICIAL ---
  if (view === 'setup') {
    return (
      <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-8">
            <div className="bg-indigo-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 rotate-3 shadow-inner">
              <Sparkles className="text-indigo-600" size={40} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Dulce Sal</h1>
            <p className="text-slate-400 font-medium mt-1">Configuración Inicial</p>
          </div>

          <form onSubmit={handleSetup} className="space-y-5">
            <Input 
              label="Dirección del Local" 
              placeholder="Ej: Av. Santa Fe 1234"
              value={setupData.address}
              onChange={e => setSetupData({...setupData, address: e.target.value})}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Latitud" value={setupData.lat} onChange={e => setSetupData({...setupData, lat: e.target.value})} required />
              <Input label="Longitud" value={setupData.lng} onChange={e => setSetupData({...setupData, lng: e.target.value})} required />
            </div>
            <Input label="Radio de Alerta (m)" type="number" value={setupData.radius} onChange={e => setSetupData({...setupData, radius: e.target.value})} required />
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-[10px] text-slate-400 font-medium leading-relaxed">
              <p className="font-black uppercase text-indigo-600 mb-1 tracking-widest">Credenciales Admin:</p>
              Email: admin@dulcesal.com <br/> Pass: dulcesal123
            </div>

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Configurando...' : 'Crear Aplicación Dulce Sal'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // --- VISTA B: PORTAL PRINCIPAL DULCE SAL ---
  const registerUrl = typeof window !== 'undefined' ? `${window.location.origin}/customer` : '';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(registerUrl)}&margin=20`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans selection:bg-indigo-100">
      <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl shadow-indigo-100/50 border border-slate-100 max-w-lg w-full text-center relative overflow-hidden animate-in fade-in zoom-in duration-500">
        
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>

        <div className="relative z-10">
          <div className="bg-indigo-600 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 rotate-3 shadow-xl shadow-indigo-200">
            <Store className="text-white" size={48} />
          </div>
          
          <h1 className="text-5xl font-black text-slate-900 mb-2 tracking-tighter italic">Dulce Sal</h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-10 flex items-center justify-center gap-2">
            <MapPin size={12} className="text-indigo-500" /> {business?.address}
          </p>

          <div className="grid grid-cols-1 gap-4 mb-10">
            <Button fullWidth onClick={() => window.location.href = '/customer'}>
              <User size={22} /> Soy Cliente / Mis Puntos
            </Button>
            
            <Button variant="dark" fullWidth onClick={() => window.location.href = '/admin'}>
              <LayoutDashboard size={22} /> Panel de Administración
            </Button>
          </div>

          <div className="pt-10 border-t border-slate-100">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6">QR del Mostrador</h3>
            <div className="bg-slate-50 p-6 rounded-[2.5rem] border-2 border-dashed border-slate-200 inline-block mb-6">
              <img src={qrCodeUrl} alt="QR Local" className="w-48 h-48 rounded-2xl shadow-sm" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium mb-6 px-4">
              Imprime este código. Los clientes lo escanearán para sumarse a tu programa.
            </p>
            <a 
              href={qrCodeUrl} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-8 py-3 rounded-2xl text-xs font-black hover:bg-indigo-100 transition-all active:scale-95 shadow-sm"
            >
              <Download size={16} /> Descargar QR
            </a>
          </div>
        </div>
      </div>
      
      <div className="mt-12 flex items-center gap-3 opacity-20">
        <Heart className="text-slate-900" size={14} />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-900 italic">
          Dulce Sal Experience
        </p>
      </div>
    </div>
  );
}
