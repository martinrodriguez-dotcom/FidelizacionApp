import React, { useEffect, useState } from 'react';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc 
} from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  LayoutDashboard, 
  QrCode, 
  Users, 
  Award, 
  LogOut,
  TrendingUp,
  Store,
  Calendar,
  ChevronRight,
  Search,
  Filter,
  Bell
} from 'lucide-react';

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
const auth = getAuth(app);
const db = getFirestore(app);

// Identificadores fijos para Dulce Sal
const appIdSaaS = "dulce-sal-app"; 
const DULCE_SAL_ID = "dulce-sal-id"; 

const StatCard = ({ title, value, icon, color = "rosa", subtitle }) => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-xl hover:shadow-rosa-100/50 transition-all duration-300 group">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{title}</p>
        <h3 className="text-4xl font-black text-slate-900 tracking-tight group-hover:scale-105 transition-transform origin-left">
          {value}
        </h3>
        {subtitle && <p className="text-slate-400 text-[10px] mt-2 font-medium">{subtitle}</p>}
      </div>
      <div className={`p-4 rounded-2xl bg-${color}-50 text-${color}-600 group-hover:rotate-6 transition-transform`}>
        {icon}
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Verificación de sesión activa
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        window.location.href = '/';
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Carga de datos del negocio y clientes
  useEffect(() => {
    if (!user) return;

    // A. Info del negocio
    const businessRef = doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'businesses', DULCE_SAL_ID);
    const unsubBusiness = onSnapshot(businessRef, (snap) => {
      if (snap.exists()) {
        setBusiness(snap.data());
      }
    });

    // B. Lista de clientes
    const customersRef = collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'loyalty_cards');

    const unsubCustomers = onSnapshot(customersRef, (snap) => {
      const list = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(c => c.businessId === DULCE_SAL_ID);
        
      setCustomers(list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setLoading(false);
    }, (err) => {
      console.error("Error cargando base de clientes:", err);
      setLoading(false);
    });

    return () => {
      unsubBusiness();
      unsubCustomers();
    };
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  const filteredCustomers = customers.filter(c => 
    c.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customerPhone?.includes(searchTerm)
  );

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-rosa-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Cargando Panel Dulce Sal</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans selection:bg-rosa-100">
      
      {/* SIDEBAR LATERAL */}
      <aside className="w-72 bg-white border-r border-slate-100 hidden lg:flex flex-col p-8 sticky top-0 h-screen">
        <div className="mb-12 flex items-center gap-4">
          <div className="bg-rosa-500 p-3 rounded-2xl text-white shadow-lg shadow-rosa-100">
            <Store size={24} />
          </div>
          <div>
            <h2 className="font-black text-slate-900 tracking-tighter text-2xl italic">Dulce Sal</h2>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Admin Console</p>
          </div>
        </div>
        
        <nav className="space-y-3 flex-1">
          <button 
            onClick={() => window.location.href = '/admin'}
            className="w-full flex items-center justify-between px-6 py-4 rounded-[1.5rem] bg-rosa-500 text-white font-bold text-sm shadow-xl shadow-rosa-100 transition-all"
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard size={18} /> Dashboard
            </div>
            <ChevronRight size={14} className="opacity-50" />
          </button>
          
          <button 
            onClick={() => window.location.href = '/admin/customers'}
            className="w-full flex items-center gap-3 px-6 py-4 rounded-[1.5rem] text-slate-400 hover:bg-rosa-50 hover:text-rosa-600 font-bold text-sm transition-all group"
          >
            <Users size={18} className="group-hover:text-rosa-500" /> Clientes
          </button>
          
          <button 
            onClick={() => window.location.href = '/admin/rewards'}
            className="w-full flex items-center gap-3 px-6 py-4 rounded-[1.5rem] text-slate-400 hover:bg-rosa-50 hover:text-rosa-600 font-bold text-sm transition-all group"
          >
            <Award size={18} className="group-hover:text-rosa-500" /> Configurar Premios
          </button>

          <button 
            onClick={() => window.location.href = '/admin/campaigns'}
            className="w-full flex items-center gap-3 px-6 py-4 rounded-[1.5rem] text-slate-400 hover:bg-rosa-50 hover:text-rosa-600 font-bold text-sm transition-all group"
          >
            <Bell size={18} className="group-hover:text-rosa-500" /> Campañas Push
          </button>
        </nav>

        <div className="pt-8 border-t border-slate-50">
          <div className="bg-slate-50 p-4 rounded-2xl mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Usuario Admin</p>
            <p className="text-xs font-bold text-slate-600 truncate">{user?.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-6 py-4 text-red-400 font-bold text-sm hover:bg-red-50 rounded-[1.5rem] transition-all"
          >
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          <header className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-12">
            <div>
              <div className="flex items-center gap-2 text-rosa-500 mb-2">
                <Calendar size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Resumen General</h1>
              <p className="text-slate-400 font-medium italic text-sm mt-1">Monitorea el crecimiento de Dulce Sal</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => window.location.href = '/'}
                className="bg-white border border-slate-200 text-slate-600 px-6 py-3.5 rounded-2xl font-bold text-sm hover:bg-rosa-50 transition-all flex items-center gap-2 shadow-sm"
              >
                Ver Portal Público
              </button>
              <button 
                onClick={() => window.location.href = '/admin/scan'}
                className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl hover:bg-black transition-all flex items-center gap-2 active:scale-95"
              >
                <QrCode size={18} /> Escanear Cliente
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <StatCard 
              title="Comunidad Dulce Sal" 
              value={customers.length} 
              icon={<Users size={24}/>} 
              color="rosa"
              subtitle="Clientes únicos registrados"
            />
            <StatCard 
              title="Tráfico Total" 
              value={customers.reduce((acc,c) => acc + (c.visits || 0), 0)} 
              icon={<TrendingUp size={24}/>} 
              color="emerald"
              subtitle="Visitas acumuladas históricas"
            />
            <StatCard 
              title="Puntos en Circulación" 
              value={customers.reduce((acc,c) => acc + (c.points || 0), 0)} 
              icon={<Award size={24}/>} 
              color="amber"
              subtitle="Puntos pendientes de canje"
            />
          </div>

          <section className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
            <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-md-center gap-6">
              <div>
                <h3 className="font-black text-slate-900 text-2xl tracking-tight">Base de Clientes</h3>
                <p className="text-slate-400 text-xs font-medium mt-1">Listado actualizado en tiempo real</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    placeholder="Buscar por nombre o cel..."
                    className="pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rosa-500 font-medium text-sm w-full md:w-64 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button className="p-3 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 hover:text-rosa-500 transition-colors">
                  <Filter size={20} />
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/30">
                    <th className="px-10 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Socio</th>
                    <th className="px-10 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">WhatsApp</th>
                    <th className="px-10 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Nivel</th>
                    <th className="px-10 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Fidelidad</th>
                    <th className="px-10 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-10 py-24 text-center">
                        <div className="max-w-xs mx-auto">
                          <Users className="text-slate-200 mx-auto mb-4" size={48} />
                          <p className="text-slate-400 font-bold text-sm italic">
                            {searchTerm ? "No hay coincidencias para tu búsqueda." : "Aún no tienes clientes registrados. ¡Comparte tu código QR!"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-rosa-50/30 transition-all group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-rosa-50 text-rosa-500 rounded-xl flex items-center justify-center font-black text-xs group-hover:bg-rosa-500 group-hover:text-white transition-colors">
                            {c.customerName?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 leading-none mb-1.5 uppercase text-sm tracking-tight">{c.customerName}</p>
                            <p className="text-[10px] text-slate-400 font-mono tracking-tighter italic">REG: {new Date(c.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <a href={`https://wa.me/${c.customerPhone}`} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-600 font-bold hover:text-emerald-500 transition-colors flex items-center gap-1">
                          {c.customerPhone}
                        </a>
                      </td>
                      <td className="px-10 py-6 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          (c.visits || 0) >= 10 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {(c.visits || 0) >= 10 ? 'VIP Platinum' : 'Socio Base'}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-center">
                        <div className="flex items-center justify-center gap-4">
                          <div className="text-center">
                            <p className="text-[9px] font-black text-slate-300 uppercase mb-0.5 tracking-tighter">Visitas</p>
                            <p className="font-black text-emerald-500">{c.visits || 0}</p>
                          </div>
                          <div className="w-px h-8 bg-slate-100"></div>
                          <div className="text-center">
                            <p className="text-[9px] font-black text-slate-300 uppercase mb-0.5 tracking-tighter">Puntos</p>
                            <p className="font-black text-rosa-500">{c.points || 0}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <button className="bg-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md shadow-slate-200">
                          Gestionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-8 bg-slate-50/50 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Fin del Listado • Dulce Sal Loyalty</p>
            </div>
          </section>

        </div>
      </main>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      ` }} />
    </div>
  );
}
