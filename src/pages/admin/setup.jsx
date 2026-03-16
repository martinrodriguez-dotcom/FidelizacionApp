import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc 
} from 'firebase/firestore';
import { 
  Store, 
  MapPin, 
  Sparkles, 
  Download, 
  CheckCircle2 
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE (Consolidada para evitar errores de importación) ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'dulce-sal-app';

// --- COMPONENTES UI (Inlined) ---
const Input = ({ label, type = "text", placeholder, value, onChange, required = false, step = "any" }) => (
  <div className="w-full space-y-1">
    {label && <label className="text-xs font-black uppercase text-slate-400 ml-1">{label}</label>}
    <input
      type={type}
      step={step}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-slate-800"
    />
  </div>
);

const Button = ({ children, onClick, disabled = false, type = "button", className = "" }) => (
  <button 
    type={type} 
    onClick={onClick} 
    disabled={disabled} 
    className={`w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${className}`}
  >
    {children}
  </button>
);

// --- MOCK DE ROUTER (Para entorno de previsualización) ---
const useRouter = () => ({
  push: (path) => console.log("Redirigiendo a:", path),
  query: {},
  pathname: "/admin/setup"
});

// --- COMPONENTE PRINCIPAL ---
export default function BusinessSetup() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [credentials, setCredentials] = useState(null);
  
  const [formData, setFormData] = useState({
    name: 'Dulce Sal',
    address: '',
    lat: '',
    lng: '',
    radius: '200'
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((p) => {
        setFormData(prev => ({ 
          ...prev, 
          lat: p.coords.latitude.toString(), 
          lng: p.coords.longitude.toString() 
        }));
      });
    }
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 1. Generar Credenciales Automáticas
      const autoEmail = `admin@dulcesal.com`;
      const autoPassword = `dulce${Math.floor(1000 + Math.random() * 9000)}`;

      // 2. Crear usuario administrador
      const userCredential = await createUserWithEmailAndPassword(auth, autoEmail, autoPassword);
      const adminUser = userCredential.user;

      // 3. Guardar el Negocio Único (Ruta SaaS obligatoria)
      const businessId = 'dulce-sal-id';
      const businessRef = doc(db, 'artifacts', appId, 'public', 'data', 'businesses', businessId);
      
      await setDoc(businessRef, {
        name: formData.name,
        address: formData.address,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        radius: parseInt(formData.radius),
        ownerId: adminUser.uid,
        adminEmail: autoEmail,
        createdAt: new Date().toISOString()
      });

      setCredentials({ email: autoEmail, pass: autoPassword });
      setSetupComplete(true);
    } catch (err) {
      console.error(err);
      alert("Error al configurar Dulce Sal. Es posible que el correo ya esté en uso o haya un problema de conexión.");
    } finally {
      setIsSaving(false);
    }
  };

  const publicRegisterUrl = typeof window !== 'undefined' ? `${window.location.origin}/` : '';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(publicRegisterUrl)}&margin=20`;

  if (setupComplete) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 w-full max-w-2xl text-center">
          <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="text-emerald-600" size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-2">¡Dulce Sal está Online!</h1>
          <p className="text-slate-500 mb-8 font-medium">Configuración completada con éxito.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-left">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Tus Accesos Admin</h3>
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Email</p>
                  <p className="font-mono text-sm text-indigo-600">{credentials.email}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Password Temporal</p>
                  <p className="font-mono text-sm text-indigo-600">{credentials.pass}</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
                Guarda estos datos. Los necesitarás para entrar al panel y gestionar a tus clientes.
              </p>
            </div>

            <div className="bg-indigo-600 p-6 rounded-3xl shadow-xl text-white">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-200 mb-4">QR del Mostrador</h3>
              <div className="bg-white p-2 rounded-2xl mb-4 inline-block">
                <img src={qrCodeUrl} alt="QR Local" className="w-32 h-32" />
              </div>
              <p className="text-xs font-bold mb-4">Descarga este QR e imprímelo para que tus clientes se registren.</p>
              <a 
                href={qrCodeUrl} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-50 transition-all"
              >
                <Download size={14} /> Descargar QR
              </a>
            </div>
          </div>

          <div className="mt-10">
            <button 
              onClick={() => router.push('/admin')}
              className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-black transition-all"
            >
              Ir al Panel de Control de Dulce Sal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-6 font-sans">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="bg-indigo-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 rotate-3 shadow-inner">
            <Store className="text-indigo-600" size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter">Dulce Sal</h1>
          <p className="text-slate-400 mt-2 font-medium italic text-sm">Configuración de marca blanca</p>
        </div>

        <form onSubmit={handleSetup} className="space-y-5">
          <Input 
            label="Dirección del Local" 
            placeholder="Ej: Av. Principal 123"
            value={formData.address}
            onChange={e => setFormData({...formData, address: e.target.value})}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Latitud" 
              type="number"
              value={formData.lat}
              onChange={e => setFormData({...formData, lat: e.target.value})}
              required
            />
            <Input 
              label="Longitud" 
              type="number"
              value={formData.lng}
              onChange={e => setFormData({...formData, lng: e.target.value})}
              required
            />
          </div>

          <button 
            type="button" 
            onClick={getLocation}
            className="w-full bg-slate-100 text-slate-600 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
          >
            <MapPin size={16} /> Obtener GPS actual
          </button>

          <Input 
            label="Radio de Alerta (Metros)" 
            type="number"
            value={formData.radius}
            onChange={e => setFormData({...formData, radius: e.target.value})}
            required
          />

          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Configurando...' : <><Sparkles size={18} /> Crear App Dulce Sal</>}
          </Button>
        </form>
      </div>
    </div>
  );
}
