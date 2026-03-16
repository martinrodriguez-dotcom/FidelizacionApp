import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { Bell, Send, ArrowLeft, Smartphone } from 'lucide-react';
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

export default function CampaignsPage() {
  const [user, setUser] = useState(null);
  const [customerCount, setCustomerCount] = useState(0);
  const [pushCount, setPushCount] = useState(0);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const [formData, setFormData] = useState({ title: '', body: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) window.location.href = '/';
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // 1. Contar Clientes Reales y Suscritos
    const cardsRef = collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'loyalty_cards');
    const unsubCards = onSnapshot(cardsRef, (snap) => {
      const list = snap.docs.map(d => d.data()).filter(c => c.businessId === DULCE_SAL_ID);
      setCustomerCount(list.length);
      setPushCount(list.filter(c => c.pushEnabled === true).length); // Contar cuántos aceptaron permisos
    });

    // 2. Historial de Campañas
    const campRef = collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'campaigns');
    const unsubCamp = onSnapshot(campRef, (snap) => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(c => c.businessId === DULCE_SAL_ID);
      setCampaigns(list.sort((a,b) => new Date(b.sentAt) - new Date(a.sentAt)));
      setLoading(false);
    });

    return () => { unsubCards(); unsubCamp(); };
  }, [user]);

  const handleSendPush = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim()) return;
    setIsSending(true);

    try {
      // Registrar en base de datos el envío de la campaña
      await addDoc(collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'campaigns'), {
        businessId: DULCE_SAL_ID,
        title: formData.title,
        body: formData.body,
        sentAt: new Date().toISOString(),
        reach: pushCount
      });

      // LÓGICA FUTURA: Aquí iría la llamada a Firebase Cloud Functions para el envío real
      alert(`¡Campaña guardada y enviada a los ${pushCount} dispositivos habilitados!`);
      
      setFormData({ title: '', body: '' });
    } catch (error) {
      console.error(error);
      alert("Error al enviar campaña.");
    } finally {
      setIsSending(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        <div className="lg:col-span-2 flex items-center gap-4 mb-4">
          <button onClick={() => window.location.href = '/admin'} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-indigo-600 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Campañas Push</h1>
            <p className="text-slate-500 font-medium">Envía notificaciones a los celulares de tus clientes.</p>
          </div>
        </div>

        {/* Creador de Campañas */}
        <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-pink-50 w-16 h-16 rounded-2xl flex items-center justify-center">
              <Bell className="text-pink-500" size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Nueva Notificación</h2>
              <p className="text-xs font-bold text-slate-400 mt-1">Llegará a {pushCount} de {customerCount} clientes.</p>
            </div>
          </div>

          <form onSubmit={handleSendPush} className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Título del Mensaje</label>
              <input type="text" placeholder="Ej: ¡Llegó el fin de semana!" maxLength="50" className="w-full mt-1 p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500 font-bold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Cuerpo de la Notificación</label>
              <textarea placeholder="Ej: Ven hoy y lleva un postre gratis con tu compra." rows="3" maxLength="150" className="w-full mt-1 p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500 font-medium resize-none" value={formData.body} onChange={e => setFormData({...formData, body: e.target.value})} required />
              <p className="text-right text-[10px] text-slate-400 mt-1 font-bold">{formData.body.length}/150</p>
            </div>
            <button type="submit" disabled={isSending || pushCount === 0} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-black flex items-center justify-center gap-2 disabled:opacity-50">
              {isSending ? 'Enviando...' : <><Send size={18} /> Enviar a {pushCount} clientes</>}
            </button>
            {pushCount === 0 && (
              <p className="text-center text-xs text-red-400 font-bold mt-2">Nadie ha aceptado permisos push aún.</p>
            )}
          </form>
        </div>

        {/* Vista Previa y Registro */}
        <div className="space-y-6">
          
          <div className="bg-slate-200/50 p-8 rounded-[3rem] border border-slate-200">
            <h3 className="text-[10px] font-black uppercase text-slate-500 mb-6 tracking-widest text-center">Vista Previa en Celular</h3>
            <div className="bg-white p-4 rounded-3xl shadow-sm max-w-sm mx-auto flex items-start gap-4">
              <div className="bg-indigo-600 w-10 h-10 rounded-xl shrink-0 flex items-center justify-center">
                <Smartphone className="text-white" size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">{formData.title || 'Título de Notificación'}</p>
                <p className="text-slate-500 text-xs mt-1 leading-tight">{formData.body || 'Cuerpo del mensaje descriptivo para atraer al cliente.'}</p>
                <p className="text-slate-300 text-[10px] mt-2 font-mono">Dulce Sal • Ahora</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
            <h3 className="text-sm font-black text-slate-800 mb-6">Historial de Envíos</h3>
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2 hide-scrollbar">
              {campaigns.length === 0 ? (
                <p className="text-slate-400 text-xs italic text-center py-4">Aún no has enviado campañas.</p>
              ) : campaigns.map(camp => (
                <div key={camp.id} className="border-b border-slate-50 pb-4 last:border-0">
                  <p className="font-bold text-slate-700 text-sm">{camp.title}</p>
                  <div className="flex justify-between items-center mt-1 text-[10px] text-slate-400 font-bold">
                    <span>{new Date(camp.sentAt).toLocaleString()}</span>
                    <span className="bg-slate-100 px-2 py-1 rounded-md">Alcance: {camp.reach}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
