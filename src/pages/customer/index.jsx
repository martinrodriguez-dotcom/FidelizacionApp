import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Store, Award, CheckCircle2, MapPin } from 'lucide-react';
import { db } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';
import { useGeolocation } from '../../hooks/useGeolocation';
import Button from '../../components/ui/Button';

// ID del artefacto para cumplir con las reglas de seguridad del SaaS
const appId = typeof __app_id !== 'undefined' ? __app_id : 'fidelizapro-saas';

/**
 * Dashboard del Cliente / Tarjeta Digital (Ruta: /customer)
 * Muestra el QR del cliente, sus puntos acumulados y las recompensas disponibles.
 */
export default function CustomerDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [myCards, setMyCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [businessRewards, setBusinessRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Proteger ruta: si no hay usuario, enviar al directorio
  useEffect(() => {
    if (!authLoading && !user) router.push('/directory');
  }, [user, authLoading, router]);

  // 2. Cargar todas las tarjetas de fidelidad del usuario (Ruta corregida)
  useEffect(() => {
    if (!user) return;

    const cardsRef = collection(db, 'artifacts', appId, 'public', 'data', 'loyalty_cards');
    const cardsQuery = query(cardsRef, where('customerId', '==', user.uid));

    const unsubscribe = onSnapshot(cardsQuery, (snapshot) => {
      const cardsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyCards(cardsList);
      
      if (!selectedCardId && cardsList.length > 0) {
        setSelectedCardId(cardsList[0].id);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error en onSnapshot de tarjetas:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, selectedCardId]);

  // 3. Cargar datos del negocio activo y sus recompensas (Rutas corregidas)
  const activeCard = myCards.find(c => c.id === selectedCardId);

  useEffect(() => {
    if (!activeCard) return;

    const fetchBusinessAndRewards = async () => {
      try {
        // Datos del negocio específico
        const bRef = doc(db, 'artifacts', appId, 'public', 'data', 'businesses', activeCard.businessId);
        const bSnap = await getDoc(bRef);
        if (bSnap.exists()) {
          setBusinessInfo({ id: bSnap.id, ...bSnap.data() });
        }

        // Recompensas del negocio específico
        const rRef = collection(db, 'artifacts', appId, 'public', 'data', 'rewards');
        const rQuery = query(rRef, where('businessId', '==', activeCard.businessId));
        
        onSnapshot(rQuery, (rSnap) => {
          setBusinessRewards(rSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

      } catch (error) {
        console.error("Error al cargar datos del negocio activo:", error);
      }
    };

    fetchBusinessAndRewards();
  }, [activeCard]);

  // 4. Integración de Geolocalización para alertas de proximidad
  const targetLocation = businessInfo ? { 
    lat: businessInfo.lat, 
    lng: businessInfo.lng, 
    radius: businessInfo.radius || 200 
  } : null;

  useGeolocation(targetLocation, (distance) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`¡Estás cerca de ${businessInfo.name}!`, {
        body: `Tienes ${activeCard?.points || 0} puntos. ¡Entra y canjea tus premios!`,
        icon: '/icons/icon-192x192.png'
      });
    }
  });

  const generateQRUrl = (data) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data)}&margin=10`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-indigo-600 font-bold">
        Cargando tu billetera digital...
      </div>
    );
  }

  if (myCards.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-sm w-full">
          <Store size={64} className="text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Aún no tienes tarjetas</h2>
          <p className="text-slate-500 mb-8">Explora comercios y únete a sus programas para empezar a sumar puntos.</p>
          <Button fullWidth onClick={() => router.push('/directory')}>
            Explorar Negocios
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center pt-8 pb-24 px-4 font-sans">
      <div className="w-full max-w-md">
        
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold text-slate-800">Mi Billetera</h1>
          <button onClick={() => router.push('/directory')} className="text-indigo-600 font-bold text-sm hover:underline">
            + Añadir
          </button>
        </div>

        {myCards.length > 1 && (
          <div className="mb-6 overflow-x-auto flex gap-2 pb-2 hide-scrollbar">
            {myCards.map(c => (
              <button 
                key={c.id} 
                onClick={() => setSelectedCardId(c.id)}
                className={`px-5 py-2.5 rounded-full whitespace-nowrap font-bold text-sm transition-all shadow-sm ${
                  selectedCardId === c.id 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {c.businessName}
              </button>
            ))}
          </div>
        )}

        {activeCard && (
          <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[2rem] p-8 shadow-2xl text-white relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="pr-4">
                <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1.5 opacity-80">Tarjeta Digital</p>
                <h2 className="text-2xl font-extrabold leading-tight">{activeCard.businessName}</h2>
                <p className="text-slate-300 text-sm mt-1 flex items-center gap-1">
                  <MapPin size={12} /> {businessInfo?.address || 'Cargando ubicación...'}
                </p>
              </div>
              <div className="bg-white p-1.5 rounded-2xl shrink-0 shadow-lg">
                <img src={generateQRUrl(user.uid)} alt="QR" className="w-20 h-20 md:w-24 md:h-24 rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6 relative z-10">
              <div>
                <p className="text-slate-400 text-xs uppercase font-bold mb-1">Puntos</p>
                <p className="text-4xl font-extrabold text-amber-400">{activeCard.points}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase font-bold mb-1">Visitas</p>
                <p className="text-4xl font-extrabold text-emerald-400">{activeCard.visits}</p>
              </div>
            </div>

            <div className="mt-8 text-center border-t border-white/5 pt-4 relative z-10">
              <p className="text-[10px] text-white/30 font-mono tracking-widest">ID: {user.uid}</p>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Award className="text-indigo-600" size={20} /> Recompensas
          </h3>
          <div className="space-y-3">
            {businessRewards.map(r => {
              const currentValue = r.conditionType === 'visits' ? activeCard.visits : activeCard.points;
              const isUnlocked = currentValue >= r.conditionValue;
              const progress = Math.min((currentValue / r.conditionValue) * 100, 100);

              return (
                <div key={r.id} className={`p-5 rounded-2xl border ${isUnlocked ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className={`font-bold ${isUnlocked ? 'text-emerald-900' : 'text-slate-800'}`}>{r.title}</h4>
                    {isUnlocked ? (
                      <span className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={12} /> Listo
                      </span>
                    ) : (
                      <span className="text-slate-500 text-xs font-bold bg-slate-100 px-2 py-1 rounded-lg">
                        {currentValue}/{r.conditionValue} {r.conditionType === 'visits' ? 'visitas' : 'pts'}
                      </span>
                    )}
                  </div>
                  {!isUnlocked && (
                    <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                  )}
                  {isUnlocked && <p className="text-xs text-emerald-700 font-medium mt-1">¡Canjéalo en el mostrador!</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
