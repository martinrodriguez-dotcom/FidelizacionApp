import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { collection, doc, setDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { MapPin, Store } from 'lucide-react';
import { db, auth } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

/**
 * Página de configuración inicial del negocio (Ruta: /admin/setup)
 * Permite registrar un nuevo comercio en la base de datos con su geolocalización.
 */
export default function BusinessSetup() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    lat: '',
    lng: '',
    radius: '200' // Radio por defecto en metros para el geofencing
  });
  
  const [isSaving, setIsSaving] = useState(false);

  // Función para obtener la ubicación actual del dispositivo
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({ 
            ...prev, 
            lat: position.coords.latitude, 
            lng: position.coords.longitude 
          }));
        },
        (error) => {
          alert("No se pudo obtener la ubicación: " + error.message);
        }
      );
    } else {
      alert("Tu navegador no soporta geolocalización.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Para este MVP, si el usuario no está logueado, lo logueamos anónimamente
      let currentUser = user;
      if (!currentUser) {
        const userCredential = await signInAnonymously(auth);
        currentUser = userCredential.user;
      }

      // Creamos una nueva referencia de documento en la colección 'businesses'
      const businessRef = doc(collection(db, 'businesses'));
      
      await setDoc(businessRef, {
        name: formData.name,
        address: formData.address,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        radius: parseInt(formData.radius),
        ownerId: currentUser.uid, // Guardamos el ID del creador para seguridad
        createdAt: new Date().toISOString()
      });

      // Redirigimos al panel de administración (Dashboard) pasándole el ID del negocio recién creado
      router.push('/admin');
      
    } catch (err) {
      console.error("Error al registrar negocio:", err);
      alert("Ocurrió un error al registrar el negocio. Revisa la consola.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100 w-full max-w-xl">
        
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-indigo-100 p-4 rounded-full">
            <Store className="text-indigo-600" size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">Configura tu Negocio</h1>
            <p className="text-slate-500 text-sm">Crea tu perfil para empezar a fidelizar clientes.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input 
            label="Nombre del Negocio" 
            id="name"
            placeholder="Ej: Cafetería El Grano"
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            required
          />
          
          <Input 
            label="Dirección Física" 
            id="address"
            placeholder="Ej: Av. Principal 123, Ciudad"
            value={formData.address} 
            onChange={e => setFormData({...formData, address: e.target.value})} 
            required
          />

          <div className="flex flex-col md:flex-row gap-4 items-end">
             <div className="flex-1 w-full">
              <Input 
                label="Latitud" 
                id="lat"
                type="number"
                step="any"
                placeholder="-34.6037"
                value={formData.lat} 
                onChange={e => setFormData({...formData, lat: e.target.value})} 
                required
              />
            </div>
            <div className="flex-1 w-full">
              <Input 
                label="Longitud" 
                id="lng"
                type="number"
                step="any"
                placeholder="-58.3816"
                value={formData.lng} 
                onChange={e => setFormData({...formData, lng: e.target.value})} 
                required
              />
            </div>
            {/* Botón para autocompletar coordenadas */}
            <button 
              type="button" 
              onClick={getLocation} 
              className="p-3.5 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center border border-slate-200" 
              title="Obtener mi ubicación actual con el GPS"
            >
              <MapPin size={22} className="text-slate-600" />
            </button>
          </div>

          <div>
            <Input 
              label="Radio de Alcance (metros)" 
              id="radius"
              type="number"
              min="50"
              value={formData.radius} 
              onChange={e => setFormData({...formData, radius: e.target.value})} 
              required
            />
            <p className="text-xs text-slate-500 mt-2 font-medium">
              * Enviaremos notificaciones automáticas cuando un cliente registrado pase a esta distancia de tu local.
            </p>
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              fullWidth 
              disabled={isSaving}
            >
              {isSaving ? 'Creando Panel...' : 'Crear mi Panel de Control'}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => router.push('/')} 
            className="text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
