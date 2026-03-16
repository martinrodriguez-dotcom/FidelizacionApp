import React from 'react';
import { useRouter } from 'next/router';
import { Store, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

/**
 * Página principal de la aplicación (Ruta: /)
 * Funciona como un selector para dirigir a los usuarios a sus respectivos portales.
 */
export default function Home() {
  const router = useRouter();
  const { loading } = useAuth();

  // Mientras verifica el estado de Firebase, mostramos un estado de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-indigo-600 font-bold text-xl">
        Cargando Plataforma SaaS...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      
      {/* Cabecera Principal */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
          FidelizaPro SaaS
        </h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto">
          La plataforma definitiva de fidelización de clientes y marketing automation para comercios físicos.
        </p>
      </div>
      
      {/* Selector de Roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        
        {/* Tarjeta de Acceso para Negocios */}
        <button 
          onClick={() => router.push('/admin/setup')}
          className="flex flex-col items-center p-10 bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all border border-slate-100 group"
        >
          <div className="bg-indigo-50 p-6 rounded-full mb-6 group-hover:bg-indigo-100 transition-colors">
            <Store size={48} className="text-indigo-600 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Soy un Negocio</h2>
          <p className="text-slate-500 text-center leading-relaxed">
            Crea tu programa de recompensas, escanea los códigos QR de tus clientes y envía notificaciones push.
          </p>
        </button>

        {/* Tarjeta de Acceso para Clientes */}
        <button 
          onClick={() => router.push('/directory')}
          className="flex flex-col items-center p-10 bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all border border-slate-100 group"
        >
          <div className="bg-emerald-50 p-6 rounded-full mb-6 group-hover:bg-emerald-100 transition-colors">
            <User size={48} className="text-emerald-600 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Soy un Cliente</h2>
          <p className="text-slate-500 text-center leading-relaxed">
            Descubre negocios cercanos, acumula puntos en cada visita y canjea increíbles recompensas exclusivas.
          </p>
        </button>

      </div>
    </div>
  );
}
