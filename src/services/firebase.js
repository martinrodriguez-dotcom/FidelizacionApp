import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- CONFIGURACIÓN DE FIREBASE ---
// Credenciales de tu proyecto FidelizaPro
const firebaseConfig = {
  apiKey: "AIzaSyBqCo-N8hJo61cksLdW9JgJySSfEFJke64",
  authDomain: "fidelizacionapp-d3e8e.firebaseapp.com",
  projectId: "fidelizacionapp-d3e8e",
  storageBucket: "fidelizacionapp-d3e8e.firebasestorage.app",
  messagingSenderId: "86470097031",
  appId: "1:86470097031:web:fee57a2a8e6d471ccda022"
};

// Patrón Singleton: 
// Evita inicializar Firebase múltiples veces cuando navegas entre páginas en Next.js
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Inicializamos los servicios de Autenticación y Base de Datos (Firestore)
const auth = getAuth(app);
const db = getFirestore(app);

// Exportamos los servicios listos para usar en cualquier página
export { app, auth, db };
