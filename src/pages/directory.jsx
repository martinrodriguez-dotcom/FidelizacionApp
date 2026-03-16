import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { ArrowLeft, Store, MapPin, Search } from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyBqCo-N8hJo61cksLdW9JgJySSfEFJke64",
  authDomain: "fidelizacionapp-d3e8e.firebaseapp.com",
  projectId: "fidelizacionapp-d3e8e",
  storageBucket: "fidelizacionapp-d3e8e.firebasestorage.app",
  messagingSenderId: "86470097031",
  appId: "1:86470097031:web:fee57a2a8e6d471ccda022"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// ID del artefacto para cumplir con las reglas de seguridad
const appIdSaaS = "dulce-sal-app"; 

// --- COMPONENTES UI AUXILIARES ---
const Button = ({ children, onClick, variant = 'primary', fullWidth = false, disabled = false, type = "button" }) => {
  const base = "px-6 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100",
    outline: "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''}`}>
      {children}
    </button>
  );
};

export default function DirectoryPage() {
  const [businesses, setBusinesses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        // Ruta segura para buscar todos los negocios registrados bajo este SaaS
        const businessesRef = collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'businesses');
        const querySnapshot = await getDocs(businessesRef);
        
        const businessList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setBusinesses(businessList);
        setLoading(false);
      } catch (error) {
        console.error("Error al cargar los negocios:", error);
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, []);

  const filteredBusinesses = businesses.filter(b => 
    b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => window.location.href = '/'} 
            className="flex items-center text-slate-500 hover:text-indigo-600 font-bold transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" /> Volver al Inicio
          </button>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Directorio</h1>
          <div className="w-24"></div> {/* Espaciador para centrar */}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-12 text-center max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-indigo-100 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 rotate-3">
            <MapPin className="text-indigo-600" size={32} />
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">Encuentra tus lugares favoritos</h2>
          <p className="text-slate-500 mb-8 font-medium text-lg leading-relaxed">
            Busca comercios adheridos a la red de FidelizaPro, únete a sus programas y empieza a sumar puntos por tus compras.
          </p>
          
          <div className="bg-white p-2 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center max-w-lg mx-auto focus-within:ring-4 focus-within:ring-indigo-100 transition-all">
            <div className="pl-5 pr-3 text-slate-400">
              <Search size={24} />
            </div>
            <input 
              type="text" 
              placeholder="Buscar por nombre o dirección..." 
              className="w-full bg-transparent outline-none py-4 text-slate-800 font-bold placeholder:text-slate-300 placeholder:font-medium" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Cargando red de comercios</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBusinesses.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
                <Store className="text-slate-200 mx-auto mb-4" size={48} />
                <p className="text-slate-400 font-bold">
                  {searchTerm ? "No encontramos ningún comercio con esa búsqueda." : "Aún no hay comercios registrados en la plataforma."}
                </p>
              </div>
            ) : (
              filteredBusinesses.map(business => (
                <div key={business.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:shadow-indigo-100/50 border border-slate-100 flex flex-col h-full transition-all duration-300 group hover:-translate-y-1">
                  <div className="flex items-center gap-5 mb-6">
                    <div className="bg-indigo-50 w-16 h-16 flex items-center justify-center rounded-2xl group-hover:bg-indigo-600 transition-colors shrink-0">
                      <Store className="text-indigo-600 group-hover:text-white transition-colors" size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 leading-tight tracking-tight mb-1">{business.name}</h3>
                      <div className="flex items-start text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <MapPin size={12} className="mr-1 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{business.address}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto pt-6 border-t border-slate-50">
                    <Button 
                      fullWidth 
                      variant="outline" 
                      onClick={() => window.location.href = `/${business.id}`}
                    >
                      Ver Programa VIP
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
