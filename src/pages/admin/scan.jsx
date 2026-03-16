import React, { useState, useEffect } from 'react';
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
  ArrowLeft
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

  // 1. Proteger la ruta
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) window.location.href = '/';
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Función Principal: Validar Tarjeta y Sumar Puntos
  const handleScan = async (e) => {
    e.preventDefault();
    if (!scannedId.trim()) return;

    setStatus({ type: 'loading', message: 'Validando identidad del cliente...' });

    try {
      // Formamos el ID de la tarjeta exacto según la regla (negocio_cliente)
      const cardId = `${DULCE_SAL_ID}_${scannedId.trim()}`;
      
      // Apuntamos directamente a la ruta segura que autoriza Firebase Canvas
      const cardRef = doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'loyalty_cards', cardId);
      const cardSnap = await getDoc(cardRef);

      if (!cardSnap.exists()) {
        setStatus({ 
          type: 'error', 
          message: 'Error: El ID ingresado no corresponde a ningún cliente registrado en Dulce Sal.' 
        });
        return;
      }

      const cardData = cardSnap.data();
      const pointsToEarn = 10; // Puntos fijos otorgados por visita

      // Actualizar tarjeta
      await updateDoc(cardRef, {
        visits: (cardData.visits || 0) + 1,
        points: (cardData.points || 0) + pointsToEarn,
        lastVisit: new Date().toISOString()
      });

      setStatus({ 
        type: 'success', 
        message: `¡Visita registrada! ${cardData.customerName} tiene ahora ${(cardData.visits || 0) + 1} visitas.` 
      });
      
      setScannedId(''); // Limpiar input para el siguiente cliente

    } catch (error) {
      console.error("Error validando QR:", error);
      setStatus({ 
        type: 'error', 
        message: 'Ocurrió un error de conexión o permisos. Asegúrate de estar ingresando el ID correcto.' 
      });
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      <header className="bg-white border-b border-slate-100 p-6 flex items-center gap-4 sticky top-0">
        <button 
          onClick={() => window.location.href = '/admin'}
          className="p-2 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Escanear Tarjeta</h1>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Dulce Sal Loyalty</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 text-center animate-in zoom-in duration-500">
          
          <div className="bg-indigo-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <QrCode size={40} className="text-indigo-600" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-2">Simulador de Escáner</h2>
          <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
            Ingresa el <strong>UID</strong> que aparece en la tarjeta digital del cliente para registrar su visita y sumarle puntos.
          </p>

          <form onSubmit={handleScan} className="space-y-6">
            <div className="text-left">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">ID de Cliente</label>
              <input
                type="text"
                placeholder="Pega el código aquí..."
                className="w-full mt-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono text-slate-700"
                value={scannedId}
                onChange={(e) => setScannedId(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={status.type === 'loading'}
              className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {status.type === 'loading' ? 'Validando...' : 'Sumar Puntos al Cliente'}
            </button>
          </form>

          {/* Feedback Visual */}
          {status.message && (
            <div className={`mt-8 p-5 rounded-2xl flex items-start gap-3 border text-left animate-in slide-in-from-bottom-4 ${
              status.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-lg shadow-emerald-100/50' : 
              status.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'hidden'
            }`}>
              {status.type === 'success' ? (
                <CheckCircle2 className="shrink-0 mt-0.5 text-emerald-500" size={20} />
              ) : (
                <AlertCircle className="shrink-0 mt-0.5 text-red-500" size={20} />
              )}
              <p className="font-bold text-sm leading-relaxed">{status.message}</p>
            </div>
          )}
        </div>
      </main>
      
    </div>
  );
}
