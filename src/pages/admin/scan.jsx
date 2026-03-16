import React, { useState, useEffect, useRef } from 'react';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  updateDoc 
} from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged 
} from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  QrCode, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  UserPlus,
  Camera
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

export default function ScanPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scannedId, setScannedId] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const scannerRef = useRef(null);

  // 1. Proteger la ruta y generar URL del QR
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) window.location.href = '/';
      setLoading(false);
    });

    if (typeof window !== 'undefined') {
      const registerUrl = `${window.location.origin}/customer`;
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(registerUrl)}&margin=20`);
    }

    return () => unsubscribe();
  }, []);

  // 2. Inicializar la Cámara (html5-qrcode dinámico)
  useEffect(() => {
    if (loading) return;

    let scanner = null;

    // Inyectamos la librería dinámicamente para no depender de npm install
    const script = document.createElement('script');
    script.src = "https://unpkg.com/html5-qrcode";
    script.async = true;

    script.onload = () => {
      // Configuramos el escáner
      scanner = new window.Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        /* verbose= */ false
      );
      
      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          // Éxito al escanear: pausamos para no escanear 100 veces el mismo QR en un segundo
          if (scannerRef.current) scannerRef.current.pause(true);
          
          processScannedId(decodedText);
          
          // Reanudamos la cámara después de 4 segundos
          setTimeout(() => {
            if (scannerRef.current) scannerRef.current.resume();
          }, 4000);
        },
        (errorMessage) => {
          // Ignoramos los errores de lectura frame a frame (son normales)
        }
      );
    };

    document.body.appendChild(script);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error(e));
      }
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [loading]);

  // 3. Procesar el ID escaneado (cámara o manual)
  const processScannedId = async (uid) => {
    if (!uid.trim()) return;

    setScannedId(uid); // Lo mostramos en el input
    setStatus({ type: 'loading', message: 'Validando identidad del cliente...' });

    try {
      const cardId = `${DULCE_SAL_ID}_${uid.trim()}`;
      const cardRef = doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'loyalty_cards', cardId);
      const cardSnap = await getDoc(cardRef);

      if (!cardSnap.exists()) {
        setStatus({ 
          type: 'error', 
          message: 'Error: Esta tarjeta no pertenece a Dulce Sal o el cliente no está registrado.' 
        });
        return;
      }

      const cardData = cardSnap.data();
      const pointsToEarn = 10; 

      await updateDoc(cardRef, {
        visits: (cardData.visits || 0) + 1,
        points: (cardData.points || 0) + pointsToEarn,
        lastVisit: new Date().toISOString()
      });

      setStatus({ 
        type: 'success', 
        message: `¡Éxito! +${pointsToEarn} puntos sumados a ${cardData.customerName}. (Total: ${(cardData.visits || 0) + 1} visitas)` 
      });
      
      setTimeout(() => setScannedId(''), 3000); 

    } catch (error) {
      console.error("Error validando QR:", error);
      setStatus({ 
        type: 'error', 
        message: 'Ocurrió un error. Verifica tu conexión a internet.' 
      });
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    processScannedId(scannedId);
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Estilos para limpiar la interfaz de la librería de escaneo */}
      <style dangerouslySetInnerHTML={{ __html: `
        #reader { border: none !important; border-radius: 1.5rem; overflow: hidden; background: #f8fafc; }
        #reader__dashboard_section_csr span { font-family: inherit; font-weight: bold; color: #475569; }
        #reader__dashboard_section_csr button { background-color: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 10px; }
        #reader__dashboard_section_swaplink { display: none; }
        #reader__scan_region img { object-fit: cover; border-radius: 1.5rem; }
      `}} />

      <header className="bg-white border-b border-slate-100 p-6 flex items-center gap-4 sticky top-0 z-10">
        <button 
          onClick={() => window.location.href = '/admin'}
          className="p-2 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Mostrador Virtual</h1>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Dulce Sal Loyalty</p>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* PANEL IZQUIERDO: CÁMARA Y ESCÁNER */}
          <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 text-center animate-in zoom-in duration-500 flex flex-col">
            
            <div className="flex items-center justify-center gap-3 mb-6">
              <Camera className="text-indigo-600" size={28} />
              <h2 className="text-2xl font-black text-slate-900">Escanear Tarjeta</h2>
            </div>
            
            {/* CONTENEDOR DE LA CÁMARA */}
            <div className="w-full max-w-sm mx-auto mb-6 shadow-inner rounded-3xl overflow-hidden border-4 border-slate-50">
              <div id="reader" className="w-full"></div>
            </div>

            {/* Feedback Visual */}
            <div className="h-20 mb-6 flex items-center justify-center">
              {status.message ? (
                <div className={`w-full p-4 rounded-2xl flex items-start gap-3 border text-left animate-in slide-in-from-bottom-2 ${
                  status.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
                  status.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 
                  'bg-indigo-50 border-indigo-200 text-indigo-800'
                }`}>
                  {status.type === 'success' ? <CheckCircle2 className="shrink-0 mt-0.5 text-emerald-500" size={20} /> : 
                   status.type === 'error' ? <AlertCircle className="shrink-0 mt-0.5 text-red-500" size={20} /> :
                   <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0 mt-0.5"></div>
                  }
                  <p className="font-bold text-sm leading-tight">{status.message}</p>
                </div>
              ) : (
                <p className="text-slate-400 text-sm font-medium px-6">
                  Apunta con la cámara al código QR del cliente para sumar sus puntos automáticamente.
                </p>
              )}
            </div>

            {/* Fallback Manual */}
            <div className="pt-6 border-t border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">¿La cámara falló? Ingreso Manual</p>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escribe el UID aquí..."
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm text-slate-700"
                  value={scannedId}
                  onChange={(e) => setScannedId(e.target.value)}
                />
                <button 
                  type="submit" 
                  disabled={status.type === 'loading' || !scannedId.trim()}
                  className="bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-black transition-all disabled:opacity-50"
                >
                  Sumar
                </button>
              </form>
            </div>
          </div>

          {/* PANEL DERECHO: QR DE DULCE SAL SIEMPRE VISIBLE */}
          <div className="bg-indigo-600 p-10 rounded-[3rem] shadow-2xl shadow-indigo-200/50 text-white flex flex-col items-center justify-center text-center relative overflow-hidden animate-in zoom-in duration-500 delay-100">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/50 rounded-full blur-[80px]"></div>
            
            <div className="relative z-10 w-full flex flex-col items-center">
              <div className="bg-white/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 border border-white/20">
                <UserPlus size={32} className="text-white" />
              </div>
              
              <h2 className="text-3xl font-black mb-3 tracking-tight">Invitar Cliente Nuevo</h2>
              <p className="text-indigo-100 text-sm font-medium leading-relaxed max-w-xs mb-10">
                Pide a tu cliente que escanee este código para crear su tarjeta de Dulce Sal al instante.
              </p>

              {/* Contenedor del QR */}
              <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl transition-transform hover:scale-105">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Registro Dulce Sal" className="w-48 h-48 md:w-56 md:h-56 rounded-2xl" />
                ) : (
                  <div className="w-48 h-48 bg-slate-100 rounded-2xl animate-pulse"></div>
                )}
              </div>
              
              <p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200/50">
                Dulce Sal Loyalty
              </p>
            </div>
          </div>

        </div>
      </main>
      
    </div>
  );
}
