import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, collection, setDoc, updateDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getMessaging, getToken } from 'firebase/messaging';
import { Store, ArrowLeft, Heart, Award, Bell, BellRing, Sparkles, Megaphone } from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
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

// --- TU LLAVE DE SEGURIDAD PUSH ---
const VAPID_KEY = "BP0oUuWAELndsKXM8iG5j6NskfYtRC4brM81Kd-yXs33Oh6KQ0RO_1z5GPXYxk-a0ezpjXKSAGUQRqvFtERxcaA";

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
          theme: { extend: { colors: {
            rosa: { 50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4', 400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d', 800: '#9d174d', 900: '#831843' }
          }}}}
        };
      };
    }
  }, []);
  return null;
};

export default function CustomerView() {
  const [user, setUser] = useState(null);
  const [card, setCard] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [regData, setRegData] = useState({ name: '', phone: '' });
  const [notifPermission, setNotifPermission] = useState('default');

  useEffect(() => {
    if ("Notification" in window) setNotifPermission(Notification.permission);
  }, []);

  useEffect(() => {
    const initAuth = async () => { if (!auth.currentUser) await signInAnonymously(auth); };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const cardId = `${DULCE_SAL_ID}_${user.uid}`;
    
    const unsubCard = onSnapshot(doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'loyalty_cards', cardId), (snap) => {
      if (snap.exists()) setCard(snap.data());
    });
    
    const unsubRewards = onSnapshot(collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'rewards'), (snap) => {
      setRewards(snap.docs.map(d => ({id: d.id, ...d.data()})).filter(r => r.businessId === DULCE_SAL_ID));
    });

    const unsubCampaigns = onSnapshot(collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'campaigns'), (snap) => {
      const list = snap.docs
        .map(d => ({id: d.id, ...d.data()}))
        .filter(c => c.businessId === DULCE_SAL_ID)
        .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
      setCampaigns(list);
    });

    return () => { unsubCard(); unsubRewards(); unsubCampaigns(); };
  }, [user]);

  const handleRegister = async (e) => {
    e.preventDefault();
    const cardId = `${DULCE_SAL_ID}_${user.uid}`;
    await setDoc(doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'loyalty_cards', cardId), {
      businessId: DULCE_SAL_ID, customerName: regData.name, customerPhone: regData.phone,
      customerId: user.uid, points: 0, visits: 0, createdAt: new Date().toISOString()
    });
  };

  // LÓGICA DE REGISTRO PUSH
  const requestNotifications = async () => {
    if (!("Notification" in window)) {
      alert("Tu navegador no soporta notificaciones push.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      
      if (permission === "granted") {
        const messaging = getMessaging(app);
        // Obtenemos el token usando tu VAPID Key
        const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
        
        if (currentToken) {
          // Si el cliente ya está registrado, guardamos su token en Firestore
          if (card && user) {
            const cardId = `${DULCE_SAL_ID}_${user.uid}`;
            await updateDoc(doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'loyalty_cards', cardId), {
              fcmToken: currentToken
            });
          }
          alert("¡Súper! Ya estás suscrito a las notificaciones de Dulce Sal.");
        }
      }
    } catch (error) {
      console.error("Error al configurar notificaciones", error);
      alert("Hubo un problema al activar las notificaciones. Asegúrate de dar los permisos en tu navegador.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 font-sans selection:bg-rosa-100 selection:text-rosa-900 pb-20">
      <TailwindStyleInjector />

      <header className="w-full max-w-md flex items-center justify-between mb-8">
        <button onClick={() => window.location.href = '/'} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-rosa-500 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="bg-rosa-500 p-2 rounded-xl text-white shadow-md shadow-rosa-200">
            <Store size={18} />
          </div>
          <span className="font-black text-slate-900 tracking-tighter text-xl italic">Dulce Sal</span>
        </div>
        
        <button 
          onClick={requestNotifications}
          className={`p-3 rounded-2xl shadow-sm transition-all ${
            notifPermission === 'granted' 
              ? 'bg-emerald-50 text-emerald-500' 
              : 'bg-white text-slate-400 hover:text-rosa-500 hover:bg-rosa-50'
          }`}
          title={notifPermission === 'granted' ? 'Notificaciones Activas' : 'Activar Notificaciones'}
        >
          {notifPermission === 'granted' ? <BellRing size={20} /> : <Bell size={20} />}
        </button>
      </header>

      {!card ? (
        <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 w-full max-w-md text-center animate-in fade-in zoom-in duration-500">
          <div className="bg-rosa-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <Heart className="text-rosa-500" size={40} />
          </div>
          <h2 className="text-3xl font-black mb-2 text-slate-900 tracking-tight">¡Hola!</h2>
          <p className="text-slate-400 mb-8 font-medium italic">Regístrate en Dulce Sal para ganar premios y enterarte de promos.</p>
          
          <form onSubmit={handleRegister} className="space-y-4 text-left">
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 mb-1 block">Tu Nombre</label>
              <input required value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rosa-500 font-bold text-slate-700 transition-all" placeholder="Ej: Laura Gómez" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 mb-1 block">Tu WhatsApp</label>
              <input required value={regData.phone} onChange={e => setRegData({...regData, phone: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rosa-500 font-bold text-slate-700 transition-all" placeholder="Ej: 3446 123456" />
            </div>
            <button type="submit" className="w-full mt-4 bg-rosa-500 text-white font-black px-6 py-4 rounded-2xl hover:bg-rosa-600 transition-all active:scale-95 text-sm uppercase tracking-widest shadow-xl shadow-rosa-200">
              Crear Mi Tarjeta VIP
            </button>
          </form>
        </div>
      ) : (
        <div className="w-full max-w-md space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* TARJETA VIP */}
          <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/30">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-rosa-500/30 rounded-full blur-3xl"></div>
            
            <div className="flex justify-between items-start relative z-10 mb-8">
              <div>
                <span className="text-[10px] font-black uppercase text-rosa-300 tracking-widest bg-rosa-500/20 px-3 py-1.5 rounded-full border border-rosa-500/30 backdrop-blur-sm">
                  Socio VIP
                </span>
                <h3 className="text-2xl font-black mt-4 tracking-tight uppercase truncate max-w-[200px]">{card.customerName}</h3>
              </div>
              <div className="bg-white p-2 rounded-[1.5rem] shadow-xl shrink-0">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${user?.uid}&color=ec4899`} className="w-20 h-20 rounded-xl" alt="Tu QR VIP" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-6 text-center relative z-10">
              <div>
                <p className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-1">Tus Puntos</p>
                <p className="text-4xl font-black text-rosa-400 tracking-tighter">{card.points}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-1">Tus Visitas</p>
                <p className="text-4xl font-black text-emerald-400 tracking-tighter">{card.visits}</p>
              </div>
            </div>
          </div>

          {/* SECCIÓN DE PROMOS */}
          <div className="space-y-4">
            <h4 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Megaphone className="text-rosa-500" size={24} /> Promos y Novedades
            </h4>
            
            {campaigns.length === 0 ? (
              <p className="text-slate-400 italic text-sm text-center py-8 bg-white rounded-3xl border border-dashed border-slate-200">
                Aún no hay promociones activas. ¡Te avisaremos pronto!
              </p>
            ) : (
              <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar -mx-6 px-6 snap-x">
                {campaigns.map(c => (
                  <div key={c.id} className="min-w-[260px] max-w-[260px] bg-gradient-to-br from-rosa-500 to-rosa-600 p-6 rounded-[2rem] shadow-lg shadow-rosa-200 text-white snap-center shrink-0">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={16} className="text-rosa-200" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-rosa-200">Nueva Promo</span>
                    </div>
                    <h5 className="font-black text-lg mb-2 leading-tight tracking-tight">{c.title}</h5>
                    <p className="text-sm text-rosa-50 font-medium leading-relaxed">{c.body}</p>
                  </div>
                ))}
              </div>
            )}
            
            {notifPermission !== 'granted' && (
              <button onClick={requestNotifications} className="w-full mt-2 bg-rosa-50 border border-rosa-100 text-rosa-600 px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rosa-100 transition-colors">
                <BellRing size={16} /> Activar alertas
              </button>
            )}
          </div>

          {/* SECCIÓN DE PREMIOS */}
          <div className="space-y-4">
            <h4 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Award className="text-rosa-500" size={24} /> Tus Premios
            </h4>
            
            {rewards.length === 0 ? (
              <p className="text-slate-400 italic text-sm text-center py-10 bg-white rounded-3xl border border-dashed border-slate-200">
                Próximamente premios exclusivos...
              </p>
            ) : (
              rewards.map(r => {
                const current = r.conditionType === 'visits' ? card.visits : card.points;
                const unlocked = current >= r.conditionValue;
                const pct = Math.min((current / r.conditionValue) * 100, 100);
                
                return (
                  <div key={r.id} className={`p-6 rounded-[2rem] border transition-all ${unlocked ? 'bg-emerald-50 border-emerald-200 shadow-md shadow-emerald-100/50' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className={`font-black text-lg tracking-tight mb-1 ${unlocked ? 'text-emerald-900' : 'text-slate-900'}`}>{r.title}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em]">
                          Meta: {r.conditionValue} {r.conditionType === 'visits' ? 'Visitas' : 'Puntos'}
                        </p>
                      </div>
                      {unlocked && (
                        <span className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md">
                          ¡Canjear!
                        </span>
                      )}
                    </div>
                    {!unlocked && (
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-rosa-500 transition-all duration-1000 ease-out" style={{width: `${pct}%`}}></div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}
    </div>
  );
}
