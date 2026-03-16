import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { collection, doc, setDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { MapPin, Store } from 'lucide-react';
import { db, auth } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

// Definimos el ID de la aplicación para el SaaS
const appId = typeof __app_id !== 'undefined' ? __app_id : 'fidelizapro-saas';

export default function BusinessSetup() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '', address: '', lat: '', lng: '', radius: '200'
  });

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((p) => {
        setFormData(prev => ({ ...prev, lat: p.coords.latitude, lng: p.coords.longitude }));
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      let currentUser = user;
      if (!currentUser) {
        const cred = await signInAnonymously(auth);
        currentUser = cred.user;
      }

      // IMPORTANTE: Ruta corregida para cumplir con las reglas del SaaS
      const businessRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'businesses'));
      
      await setDoc(businessRef, {
        name: formData.name,
        address: formData.address,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        radius: parseInt(formData.radius),
        ownerId: currentUser.uid,
        createdAt: new Date().toISOString()
      });

      router.push('/admin');
    } catch (err) {
      console.error("Error al registrar negocio:", err);
      // El error de permisos suele ocurrir aquí si la ruta no es 'artifacts/appId/public/data/businesses'
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 w-full max-w-xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-indigo-100 p-4 rounded-full">
            <Store className="text-indigo-600" size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">Configura tu Negocio</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Nombre del Negocio" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          <Input label="Dirección Física" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
          <div className="flex gap-4 items-end">
            <Input label="Latitud" type="number" step="any" value={formData.lat} onChange={e => setFormData({...formData, lat: e.target.value})} required />
            <Input label="Longitud" type="number" step="any" value={formData.lng} onChange={e => setFormData({...formData, lng: e.target.value})} required />
            <button type="button" onClick={getLocation} className="p-3.5 bg-slate-100 rounded-xl hover:bg-slate-200 border border-slate-200">
              <MapPin size={22} className="text-slate-600" />
            </button>
          </div>
          <Input label="Radio de Alcance (metros)" type="number" value={formData.radius} onChange={e => setFormData({...formData, radius: e.target.value})} required />
          <Button type="submit" fullWidth disabled={isSaving}>
            {isSaving ? 'Creando...' : 'Crear mi Panel de Control'}
          </Button>
        </form>
      </div>
    </div>
  );
}
