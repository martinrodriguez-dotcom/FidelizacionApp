import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { Award, Plus, Trash2, ArrowLeft, Gift } from 'lucide-react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// --- CONFIGURACIÓN FIREBASE ---
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

const appIdSaaS = "dulce-sal-app"; 
const DULCE_SAL_ID = "dulce-sal-id";

export default function RewardsPage() {
  const [user, setUser] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: '', conditionType: 'points', conditionValue: 100 });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) window.location.href = '/';
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const rewardsRef = collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'rewards');
    const unsubscribe = onSnapshot(rewardsRef, (snap) => {
      const list = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(r => r.businessId === DULCE_SAL_ID);
      
      // Ordenar por el valor requerido para que las metas más bajas salgan primero
      setRewards(list.sort((a,b) => a.conditionValue - b.conditionValue));
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
      console.error("Error al guardar recompensa:", error);
      alert("Error al guardar recompensa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReward = async (id) => {
    if (!window.confirm("¿Eliminar este premio definitivamente?")) return;
    
    try {
      await deleteDoc(doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'rewards', id));
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("Hubo un error al eliminar el premio.");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Cabecera */}
        <div className="lg:col-span-3 flex items-center gap-4 mb-4">
          <button onClick={() => window.location.href = '/admin'} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-indigo-600 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Catálogo de Premios</h1>
            <p className="text-slate-500 font-medium">Define las metas que motivarán a tus clientes a volver a Dulce Sal.</p>
          </div>
        </div>

        {/* Panel Formulario */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 sticky top-10">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
              <Gift className="text-amber-500" size={32} />
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-6">Nuevo Premio</h2>
            
            <form onSubmit={handleAddReward} className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Premio a entregar</label>
                <input 
                  type="text" 
                  placeholder="Ej: Docena de Facturas Gratis" 
                  className="w-full mt-1 p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  required 
                />
              </div>
              
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Tipo de Meta</label>
                <select 
                  className="w-full mt-1 p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" 
                  value={formData.conditionType} 
                  onChange={e => setFormData({...formData, conditionType: e.target.value})}
                >
                  <option value="points">Puntos Acumulados</option>
                  <option value="visits">Cantidad de Visitas</option>
                </select>
              </div>
              
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Meta Requerida</label>
                <input 
                  type="number" 
                  min="1" 
                  className="w-full mt-1 p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" 
                  value={formData.conditionValue} 
                  onChange={e => setFormData({...formData, conditionValue: e.target.value})} 
                  required 
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
              >
                {isSubmitting ? 'Guardando...' : <><Plus size={20} /> Añadir al Catálogo</>}
              </button>
            </form>
          </div>
        </div>

        {/* Lista de Premios */}
        <div className="lg:col-span-2 space-y-4">
          {rewards.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-16 text-center border border-dashed border-slate-200">
              <Award className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-400 font-medium italic">Aún no has configurado ningún premio para tus clientes.</p>
            </div>
          ) : (
            rewards.map(reward => (
              <div key={reward.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-5">
                  <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center shrink-0">
                    <Award className="text-indigo-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">{reward.title}</h3>
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-1">
                      Requiere: <span className={reward.conditionType === 'visits' ? 'text-emerald-500' : 'text-amber-500'}>{reward.conditionValue} {reward.conditionType === 'visits' ? 'Visitas' : 'Puntos'}</span>
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteReward(reward.id)} 
                  className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                  title="Eliminar Premio"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
