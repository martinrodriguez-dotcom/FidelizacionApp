import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, getAuth } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { Store, ArrowLeft, UserPlus, Heart } from 'lucide-react';

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

export default function BusinessLandingPage() {
  const router = useRouter();
  const { businessId } = router.query;
  
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });

  // 1. Manejar Autenticación Anónima
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Error en Auth:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Cargar datos del negocio específico
  useEffect(() => {
    if (!businessId) return;

    const fetchBusiness = async () => {
      try {
        const docRef = doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'businesses', businessId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setBusiness({ id: docSnap.id, ...docSnap.data() });
          
          // Verificar si el usuario ya está registrado en este local
          if (user) {
            const cardId = `${businessId}_${user.uid}`;
            const cardRef = doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'loyalty_cards', cardId);
            const cardSnap = await getDoc(cardRef);
            
            if (cardSnap.exists()) {
              // Si ya tiene tarjeta, lo mandamos directo a su panel
              router.push('/customer');
            }
          }
        }
      } catch (error) {
        console.error("Error obteniendo local:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBusiness();
    }
  }, [businessId, user, router]);

  // 3. Manejar el Registro (Crear Tarjeta VIP)
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!business || !user || !formData.name.trim() || !formData.phone.trim()) return;
    
    setIsSubmitting(true);
    try {
      const cardId = `${business.id}_${user.uid}`;
      const cardRef = doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'loyalty_cards', cardId);
      
      await setDoc(cardRef, {
        businessId: business.id,
        businessName: business.name,
        customerId: user.uid,
        customerName: formData.name,
        customerPhone: formData.phone,
        points: 0,
        visits: 0,
        createdAt: new Date().toISOString(),
        lastVisit: null,
        pushEnabled: false
      });
      
      // Registro exitoso, redirigir a la tarjeta
      router.push('/customer');
    } catch (error) {
      console.error("Error al registrar:", error);
      alert("Hubo un problema al crear tu tarjeta. Intenta nuevamente.");
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-indigo-600">
      <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
      <p className="text-white font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Cargando Local...</p>
    </div>
  );

  if (!business && !loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <Store className="text-slate-300 mb-4" size={64} />
      <h1 className="text-2xl font-black text-slate-800 mb-2">Comercio no encontrado</h1>
      <p className="text-slate-500 mb-8">El enlace parece estar roto o el comercio ya no existe.</p>
      <button onClick={() => router.push('/directory')} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold">
        Ver Directorio
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-6 font-sans">
      
      <button 
        onClick={() => router.push('/directory')} 
        className="absolute top-6 left-6 flex items-center text-indigo-200 hover:text-white transition-colors font-bold text-sm"
      >
        <ArrowLeft size={18} className="mr-2" /> Volver
      </button>

      <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md text-center animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
        
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-50 rounded-full blur-2xl opacity-60 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="bg-indigo-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6 rotate-3 shadow-inner">
            <Heart className="text-indigo-600" size={40} />
          </div>
          
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">¡Hola!</h1>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed">
            Regístrate en <span className="text-indigo-600 font-bold">{business?.name}</span> para empezar a ganar premios exclusivos.
          </p>
          
          <form onSubmit={handleRegister} className="space-y-5 text-left">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Tu Nombre</label>
              <input 
                type="text" 
                placeholder="Ej: Maria García" 
                required
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 transition-all placeholder:text-slate-300"
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">WhatsApp</label>
              <input 
                type="tel" 
                placeholder="Ej: 11 1234 5678" 
                required
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 transition-all placeholder:text-slate-300"
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95 mt-4"
            >
              {isSubmitting ? 'Procesando...' : <><UserPlus size={20} /> Crear Mi Tarjeta VIP</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
