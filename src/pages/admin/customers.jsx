import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { 
  BarChart3, 
  QrCode, 
  Users, 
  Award, 
  Bell, 
  Download, 
  Search, 
  ArrowLeft,
  User 
} from 'lucide-react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

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

// Sanitización del ID de la aplicación para evitar errores de segmentos
const appIdRaw = typeof __app_id !== 'undefined' ? __app_id : "dulce-sal-app";
const appIdSaaS = appIdRaw.replace(/\//g, '_'); 
const DULCE_SAL_ID = "dulce-sal-id";

export default function CustomersPage() {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. Proteger ruta
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) window.location.href = '/';
    });
    return () => unsubscribe();
  }, []);

  // 2. Cargar datos
  useEffect(() => {
    if (!user) return;

    const businessRef = doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'businesses', DULCE_SAL_ID);
    getDoc(businessRef).then(docSnap => {
      if (docSnap.exists()) setBusiness(docSnap.data());
    });

    const customersRef = collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'loyalty_cards');
    const unsubscribe = onSnapshot(customersRef, (snap) => {
      const list = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(c => c.businessId === DULCE_SAL_ID);
      
      setCustomers(list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setLoading(false);
    }, (err) => {
      console.error("Error al cargar clientes:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleExportCSV = () => {
    if (customers.length === 0) return alert("No hay clientes para exportar.");
    const header = "Nombre,WhatsApp,Visitas,Puntos,FechaRegistro\n";
    const rows = customers.map(c => 
      `${c.customerName},${c.customerPhone},${c.visits},${c.points},${new Date(c.createdAt).toLocaleDateString()}`
    ).join("\n");
    
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `Clientes_DulceSal.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCustomers = customers.filter(c => 
    c.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.customerPhone?.includes(searchTerm)
  );

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans">
      <div className="w-12 h-12 border-4 border-rosa-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-rosa-400 font-black uppercase tracking-[0.3em] text-[10px]">Cargando Base de Clientes</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6 md:p-12 selection:bg-rosa-100 selection:text-rosa-900">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => window.location.href = '/admin'} 
              className="p-4 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-rosa-500 hover:bg-rosa-50 transition-all active:scale-95"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Base de Clientes</h1>
              <p className="text-slate-500 font-medium italic mt-1">Gestiona la comunidad de Dulce Sal</p>
            </div>
          </div>
          <button 
            onClick={handleExportCSV} 
            className="bg-rosa-500 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-rosa-100 flex items-center justify-center gap-3 hover:bg-rosa-600 transition-all active:scale-95"
          >
            <Download size={20} /> Exportar CSV
          </button>
        </header>

        {/* Buscador de Clientes */}
        <div className="bg-white p-2 rounded-[2.5rem] shadow-xl shadow-slate-200/30 border border-slate-100 flex items-center gap-4 mb-10 transition-all focus-within:ring-4 focus-within:ring-rosa-50">
          <div className="pl-6 text-slate-300">
            <Search size={22} />
          </div>
          <input
            type="text" 
            placeholder="Buscar por nombre o WhatsApp..."
            className="w-full bg-transparent outline-none py-5 text-slate-700 font-bold placeholder:text-slate-300 placeholder:font-medium"
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Tabla de Resultados */}
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-10 py-6 font-black uppercase tracking-[0.2em] text-[10px] text-slate-400">Socio</th>
                  <th className="px-10 py-6 font-black uppercase tracking-[0.2em] text-[10px] text-slate-400">WhatsApp</th>
                  <th className="px-10 py-6 font-black uppercase tracking-[0.2em] text-[10px] text-slate-400 text-center">Visitas</th>
                  <th className="px-10 py-6 font-black uppercase tracking-[0.2em] text-[10px] text-slate-400 text-center">Puntos</th>
                  <th className="px-10 py-6 font-black uppercase tracking-[0.2em] text-[10px] text-slate-400 text-right">Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-10 py-24 text-center">
                      <div className="max-w-xs mx-auto">
                        <Users className="text-slate-200 mx-auto mb-4" size={56} />
                        <p className="text-slate-400 font-bold italic">
                          {searchTerm ? "No se encontraron socios con ese criterio." : "Aún no tienes clientes registrados."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredCustomers.map(c => (
                  <tr key={c.id} className="hover:bg-rosa-50/30 transition-all group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-rosa-50 text-rosa-500 rounded-2xl flex items-center justify-center font-black text-sm group-hover:bg-rosa-500 group-hover:text-white transition-all shadow-sm">
                          {c.customerName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm tracking-tight uppercase leading-none mb-1.5">{c.customerName}</p>
                          <p className="text-[10px] font-mono text-slate-400 italic">ID: {c.customerId.substring(0,8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <a 
                        href={`https://wa.me/${c.customerPhone}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-sm font-bold text-slate-600 hover:text-emerald-500 transition-colors flex items-center gap-1.5"
                      >
                        {c.customerPhone}
                      </a>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <span className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-xl font-black text-xs">
                        {c.visits} Visitas
                      </span>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <span className="bg-rosa-50 text-rosa-600 px-4 py-1.5 rounded-xl font-black text-xs">
                        {c.points} Puntos
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <p className="text-xs font-bold text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</p>
                      <p className="text-[10px] text-slate-300 font-medium">Dulce Sal VIP</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bg-slate-50/50 p-8 text-center border-t border-slate-50">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">
              Gestión de Fidelidad • Dulce Sal Loyalty
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
