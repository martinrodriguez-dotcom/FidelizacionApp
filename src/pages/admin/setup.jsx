import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, query } from 'firebase/firestore';
import { Store, User, LayoutDashboard } from 'lucide-react';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "",
      authDomain: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: ""
    };

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'dulce-app-fidelizacion';

/**
 * App.jsx: White-label version for "Dulce App"
 * Focuses on a single business identity and simplifies the user flow.
 */
export default function App() {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [view, setView] = useState('loading'); // loading, setup, main
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(null);

  // 1. Mandatory Authentication Flow (Rule 3)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        setError("Error de autenticación");
      }
    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setLoadingData(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const [loadingData, setLoadingData] = useState(true);

  // 2. Single Business Detection (Rule 1 & Rule 2)
  useEffect(() => {
    // Guard: Always check for user before querying (Rule 3)
    if (!user) return;

    // Use mandatory SaaS path (Rule 1)
    const businessesRef = collection(db, 'artifacts', appId, 'public', 'data', 'businesses');
    
    // Simple query without limit() (Rule 2)
    const q = query(businessesRef);

    const unsubscribe = onSnapshot(q, (snap) => {
      if (snap.empty) {
        setView('setup');
      } else {
        // Take the first business found (filtering in memory per Rule 2)
        const businessDoc = snap.docs[0];
        const businessData = { id: businessDoc.id, ...businessDoc.data() };
        setBusiness(businessData);
        
        // Verify if the current user is the owner
        if (user.uid === businessData.ownerId) {
          setIsAdmin(true);
        }
        setView('main');
      }
      setLoadingData(false);
    }, (err) => {
      console.error("Firestore snapshot error:", err);
      // Fallback: If permissions fail, might need setup or check path
      if (err.code === 'permission-denied') {
        setError("Error de acceso a la base de datos.");
      }
    });

    return () => unsubscribe();
  }, [user]);

  if (view === 'loading' || loadingData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold">Cargando Dulce App...</p>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>
    );
  }

  // Redirect to setup if no business exists
  if (view === 'setup') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-indigo-600 text-white p-10 text-center">
        <Store size={64} className="mb-6 opacity-80" />
        <h2 className="text-3xl font-black mb-4">Bienvenido a Dulce App</h2>
        <p className="mb-8 opacity-90 max-w-sm">Aún no has configurado tu negocio. Por favor, completa el registro inicial.</p>
        <button 
          onClick={() => window.location.href = '/admin/setup'}
          className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black shadow-xl"
        >
          Configurar Negocio Ahora
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans selection:bg-indigo-100">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl shadow-indigo-100/50 border border-slate-100 max-w-md w-full animate-in fade-in zoom-in duration-500">
        <div className="bg-indigo-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 rotate-3 shadow-inner">
          <Store className="text-indigo-600" size={48} />
        </div>
        
        <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
          {business?.name || "Dulce App"}
        </h1>
        <p className="text-slate-400 mb-10 font-medium italic">
          {business?.address || "Programa de Fidelización"}
        </p>
        
        <div className="space-y-4">
          <button 
            onClick={() => window.location.href = '/customer'}
            className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <User size={22} /> Ver Mis Puntos
          </button>

          {isAdmin ? (
            <button 
              onClick={() => window.location.href = '/admin'}
              className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl shadow-slate-200 hover:bg-black hover:scale-[1.02] transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <LayoutDashboard size={22} /> Panel Administrativo
            </button>
          ) : (
            <div className="pt-6">
              <button 
                onClick={() => window.location.href = '/login'}
                className="text-slate-400 text-[10px] font-black hover:text-indigo-600 transition-colors uppercase tracking-[0.2em]"
              >
                Acceso para Administradores
              </button>
            </div>
          )}
        </div>
      </div>
      
      <p className="mt-12 text-slate-300 text-[10px] font-black uppercase tracking-[0.5em]">
        Powered by FidelizaPro
      </p>
    </div>
  );
}
