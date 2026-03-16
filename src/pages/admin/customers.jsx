import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { BarChart3, QrCode, Users, Award, Bell, Download, Search, ArrowLeft } from 'lucide-react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
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
const auth = getAuth(app);
const db = getFirestore(app);

const appIdSaaS = "dulce-sal-app"; 
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-10">
          <div className="flex items-center gap-4">
            <button onClick={() => window.location.href = '/admin'} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-indigo-600 transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Base de Clientes</h1>
              <p className="text-slate-500 font-medium">Gestiona a los usuarios registrados en Dulce Sal.</p>
            </div>
          </div>
          <button onClick={handleExportCSV} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all active:scale-95">
            <Download size={18} /> Exportar CSV
          </button>
        </header>

        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-3 mb-8">
          <Search className="text-slate-400 ml-2" size={20} />
          <input
            type="text" placeholder="Buscar por nombre o WhatsApp..."
            className="w-full bg-transparent outline-none py-2 text-slate-700 font-medium"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="p-6 font-black uppercase tracking-widest text-[10px] text-slate-400">Cliente</th>
                  <th className="p-6 font-black uppercase tracking-widest text-[10px] text-slate-400">WhatsApp</th>
                  <th className="p-6 font-black uppercase tracking-widest text-[10px] text-slate-400 text-center">Visitas</th>
                  <th className="p-6 font-black uppercase tracking-widest text-[10px] text-slate-400 text-center">Puntos</th>
                  <th className="p-6 font-black uppercase tracking-widest text-[10px] text-slate-400 text-right">Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-slate-400 font-medium italic">No se encontraron clientes.</td>
                  </tr>
                ) : filteredCustomers.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6">
                      <p className="font-black text-slate-800">{c.customerName}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">ID: {c.customerId.substring(0,8)}</p>
                    </td>
                    <td className="p-6 font-medium text-slate-600">{c.customerPhone}</td>
                    <td className="p-6 text-center"><span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-black text-sm">{c.visits}</span></td>
                    <td className="p-6 text-center"><span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-black text-sm">{c.points}</span></td>
                    <td className="p-6 text-right text-sm font-medium text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
