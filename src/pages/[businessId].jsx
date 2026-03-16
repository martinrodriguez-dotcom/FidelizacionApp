import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { Store, ArrowLeft } from 'lucide-react';
import { db, auth } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'fidelizapro-saas';

export default function BusinessLandingPage() {
  const router = useRouter();
  const { businessId } = router.query;
  const { user, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    if (!businessId) return;
    const fetchBusiness = async () => {
      try {
        // RUTA CORREGIDA
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'businesses', businessId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBusiness({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchBusiness();
  }, [businessId]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!business) return;
    setIsSubmitting(true);
    try {
      let currentUser = user;
      if (!currentUser) {
        const userCredential = await signInAnonymously(auth);
        currentUser = userCredential.user;
      }
      // RUTA CORREGIDA PARA CREAR TARJETA
      const cardId = `${business.id}_${currentUser.uid}`;
      const cardRef = doc(db, 'artifacts', appId, 'public', 'data', 'loyalty_cards', cardId);
      
      await setDoc(cardRef, {
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
      router.push('/customer');
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  if (loading || authLoading) return <div className="min-h-screen flex items-center justify-center bg-indigo-600 text-white font-bold">Cargando...</div>;

  return (
    <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-4">
      <button onClick={() => router.push('/directory')} className="absolute top-6 left-6 flex items-center text-indigo-200 hover:text-white transition-colors">
        <ArrowLeft size={20} className="mr-2" /> Directorio
      </button>
      <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md text-center relative overflow-hidden">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6"><Store className="text-indigo-600" size={40} /></div>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">{business?.name}</h1>
        <form onSubmit={handleRegister} className="space-y-4 text-left">
          <Input label="Nombre Completo" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          <Input label="Correo Electrónico" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
          <Input label="Teléfono" type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
          <Button type="submit" fullWidth disabled={isSubmitting}>{isSubmitting ? 'Generando...' : 'Generar Mi Tarjeta'}</Button>
        </form>
      </div>
    </div>
  );
}
