import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';

/**
 * Custom Hook para manejar el estado de autenticación global en toda la app.
 * Retorna el objeto del usuario actual y un booleano indicando si está cargando.
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged es un listener de Firebase que se dispara al iniciar sesión, 
    // cerrar sesión o al recargar la página si la sesión sigue activa.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Limpiamos la suscripción cuando el componente que usa este hook se desmonta
    return () => unsubscribe();
  }, []);

  return { user, loading };
};
