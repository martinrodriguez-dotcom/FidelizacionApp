import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { 
  Bell, 
  Send, 
  ArrowLeft, 
  Smartphone, 
  Users, 
  CheckCircle2, 
  Loader2,
  History
} from 'lucide-react';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// --- CONFIGURACIÓN FIREBASE ---
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

export default function CampaignsPage() {
  const [user, setUser] = useState(null);
  const [customerCount, setCustomerCount] = useState(0);
  const [pushCount, setPushCount] = useState(0);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const [formData, setFormData] = useState({ title: '', body: '' });

  // Función de navegación segura
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
      if (!currentUser && !loading) safeNavigate('/admin');
    });
    return () => unsubscribe();
  }, [loading]);

  useEffect(() => {
    if (!user) return;

    // 1. Contar Clientes Reales y Suscritos
    const cardsRef = collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'loyalty_cards');
    const unsubCards = onSnapshot(cardsRef, (snap) => {
      const list = snap.docs.map(d => d.data()).filter(c => c.businessId === DULCE_SAL_ID);
      setCustomerCount(list.length);
      setPushCount(list.filter(c => c.pushEnabled === true).length);
    });

    // 2. Historial de Campañas
    const campRef = collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'campaigns');
    const unsubCamp = onSnapshot(campRef, (snap) => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(c => c.businessId === DULCE_SAL_ID);
      setCampaigns(list.sort((a,b) => new Date(b.sentAt) - new Date(a.sentAt)));
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => { unsubCards(); unsubCamp(); };
  }, [user]);

  const handleSendPush = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim()) return;
    setIsSending(true);

    try {
      await addDoc(collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'campaigns'), {
        businessId: DULCE_SAL_ID,
        title: formData.title,
        body: formData.body,
        sentAt: new Date().toISOString(),
        reach: pushCount
      });

      setFormData({ title: '', body: '' });
      // Mensaje de éxito visual (sustituyendo alert por estado si fuera necesario, aquí mantenemos simple)
      alert(`¡Campaña enviada a ${pushCount} dispositivos!`);
    } catch (error) {
      console.error(error);
      alert("Error al enviar campaña.");
    } finally {
      setIsSending(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="text-rosa-500 animate-spin" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6 md:p-12 selection:bg-rosa-100 selection:text-rosa-900">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        <div className="lg:col-span-2 flex items-center gap-5 mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <button 
            onClick={() => safeNavigate('/admin')} 
            className="p-4 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-rosa-600 hover:bg-rosa-50 transition-all active:scale-95"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Campañas Push</h1>
            <p className="text-slate-500 font-medium italic mt-1">Conecta con los clientes de Dulce Sal en tiempo real</p>
          </div>
        </div>

        {/* Creador de Campañas */}
        <div className="bg-white p-8 md:p-10 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 animate-in fade-in slide-in-from-left-4 duration-700">
          <div className="flex items-center gap-5 mb-10">
            <div className="bg-rosa-50 w-20 h-20 rounded-[1.75rem] flex items-center justify-center rotate-3 shadow-inner">
              <Bell className="text-rosa-500" size={36} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Nuevo Mensaje</h2>
              <div className="flex items-center gap-2 mt-1">
                <Smartphone size={14} className="text-rosa-400" />
                <p className="text-xs font-bold text-slate-400 tracking-tight">
                  Llegará a <span className="text-rosa-600">{pushCount}</span> de {customerCount} clientes.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSendPush} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Título de la Notificación</label>
              <input 
                type="text" 
                placeholder="Ej: ¡Hoy 2x1 en postres!" 
                maxLength="50" 
                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rosa-500 font-bold transition-all" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Cuerpo del Mensaje</label>
              <textarea 
                placeholder="Ej: Ven este fin de semana y duplica tus puntos en consumos mayores a $500." 
                rows="4" 
                maxLength="150" 
                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rosa-500 font-medium resize-none transition-all" 
                value={formData.body} 
                onChange={e => setFormData({...formData, body: e.target.value})} 
                required 
              />
              <p className="text-right text-[10px] text-slate-300 font-black tracking-widest uppercase mt-1">
                {formData.body.length}/150 caracteres
              </p>
            </div>
            
            <button 
              type="submit" 
              disabled={isSending || pushCount === 0} 
              className="w-full bg-rosa-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-rosa-100 hover:bg-rosa-600 flex items-center justify-center gap-3 disabled:opacity-50 transition-all active:scale-95"
            >
              {isSending ? <Loader2 className="animate-spin" size={20} /> : <><Send size={20} /> Enviar Notificación</>}
            </button>
            
            {pushCount === 0 && (
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl mt-4">
                <p className="text-center text-[10px] text-amber-600 font-black uppercase tracking-widest">
                  No hay dispositivos habilitados para recibir mensajes.
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Vista Previa y Registro */}
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
          
          <div className="bg-slate-200/40 p-10 rounded-[3.5rem] border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rosa-500/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <h3 className="text-[10px] font-black uppercase text-slate-400 mb-8 tracking-[0.3em] text-center">Vista Previa Real-Time</h3>
            
            {/* Mockup de Notificación iOS/Android */}
            <div className="bg-white p-5 rounded-3xl shadow-xl max-w-sm mx-auto flex items-start gap-4 border border-slate-100 animate-in zoom-in duration-300">
              <div className="bg-rosa-500 w-12 h-12 rounded-[1.25rem] shrink-0 flex items-center justify-center shadow-lg shadow-rosa-100">
                <Store className="text-white" size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <p className="font-black text-slate-900 text-[13px] tracking-tight uppercase">Dulce Sal</p>
                  <span className="text-[9px] text-slate-300 font-bold uppercase">Ahora</span>
                </div>
                <p className="font-bold text-slate-800 text-sm truncate">{formData.title || 'Título del Mensaje'}</p>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed line-clamp-2">
                  {formData.body || 'Escribe un mensaje atractivo para que tus clientes vuelvan al local.'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 md:p-10 rounded-[3.5rem] shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <History className="text-rosa-500" size={20} />
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Envíos Recientes</h3>
            </div>
            
            <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2 hide-scrollbar">
              {campaigns.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="mx-auto text-slate-100 mb-3" size={40} />
                  <p className="text-slate-400 text-xs font-bold italic">Aún no has enviado campañas.</p>
                </div>
              ) : campaigns.map(camp => (
                <div key={camp.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-rosa-100 transition-colors">
                  <p className="font-black text-slate-800 text-sm tracking-tight mb-1">{camp.title}</p>
                  <p className="text-slate-500 text-[11px] leading-tight mb-3 line-clamp-1 italic">{camp.body}</p>
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      <span>{new Date(camp.sentAt).toLocaleDateString()}</span>
                    </div>
                    <span className="bg-white px-3 py-1 rounded-full border border-slate-100 text-rosa-500">
                      Alcance: {camp.reach}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      ` }} />
    </div>
  );
}
