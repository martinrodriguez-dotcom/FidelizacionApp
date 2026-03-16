import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc } from 'firebase/firestore';
import { Store, MapPin, Mail, Lock, Info } from 'lucide-react';
import { db, auth } from '../../services/firebase';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

// ID de la aplicación para el esquema SaaS
const appId = typeof __app_id !== 'undefined' ? __app_id : 'fidelizapro-saas';

/**
 * Página de Registro y Configuración de Negocio (Ruta: /admin/setup)
 * Permite a nuevos comerciantes crear su cuenta y configurar su local.
 */
export default function BusinessSetup() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    lat: '',
    lng: '',
    radius: '200',
    email: '',
    password: ''
  });

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          setFormData(prev => ({ 
            ...prev, 
            lat: p.coords.latitude.toString(), 
            lng: p.coords.longitude.toString() 
          }));
        },
        (err) => {
          setError('No pudimos obtener tu ubicación. Por favor, ingrésala manualmente.');
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    
    try {
      // 1. Crear el usuario administrador con Email y Contraseña
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      const user = userCredential.user;

      // 2. Guardar los datos del negocio en la ruta SaaS de Firestore
      // Usamos una nueva referencia de documento en la colección de negocios
      const businessRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'businesses'));
      
      await setDoc(businessRef, {
        name: formData.name,
        address: formData.address,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        radius: parseInt(formData.radius),
        ownerId: user.uid,
        ownerEmail: formData.email,
        createdAt: new Date().toISOString()
      });

      // 3. Redirigir al panel de administración
      router.push('/admin');
    } catch (err) {
      console.error("Error en el registro:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo electrónico ya está registrado.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError('Hubo un error al crear la cuenta. Inténtalo de nuevo.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-slate-100 w-full max-w-2xl">
        
        <div className="flex items-center gap-5 mb-10">
          <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-100">
            <Store className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Crea tu Negocio</h1>
            <p className="text-slate-500 font-medium">Configura tu cuenta de administrador y tu local.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Sección de Cuenta */}
          <div className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Mail size={14} /> Datos de Acceso
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Correo Electrónico" 
                type="email"
                placeholder="ejemplo@negocio.com"
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                required 
              />
              <Input 
                label="Contraseña" 
                type="password"
                placeholder="Min. 6 caracteres"
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                required 
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Sección de Negocio */}
          <div className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Info size={14} /> Información del Local
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <Input 
                label="Nombre Comercial" 
                placeholder="Ej: Starbucks Centro"
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
              />
              <Input 
                label="Dirección Física" 
                placeholder="Calle, Ciudad, País"
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})} 
                required 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <Input 
                label="Latitud" 
                type="number" 
                step="any" 
                value={formData.lat} 
                onChange={e => setFormData({...formData, lat: e.target.value})} 
                required 
              />
              <Input 
                label="Longitud" 
                type="number" 
                step="any" 
                value={formData.lng} 
                onChange={e => setFormData({...formData, lng: e.target.value})} 
                required 
              />
              <button 
                type="button" 
                onClick={getLocation} 
                className="h-[52px] bg-slate-100 rounded-xl hover:bg-slate-200 border border-slate-200 transition-all flex items-center justify-center gap-2 text-slate-600 font-bold text-sm"
              >
                <MapPin size={18} /> Obtener GPS
              </button>
            </div>

            <Input 
              label="Radio de Alerta (Metros)" 
              type="number" 
              value={formData.radius} 
              onChange={e => setFormData({...formData, radius: e.target.value})} 
              required 
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 animate-pulse text-center">
              {error}
            </div>
          )}

          <Button type="submit" fullWidth disabled={isSaving} className="!py-5 !text-lg shadow-2xl shadow-indigo-200">
            {isSaving ? 'Creando cuenta...' : 'Finalizar y Entrar al Panel'}
          </Button>
          
        </form>
      </div>
    </div>
  );
}
