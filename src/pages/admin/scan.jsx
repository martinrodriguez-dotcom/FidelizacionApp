import React, { useState, useEffect, useRef } from 'react';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  updateDoc 
} from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken
} from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  QrCode, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  UserPlus,
  Camera,
  Loader2
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

// Identificadores (Sanitizados para Firestore)
const appIdRaw = typeof __app_id !== 'undefined' ? __app_id : "dulce-sal-app";
const appIdSaaS = appIdRaw.replace(/\//g, '_'); 
const DULCE_SAL_ID = "dulce-sal-id"; 

export default function ScanPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scannedId, setScannedId] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [qrCodeUrl, setQrCodeUrl] = useState('#');
  const scannerRef = useRef(null);

  // Función de navegación segura
  const safeNavigate = (path) => {
    if (typeof window !== 'undefined' && path) {
      window.location.href = path;
    }
  };

  // 1. Proteger la ruta e inicializar Auth
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

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser && !loading) safeNavigate('/admin');
      setLoading(false);
    });

    if (typeof window !== 'undefined') {
      const registerUrl = `${window.location.origin}/customer`;
      // Generamos el QR de registro con el color rosa de la marca (ec4899)
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(registerUrl)}&margin=20&color=ec4899`);
    }

    return () => unsubscribe();
  }, [loading]);

  // 2. Inicializar la Cámara (html5-qrcode)
  useEffect(() => {
    if (loading || !user) return;

    let scanner = null;
    const script = document.createElement('script');
    script.src = "https://unpkg.com/html5-qrcode";
    script.async = true;

    script.onload = () => {
      scanner = new window.Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        false
      );
      scannerRef.current = scanner;
      scanner.render(
        (decodedText) => {
          if (scannerRef.current) scannerRef.current.pause(true);
          processScannedId(decodedText);
          setTimeout(() => { if (scannerRef.current) scannerRef.current.resume(); }, 4000);
        },
        () => {} // Ignorar errores de frame
      );
    };

    document.body.appendChild(script);
    return () => {
      if (scannerRef.current) scannerRef.current.clear().catch(e => console.error(e));
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, [loading, user]);

  // 3. Lógica de Suma de Puntos
  const processScannedId = async (uid) => {
    if (!uid.trim() || uid === '#') return;
    setScannedId(uid);
    setStatus({ type: 'loading', message: 'Validando cliente...' });

    try {
      const cardId = `${DULCE_SAL_ID}_${uid.trim()}`;
      const cardRef = doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'loyalty_cards', cardId);
      const cardSnap = await getDoc(cardRef);

      if (!cardSnap.exists()) {
        setStatus({ type: 'error', message: 'Cliente no encontrado en Dulce Sal.' });
        return;
      }

      const cardData = cardSnap.data();
      await updateDoc(cardRef, {
        visits: (cardData.visits || 0) + 1,
        points: (cardData.points || 0) + 10,
        lastVisit: new Date().toISOString()
      });

      setStatus({ 
        type: 'success', 
        message: `+10 puntos para ${cardData.customerName}. Total: ${cardData.points + 10} pts.` 
      });
      setTimeout(() => { setStatus({ type: '', message: '' }); setScannedId(''); }, 3500);

    } catch (error) {
      setStatus({ type: 'error', message: 'Error de conexión.' });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-rosa-50">
      <Loader2 className="text-rosa-500 animate-spin" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-rosa-100">
      <style dangerouslySetInnerHTML={{ __html: `
        #reader { border: none !important; border-radius: 2rem; overflow: hidden; background: white; }
        #reader__dashboard_section_csr button { background-color: #ec4899; color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 800; cursor: pointer; }
        #reader__scan_region img { object-fit: cover; border-radius: 2rem; }
      `}} />

      <header className="bg-white border-b border-slate-100 p-6 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <button onClick={() => safeNavigate('/admin')} className="p-2 hover:bg-rosa-50 text-slate-400 hover:text-rosa-600 rounded-xl transition-all">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Mostrador Dulce Sal</h1>
          <p className="text-[10px] font-black uppercase text-rosa-400 tracking-widest leading-none mt-1">Suma de Puntos</p>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* LADO IZQUIERDO: CÁMARA */}
          <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 text-center animate-in zoom-in duration-500">
            <div className="flex items-center justify-center gap-3 mb-8">
              <Camera className="text-rosa-500" size={28} />
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Escanear Cliente</h2>
            </div>
            
            <div className="w-full max-w-sm mx-auto mb-8 shadow-inner rounded-[2.5rem] overflow-hidden border-8 border-slate-50">
              <div id="reader" className="w-full"></div>
            </div>

            <div className="h-24 mb-6">
              {status.message ? (
                <div className={`p-5 rounded-2xl flex items-start gap-4 border text-left animate-in slide-in-from-bottom-2 ${
                  status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 
                  status.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' : 
                  'bg-rosa-50 border-rosa-100 text-rosa-800'
                }`}>
                  {status.type === 'success' ? <CheckCircle2 className="shrink-0 text-emerald-500" size={22} /> : 
                   status.type === 'error' ? <AlertCircle className="shrink-0 text-red-500" size={22} /> :
                   <Loader2 className="animate-spin text-rosa-500" size={22} />
                  }
                  <p className="font-bold text-sm leading-tight">{status.message}</p>
                </div>
              ) : (
                <p className="text-slate-400 text-sm font-medium px-8 italic">
                  Enfoca el código QR del cliente para procesar su visita automáticamente.
                </p>
              )}
            </div>

            <div className="pt-8 border-t border-slate-50">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-4">Ingreso Manual</p>
              <form onSubmit={(e) => { e.preventDefault(); processScannedId(scannedId); }} className="flex gap-3">
                <input
                  type="text" placeholder="UID del cliente..."
                  className="flex-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-rosa-500 font-mono text-xs"
                  value={scannedId} onChange={(e) => setScannedId(e.target.value)}
                />
                <button type="submit" className="bg-slate-900 text-white font-black px-6 py-4 rounded-2xl hover:bg-black transition-all active:scale-95">Sumar</button>
              </form>
            </div>
          </div>

          {/* LADO DERECHO: QR DE REGISTRO */}
          <div className="bg-rosa-500 p-10 rounded-[3rem] shadow-2xl shadow-rosa-200/50 text-white flex flex-col items-center justify-center text-center relative overflow-hidden animate-in zoom-in duration-500 delay-150">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-rosa-400 rounded-full blur-[100px] opacity-50"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="bg-white/20 w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 backdrop-blur-md border border-white/30 shadow-xl">
                <UserPlus size={36} className="text-white" />
              </div>
              <h2 className="text-3xl font-black mb-4 tracking-tighter italic">¿Cliente Nuevo?</h2>
              <p className="text-rosa-50 text-sm font-medium leading-relaxed max-w-xs mb-10 opacity-90">
                Pide que escaneen este código para unirse al programa VIP de Dulce Sal ahora mismo.
              </p>
              <div className="bg-white p-6 rounded-[3rem] shadow-2xl transform hover:rotate-2 transition-transform duration-500 cursor-pointer">
                {qrCodeUrl !== '#' ? (
                  <img src={qrCodeUrl} alt="QR Registro" className="w-52 h-52 rounded-2xl" />
                ) : (
                  <div className="w-52 h-52 bg-slate-50 animate-pulse rounded-2xl"></div>
                )}
              </div>
              <p className="mt-10 text-[10px] font-black uppercase tracking-[0.4em] text-rosa-200/60">Dulce Sal Loyalty</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
