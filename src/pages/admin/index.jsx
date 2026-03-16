import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { BarChart3, QrCode, Users, Award, Bell, Store } from 'lucide-react';
import { db } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout from '../../components/layouts/AdminLayout';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';

/**
 * Página principal del Dashboard del Negocio (Ruta: /admin)
 * Muestra las estadísticas generales y el menú de navegación.
 */
export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [business, setBusiness] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Redirigir si no hay usuario logueado
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Cargar datos del negocio y sus clientes desde Firestore
  useEffect(() => {
    if (!user) return;

    // 1. Buscar el negocio que pertenece a este usuario
    const businessQuery = query(
      collection(db, 'businesses'), 
      where('ownerId', '==', user.uid)
    );

    const unsubscribeBusiness = onSnapshot(businessQuery, (snapshot) => {
      if (!snapshot.empty) {
        const businessData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        setBusiness(businessData);

        // 2. Si encontramos el negocio, buscamos sus clientes (tarjetas de fidelidad)
        const customersQuery = query(
          collection(db, 'loyalty_cards'),
          where('businessId', '==', businessData.id)
        );

        const unsubscribeCustomers = onSnapshot(customersQuery, (custSnapshot) => {
          const customersList = custSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setCustomers(customersList);
          setLoadingData(false);
        });

        return () => unsubscribeCustomers();
      } else {
        // Si el usuario está logueado pero no tiene negocio, lo mandamos a crearlo
        router.push('/admin/setup');
      }
    }, (error) => {
      console.error("Error cargando dashboard:", error);
      setLoadingData(false);
    });

    return () => unsubscribeBusiness();
  }, [user, router]);

  // Configuración del menú lateral para el AdminLayout
  const navItems = [
    { label: 'Dashboard', icon: <BarChart3 />, path: '/admin', onClick: () => router.push('/admin') },
    { label: 'Escanear QR', icon: <QrCode />, path: '/admin/scan', onClick: () => router.push('/admin/scan') },
    { label: 'Clientes', icon: <Users />, path: '/admin/customers', onClick: () => router.push('/admin/customers') },
    { label: 'Recompensas', icon: <Award />, path: '/admin/rewards', onClick: () => router.push('/admin/rewards') },
    { label: 'Campañas Push', icon: <Bell />, path: '/admin/campaigns', onClick: () => router.push('/admin/campaigns') },
  ];

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-indigo-600 font-bold">
        Cargando tu panel de control...
      </div>
    );
  }

  // Cálculos de estadísticas
  const totalVisits = customers.reduce((acc, curr) => acc + (curr.visits || 0), 0);
  const totalPoints = customers.reduce((acc, curr) => acc + (curr.points || 0), 0);
  
  // Obtener los últimos 5 clientes recientes
  const recentCustomers = [...customers]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <AdminLayout 
      businessName={business?.name} 
      navItems={navItems} 
      activePath="/admin"
    >
      <div className="space-y-8">
        
        {/* Encabezado del Dashboard */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Vista General</h1>
            <p className="text-slate-500 mt-1">Bienvenido de nuevo. Aquí tienes el resumen de tu programa de fidelización.</p>
          </div>
          <Button onClick={() => router.push('/admin/scan')} className="md:w-auto">
            <QrCode className="mr-2" size={20} /> Escanear Tarjeta
          </Button>
        </div>

        {/* Tarjetas de Estadísticas (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Clientes" 
            value={customers.length} 
            icon={<Users size={28} />} 
          />
          <StatCard 
            title="Visitas Totales" 
            value={totalVisits} 
            icon={<Store size={28} className="text-emerald-500" />} 
          />
          <StatCard 
            title="Puntos Otorgados" 
            value={totalPoints} 
            icon={<Award size={28} className="text-amber-500" />} 
          />
        </div>

        {/* Tabla de Clientes Recientes */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Clientes Recientes</h2>
            <button 
              onClick={() => router.push('/admin/customers')}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-bold transition-colors"
            >
              Ver todos &rarr;
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-4 font-medium">Cliente</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Visitas</th>
                  <th className="p-4 font-medium">Puntos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{customer.customerName}</td>
                    <td className="p-4 text-slate-500">{customer.customerEmail}</td>
                    <td className="p-4">
                      <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold">
                        {customer.visits}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full font-bold">
                        {customer.points}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentCustomers.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-slate-500">
                      Aún no tienes clientes registrados en tu programa de fidelidad.
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
