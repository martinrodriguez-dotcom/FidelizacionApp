import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { Award, Plus, Trash2, ArrowLeft, Gift, Loader2 } from 'lucide-react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
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

// Sanitización del ID de la aplicación para evitar errores de segmentos
const appIdRaw = typeof __app_id !== 'undefined' ? __app_id : "dulce-sal-app";
const appIdSaaS = appIdRaw.replace(/\//g, '_'); 
const DULCE_SAL_ID = "dulce-sal-id";

export default function RewardsPage() {
  const [user, setUser] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: '', conditionType: 'points', conditionValue: 100 });

  // 1. Verificación de sesión
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) window.location.href = '/';
    });
    return () => unsubscribe();
  }, []);

  // 2. Carga de premios en tiempo real
  useEffect(() => {
    if (!user) return;

    const rewardsRef = collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'rewards');
    const unsubscribe = onSnapshot(rewardsRef, (snap) => {
      const list = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(r => r.businessId === DULCE_SAL_ID);
      
      setRewards(list.sort((a,b) => a.conditionValue - b.conditionValue));
      setLoading(false);
    }, (err) => {
      console.error("Error al cargar premios:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddReward = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || formData.conditionValue <= 0) return;
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'rewards'), {
        businessId: DULCE_SAL_ID,
        title: formData.title,
        conditionType: formData.conditionType,
        conditionValue: parseInt(formData.conditionValue),
        createdAt: new Date().toISOString()
      });
      
      setFormData({ title: '', conditionType: 'points', conditionValue: 100 });
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReward = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este premio?")) return;
    
    try {
      await deleteDoc(doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'rewards', id));
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="text-rosa-500 animate-spin mb-4" size={40} />
      <p className="text-rosa-400 font-black uppercase tracking-widest text-[10px]">Cargando Catálogo</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6 md:p-12 selection:bg-rosa-100">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Cabecera */}
        <div className="lg:col-span-3 flex items-center gap-5 mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <button 
            onClick={() => window.location.href = '/admin'} 
            className="p-4 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-rosa-600 hover:bg-rosa-50 transition-all active:scale-95"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Premios y Beneficios</h1>
            <p className="text-slate-500 font-medium italic mt-1">Configura las metas para los clientes de Dulce Sal</p>
          </div>
        </div>

        {/* Panel Formulario - Nueva Recompensa */}
        <div className="lg:col-span-1 animate-in fade-in slide-in-from-left-4 duration-700">
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 sticky top-10">
            <div className="w-16 h-16 bg-rosa-50 rounded-2xl flex items-center justify-center mb-8 rotate-3">
              <Gift className="text-rosa-500" size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-8 tracking-tight">Nuevo Premio</h2>
            
            <form onSubmit={handleAddReward} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">¿Qué vas a regalar?</label>
                <input 
                  type="text" 
                  placeholder="Ej: Café de regalo" 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rosa-500 font-bold transition-all" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  required 
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Tipo de Meta</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rosa-500 font-bold transition-all appearance-none" 
                  value={formData.conditionType} 
                  onChange={e => setFormData({...formData, conditionType: e.target.value})}
                >
                  <option value="points">Puntos Acumulados</option>
                  <option value="visits">Visitas al Local</option>
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Valor Requerido</label>
                <input 
                  type="number" 
                  min="1" 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rosa-500 font-bold transition-all" 
                  value={formData.conditionValue} 
                  onChange={e => setFormData({...formData, conditionValue: e.target.value})} 
                  required 
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full bg-rosa-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-rosa-100 hover:bg-rosa-600 flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95 mt-4"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Plus size={20} /> Guardar Premio</>}
              </button>
            </form>
          </div>
        </div>

        {/* Lista de Premios Actuales */}
        <div className="lg:col-span-2 space-y-5 animate-in fade-in slide-in-from-right-4 duration-700">
          {rewards.length === 0 ? (
            <div className="bg-white rounded-[3rem] p-20 text-center border border-dashed border-slate-200">
              <Award className="mx-auto text-slate-100 mb-6" size={64} />
              <p className="text-slate-400 font-bold italic text-sm">No hay premios configurados todavía.</p>
            </div>
          ) : (
            rewards.map(reward => (
              <div key={reward.id} className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-xl hover:shadow-rosa-100/20 transition-all group">
                <div className="flex items-center gap-6">
                  <div className="bg-rosa-50 w-20 h-20 rounded-[1.75rem] flex items-center justify-center shrink-0 group-hover:bg-rosa-500 transition-colors">
                    <Award className="text-rosa-500 group-hover:text-white transition-colors" size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{reward.title}</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        reward.conditionType === 'visits' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {reward.conditionValue} {reward.conditionType === 'visits' ? 'Visitas' : 'Puntos'}
                      </span>
                      <span className="text-slate-300 text-[10px] font-bold">• Dulce Sal VIP</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteReward(reward.id)} 
                  className="p-4 bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-90"
                  title="Eliminar Premio"
                >
                  <Trash2 size={22} />
                </button>
              </div>
            ))
          )}

          <div className="p-10 bg-rosa-50/30 rounded-[3rem] border border-dashed border-rosa-100 text-center mt-8">
            <p className="text-[10px] font-black text-rosa-300 uppercase tracking-[0.4em]">
              Los cambios se aplican al instante en la tarjeta de los clientes
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
