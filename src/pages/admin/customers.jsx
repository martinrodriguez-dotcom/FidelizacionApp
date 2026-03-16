import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { BarChart3, QrCode, Users, Award, Bell, Download, Search } from 'lucide-react';
import { db } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';
import { exportCustomersToCSV } from '../../utils/csvExport';
import AdminLayout from '../../components/layouts/AdminLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

/**
 * Página de Gestión de Clientes (Ruta: /admin/customers)
 * Muestra la tabla de clientes del negocio y permite exportar los datos a CSV.
 */
export default function CustomersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [business, setBusiness] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  // Proteger la ruta
  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  // Cargar datos del negocio y escuchar cambios en la colección de clientes
  useEffect(() => {
    if (!user) return;

    const fetchBusinessAndCustomers = async () => {
      try {
        // 1. Obtener el negocio
        const q = query(collection(db, 'businesses'), where('ownerId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const businessData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
          setBusiness(businessData);

          // 2. Escuchar en tiempo real las tarjetas de fidelidad (clientes) de este negocio
          const customersQuery = query(
            collection(db, 'loyalty_cards'),
            where('businessId', '==', businessData.id)
          );

          const unsubscribe = onSnapshot(customersQuery, (custSnapshot) => {
            const customersList = custSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            // Ordenar por fecha de creación (los más nuevos primero)
            customersList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setCustomers(customersList);
            setLoadingData(false);
          });

          return () => unsubscribe();
        } else {
          setLoadingData(false);
        }
      } catch (error) {
        console.error("Error cargando clientes:", error);
        setLoadingData(false);
      }
    };

    fetchBusinessAndCustomers();
  }, [user]);

  // Configuración del menú lateral
  const navItems = [
    { label: 'Dashboard', icon: <BarChart3 />, path: '/admin', onClick: () => router.push('/admin') },
    { label: 'Escanear QR', icon: <QrCode />, path: '/admin/scan', onClick: () => router.push('/admin/scan') },
    { label: 'Clientes', icon: <Users />, path: '/admin/customers', onClick: () => router.push('/admin/customers') },
    { label: 'Recompensas', icon: <Award />, path: '/admin/rewards', onClick: () => router.push('/admin/rewards') },
    { label: 'Campañas Push', icon: <Bell />, path: '/admin/campaigns', onClick: () => router.push('/admin/campaigns') },
  ];

  // Función para manejar la exportación a CSV usando nuestra utilidad
  const handleExportCSV = () => {
    exportCustomersToCSV(customers, business.name);
  };

  // Filtrar clientes por búsqueda (nombre o email)
  const filteredCustomers = customers.filter(c => 
    c.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loadingData) return null;

  return (
    <AdminLayout 
      businessName={business?.name} 
      navItems={navItems} 
      activePath="/admin/customers"
    >
      <div className="space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Base de Clientes</h1>
            <p className="text-slate-500 mt-1">Gestiona a los usuarios registrados en tu programa.</p>
          </div>
          <Button 
            onClick={handleExportCSV} 
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Download size={18} /> Exportar CSV
          </Button>
        </div>

        {/* Barra de búsqueda */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
          <Search className="text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre o correo electrónico..."
            className="w-full bg-transparent outline-none text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Tabla de Clientes */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-5 font-bold uppercase tracking-wider text-xs">Cliente</th>
                  <th className="p-5 font-bold uppercase tracking-wider text-xs">Contacto</th>
                  <th className="p-5 font-bold uppercase tracking-wider text-xs text-center">Visitas</th>
                  <th className="p-5 font-bold uppercase tracking-wider text-xs text-center">Puntos</th>
                  <th className="p-5 font-bold uppercase tracking-wider text-xs">Fecha de Ingreso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-5">
                      <p className="font-bold text-slate-800">{customer.customerName}</p>
                      <p className="text-xs text-slate-500 font-mono mt-1" title="ID del Cliente">
                        ID: {customer.customerId.substring(0, 8)}...
                      </p>
                    </td>
                    <td className="p-5">
                      <p className="text-slate-700">{customer.customerEmail}</p>
                      <p className="text-slate-500 text-xs mt-1">{customer.customerPhone}</p>
                    </td>
                    <td className="p-5 text-center">
                      <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold">
                        {customer.visits}
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-bold">
                        {customer.points}
                      </span>
                    </td>
                    <td className="p-5 text-slate-500">
                      {new Date(customer.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}

                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-10 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <Users size={48} className="text-slate-300 mb-3" />
                        <p className="text-lg font-medium">No se encontraron clientes.</p>
                        <p className="text-sm">
                          {searchTerm 
                            ? "Intenta con otro término de búsqueda." 
                            : "Aún no tienes clientes registrados en tu programa de fidelidad."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
