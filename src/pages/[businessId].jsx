import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { Store, ArrowLeft } from 'lucide-react';
import { db, auth } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

/**
 * Landing Page Pública del Negocio (Ruta dinámica: /[businessId])
 * Permite a los clientes registrarse en el programa de fidelización de un comercio específico.
 */
export default function BusinessLandingPage() {
  const router = useRouter();
  const { businessId } = router.query;
  const { user, loading: authLoading } = useAuth();
  
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // 1. Cargar los datos del negocio desde Firestore
  useEffect(() => {
    if (!businessId) return;

    const fetchBusiness = async () => {
      try {
        const docRef = doc(db, 'businesses', businessId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setBusiness({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.error("Negocio no encontrado");
        }
      } catch (error) {
        console.error("Error al obtener el negocio:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [businessId]);

  // 2. Verificar si el usuario ya tiene una tarjeta para este negocio
  useEffect(() => {
    if (!user || !businessId) return;

    const checkExistingCard = async () => {
      // El ID de la tarjeta es una combinación del ID del negocio y el ID del cliente
      const cardId = `${businessId}_${user.uid}`;
      const cardRef = doc(db, 'loyalty_cards', cardId);
      const cardSnap = await getDoc(cardRef);

      if (cardSnap.exists()) {
        // Si ya tiene tarjeta, lo mandamos directo a su dashboard de cliente
        router.push('/customer');
      }
    };

    checkExistingCard();
  }, [user, businessId, router]);

  // 3. Manejar el registro del cliente
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!business) return;

    setIsSubmitting(true);

    try {
      // Si el cliente no tiene sesión iniciada, lo autenticamos de forma anónima
      let currentUser = user;
      if (!currentUser) {
        const userCredential = await signInAnonymously(auth);
        currentUser = userCredential.user;
      }

      // Generar el ID único para esta relación Cliente <-> Negocio
      const cardId = `${business.id}_${currentUser.uid}`;
      
      // Crear la tarjeta de fidelización en la base de datos
      await setDoc(doc(db, 'loyalty_cards', cardId), {
        businessId: business.id,
        businessName: business.name,
        customerId: currentUser.uid,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        points: 0,
        visits: 0,
        createdAt: new Date().toISOString()
      });
      
      // Pedir permisos de notificación al registrarse (Para recibir las Push Campaigns luego)
      if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        await Notification.requestPermission();
      }

      // Redirigir al dashboard del cliente donde verá su tarjeta y código QR
      router.push('/customer');

    } catch (error) {
      console.error("Error al registrar cliente:", error);
      alert("Hubo un problema al crear tu tarjeta. Por favor, intenta de nuevo.");
      setIsSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-600 text-white font-bold text-xl">
        Cargando programa de fidelización...
      </div>
    );
  }

  if (!business && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <Store size={64} className="text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Comercio no encontrado</h1>
        <p className="text-slate-500 mb-6">El enlace que seguiste parece ser incorrecto o el comercio ya no existe.</p>
        <Button onClick={() => router.push('/directory')} variant="primary">
          Explorar Directorio
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-4 md:p-6 font-sans">
      
      <button 
        onClick={() => router.push('/directory')}
        className="absolute top-6 left-6 flex items-center text-indigo-200 hover:text-white transition-colors font-medium"
      >
        <ArrowLeft size={20} className="mr-2" /> Directorio
      </button>

      <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-2xl w-full max-w-md text-center relative overflow-hidden">
        
        {/* Elemento decorativo */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-400 to-indigo-600"></div>

        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-indigo-100">
          <Store className="text-indigo-600" size={40} />
        </div>
        
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">{business.name}</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Únete a nuestro programa de fidelización, acumula puntos con cada visita y obtén increíbles recompensas.
        </p>
        
        <form onSubmit={handleRegister} className="space-y-4 text-left">
          <Input 
            label="Nombre Completo"
            id="name"
            placeholder="Ej: Juan Pérez"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
          
          <Input 
            label="Correo Electrónico"
            id="email"
            type="email"
            placeholder="juan@ejemplo.com"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          
          <Input 
            label="Teléfono"
            id="phone"
            type="tel"
            placeholder="+54 11 1234 5678"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            required
          />

          <div className="pt-4">
            <Button 
              type="submit" 
              fullWidth 
              disabled={isSubmitting}
              className="py-4 text-lg shadow-lg"
            >
              {isSubmitting ? 'Generando Tarjeta...' : 'Generar Mi Tarjeta Digital'}
            </Button>
          </div>
        </form>
        
        <p className="text-xs text-slate-400 mt-6">
          Al registrarte, aceptas recibir notificaciones y correos electrónicos relacionados con tus recompensas.
        </p>
      </div>
    </div>
  );
}
