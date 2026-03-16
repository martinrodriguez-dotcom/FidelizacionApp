import React from 'react';

// ============================================================================
// NOTA PARA TU PROYECTO LOCAL (VS CODE):
// Por favor, descomenta las siguientes dos líneas en tu entorno local
// y elimina la constante "Head" simulada de abajo.
// ============================================================================
// import '../styles/globals.css';
// import Head from 'next/head';

// --- Componente simulado para evitar problemas en esta vista previa ---
const Head = ({ children }) => <>{children}</>;
// ----------------------------------------------------------------------

/**
 * Componente Raíz de la Aplicación (_app.jsx)
 * Este archivo es fundamental en Next.js para inicializar todas las páginas.
 */
export default function MyApp({ Component, pageProps }) {
  // Componente de respaldo en caso de renderizarse sin Component
  const ActiveComponent = Component || function PreviewFallback() {
    return (
      <div className="flex min-h-screen items-center justify-center p-10 text-center text-slate-500 font-bold">
        La estructura base _app.jsx está lista para tu proyecto.
      </div>
    );
  };

  return (
    <>
      <Head>
        {/* Asegura que la app se vea como una aplicación nativa en móviles y evita el zoom al tocar inputs */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <title>Dulce Sal Loyalty</title>
      </Head>
      
      <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
        {/* Se envuelve la aplicación en un contenedor base para asegurar 
            que el fondo y el comportamiento de selección de texto sean consistentes.
        */}
        <ActiveComponent {...pageProps} />
      </div>
    </>
  );
}
