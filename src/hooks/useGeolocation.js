import { useState, useEffect } from 'react';
import { getDistanceInMeters } from '../utils/haversine';

/**
 * Custom Hook para rastrear la ubicación del usuario en tiempo real 
 * y alertar si está cerca de un objetivo (Geofencing).
 * @param {Object} targetLocation - Objeto con { lat, lng, radius } del negocio
 * @param {Function} onEnterRadius - Callback que se ejecuta al entrar al radio definido
 */
export const useGeolocation = (targetLocation, onEnterRadius) => {
  const [error, setError] = useState(null);
  const [isNear, setIsNear] = useState(false);

  useEffect(() => {
    // Verificamos soporte del navegador y que existan coordenadas objetivo
    if (!targetLocation || !targetLocation.lat || !targetLocation.lng || !('geolocation' in navigator)) {
      setError('Geolocalización no soportada o datos de objetivo faltantes.');
      return;
    }

    let notificationTriggered = false;

    // Iniciar rastreo continuo de la posición del dispositivo
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Calcular la distancia actual usando la fórmula de Haversine
        const distance = getDistanceInMeters(
          latitude, longitude, 
          targetLocation.lat, targetLocation.lng
        );

        // Actualizamos estado si está dentro del radio definido (ej. 200 metros)
        const currentlyNear = distance <= targetLocation.radius;
        setIsNear(currentlyNear);

        // Si entramos al radio por primera vez en esta sesión, disparamos el evento (Push local)
        if (currentlyNear && !notificationTriggered) {
          notificationTriggered = true;
          if (onEnterRadius) {
            onEnterRadius(distance);
          }
        }
      },
      (geoError) => {
        setError(geoError.message);
      },
      { 
        enableHighAccuracy: true, // Forzamos uso de GPS si está disponible
        maximumAge: 10000, 
        timeout: 5000 
      }
    );

    // Limpiar el rastreador al desmontar el componente para evitar fugas de memoria
    return () => navigator.geolocation.clearWatch(watchId);
  }, [targetLocation, onEnterRadius]);

  return { isNear, error };
};
