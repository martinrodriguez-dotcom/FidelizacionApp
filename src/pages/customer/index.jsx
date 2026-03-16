import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc,
  setDoc 
} from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously 
} from 'firebase/auth';
import { 
  Store, 
  Award, 
  CheckCircle2, 
  MapPin, 
  Smartphone,
  UserPlus,
  Heart,
  Share2,
  Clock,
  BellRing
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

const appIdSaaS = "dulce-sal-app"; 
const DULCE_SAL_ID = "dulce-sal-id";

const Button = ({ children, onClick, variant = 'primary', fullWidth = false, disabled = false, type = "button", className="" }) => {
  const base = "px-6 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100",
    secondary: "bg-pink-500 text-white hover:bg-pink-600 shadow-xl shadow-pink-100",
    outline: "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}>
      {children}
    </button>
  );
};

export default function CustomerSection() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [business, setBusiness] = useState(null);
  const [card, setCard] = useState(null);
  const [rewards, setRewards] = useState([]);
  
  const [formData, setFormData] = useState({ name: '', phone: '' });

  // ESTADO PARA NOTIFICACIONES Y DISPOSITIVO
  const [pushPermission, setPushPermission] = useState('default');
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) setUser(currentUser);
      else {
        try { await signInAnonymously(auth); } 
        catch (err) { console.error("Error Auth:", err); }
      }
    });

    // Detectar entorno del navegador de forma segura
    if (typeof window !== 'undefined') {
      // 1. Detectar si es iPhone/iPad
      const iosCheck = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      setIsIOS(iosCheck);
      
      // 2. Detectar si está "Instalada" en la pantalla de inicio (PWA)
      const standaloneCheck = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
      setIsStandalone(standaloneCheck);

      // 3. Revisar permisos
      if ('Notification' in window) {
        setPushPermission(Notification.permission);
      }
    }

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const bRef = doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'businesses', DULCE_SAL_ID);
    onSnapshot(bRef, (snap) => {
      if (snap.exists()) setBusiness(snap.data());
    });

    const cardId = `${DULCE_SAL_ID}_${user.uid}`;
    const cardRef = doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'loyalty_cards', cardId);
    
    const unsubscribeCard = onSnapshot(cardRef, (snap) => {
      if (snap.exists()) setCard(snap.data());
      setLoading(false);
    }, (err) => {
      console.error("Error Firestore (Card):", err);
      setLoading(false);
    });

    const rRef = collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'rewards');
    const q = query(rRef, where('businessId', '==', DULCE_SAL_ID));
    onSnapshot(q, (snap) => {
      setRewards(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsubscribeCard();
  }, [user]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    
    setIsRegistering(true);
    try {
      const cardId = `${DULCE_SAL_ID}_${user.uid}`;
      const cardRef = doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'loyalty_cards', cardId);

      await setDoc(cardRef, {
        businessId: DULCE_SAL_ID,
        businessName: business?.name || 'Dulce Sal',
        customerId: user.uid,
        customerName: formData.name,
        customerPhone: formData.phone,
        points: 0,
        visits: 0,
        createdAt: new Date().toISOString(),
        lastVisit: null,
        pushEnabled: false
      });
    } catch (err) {
      console.error("Error Registro:", err);
    } finally {
      setIsRegistering(false);
    }
  };

  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      alert("Tu dispositivo actual no soporta notificaciones web.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission === 'granted' && card) {
        const cardId = `${DULCE_SAL_ID}_${user.uid}`;
        const cardRef = doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'loyalty_cards', cardId);
        await updateDoc(cardRef, { pushEnabled: true });

        new Notification("¡Suscripción exitosa!", {
          body: "Te avisaremos de tus próximos premios en Dulce Sal.",
        });
      }
    } catch (error) {
      console.error("Error pidiendo permisos:", error);
    }
  };

  const qrUrl = (uid) => `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(uid)}&margin=10&color=0f172a`;

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Cargando Dulce Sal...</p>
    </div>
  );

  if (!card) {
    return (
      <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md text-center animate-in fade-in zoom-in duration-500">
          <div className="bg-pink-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
            <Heart className="text-pink-500" size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">¡Hola!</h1>
          <p className="text-slate-400 font-medium mb-8 leading-relaxed">
            Regístrate en <span className="text-indigo-600 font-bold">{business?.name || 'Dulce Sal'}</span> para empezar a ganar premios.
          </p>
          
          <form onSubmit={handleRegister} className="space-y-5 text-left">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Nombre Completo</label>
              <input 
                type="text" placeholder="Ej: Maria García" required
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 transition-all"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">WhatsApp</label>
              <input 
                type="tel" placeholder="Ej: 11 1234 5678" required
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 transition-all"
                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <Button type="submit" fullWidth disabled={isRegistering} variant="primary">
              {isRegistering ? 'Procesando...' : <><UserPlus size={20} className="mr-1" /> Crear Mi Tarjeta VIP</>}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-8 pb-32 px-4 font-sans selection:bg-indigo-100">
      <div className="w-full max-w-md">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-100">
              <Store className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{business?.name}</h2>
              <div className="flex items-center text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <MapPin size={10} className="mr-1" /> {business?.address}
              </div>
            </div>
          </div>
          <button onClick={() => window.location.href = '/'} className="bg-white p-3 rounded-2xl border border-slate-200 text-slate-400 hover:text-indigo-600 transition-colors shadow-sm">
            <Share2 size={20} />
          </button>
        </div>

        {/* Tarjeta VIP */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl text-white relative overflow-hidden mb-8">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="flex justify-between items-start mb-10 relative z-10">
            <div className="flex-1 pr-4">
              <div className="bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full inline-block">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400">Cliente VIP</span>
              </div>
              <h3 className="text-2xl font-black mt-6 leading-tight tracking-tight uppercase truncate">{card.customerName}</h3>
              <p className="text-slate-500 text-[9px] font-mono mt-2 opacity-50 tracking-[0.3em]">REF: {user.uid.substring(0,10)}</p>
            </div>
            <div className="bg-white p-2.5 rounded-[1.5rem] shadow-2xl shrink-0 transition-transform hover:scale-105">
              <img src={qrUrl(user.uid)} alt="QR del Cliente" className="w-24 h-24 rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-8 relative z-10">
            <div className="text-center border-r border-white/5">
              <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-1">
                <Award size={12} />
                <p className="text-[9px] font-black uppercase tracking-widest">Puntos</p>
              </div>
              <p className="text-5xl font-black text-amber-400 tabular-nums tracking-tighter">{card.points}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-1">
                <Clock size={12} />
                <p className="text-[9px] font-black uppercase tracking-widest">Visitas</p>
              </div>
              <p className="text-5xl font-black text-emerald-400 tabular-nums tracking-tighter">{card.visits}</p>
            </div>
          </div>
        </div>

        {/* --- LÓGICA INTELIGENTE DE PERMISOS PUSH (iPHONE VS ANDROID/PC) --- */}
        {pushPermission === 'default' && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-[2rem] p-6 mb-8 flex flex-col items-center text-center animate-in slide-in-from-bottom-4 shadow-sm">
            <div className="bg-white p-3 rounded-full text-indigo-600 mb-3 shadow-sm">
              <BellRing size={24} />
            </div>
            <h3 className="font-black text-indigo-900 mb-2">¡No te pierdas tus premios!</h3>
            
            {typeof window !== 'undefined' && !('Notification' in window) ? (
              isIOS && !isStandalone ? (
                /* INSTRUCCIONES PARA iPHONE */
                <div className="text-xs text-indigo-700/80 font-medium leading-relaxed px-2 pb-2">
                  <p className="mb-3">Para recibir notificaciones de premios, Apple requiere que instales esta app.</p>
                  <p className="bg-white/60 p-4 rounded-2xl border border-indigo-200/50 shadow-sm">
                    Toca el ícono <strong>Compartir</strong> en la barra inferior y luego <strong>"Agregar a inicio"</strong>. Luego ábrela desde tu pantalla principal.
                  </p>
                </div>
              ) : (
                /* FALLBACK NAVEGADOR SIN SOPORTE (Safari Mac Viejo, etc) */
                <p className="text-xs text-indigo-700/80 font-medium mb-4 leading-relaxed px-4">
                  Tu navegador actual no admite notificaciones web. Te recomendamos instalar la app o usar Chrome.
                </p>
              )
            ) : (
              /* BOTÓN NORMAL PARA ANDROID / CHROME / PWA iPHONE */
              <>
                <p className="text-xs text-indigo-700/80 font-medium mb-4 leading-relaxed px-4">
                  Activa las notificaciones para que te avisemos cuando tengas promociones exclusivas.
                </p>
                <Button onClick={requestPushPermission} variant="primary" fullWidth className="py-3 shadow-indigo-200">
                  Permitir Notificaciones
                </Button>
              </>
            )}
          </div>
        )}

        {/* Recompensas */}
        <div className="px-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center">
                <Award className="text-indigo-600" size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-800">Tus Premios</h3>
            </div>
          </div>
          
          <div className="space-y-4">
            {rewards.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-12 border border-dashed border-slate-200 text-center">
                <Smartphone size={32} className="text-slate-200 mx-auto mb-3" />
                <p className="italic text-slate-400 text-sm">Próximamente premios exclusivos.</p>
              </div>
            ) : (
              rewards.map(r => {
                const current = r.conditionType === 'visits' ? card.visits : card.points;
                const isUnlocked = current >= r.conditionValue;
                const pct = Math.min((current / r.conditionValue) * 100, 100);

                return (
                  <div key={r.id} className={`p-6 rounded-[2.25rem] border transition-all duration-500 ${
                    isUnlocked ? 'bg-emerald-50 border-emerald-200 shadow-xl' : 'bg-white border-slate-100'
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className={`text-base font-black ${isUnlocked ? 'text-emerald-900' : 'text-slate-800'}`}>{r.title}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">
                          {r.conditionValue} {r.conditionType === 'visits' ? 'Visitas' : 'Puntos'} requeridos
                        </p>
                      </div>
                      {isUnlocked ? (
                        <div className="bg-emerald-500 text-white px-4 py-2 rounded-2xl flex items-center gap-1.5 animate-pulse">
                          <CheckCircle2 size={14} /> <span className="text-[10px] font-black uppercase">¡Canjear!</span>
                        </div>
                      ) : (
                        <span className="text-slate-800 text-xs font-black bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/50">
                          {current} / {r.conditionValue}
                        </span>
                      )}
                    </div>
                    {!isUnlocked && (
                      <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div className="absolute top-0 left-0 h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-16 text-center opacity-30">
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-400">Dulce Sal Loyalty</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      ` }} />
    </div>
  );
}
