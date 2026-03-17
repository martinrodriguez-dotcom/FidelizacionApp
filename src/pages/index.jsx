import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, doc, onSnapshot, collection, 
  query, where, setDoc, addDoc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { 
  getAuth, onAuthStateChanged, signInAnonymously, 
  signInWithCustomToken, signOut 
} from 'firebase/auth';
import { 
  Store, User, MapPin, Sparkles, LayoutDashboard, Heart,
  ChevronRight, Star, Coffee, Gift, Smartphone, ShieldCheck,
  Zap, Award, Bell, QrCode, LogOut, TrendingUp, Search, 
  Filter, ArrowLeft, Download, CheckCircle2, AlertCircle, 
  Loader2, Camera, UserPlus, History, Send
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

const appIdRaw = typeof __app_id !== 'undefined' ? __app_id : "dulce-sal-app";
const appIdSaaS = appIdRaw.replace(/\//g, '_'); 
const DULCE_SAL_ID = "dulce-sal-id"; 

// --- ESTILOS "ROSA DULCE SAL" ---
const RosaStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    :root {
      --rosa-50: #fdf2f8;
      --rosa-100: #fce7f3;
      --rosa-200: #fbcfe8;
      --rosa-500: #ec4899;
      --rosa-600: #db2777;
    }
    .bg-rosa-50 { background-color: var(--rosa-50); }
    .bg-rosa-100 { background-color: var(--rosa-100); }
    .bg-rosa-200 { background-color: var(--rosa-200); }
    .bg-rosa-500 { background-color: var(--rosa-500); }
    .bg-rosa-600 { background-color: var(--rosa-600); }
    .text-rosa-500 { color: var(--rosa-500); }
    .text-rosa-600 { color: var(--rosa-600); }
    .border-rosa-100 { border-color: var(--rosa-100); }
    .border-rosa-200 { border-color: var(--rosa-200); }
    .border-rosa-500 { border-color: var(--rosa-500); }
    .shadow-rosa { box-shadow: 0 20px 25px -5px rgba(236, 72, 153, 0.1), 0 10px 10px -5px rgba(236, 72, 153, 0.04); }
    .selection\\:bg-rosa-100 ::selection { background-color: var(--rosa-100); }
    
    #reader { border: none !important; border-radius: 2rem; overflow: hidden; background: white; }
    #reader__dashboard_section_csr button { background-color: #ec4899; color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 800; cursor: pointer; }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
  `}} />
);

// --- COMPONENTES UI REUTILIZABLES ---

const Button = ({ children, onClick, variant = 'primary', fullWidth = false, disabled = false, className = "" }) => {
  const base = "px-6 py-4 rounded-[1.8rem] font-black transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 text-sm uppercase tracking-widest";
  const variants = {
    primary: "bg-rosa-500 text-white hover:bg-rosa-600 shadow-xl shadow-rosa-100",
    dark: "bg-slate-900 text-white hover:bg-black",
    outline: "bg-white text-slate-600 border border-slate-200 hover:bg-rosa-50"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}>
      {children}
    </button>
  );
};

const Input = ({ label, type = "text", placeholder, value, onChange, required = false }) => (
  <div className="w-full space-y-1.5">
    {label && <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">{label}</label>}
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rosa-500 focus:bg-white transition-all font-bold text-slate-800"
    />
  </div>
);

// --- VISTAS DE LA APLICACIÓN ---

export default function App() {
  const [view, setView] = useState('home'); // home, customer, admin-dashboard, admin-customers, admin-rewards, admin-scan, admin-campaigns
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auth Logic
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error(err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Data Logic
  useEffect(() => {
    if (!user) return;
    const bRef = doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'businesses', DULCE_SAL_ID);
    const unsub = onSnapshot(bRef, (snap) => {
      if (snap.exists()) setBusiness(snap.data());
      setLoading(false);
    }, (err) => { console.error(err); setLoading(false); });
    return () => unsub();
  }, [user]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-rosa-50 font-sans">
      <RosaStyles />
      <Loader2 className="text-rosa-500 animate-spin" size={48} />
      <p className="text-rosa-500 font-black uppercase tracking-[0.4em] text-[10px] mt-6">Dulce Sal</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-rosa-100">
      <RosaStyles />
      
      {view === 'home' && <HomeView setView={setView} business={business} />}
      {view === 'customer' && <CustomerView setView={setView} user={user} business={business} />}
      
      {/* Admin Views Wrapper */}
      {view.startsWith('admin-') && (
        <AdminLayout setView={setView} user={user} currentView={view}>
          {view === 'admin-dashboard' && <AdminDashboard setView={setView} />}
          {view === 'admin-customers' && <AdminCustomers />}
          {view === 'admin-rewards' && <AdminRewards />}
          {view === 'admin-scan' && <AdminScan />}
          {view === 'admin-campaigns' && <AdminCampaigns />}
        </AdminLayout>
      )}
    </div>
  );
}

// --- SUB-VISTAS ---

function HomeView({ setView, business }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-rosa-100/50 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-rosa-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white p-12 md:p-20 rounded-[4.5rem] shadow-rosa border border-slate-100 max-w-lg w-full text-center relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="bg-rosa-500 w-28 h-28 rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-rosa-200 rotate-6 hover:rotate-0 transition-transform duration-500 border-4 border-white">
          <Store className="text-white" size={56} />
        </div>
        <h1 className="text-6xl font-black text-slate-900 mb-3 tracking-tighter italic">Dulce Sal</h1>
        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-12 flex items-center justify-center gap-2">
          <MapPin size={12} className="text-rosa-500" /> {business?.address || 'Premium Loyalty'}
        </p>

        <div className="space-y-5">
          <Button fullWidth onClick={() => setView('customer')}>
            <User size={20} /> Portal Cliente
          </Button>
          <Button variant="dark" fullWidth onClick={() => setView('admin-dashboard')}>
            <LayoutDashboard size={20} /> Administración
          </Button>
        </div>
        
        <footer className="mt-16 pt-10 border-t border-slate-50 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <Heart className="text-rosa-500 fill-rosa-500 animate-pulse" size={14} />
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Experience the sweetness</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function CustomerView({ setView, user, business }) {
  const [card, setCard] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [regData, setRegData] = useState({ name: '', phone: '' });

  useEffect(() => {
    if (!user) return;
    const cardId = `${DULCE_SAL_ID}_${user.uid}`;
    const unsub = onSnapshot(doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'loyalty_cards', cardId), (snap) => {
      if (snap.exists()) setCard(snap.data());
    });
    const rUnsub = onSnapshot(collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'rewards'), (snap) => {
      setRewards(snap.docs.map(d => ({id: d.id, ...d.data()})).filter(r => r.businessId === DULCE_SAL_ID));
    });
    return () => { unsub(); rUnsub(); };
  }, [user]);

  const handleRegister = async (e) => {
    e.preventDefault();
    const cardId = `${DULCE_SAL_ID}_${user.uid}`;
    await setDoc(doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'loyalty_cards', cardId), {
      businessId: DULCE_SAL_ID,
      customerName: regData.name,
      customerPhone: regData.phone,
      customerId: user.uid,
      points: 0,
      visits: 0,
      createdAt: new Date().toISOString()
    });
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${user?.uid}&color=ec4899`;

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center animate-in fade-in duration-500">
      <header className="w-full max-w-md flex items-center justify-between mb-8">
        <button onClick={() => setView('home')} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-rosa-500"><ArrowLeft size={20}/></button>
        <div className="flex items-center gap-3">
          <div className="bg-rosa-500 p-2 rounded-xl text-white"><Store size={20}/></div>
          <span className="font-black text-slate-900 tracking-tight">Dulce Sal</span>
        </div>
        <div className="w-10"></div>
      </header>

      {!card ? (
        <div className="bg-white p-10 rounded-[3rem] shadow-rosa w-full max-w-md text-center">
          <div className="bg-rosa-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"><Heart className="text-rosa-500" size={40}/></div>
          <h2 className="text-3xl font-black mb-2">¡Bienvenido!</h2>
          <p className="text-slate-400 mb-8 font-medium italic">Regístrate para ganar premios exclusivos.</p>
          <form onSubmit={handleRegister} className="space-y-4">
            <Input label="Nombre" value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} required />
            <Input label="WhatsApp" value={regData.phone} onChange={e => setRegData({...regData, phone: e.target.value})} required />
            <Button fullWidth>Crear Mi Tarjeta VIP</Button>
          </form>
        </div>
      ) : (
        <div className="w-full max-w-md space-y-8 pb-10">
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-rosa-500/20 rounded-full blur-3xl"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <span className="text-[10px] font-black uppercase text-rosa-400 tracking-widest bg-rosa-500/10 px-3 py-1 rounded-full border border-rosa-500/20">Socio VIP</span>
                <h3 className="text-3xl font-black mt-6 tracking-tight uppercase truncate">{card.customerName}</h3>
              </div>
              <div className="bg-white p-2.5 rounded-[2rem] shadow-xl">
                <img src={qrUrl} alt="QR" className="w-24 h-24 rounded-2xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 border-t border-white/5 mt-10 pt-10 text-center">
              <div><p className="text-[10px] uppercase text-slate-500 font-black tracking-widest mb-1">Puntos</p><p className="text-5xl font-black text-rosa-500 tracking-tighter">{card.points}</p></div>
              <div><p className="text-[10px] uppercase text-slate-500 font-black tracking-widest mb-1">Visitas</p><p className="text-5xl font-black text-emerald-400 tracking-tighter">{card.visits}</p></div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xl font-black text-slate-800 flex items-center gap-2"><Award className="text-rosa-500"/> Tus Premios</h4>
            {rewards.map(r => {
              const current = r.conditionType === 'visits' ? card.visits : card.points;
              const unlocked = current >= r.conditionValue;
              const pct = Math.min((current / r.conditionValue) * 100, 100);
              return (
                <div key={r.id} className={`p-6 rounded-[2.5rem] border transition-all ${unlocked ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
                  <div className="flex justify-between mb-4">
                    <div><p className="font-black text-slate-800 text-sm">{r.title}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{r.conditionValue} {r.conditionType === 'visits' ? 'Visitas' : 'Puntos'}</p></div>
                    {unlocked && <span className="bg-emerald-500 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase">¡Listo!</span>}
                  </div>
                  {!unlocked && <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-rosa-500" style={{width: `${pct}%`}}></div></div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminLayout({ children, setView, user, currentView }) {
  const menu = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin-customers', label: 'Clientes', icon: Users },
    { id: 'admin-rewards', label: 'Premios', icon: Award },
    { id: 'admin-scan', label: 'Escanear', icon: QrCode },
    { id: 'admin-campaigns', label: 'Campañas', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-72 bg-white border-r border-slate-100 hidden lg:flex flex-col p-8 sticky top-0 h-screen">
        <div className="mb-12 flex items-center gap-4 cursor-pointer" onClick={() => setView('home')}>
          <div className="bg-rosa-500 p-3 rounded-2xl text-white shadow-xl shadow-rosa-100"><Store size={24}/></div>
          <div><h2 className="font-black text-slate-900 tracking-tighter text-2xl italic leading-none">Dulce Sal</h2><p className="text-[9px] font-black uppercase text-rosa-400 tracking-widest">Admin</p></div>
        </div>
        <nav className="space-y-2 flex-1">
          {menu.map(item => (
            <button key={item.id} onClick={() => setView(item.id)} className={`w-full flex items-center gap-3 px-6 py-4 rounded-[1.5rem] font-bold text-sm transition-all ${currentView === item.id ? 'bg-rosa-500 text-white shadow-lg shadow-rosa-100' : 'text-slate-400 hover:bg-rosa-50 hover:text-rosa-500'}`}>
              <item.icon size={18}/> {item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => setView('home')} className="w-full flex items-center gap-3 px-6 py-4 text-red-400 font-bold text-sm hover:bg-red-50 rounded-[1.5rem] transition-all mt-8"><LogOut size={18}/> Salir</button>
      </aside>
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">{children}</main>
    </div>
  );
}

function AdminDashboard({ setView }) {
  const [stats, setStats] = useState({ clients: 0, visits: 0, points: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'loyalty_cards'), (snap) => {
      const list = snap.docs.map(d => d.data()).filter(c => c.businessId === DULCE_SAL_ID);
      setStats({
        clients: list.length,
        visits: list.reduce((a,c) => a + (c.visits || 0), 0),
        points: list.reduce((a,c) => a + (c.points || 0), 0)
      });
      setRecent(list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));
    });
    return () => unsub();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div><h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">Panel de Control</h1><p className="text-slate-400 font-medium italic mt-2">Bienvenido al corazón de Dulce Sal</p></div>
        <Button onClick={() => setView('admin-scan')}><QrCode size={18}/> Escanear Cliente</Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard title="Comunidad" value={stats.clients} icon={Users} subtitle="Clientes registrados" />
        <StatCard title="Visitas" value={stats.visits} icon={TrendingUp} subtitle="Tráfico total" />
        <StatCard title="Puntos" value={stats.points} icon={Award} subtitle="En circulación" />
      </div>

      <section className="bg-white rounded-[3rem] border border-slate-100 shadow-rosa overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex justify-between items-center">
          <h3 className="font-black text-xl tracking-tight">Actividad Reciente</h3>
          <button onClick={() => setView('admin-customers')} className="text-rosa-500 font-black text-xs uppercase tracking-widest hover:underline">Ver Todos</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <tbody className="divide-y divide-slate-50">
              {recent.map((c, i) => (
                <tr key={i} className="hover:bg-rosa-50 transition-all">
                  <td className="px-10 py-6 font-black text-slate-800">{c.customerName}</td>
                  <td className="px-10 py-6 text-slate-400 font-mono text-xs">{c.customerPhone}</td>
                  <td className="px-10 py-6 text-right font-black text-rosa-500">{c.points} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, subtitle }) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
      <div className="flex justify-between items-start mb-6">
        <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{title}</p><h3 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h3></div>
        <div className="p-4 bg-rosa-50 text-rosa-500 rounded-2xl group-hover:bg-rosa-500 group-hover:text-white transition-all"><Icon size={24}/></div>
      </div>
      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{subtitle}</p>
    </div>
  );
}

function AdminCustomers() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'loyalty_cards'), (snap) => {
      setList(snap.docs.map(d => d.data()).filter(c => c.businessId === DULCE_SAL_ID));
    });
    return () => unsub();
  }, []);

  const filtered = list.filter(c => c.customerName?.toLowerCase().includes(search.toLowerCase()) || c.customerPhone?.includes(search));

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <h2 className="text-3xl font-black tracking-tighter">Gestión de Socios</h2>
      <div className="bg-white p-2 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
        <Search className="ml-6 text-slate-300" size={20}/>
        <input type="text" placeholder="Buscar por nombre o cel..." className="w-full py-4 bg-transparent outline-none font-bold" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50"><tr><th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Socio</th><th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Visitas</th><th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Acción</th></tr></thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((c, i) => (
              <tr key={i} className="hover:bg-rosa-50 transition-all">
                <td className="px-10 py-6 font-black">{c.customerName}</td>
                <td className="px-10 py-6 font-bold text-rosa-500">{c.visits}</td>
                <td className="px-10 py-6 text-right"><button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Ver Perfil</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminRewards() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ title: '', value: 10 });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'rewards'), (snap) => {
      setList(snap.docs.map(d => ({id: d.id, ...d.data()})).filter(r => r.businessId === DULCE_SAL_ID));
    });
    return () => unsub();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'rewards'), {
      businessId: DULCE_SAL_ID,
      title: form.title,
      conditionType: 'visits',
      conditionValue: parseInt(form.value)
    });
    setForm({ title: '', value: 10 });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <h2 className="text-3xl font-black tracking-tighter">Catálogo de Premios</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <form onSubmit={handleAdd} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 space-y-6 shadow-sm">
          <h4 className="font-black text-xl">Nuevo Premio</h4>
          <Input label="Título" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
          <Input label="Visitas Requeridas" type="number" value={form.value} onChange={e => setForm({...form, value: e.target.value})} required />
          <Button fullWidth>Guardar Premio</Button>
        </form>
        <div className="lg:col-span-2 space-y-4">
          {list.map(r => (
            <div key={r.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex justify-between items-center shadow-sm">
              <div><h4 className="font-black text-lg">{r.title}</h4><p className="text-xs font-bold text-rosa-500 uppercase tracking-widest">{r.conditionValue} Visitas</p></div>
              <button onClick={() => deleteDoc(doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'rewards', r.id))} className="p-3 bg-red-50 text-red-500 rounded-xl"><Trash2 size={20}/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminScan() {
  const [status, setStatus] = useState({ type: '', msg: '' });
  const scannerRef = useRef(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://unpkg.com/html5-qrcode";
    script.onload = () => {
      const scanner = new window.Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
      scannerRef.current = scanner;
      scanner.render(async (decoded) => {
        scanner.pause(true);
        try {
          const cardId = `${DULCE_SAL_ID}_${decoded}`;
          const cardRef = doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'loyalty_cards', cardId);
          const snap = await getDoc(cardRef);
          if (snap.exists()) {
            await updateDoc(cardRef, { visits: (snap.data().visits || 0) + 1, points: (snap.data().points || 0) + 10 });
            setStatus({ type: 'success', msg: `Visita registrada para ${snap.data().customerName}` });
          } else {
            setStatus({ type: 'error', msg: 'Socio no registrado.' });
          }
        } catch (e) { setStatus({ type: 'error', msg: 'Error de conexión.' }); }
        setTimeout(() => { setStatus({type:'', msg:''}); scanner.resume(); }, 3000);
      });
    };
    document.body.appendChild(script);
    return () => { if (scannerRef.current) scannerRef.current.clear(); };
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-10 text-center animate-in zoom-in duration-500">
      <h2 className="text-3xl font-black tracking-tighter">Escanear Cliente</h2>
      <div className="max-w-md mx-auto bg-white p-8 rounded-[3rem] shadow-rosa border-8 border-slate-100">
        <div id="reader"></div>
      </div>
      {status.msg && (
        <div className={`p-6 rounded-3xl inline-flex items-center gap-3 font-black text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {status.type === 'success' ? <CheckCircle2/> : <AlertCircle/>} {status.msg}
        </div>
      )}
    </div>
  );
}

function AdminCampaigns() {
  const [form, setForm] = useState({ title: '', body: '' });
  const [list, setList] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'campaigns'), (snap) => {
      setList(snap.docs.map(d => d.data()).filter(c => c.businessId === DULCE_SAL_ID).sort((a,b) => new Date(b.sentAt) - new Date(a.sentAt)));
    });
    return () => unsub();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'campaigns'), {
      businessId: DULCE_SAL_ID,
      title: form.title,
      body: form.body,
      sentAt: new Date().toISOString()
    });
    setForm({ title: '', body: '' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <h2 className="text-3xl font-black tracking-tighter">Mensajes Push</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <form onSubmit={handleSend} className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
          <Input label="Título" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Mensaje</label>
            <textarea rows="4" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rosa-500 font-medium resize-none" value={form.body} onChange={e => setForm({...form, body: e.target.value})} required />
          </div>
          <Button fullWidth><Send size={18}/> Enviar Notificación</Button>
        </form>
        <div className="space-y-4">
          <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-widest px-4">Historial de Envíos</h4>
          {list.map((c, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <h5 className="font-black text-sm mb-1">{c.title}</h5>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">{c.body}</p>
              <p className="text-[9px] font-black text-rosa-300 uppercase tracking-widest">{new Date(c.sentAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Iconos adicionales faltantes en las imports directas
function Trash2({ size }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>; }
