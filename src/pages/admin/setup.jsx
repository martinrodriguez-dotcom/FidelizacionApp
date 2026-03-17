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

// --- CONFIGURACIÓN DE FIREBASE ---
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

// --- COMPONENTES UI (Actualizados a Rosa) ---
const Input = ({ label, type = "text", placeholder, value, onChange, required = false, step = "any" }) => (
  <div className="w-full space-y-1">
    {label && <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">{label}</label>}
    <input
      type={type}
      step={step}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-rosa-500 focus:bg-white transition-all font-bold text-slate-800 placeholder:text-slate-300"
    />
  </div>
);

const Button = ({ children, onClick, disabled = false, type = "button", className = "" }) => (
  <button 
    type={type} 
    onClick={onClick} 
    disabled={disabled} 
    className={`w-full bg-rosa-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-rosa-100 hover:bg-rosa-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 ${className}`}
  >
    {children}
  </button>
);

// --- COMPONENTE PRINCIPAL ---
export default function BusinessSetup() {
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
      const autoEmail = `admin@dulcesal.com`;
      const autoPassword = `dulce${Math.floor(1000 + Math.random() * 9000)}`;

      const userCredential = await createUserWithEmailAndPassword(auth, autoEmail, autoPassword);
      const adminUser = userCredential.user;

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
      alert("Error al configurar Dulce Sal. Es posible que el correo ya esté en uso.");
    } finally {
      setIsSaving(false);
    }
  };

  const publicRegisterUrl = typeof window !== 'undefined' ? `${window.location.origin}/` : '';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(publicRegisterUrl)}&margin=20&color=ec4899`;

  if (setupComplete) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans selection:bg-rosa-100">
        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 w-full max-w-2xl text-center animate-in zoom-in duration-500">
          <div className="bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <CheckCircle2 className="text-emerald-500" size={48} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter">¡Dulce Sal está Online!</h1>
          <p className="text-slate-400 mb-10 font-medium">Configuración completada con éxito.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-10">
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rosa-500/5 rounded-full -mr-10 -mt-10"></div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Tus Accesos Admin</h3>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Email</p>
                  <p className="font-mono text-sm text-rosa-600 font-bold">{credentials.email}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Password</p>
                  <p className="font-mono text-sm text-rosa-600 font-bold">{credentials.pass}</p>
                </div>
              </div>
            </div>

            <div className="bg-rosa-500 p-8 rounded-[2.5rem] shadow-2xl shadow-rosa-100 text-white relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-rosa-100 mb-6">QR Mostrador</h3>
              <div className="bg-white p-4 rounded-3xl mb-6 inline-block shadow-lg">
                <img src={qrCodeUrl} alt="QR Local" className="w-32 h-32 rounded-xl" />
              </div>
              <a 
                href={qrCodeUrl} 
                target="_blank" 
                rel="noreferrer"
                className="w-full bg-white text-rosa-600 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 hover:bg-rosa-50 transition-all"
              >
                <Download size={16} /> Descargar QR
              </a>
            </div>
          </div>

          <button 
            onClick={() => window.location.href = '/admin'}
            className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95"
          >
            Ir al Panel de Control de Dulce Sal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rosa-500 flex items-center justify-center p-6 font-sans selection:bg-rosa-100">
      <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-rosa-50 rounded-full blur-3xl opacity-50"></div>
        
        <div className="text-center mb-10 relative z-10">
          <div className="bg-rosa-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6 rotate-3 shadow-inner">
            <Store className="text-rosa-500" size={48} />
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter">Dulce Sal</h1>
          <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-[10px]">Configuración de Marca</p>
        </div>

        <form onSubmit={handleSetup} className="space-y-6 relative z-10">
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
            className="w-full bg-slate-100 text-slate-500 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 transition-all active:scale-95"
          >
            <MapPin size={16} className="text-rosa-500" /> Usar GPS actual
          </button>

          <Input 
            label="Radio de Alerta (Metros)" 
            type="number"
            value={formData.radius}
            onChange={e => setFormData({...formData, radius: e.target.value})}
            required
          />

          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Configurando...' : <><Sparkles size={20} /> Crear App Dulce Sal</>}
          </Button>
        </form>
      </div>
    </div>
  );
}
