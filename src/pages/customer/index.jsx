import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Store, Award, CheckCircle2, ArrowLeft, MapPin } from 'lucide-react';
import { db } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';
import { useGeolocation } from '../../hooks/useGeolocation';
import Button from '../../components/ui/Button';

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

  // 1. Proteger ruta
  useEffect(() => {
    if (!authLoading && !user) router.push('/directory');
  }, [user, authLoading, router]);

  // 2. Cargar todas las tarjetas de fidelidad del usuario
  useEffect(() => {
    if (!user) return;

    const cardsQuery = query(
      collection(db, 'loyalty_cards'),
      where('customerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(cardsQuery, (snapshot) => {
      const cardsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyCards(cardsList);
      
      // Si no hay tarjeta seleccionada y tiene al menos una, seleccionamos la primera
      if (!selectedCardId && cardsList.length > 0) {
        setSelectedCardId(cardsList[0].id);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, selectedCardId]);

  // 3. Cargar datos del negocio activo (para recompensas y geolocalización)
  const activeCard = myCards.find(c => c.id === selectedCardId);

  useEffect(() => {
    if (!activeCard) return;

    const fetchBusinessAndRewards = async () => {
      try {
        // Datos del negocio
        const bRef = doc(db, 'businesses', activeCard.businessId);
        const bSnap = await getDoc(bRef);
        if (bSnap.exists()) {
          setBusinessInfo({ id: bSnap.id, ...bSnap.data() });
        }

        // Recompensas del negocio
        const rQuery = query(collection(db, 'rewards'), where('businessId', '==', activeCard.businessId));
        onSnapshot(rQuery, (rSnap) => {
          setBusinessRewards(rSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

      } catch (error) {
        console.error("Error al cargar datos del negocio activo:", error);
      }
    };

    fetchBusinessAndRewards();
  }, [activeCard]);

  // 4. Integración del Hook de Geolocalización (Geofencing)
  const targetLocation = businessInfo ? { 
    lat: businessInfo.lat, 
    lng: businessInfo.lng, 
    radius: businessInfo.radius || 200 
  } : null;

  useGeolocation(targetLocation, (distance) => {
    // Este callback se ejecuta cuando el cliente entra en el radio del negocio
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`¡Estás cerca de ${businessInfo.name}!`, {
        body: `Tienes ${activeCard?.points || 0} puntos acumulados. ¡Entra y aprovecha tus recompensas!`,
        icon: '/icons/icon-192x192.png' // Asegúrate de tener este icono en tu carpeta public
      });
    }
  });

  // Utilidad para generar la URL de la imagen del QR (usando API externa pública)
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

  // Si el usuario no tiene ninguna tarjeta
  if (myCards.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-sm w-full">
          <Store size={64} className="text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Aún no tienes tarjetas</h2>
          <p className="text-slate-500 mb-8">Explora nuestro directorio de negocios y únete a sus programas de fidelidad para empezar a sumar puntos.</p>
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
        
        {/* Cabecera */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold text-slate-800">Mi Billetera</h1>
          <button onClick={() => router.push('/directory')} className="text-indigo-600 font-bold text-sm hover:underline">
            + Añadir
          </button>
        </div>

        {/* Selector de Tarjetas (Si tiene más de una) */}
        {myCards.length > 1 && (
          <div className="mb-6 overflow-x-auto flex gap-2 pb-2 hide-scrollbar">
            {myCards.map(c => (
              <button 
                key={c.id} 
                onClick={() => setSelectedCardId(c.id)}
                className={`px-5 py-2.5 rounded-full whitespace-nowrap font-bold text-sm transition-all shadow-sm ${
                  selectedCardId === c.id 
                    ? 'bg-indigo-600 text-white border-transparent' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
                }`}
              >
                {c.businessName}
              </button>
            ))}
          </div>
        )}

        {/* La Tarjeta Digital (Visual) */}
        {activeCard && (
          <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[2rem] p-8 shadow-2xl text-white relative overflow-hidden mb-8">
            
            {/* Decoración de fondo */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500 opacity-20 rounded-full -ml-10 -mb-10 pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="pr-4">
                <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1.5 opacity-80">Tarjeta de Fidelidad</p>
                <h2 className="text-2xl font-extrabold leading-tight">{activeCard.businessName}</h2>
                <p className="text-slate-300 text-sm mt-1 flex items-center gap-1">
                  <MapPin size={12} /> {businessInfo?.address || 'Cargando dirección...'}
                </p>
              </div>
              <div className="bg-white p-1.5 rounded-2xl shrink-0 shadow-lg">
                {/* QR Code: Representa el UID del cliente para que el negocio lo escanee */}
                <img 
                  src={generateQRUrl(user.uid)} 
                  alt="Tu Código QR" 
                  className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-contain" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6 relative z-10">
              <div>
                <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Puntos Acumulados</p>
                <p className="text-4xl font-extrabold text-amber-400 drop-shadow-sm">{activeCard.points}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Visitas Totales</p>
                <p className="text-4xl font-extrabold text-emerald-400 drop-shadow-sm">{activeCard.visits}</p>
              </div>
            </div>

            <div className="mt-8 text-center border-t border-white/5 pt-4 relative z-10">
              <p className="text-[10px] text-white/30 font-mono tracking-widest">
                ID CLIENTE: {user.uid}
              </p>
            </div>
          </div>
        )}

        {/* Sección de Recompensas */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Award className="text-indigo-600" size={20} /> 
            Tus Recompensas
          </h3>
          
          <div className="space-y-3">
            {businessRewards.map(r => {
              // Calculamos el progreso basado en si la condición es por visitas o puntos
              const currentValue = r.conditionType === 'visits' ? activeCard.visits : activeCard.points;
              const isUnlocked = currentValue >= r.conditionValue;
              const progressPercentage = Math.min((currentValue / r.conditionValue) * 100, 100);

              return (
                <div key={r.id} className={`p-5 rounded-2xl border transition-all ${
                  isUnlocked 
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 shadow-sm' 
                    : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className={`font-bold pr-4 ${isUnlocked ? 'text-emerald-900' : 'text-slate-800'}`}>
                      {r.title}
                    </h4>
                    
                    {isUnlocked ? (
                      <span className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0 shadow-sm">
                        <CheckCircle2 size={12} /> Disponible
                      </span>
                    ) : (
                      <span className="text-slate-500 text-xs font-bold shrink-0 bg-slate-100 px-2 py-1 rounded-lg">
                        {currentValue} / {r.conditionValue} {r.conditionType === 'visits' ? 'visitas' : 'pts'}
                      </span>
                    )}
                  </div>
                  
                  {/* Barra de Progreso */}
                  {!isUnlocked && (
                    <div className="w-full bg-slate-100 rounded-full h-2.5 mt-2 overflow-hidden border border-slate-200/50">
                      <div 
                        className="bg-indigo-500 h-full rounded-full transition-all duration-700 ease-out" 
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  )}

                  {isUnlocked && (
                    <p className="text-sm text-emerald-700 font-medium mt-1">
                      ¡Muéstrale tu QR al cajero para canjearlo!
                    </p>
                  )}
                </div>
              );
            })}

            {businessRewards.length === 0 && (
              <div className="text-center p-6 bg-white rounded-2xl border border-slate-200 border-dashed">
                <p className="text-slate-500 text-sm font-medium">Este comercio aún no ha publicado recompensas.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
