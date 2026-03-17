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
  Smartphone,
  ShieldCheck,
  Zap
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE ---
// Asegúrate de que estas credenciales coincidan con tu consola de Firebase
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

// Inicialización de Firebase con patrón Singleton para Next.js
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Identificadores del Proyecto Dulce Sal
const appIdRaw = typeof __app_id !== 'undefined' ? __app_id : "dulce-sal-app";
const appIdSaaS = appIdRaw.replace(/\//g, '_'); 
const DULCE_SAL_ID = "dulce-sal-id"; 

// --- COMPONENTES DE INTERFAZ (UI) ---

/**
 * Icono de característica con efectos de hover en rosa
 */
const FeatureIcon = ({ icon: Icon, label }) => (
  <div className="flex flex-col items-center gap-3 group">
    <div className="w-16 h-16 bg-white rounded-[1.5rem] shadow-sm border border-rosa-100 flex items-center justify-center text-rosa-500 group-hover:scale-110 group-hover:bg-rosa-500 group-hover:text-white transition-all duration-500 shadow-rosa-100/20 group-hover:shadow-rosa-200">
      <Icon size={28} />
    </div>
    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-rosa-600 transition-colors">
      {label}
    </span>
  </div>
);

/**
 * Botón principal estilizado con los colores de la marca
 */
const Button = ({ children, onClick, variant = 'primary', fullWidth = false }) => {
  const base = "px-8 py-5 rounded-[2.2rem] font-black transition-all flex items-center justify-center gap-4 active:scale-95 text-sm uppercase tracking-[0.15em] group overflow-hidden relative";
  const variants = {
    primary: "bg-rosa-500 text-white hover:bg-rosa-600 shadow-2xl shadow-rosa-200/50",
    dark: "bg-slate-900 text-white hover:bg-black shadow-2xl shadow-slate-300",
  };
  
  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''}`}>
      <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
      <span className="relative z-10 flex items-center gap-3 w-full justify-center">
        {children}
      </span>
    </button>
  );
};

// --- PÁGINA PRINCIPAL ---

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Manejo de la sesión (Auth)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Error en autenticación inicial:", err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Carga de los datos del negocio desde Firestore
  useEffect(() => {
    if (!user) return;

    const businessDocRef = doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'businesses', DULCE_SAL_ID);
    const unsub = onSnapshot(businessDocRef, (snap) => {
      if (snap.exists()) {
        setBusiness(snap.data());
      }
      setLoading(false);
    }, (err) => {
      console.error("Error al obtener datos del negocio:", err);
      setLoading(false);
    });
    
    return () => unsub();
  }, [user]);

  /**
   * Navegación controlada
   */
  const navigateTo = (path) => {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };

  // Pantalla de carga (Splash Screen)
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-rosa-50">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-rosa-200 rounded-full animate-pulse"></div>
        <div className="w-16 h-16 border-4 border-rosa-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
      </div>
      <p className="text-rosa-500 font-black uppercase tracking-[0.4em] text-[11px] mt-8 animate-bounce">
        Dulce Sal
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans selection:bg-rosa-100 selection:text-rosa-900 relative overflow-hidden">
      
      {/* --- ELEMENTOS DE DISEÑO DE FONDO (BG DECOR) --- */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-rosa-100/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-rosa-200/20 rounded-full blur-[150px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ec4899" strokeWidth="1"/>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
        </div>
      </div>

      {/* --- TARJETA PRINCIPAL (MAIN CARD) --- */}
      <div className="bg-white p-12 md:p-20 rounded-[5rem] shadow-[0_50px_100px_-20px_rgba(236,72,153,0.15)] border border-slate-100 max-w-xl w-full text-center relative z-10 animate-in fade-in zoom-in slide-in-from-bottom-8 duration-1000 ease-out">
        
        {/* Cabecera / Identidad */}
        <header className="mb-16">
          <div className="relative inline-block mb-12 group cursor-default">
            {/* Efecto de resplandor rosa */}
            <div className="absolute inset-0 bg-rosa-500 blur-3xl opacity-20 group-hover:opacity-50 transition-all duration-700"></div>
            
            <div className="bg-rosa-500 w-32 h-32 rounded-[3.5rem] flex items-center justify-center relative z-10 shadow-2xl shadow-rosa-300 rotate-6 group-hover:rotate-0 group-hover:scale-105 transition-all duration-500 border-4 border-white">
              <Store className="text-white" size={64} />
            </div>
            
            <div className="absolute -bottom-4 -right-4 bg-white p-3 rounded-2xl shadow-xl text-rosa-500 z-20 border border-rosa-50 scale-0 group-hover:scale-100 transition-transform duration-500 delay-100">
                <Zap size={24} fill="currentColor" />
            </div>
          </div>
          
          <h1 className="text-7xl font-black text-slate-900 mb-5 tracking-tighter italic leading-none">
            Dulce Sal
          </h1>
          
          <div className="flex items-center justify-center gap-3 text-slate-400 font-bold uppercase tracking-[0.25em] text-[11px] bg-slate-50 py-3 px-8 rounded-3xl inline-flex border border-slate-100 shadow-inner">
            <MapPin size={14} className="text-rosa-500" />
            <span>{business?.address || 'Premium Loyalty Experience'}</span>
          </div>
        </header>

        {/* Sección de Características (Features) */}
        <div className="grid grid-cols-4 gap-6 mb-16 px-4">
          <FeatureIcon icon={Star} label="Puntos" />
          <FeatureIcon icon={Gift} label="Regalos" />
          <FeatureIcon icon={Coffee} label="Club" />
          <FeatureIcon icon={ShieldCheck} label="Seguro" />
        </div>

        {/* Acciones de Navegación */}
        <div className="space-y-6 mb-16">
          <Button fullWidth onClick={() => navigateTo('/customer')}>
            <User size={22} className="group-hover:translate-x-1 transition-transform" /> 
            <span className="flex-1 text-center">Entrar como Cliente</span>
            <ChevronRight size={18} className="opacity-30 group-hover:opacity-100 transition-opacity" />
          </Button>
          
          <Button variant="dark" fullWidth onClick={() => navigateTo('/admin')}>
            <LayoutDashboard size={22} className="group-hover:rotate-12 transition-transform" /> 
            <span className="flex-1 text-center">Acceso Administración</span>
            <ChevronRight size={18} className="opacity-30 group-hover:opacity-100 transition-opacity" />
          </Button>
        </div>

        {/* Pie de Página de la Marca (Brand Footer) */}
        <footer className="pt-12 border-t border-slate-50 relative">
          <div className="flex items-center justify-center gap-4 mb-8">
            <Sparkles className="text-rosa-400" size={18} />
            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-300">
              Membresía VIP Exclusiva
            </p>
            <Sparkles className="text-rosa-400" size={18} />
          </div>
          
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <Heart className="text-rosa-500 fill-rosa-500 animate-pulse" size={16} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                Cuidamos cada detalle
              </span>
            </div>
          </div>

          {/* Iconos de PWA simulados */}
          <div className="mt-10 flex justify-center gap-6 opacity-20">
            <Smartphone size={20} className="text-slate-400" />
            <div className="w-px h-5 bg-slate-200"></div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                App Instalable
            </p>
          </div>
        </footer>
      </div>

      {/* Versión de la Aplicación */}
      <div className="mt-16 flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.7em] text-slate-300 pointer-events-none opacity-50">
        <div className="w-16 h-[2px] bg-gradient-to-r from-transparent to-slate-200"></div>
        DULCE SAL LOYALTY v2.8
        <div className="w-16 h-[2px] bg-gradient-to-l from-transparent to-slate-200"></div>
      </div>
    </div>
  );
}
