import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc 
} from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged 
} from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  BarChart3, 
  QrCode, 
  Users, 
  Award, 
  Bell, 
  Store,
  LogOut,
  TrendingUp
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE (Consistente con el resto de la app) ---
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

// Identificadores fijos para Dulce Sal (Deben coincidir con App.jsx y Customer index)
const appIdSaaS = "dulce-sal-app"; 
const DULCE_SAL_ID = "dulce-sal-main-id";

// --- COMPONENTES UI INLINED PARA EVITAR ERRORES ---

const StatCard = ({ title, value, icon, color = "indigo" }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-black text-slate-800">{value}</h3>
      </div>
      <div className={`p-3 rounded-2xl bg-${color}-50 text-${color}-600`}>
        {icon}
      </div>
    </div>
  </div>
);

/**
 * Panel Administrativo Dulce Sal (Ruta: /admin)
 * Corregido para usar la ruta artifacts/dulce-sal-app/...
 */
export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Manejo de Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        // Si no hay usuario, redirigir al login (simulado)
        window.location.href = '/login';
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Carga de Datos con Rutas SaaS Corregidas
  useEffect(() => {
    if (!user) return;

    // A. Obtener Info del Negocio (Ruta SaaS)
    const businessRef = doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'businesses', DULCE_SAL_ID);
    const unsubBusiness = onSnapshot(businessRef, (snap) => {
      if (snap.exists()) {
        setBusiness(snap.data());
      }
    });

    // B. Obtener Clientes / Tarjetas (Ruta SaaS)
    const customersRef = collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'loyalty_cards');
    const q = query(customersRef, where('businessId', '==', DULCE_SAL_ID));

    const unsubCustomers = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Ordenar por más recientes
      setCustomers(list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setLoading(false);
    }, (err) => {
      console.error("Error cargando clientes en Admin:", err);
      setLoading(false);
    });

    return () => {
      unsubBusiness();
      unsubCustomers();
    };
  }, [user]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* Sidebar Simulado */}
      <aside className="w-64 bg-white border-r border-slate-100 hidden md:flex flex-col p-6 sticky top-0 h-screen">
        <div className="mb-10 flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <Store size={20} />
          </div>
          <h2 className="font-black text-slate-800 tracking-tight text-xl">Dulce Sal</h2>
        </div>
        
        <nav className="space-y-2 flex-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-indigo-50 text-indigo-600 font-bold text-sm">
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-slate-50 font-bold text-sm transition-all">
            <Users size={18} /> Clientes
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-slate-50 font-bold text-sm transition-all">
            <Award size={18} /> Premios
          </button>
        </nav>

        <button onClick={() => auth.signOut()} className="flex items-center gap-3 px-4 py-3 text-red-400 font-bold text-sm hover:bg-red-50 rounded-2xl transition-all">
          <LogOut size={18} /> Cerrar Sesión
        </button>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          
          <header className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Panel de Control</h1>
              <p className="text-slate-400 font-medium italic">Gestionando {business?.name}</p>
            </div>
            <button className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-indigo-100 flex items-center gap-2 active:scale-95 transition-all">
              <QrCode size={18} /> Escanear Cliente
            </button>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <StatCard title="Total Clientes" value={customers.length} icon={<Users size={24}/>} color="indigo" />
            <StatCard title="Visitas Totales" value={customers.reduce((acc,c) => acc + (c.visits || 0), 0)} icon={<TrendingUp size={24}/>} color="emerald" />
            <StatCard title="Puntos Activos" value={customers.reduce((acc,c) => acc + (c.points || 0), 0)} icon={<Award size={24}/>} color="amber" />
          </div>

          {/* Tabla de Clientes Recientes */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-black text-slate-800 text-xl">Clientes Registrados</h3>
              <span className="text-xs font-black bg-slate-100 text-slate-400 px-3 py-1 rounded-full uppercase">En Tiempo Real</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Cliente</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Contacto</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Visitas</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Puntos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-8 py-20 text-center text-slate-300 italic">
                        Esperando al primer cliente... comparte tu QR del mostrador.
                      </td>
                    </tr>
                  ) : customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <p className="font-black text-slate-800">{c.customerName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">ID: {c.customerId.substring(0,8)}</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm text-slate-600 font-medium">{c.customerPhone}</p>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-black text-sm">
                          {c.visits || 0}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full font-black text-sm">
                          {c.points || 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
