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

// --- COMPONENTES UI INTERNOS ---
const FeatureIcon = ({ icon: Icon, label }) => (
  <div className="flex flex-col items-center gap-2 group">
    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-rosa-100 flex items-center justify-center text-rosa-500 group-hover:scale-110 group-hover:bg-rosa-500 group-hover:text-white transition-all duration-300">
      <Icon size={24} />
    </div>
    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
  </div>
);

const Button = ({ children, onClick, variant = 'primary', fullWidth = false }) => {
  const base = "px-8 py-5 rounded-[2rem] font-black transition-all flex items-center justify-center gap-3 active:scale-95 text-sm uppercase tracking-widest group";
  const variants = {
    primary: "bg-rosa-500 text-white hover:bg-rosa-600 shadow-2xl shadow-rosa-100",
    dark: "bg-slate-900 text-white hover:bg-black shadow-2xl shadow-slate-200",
  };
  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''}`}>
      {children}
    </button>
  );
};

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-rosa-50">
      <div className="w-12 h-12 border-4 border-rosa-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-rosa-400 font-black uppercase tracking-widest text-[10px] mt-4 tracking-[0.4em]">Dulce Sal</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-rosa-100/40 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rosa-200/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="bg-white p-10 md:p-16 rounded-[4.5rem] shadow-2xl shadow-rosa-100/50 border border-slate-100 max-w-lg w-full text-center relative z-10 animate-in fade-in zoom-in duration-1000">
        
        <header className="mb-14">
          <div className="bg-rosa-500 w-28 h-28 rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-rosa-200 rotate-6 hover:rotate-0 transition-transform duration-500 border-4 border-white">
            <Store className="text-white" size={56} />
          </div>
          
          <h1 className="text-6xl font-black text-slate-900 mb-4 tracking-tighter italic leading-none">
            Dulce Sal
          </h1>
          
          <div className="flex items-center justify-center gap-2 text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] bg-slate-50 py-2.5 px-6 rounded-full inline-flex border border-slate-100">
            <MapPin size={12} className="text-rosa-500" />
            <span>{business?.address || 'URQUIZA 830'}</span>
          </div>
        </header>

        <div className="grid grid-cols-4 gap-4 mb-14 px-2">
          <FeatureIcon icon={Star} label="Puntos" />
          <FeatureIcon icon={Gift} label="Regalos" />
          <FeatureIcon icon={Coffee} label="Club" />
          <FeatureIcon icon={Smartphone} label="App" />
        </div>

        <div className="space-y-6">
          <Button fullWidth onClick={() => window.location.href = '/customer'}>
            <User size={20} /> Portal Cliente
            <ChevronRight size={16} className="ml-auto opacity-30" />
          </Button>
          
          <Button variant="dark" fullWidth onClick={() => window.location.href = '/admin'}>
            <LayoutDashboard size={20} /> Administración
            <ChevronRight size={16} className="ml-auto opacity-30" />
          </Button>
        </div>

        <footer className="mt-16 pt-10 border-t border-slate-50">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="text-rosa-300" size={16} />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">
              Membresía Exclusiva
            </p>
            <Sparkles className="text-rosa-300" size={16} />
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <Heart className="text-rosa-500 fill-rosa-500 animate-pulse" size={14} />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
              Experience the sweetness
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
