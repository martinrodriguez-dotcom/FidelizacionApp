import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously 
} from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  Store, 
  Award, 
  CheckCircle2, 
  MapPin, 
  ArrowLeft 
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE (Inlined para evitar errores de resolución) ---
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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'fidelizapro-saas';

// --- COMPONENTES UI (Inlined) ---
const Button = ({ children, onClick, variant = 'primary', fullWidth = false, disabled = false, type = "button" }) => {
  const base = "px-6 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg active:scale-[0.98]",
    outline: "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50",
    ghost: "text-slate-500 hover:bg-slate-100"
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''}`}>
      {children}
    </button>
  );
};

// --- MOCK DE ROUTER (Para evitar error de next/router en preview) ---
const useRouter = () => {
  return {
    push: (path) => console.log("Navegando a:", path),
    query: {},
    pathname: '/customer'
  };
};

// --- UTILS (Haversine) ---
const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// --- HOOKS (Inlined) ---
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, loading };
};

const useGeolocation = (target, onArrive) => {
  useEffect(() => {
    if (!target || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition((pos) => {
      const dist = getDistanceInMeters(pos.coords.latitude, pos.coords.longitude, target.lat, target.lng);
      if (dist <= target.radius) onArrive(dist);
    });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [target]);
};

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [myCards, setMyCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [businessRewards, setBusinessRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Cargar tarjetas
  useEffect(() => {
    if (!user) return;
    const cardsRef = collection(db, 'artifacts', appId, 'public', 'data', 'loyalty_cards');
    const q = query(cardsRef, where('customerId', '==', user.uid));
    
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyCards(list);
      if (!selectedCardId && list.length > 0) setSelectedCardId(list[0].id);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
  }, [user]);

  // 2. Cargar detalles del negocio seleccionado
  const activeCard = myCards.find(c => c.id === selectedCardId);

  useEffect(() => {
    if (!activeCard) return;
    const fetchDetails = async () => {
      const bRef = doc(db, 'artifacts', appId, 'public', 'data', 'businesses', activeCard.businessId);
      const bSnap = await getDoc(bRef);
      if (bSnap.exists()) setBusinessInfo({ id: bSnap.id, ...bSnap.data() });

      const rRef = collection(db, 'artifacts', appId, 'public', 'data', 'rewards');
      const rQuery = query(rRef, where('businessId', '==', activeCard.businessId));
      onSnapshot(rQuery, (snap) => {
        setBusinessRewards(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    };
    fetchDetails();
  }, [activeCard]);

  // Geonotificación
  useGeolocation(
    businessInfo ? { lat: businessInfo.lat, lng: businessInfo.lng, radius: businessInfo.radius || 200 } : null,
    () => console.log("¡Cerca del negocio!")
  );

  const qrUrl = (uid) => `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(uid)}&margin=10`;

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-indigo-600 font-bold">Cargando billetera digital...</div>;

  if (myCards.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 max-w-sm w-full">
          <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store size={40} className="text-indigo-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Sin tarjetas aún</h2>
          <p className="text-slate-500 mb-8">Explora comercios cercanos para empezar a sumar puntos y ganar premios.</p>
          <Button fullWidth onClick={() => router.push('/directory')}>Explorar Comercios</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-8 pb-24 px-4">
      <div className="w-full max-w-md">
        
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black text-slate-800">Mi Billetera</h1>
          <button onClick={() => router.push('/directory')} className="text-indigo-600 font-bold text-sm bg-indigo-50 px-4 py-2 rounded-full">
            + Añadir
          </button>
        </div>

        {myCards.length > 1 && (
          <div className="mb-8 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {myCards.map(c => (
              <button 
                key={c.id} 
                onClick={() => setSelectedCardId(c.id)}
                className={`px-6 py-3 rounded-2xl whitespace-nowrap font-bold text-sm transition-all ${
                  selectedCardId === c.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'
                }`}
              >
                {c.businessName}
              </button>
            ))}
          </div>
        )}

        {activeCard && (
          <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl text-white relative overflow-hidden mb-10">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="flex-1 pr-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">FidelizaPro Gold</span>
                <h2 className="text-2xl font-black mt-3 leading-tight">{activeCard.businessName}</h2>
                <div className="flex items-center text-slate-400 text-xs mt-2 italic">
                  <MapPin size={12} className="mr-1" /> {businessInfo?.address || 'Cargando...'}
                </div>
              </div>
              <div className="bg-white p-2 rounded-3xl shadow-xl shrink-0">
                <img src={qrUrl(user.uid)} alt="QR" className="w-20 h-20 rounded-2xl" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 border-t border-white/5 pt-8 relative z-10">
              <div className="text-center border-r border-white/5">
                <p className="text-slate-400 text-[10px] font-bold uppercase mb-1 tracking-tighter">Puntos Acumulados</p>
                <p className="text-4xl font-black text-amber-400">{activeCard.points}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-[10px] font-bold uppercase mb-1 tracking-tighter">Visitas Realizadas</p>
                <p className="text-4xl font-black text-emerald-400">{activeCard.visits}</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-6">
            <Award className="text-indigo-600" size={24} />
            <h3 className="text-xl font-black text-slate-800">Premios Disponibles</h3>
          </div>
          
          <div className="space-y-4">
            {businessRewards.length === 0 ? (
              <p className="text-slate-400 text-center py-10 italic">No hay recompensas configuradas aún.</p>
            ) : businessRewards.map(r => {
              const current = r.conditionType === 'visits' ? activeCard.visits : activeCard.points;
              const isUnlocked = current >= r.conditionValue;
              const pct = Math.min((current / r.conditionValue) * 100, 100);

              return (
                <div key={r.id} className={`p-6 rounded-3xl border transition-all ${isUnlocked ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 shadow-sm'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className={`text-lg font-black ${isUnlocked ? 'text-emerald-900' : 'text-slate-800'}`}>{r.title}</h4>
                    {isUnlocked ? (
                      <div className="bg-emerald-500 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <CheckCircle2 size={14} /> <span className="text-[10px] font-bold">DESBLOQUEADO</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[10px] font-black tracking-widest bg-slate-50 px-3 py-1 rounded-full">
                        {current} / {r.conditionValue}
                      </span>
                    )}
                  </div>
                  
                  {!isUnlocked && (
                    <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="absolute top-0 left-0 h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                    </div>
                  )}
                  
                  {isUnlocked && <p className="text-sm text-emerald-700 font-bold mt-2">¡Muestra este panel para canjear!</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
