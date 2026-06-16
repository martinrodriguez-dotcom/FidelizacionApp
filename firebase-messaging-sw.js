// Importamos los scripts nativos de Firebase para trabajar en segundo plano
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Pegamos tu configuración exacta de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBqCo-N8hJo61cksLdW9JgJySSfEFJke64",
  authDomain: "fidelizacionapp-d3e8e.firebaseapp.com",
  projectId: "fidelizacionapp-d3e8e",
  storageBucket: "fidelizacionapp-d3e8e.firebasestorage.app",
  messagingSenderId: "86470097031",
  appId: "1:86470097031:web:fee57a2a8e6d471ccda022"
};

// Inicializamos Firebase en segundo plano
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Esta función "atrapa" el mensaje cuando llega y muestra la alerta en la pantalla
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje recibido en segundo plano: ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    // Puedes cambiar esta URL por el logo real de Dulce Sal
    icon: 'https://cdn-icons-png.flaticon.com/512/838/838002.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/838/838002.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
