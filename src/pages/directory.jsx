import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, getDocs } from 'firebase/firestore';
import { ArrowLeft, Store, MapPin, Search } from 'lucide-react';
import { db } from '../services/firebase';
import Button from '../components/ui/Button';

/**
 * Página del Directorio de Negocios (Ruta: /directory)
 * Lista todos los comercios públicos para que los clientes puedan unirse a sus programas.
 */
export default function DirectoryPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Cargar todos los negocios registrados en la plataforma
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'businesses'));
        const businessList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBusinesses(businessList);
        setLoading(false);
      } catch (error) {
        console.error("Error al cargar los negocios:", error);
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, []);

  // Filtrar negocios por nombre o dirección
  const filteredBusinesses = businesses.filter(b => 
    b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* Cabecera (Navbar simple) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => router.push('/')} 
            className="flex items-center text-slate-500 hover:text-indigo-600 font-medium transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" /> Volver
          </button>
          <h1 className="text-xl font-extrabold text-slate-800">Directorio de Comercios</h1>
          <div className="w-20"></div> {/* Espaciador para centrar el título */}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Sección de Bienvenida y Búsqueda */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-800 mb-3">Encuentra tus lugares favoritos</h2>
          <p className="text-slate-500 mb-8">Únete a los programas de fidelización, acumula puntos y canjea recompensas exclusivas en los comercios afiliados a FidelizaPro.</p>
          
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center max-w-lg mx-auto focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
            <div className="pl-4 pr-2 text-slate-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre o dirección..."
              className="w-full bg-transparent outline-none py-3 text-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Grid de Negocios */}
        {loading ? (
          <div className="flex justify-center items-center py-20 text-indigo-600 font-bold">
            Cargando comercios...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map(business => (
              <div key={business.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col h-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-indigo-50 p-4 rounded-2xl">
                    <Store className="text-indigo-600" size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 leading-tight">{business.name}</h3>
                    <div className="flex items-center text-slate-500 text-sm mt-1">
                      <MapPin size={14} className="mr-1 shrink-0" />
                      <span className="truncate">{business.address}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 border-t border-slate-100">
                  <Button 
                    fullWidth 
                    variant="outline"
                    onClick={() => router.push(`/${business.id}`)}
                  >
                    Ver Programa de Fidelidad
                  </Button>
                </div>
              </div>
            ))}

            {filteredBusinesses.length === 0 && !loading && (
              <div className="col-span-full text-center py-12">
                <Store size={48} className="text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-700">No se encontraron comercios</h3>
                <p className="text-slate-500 mt-1">Intenta ajustando tu búsqueda o vuelve más tarde.</p>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
