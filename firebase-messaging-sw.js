// IMPORTANTE: Este archivo debe guardarse en la carpeta "public" de tu proyecto Next.js
// Ruta exacta: public/firebase-messaging-sw.js

// 1. Importamos las librerías base de Firebase necesarias para el Service Worker
// Usamos la versión "compat" que es compatible con Service Workers tradicionales
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// 2. Inicializamos Firebase dentro del Service Worker
// Debes reemplazar estos valores con las mismas credenciales que usaste en src/services/firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyBqCo-N8hJo61cksLdW9JgJySSfEFJke64",
  authDomain: "fidelizacionapp-d3e8e.firebaseapp.com",
  projectId: "fidelizacionapp-d3e8e",
  storageBucket: "fidelizacionapp-d3e8e.firebasestorage.app",
  messagingSenderId: "86470097031",
  appId: "1:86470097031:web:fee57a2a8e6d471ccda022"
};

// Inicializar la app si no existe ya
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// 3. Inicializar el servicio de mensajería (FCM)
const messaging = firebase.messaging();

// 4. Configurar qué hacer cuando llega un mensaje en SEGUNDO PLANO
// (Cuando el usuario no tiene la app de Dulce Sal abierta)
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Mensaje recibido en background:', payload);

  // Extraer los datos del mensaje enviado desde tu panel admin
  // Si no viene title/body en notification, busca en data (depende de cómo se envíe desde el backend)
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Nuevo Mensaje de Dulce Sal';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || '¡Abre la app para ver tus beneficios!',
    // Ícono que aparecerá en la notificación de Android/PC (Asegúrate de tener un icono aquí)
    icon: '/icons/icon-192x192.png',
    // El badge es el icono pequeñito monocromático que sale en la barra superior de Android
    badge: '/icons/icon-192x192.png',
    // La URL a la que irá el usuario si hace clic en la notificación
    data: {
      click_action: '/' // Envía al usuario al portal de inicio
    },
    // Opciones visuales
    requireInteraction: true, // Mantener la notificación en pantalla hasta que el usuario interactúe
    vibrate: [200, 100, 200] // Patrón de vibración clásico
  };

  // Mostrar la notificación usando la API del Service Worker
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 5. Configurar el evento de clic en la notificación
// Define qué ocurre cuando el usuario "toca" el mensajito en su celular
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notificación clickeada.');
  
  // Cerramos la notificación para que no se quede estorbando
  event.notification.close();

  // Extraemos la URL guardada en 'data.click_action' o usamos la raíz por defecto
  const urlToOpen = event.notification.data?.click_action || '/';

  // Lógica para abrir o enfocar la pestaña correcta
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      // Si el usuario ya tiene una pestaña de Dulce Sal abierta, la traemos al frente
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no tiene ninguna pestaña abierta, abrimos una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
