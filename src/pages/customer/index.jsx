import React, { useState, useEffect } from 'react';
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
  Smartphone,
  Share2,
  Clock,
  Info,
  ArrowRight
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE ---
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

// --- COMPONENTES DE UI INTEGRADOS ---

const Button = ({ children, onClick, variant = 'primary', fullWidth = false, disabled = false, className = "" }) => {
  const baseStyles = "px-6 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200",
    outline: "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 shadow-sm",
    ghost: "text-slate-500 hover:bg-slate-100"
  };
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

// --- HOOKS INTEGRADOS ---

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, loading };
};

// Mock de Router para el entorno de previsualización
const useRouter = () => ({
  push: (path) => console.log("Navegando a:", path),
  query: {},
  pathname: "/customer"
});

// --- COMPONENTE PRINCIPAL ---

export default function App() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  
  const [myCards, setMyCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [businessRewards, setBusinessRewards] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  // 1. Persistencia: Login anónimo automático
  useEffect(() => {
    const initSession = async () => {
      if (!authLoading && !authUser) {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Error en auto-login:", error);
        }
      }
    };
    initSession();
  }, [authUser, authLoading]);

  // 2. Cargar tarjetas del cliente
  useEffect(() => {
    if (!authUser) return;

    const cardsRef = collection(db, 'artifacts', appId, 'public', 'data', 'loyalty_cards');
    const q = query(cardsRef, where('customerId', '==', authUser.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyCards(list);
      
      if (!selectedCardId && list.length > 0) {
        setSelectedCardId(list[0].id);
      }
      setLoadingData(false);
    }, (err) => {
      console.error("Error cargando tarjetas:", err);
      setLoadingData(false);
    });

    return () => unsubscribe();
  }, [authUser, selectedCardId]);

  // 3. Cargar detalles del negocio y sus recompensas
  const activeCard = myCards.find(c => c.id === selectedCardId);

  useEffect(() => {
    if (!activeCard) return;

    const fetchDetails = async () => {
      try {
        const bRef = doc(db, 'artifacts', appId, 'public', 'data', 'businesses', activeCard.businessId);
        const bSnap = await getDoc(bRef);
        if (bSnap.exists()) setBusinessInfo({ id: bSnap.id, ...bSnap.data() });

        const rRef = collection(db, 'artifacts', appId, 'public', 'data', 'rewards');
        const rQuery = query(rRef, where('businessId', '==', activeCard.businessId));
        
        onSnapshot(rQuery, (snap) => {
          const rewardsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setBusinessRewards(rewardsList.sort((a,b) => a.conditionValue - b.conditionValue));
        });
      } catch (error) {
        console.error("Error cargando detalles:", error);
      }
    };

    fetchDetails();
  }, [activeCard]);

  const copyMagicLink = () => {
    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/customer?id=${authUser?.uid}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const generateQRUrl = (uid) => 
    `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(uid || 'loading')}&margin=10&color=0f172a`;

  if (authLoading || (loadingData && myCards.length === 0)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold">Abriendo tu billetera digital...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32 px-4 pt-6 font-sans">
      <div className="max-w-md mx-auto">
        
        {/* Banner UX de Acceso Rápido */}
        <div className="bg-indigo-600 rounded-[2rem] p-5 mb-8 text-white flex items-center justify-between shadow-xl shadow-indigo-100 relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-white/20 p-3 rounded-2xl">
              <Smartphone size={24} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Acceso Rápido</p>
              <p className="text-sm font-extrabold">Fija FidelizaPro en tu Inicio</p>
            </div>
          </div>
          <button 
            onClick={copyMagicLink}
            className="bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-xs font-black shadow-lg relative z-10"
          >
            {copySuccess ? <CheckCircle2 size={16} /> : <Share2 size={16} />}
            {copySuccess ? 'Copiado' : 'Link Directo'}
          </button>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
        </div>

        <div className="flex items-center justify-between mb-8 px-2">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Mi Billetera</h1>
            <p className="text-slate-400 text-xs font-medium italic">Tus puntos en un solo lugar</p>
          </div>
          <button 
            onClick={() => router.push('/directory')}
            className="bg-white border border-slate-200 p-3 rounded-2xl hover:bg-indigo-50 transition-all shadow-sm"
          >
            <Store size={22} className="text-slate-400" />
          </button>
        </div>

        {/* Selector de Tarjetas */}
        {myCards.length > 1 && (
          <div className="mb-8 flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
            {myCards.map(c => (
              <button 
                key={c.id} 
                onClick={() => setSelectedCardId(c.id)}
                className={`px-6 py-3.5 rounded-[1.25rem] whitespace-nowrap font-black text-xs transition-all border ${
                  selectedCardId === c.id 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xl' 
                    : 'bg-white text-slate-400 border-slate-200'
                }`}
              >
                {c.businessName}
              </button>
            ))}
          </div>
        )}

        {activeCard ? (
          <div className="space-y-8 animate-in fade-in duration-700">
            
            {/* Tarjeta Digital Premium */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl text-white relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/30 rounded-full blur-[80px] pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-10 relative z-10">
                <div className="flex-1 pr-4">
                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                    Socio VIP
                  </span>
                  <h2 className="text-3xl font-black mt-4 leading-tight tracking-tight">{activeCard.businessName}</h2>
                  <div className="flex items-center text-slate-400 text-xs mt-2 italic">
                    <MapPin size={12} className="mr-1 text-indigo-500" /> 
                    <span className="truncate">{businessInfo?.address || 'Ubicación...'}</span>
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-[1.5rem] shadow-2xl shrink-0">
                  <img src={generateQRUrl(authUser?.uid)} alt="QR" className="w-24 h-24 rounded-[1rem]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-8 relative z-10">
                <div className="text-center border-r border-white/5">
                  <p className="text-slate-500 text-[10px] font-bold uppercase mb-1 tracking-widest">Puntos</p>
                  <p className="text-5xl font-black text-amber-400 tabular-nums">{activeCard.points}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500 text-[10px] font-bold uppercase mb-1 tracking-widest">Visitas</p>
                  <p className="text-5xl font-black text-emerald-400 tabular-nums">{activeCard.visits}</p>
                </div>
              </div>
              
              <div className="mt-10 text-center pt-5 border-t border-white/5">
                <p className="text-[9px] font-mono text-white/20 tracking-[0.4em] uppercase">Escanea este código al pagar</p>
              </div>
            </div>

            {/* Recompensas */}
            <div className="w-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center">
                  <Award className="text-indigo-600" size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-800">Tus Premios</h3>
              </div>
              
              <div className="space-y-4">
                {businessRewards.length === 0 ? (
                  <div className="bg-white rounded-[2rem] p-12 border border-dashed border-slate-200 text-center">
                    <Info size={32} className="text-slate-200 mx-auto mb-3" />
                    <p className="italic text-slate-400 text-sm">No hay premios configurados aún.</p>
                  </div>
                ) : (
                  businessRewards.map((reward) => {
                    const current = reward.conditionType === 'visits' ? activeCard.visits : activeCard.points;
                    const isUnlocked = current >= reward.conditionValue;
                    const pct = Math.min((current / reward.conditionValue) * 100, 100);

                    return (
                      <div key={reward.id} className={`p-6 rounded-[2.25rem] border transition-all duration-500 ${
                        isUnlocked 
                        ? 'bg-emerald-50 border-emerald-200 shadow-xl shadow-emerald-200/20 scale-[1.02]' 
                        : 'bg-white border-slate-100 shadow-sm'
                      }`}>
                        <div className="flex justify-between items-center mb-4">
                          <h4 className={`text-base font-black ${isUnlocked ? 'text-emerald-900' : 'text-slate-800'}`}>
                            {reward.title}
                          </h4>
                          {isUnlocked ? (
                            <div className="bg-emerald-500 text-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg">
                              <CheckCircle2 size={16} /> 
                              <span className="text-xs font-black">CANJEAR</span>
                            </div>
                          ) : (
                            <span className="text-slate-800 text-sm font-black tabular-nums">
                              {current} / {reward.conditionValue}
                            </span>
                          )}
                        </div>
                        
                        {!isUnlocked && (
                          <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="absolute top-0 left-0 h-full bg-indigo-500 transition-all duration-1000" 
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        )}
                        
                        {isUnlocked && <p className="text-[11px] text-emerald-700 font-bold mt-1 uppercase">¡Listo para usar en el mostrador!</p>}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-12 border border-slate-100 text-center shadow-xl mt-10">
            <div className="bg-indigo-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
              <Smartphone size={48} className="text-indigo-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Billetera Vacía</h2>
            <p className="text-slate-400 text-sm mb-10 px-4 leading-relaxed font-medium">
              Aún no tienes tarjetas. Busca un local cercano para empezar a sumar puntos y ganar premios.
            </p>
            <Button 
              fullWidth 
              onClick={() => router.push('/directory')}
              className="!rounded-2xl shadow-indigo-100"
            >
              Buscar Comercios
            </Button>
          </div>
        )}

        <div className="mt-16 text-center space-y-2 opacity-30">
          <p className="text-[9px] font-mono text-slate-300">
            ID: {authUser?.uid}
          </p>
        </div>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
