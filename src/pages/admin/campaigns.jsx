import React, { useEffect, useState } from 'react';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc 
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
  Send,
  MessageSquare
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

export default function AdminCampaigns() {
  const [user, setUser] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado del formulario
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');

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
    
    const campaignsRef = collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'campaigns');
    const unsub = onSnapshot(campaignsRef, (snap) => {
      const list = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(c => c.businessId === DULCE_SAL_ID);
        
      setCampaigns(list.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt)));
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

  const handleSendCampaign = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formBody.trim()) return;

    try {
      await addDoc(collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'campaigns'), {
        businessId: DULCE_SAL_ID,
        title: formTitle,
        body: formBody,
        sentAt: new Date().toISOString()
      });
      setFormTitle('');
      setFormBody('');
      alert("Notificación guardada en el historial de envíos.");
    } catch (err) {
      console.error("Error al enviar campaña:", err);
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
          <button onClick={() => safeNavigate('/admin/rewards')} className="w-full flex items-center gap-3 px-6 py-4 rounded-[1.5rem] text-slate-400 hover:bg-rosa-50 hover:text-rosa-600 font-bold text-sm transition-all group">
            <Award size={18} className="group-hover:text-rosa-500" /> Configurar Premios
          </button>
          <button className="w-full flex items-center justify-between px-6 py-4 rounded-[1.5rem] bg-rosa-500 text-white font-bold text-sm shadow-xl shadow-rosa-100 transition-all">
            <div className="flex items-center gap-3"><Bell size={18} /> Campañas Push</div>
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
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Mensajes y Notificaciones</h1>
              <p className="text-slate-400 font-medium italic text-sm mt-1">Comunícate con tu base de clientes.</p>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* REDACTAR MENSAJE */}
            <div>
              <form onSubmit={handleSendCampaign} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 sticky top-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-rosa-50 text-rosa-500 rounded-2xl flex items-center justify-center">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Redactar</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Nuevo Mensaje</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2 ml-1">Título de la Notificación</label>
                    <input 
                      type="text" required placeholder="Ej: ¡Llegaron nuevas promos!"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rosa-500 font-bold text-slate-700 transition-all"
                      value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2 ml-1">Contenido del mensaje</label>
                    <textarea 
                      required rows="4" placeholder="Escribe tu mensaje aquí..."
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rosa-500 font-medium text-slate-700 transition-all resize-none"
                      value={formBody} onChange={(e) => setFormBody(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                
                <button type="submit" className="w-full mt-8 bg-slate-900 text-white font-black px-6 py-4 rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest shadow-xl active:scale-95">
                  <Send size={18} /> Enviar a Todos
                </button>
              </form>
            </div>

            {/* HISTORIAL DE ENVÍOS */}
            <div className="space-y-4">
              <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] px-4 mb-6">Historial de Envíos</h4>
              
              {campaigns.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-16 text-center border border-slate-100 shadow-sm">
                  <Bell size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400 font-bold text-sm italic">No has enviado ninguna campaña aún.</p>
                </div>
              ) : (
                campaigns.map((c) => (
                  <div key={c.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-rosa-100/50 transition-all group">
                    <h5 className="font-black text-lg text-slate-900 mb-2 tracking-tight">{c.title}</h5>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4">{c.body}</p>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-rosa-400 bg-rosa-50 inline-flex px-3 py-1.5 rounded-xl">
                      <Send size={12} />
                      {new Date(c.sentAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
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
