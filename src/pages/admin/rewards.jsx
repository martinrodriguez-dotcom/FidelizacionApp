import React, { useEffect, useState } from 'react';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged,
  signOut,
  signInAnonymously,
  signInWithCustomToken
} from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  LayoutDashboard, 
  Users, 
  Award, 
  Bell, 
  LogOut,
  Store,
  ArrowLeft,
  Trash2,
  PlusCircle,
  Gift
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

// --- INYECTOR DE ESTILOS TAILWIND ---
const TailwindStyleInjector = () => {
  useEffect(() => {
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = "https://cdn.tailwindcss.com";
      document.head.appendChild(script);
      script.onload = () => {
        window.tailwind.config = {
          theme: {
            extend: {
              colors: {
                rosa: {
                  50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8',
                  300: '#f9a8d4', 400: '#f472b6', 500: '#ec4899',
                  600: '#db2777', 700: '#be185d', 800: '#9d174d',
                  900: '#831843'
                }
              }
            }
          }
        };
      };
    }
  }, []);
  return null;
};

export default function AdminRewards() {
  const [user, setUser] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado del formulario
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('visits');
  const [formValue, setFormValue] = useState(10);

  const safeNavigate = (path) => {
    if (typeof window !== 'undefined' && path) {
      window.location.href = path;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error(err); }
    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser && !loading) safeNavigate('/');
    });

    return () => unsubscribe();
  }, [loading]);

  useEffect(() => {
    if (!user) return;
    
    const rewardsRef = collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'rewards');
    const unsub = onSnapshot(rewardsRef, (snap) => {
      const list = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(r => r.businessId === DULCE_SAL_ID);
        
      setRewards(list.sort((a, b) => a.conditionValue - b.conditionValue));
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      safeNavigate('/');
    } catch (err) { console.error(err); }
  };

  const handleAddReward = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || formValue <= 0) return;

    try {
      await addDoc(collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'rewards'), {
        businessId: DULCE_SAL_ID,
        title: formTitle,
        conditionType: formType,
        conditionValue: parseInt(formValue)
      });
      setFormTitle('');
      setFormValue(10);
    } catch (err) {
      console.error("Error al añadir premio:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este premio?")) {
      try {
        await deleteDoc(doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'rewards', id));
      } catch (err) {
        console.error("Error al eliminar:", err);
      }
    }
  };

  if (loading && !user) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <TailwindStyleInjector />
      <div className="w-12 h-12 border-4 border-rosa-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Cargando...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans selection:bg-rosa-100">
      <TailwindStyleInjector />
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-slate-100 hidden lg:flex flex-col p-8 sticky top-0 h-screen">
        <div className="mb-12 flex items-center gap-4 cursor-pointer" onClick={() => safeNavigate('/admin')}>
          <div className="bg-rosa-500 p-3 rounded-2xl text-white shadow-lg shadow-rosa-100">
            <Store size={24} />
          </div>
          <div>
            <h2 className="font-black text-slate-900 tracking-tighter text-2xl italic">Dulce Sal</h2>
            <p className="text-[9px] font-black uppercase tracking-widest text-rosa-400">Admin Console</p>
          </div>
        </div>
        
        <nav className="space-y-3 flex-1">
          <button onClick={() => safeNavigate('/admin')} className="w-full flex items-center gap-3 px-6 py-4 rounded-[1.5rem] text-slate-400 hover:bg-rosa-50 hover:text-rosa-600 font-bold text-sm transition-all group">
            <LayoutDashboard size={18} className="group-hover:text-rosa-500" /> Dashboard
          </button>
          <button onClick={() => safeNavigate('/admin/customers')} className="w-full flex items-center gap-3 px-6 py-4 rounded-[1.5rem] text-slate-400 hover:bg-rosa-50 hover:text-rosa-600 font-bold text-sm transition-all group">
            <Users size={18} className="group-hover:text-rosa-500" /> Clientes
          </button>
          <button className="w-full flex items-center justify-between px-6 py-4 rounded-[1.5rem] bg-rosa-500 text-white font-bold text-sm shadow-xl shadow-rosa-100 transition-all">
            <div className="flex items-center gap-3"><Award size={18} /> Premios</div>
          </button>
          <button onClick={() => safeNavigate('/admin/campaigns')} className="w-full flex items-center gap-3 px-6 py-4 rounded-[1.5rem] text-slate-400 hover:bg-rosa-50 hover:text-rosa-600 font-bold text-sm transition-all group">
            <Bell size={18} className="group-hover:text-rosa-500" /> Campañas Push
          </button>
        </nav>

        <div className="pt-8 border-t border-slate-50">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-6 py-4 text-red-400 font-bold text-sm hover:bg-red-50 rounded-[1.5rem] transition-all">
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          <header className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-12">
            <div>
              <button onClick={() => safeNavigate('/admin')} className="flex items-center gap-2 text-slate-400 hover:text-rosa-500 font-bold text-xs uppercase tracking-widest mb-4 transition-colors">
                <ArrowLeft size={16} /> Volver
              </button>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Catálogo de Premios</h1>
              <p className="text-slate-400 font-medium italic text-sm mt-1">Configura las recompensas para tus clientes fieles.</p>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            {/* FORMULARIO DE CREACIÓN */}
            <div className="lg:col-span-1">
              <form onSubmit={handleAddReward} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 sticky top-8">
                <div className="w-16 h-16 bg-rosa-50 text-rosa-500 rounded-2xl flex items-center justify-center mb-6">
                  <Gift size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-8">Nuevo Premio</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2 ml-1">Título del Premio</label>
                    <input 
                      type="text" required placeholder="Ej: Café Gratis"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rosa-500 font-bold text-slate-700 transition-all"
                      value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2 ml-1">Condición</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setFormType('visits')} className={`py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${formType === 'visits' ? 'bg-rosa-500 text-white shadow-md shadow-rosa-200' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'}`}>Visitas</button>
                      <button type="button" onClick={() => setFormType('points')} className={`py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${formType === 'points' ? 'bg-rosa-500 text-white shadow-md shadow-rosa-200' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'}`}>Puntos</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2 ml-1">Meta a alcanzar</label>
                    <input 
                      type="number" required min="1"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rosa-500 font-bold text-slate-700 transition-all"
                      value={formValue} onChange={(e) => setFormValue(e.target.value)}
                    />
                  </div>
                </div>
                
                <button type="submit" className="w-full mt-8 bg-slate-900 text-white font-black px-6 py-4 rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest shadow-xl">
                  <PlusCircle size={18} /> Guardar Premio
                </button>
              </form>
            </div>

            {/* LISTA DE PREMIOS */}
            <div className="lg:col-span-2 space-y-4">
              {rewards.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-16 text-center border border-slate-100 shadow-sm">
                  <Award size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400 font-bold text-sm italic">No tienes ningún premio configurado.</p>
                </div>
              ) : (
                rewards.map((r) => (
                  <div key={r.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-rosa-100/50 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400">
                        <Gift size={24} />
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-slate-900 tracking-tight mb-1">{r.title}</h4>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rosa-500 bg-rosa-50 inline-block px-3 py-1 rounded-full border border-rosa-100">
                          {r.conditionValue} {r.conditionType === 'visits' ? 'Visitas requeridas' : 'Puntos requeridos'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(r.id)}
                      className="p-4 bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-200 rounded-2xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
