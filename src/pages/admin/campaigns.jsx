import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { BarChart3, QrCode, Users, Award, Bell, Send } from 'lucide-react';
import { db } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout from '../../components/layouts/AdminLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

/**
 * Página de Campañas Push (Ruta: /admin/campaigns)
 * Permite al negocio redactar y enviar notificaciones push a su base de clientes.
 */
export default function CampaignsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [business, setBusiness] = useState(null);
  const [customerCount, setCustomerCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  
  // Estado del mensaje a enviar
  const [message, setMessage] = useState({ title: '', body: '' });
  const [status, setStatus] = useState({ type: '', text: '' }); // type: 'loading' | 'success' | 'error'

  // Proteger la ruta
  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  // Cargar datos del negocio y contar cuántos clientes tiene
  useEffect(() => {
    if (!user) return;

    const fetchBusinessData = async () => {
      try {
        const q = query(collection(db, 'businesses'), where('ownerId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const businessData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
          setBusiness(businessData);

          // Contar los clientes (tarjetas de fidelidad) asociados a este negocio
          const customersQuery = query(
            collection(db, 'loyalty_cards'),
            where('businessId', '==', businessData.id)
          );
          const custSnapshot = await getDocs(customersQuery);
          setCustomerCount(custSnapshot.size);
        }
        setLoadingData(false);
      } catch (error) {
        console.error("Error cargando datos:", error);
        setLoadingData(false);
      }
    };

    fetchBusinessData();
  }, [user]);

  // Configuración del menú lateral
  const navItems = [
    { label: 'Dashboard', icon: <BarChart3 />, path: '/admin', onClick: () => router.push('/admin') },
    { label: 'Escanear QR', icon: <QrCode />, path: '/admin/scan', onClick: () => router.push('/admin/scan') },
    { label: 'Clientes', icon: <Users />, path: '/admin/customers', onClick: () => router.push('/admin/customers') },
    { label: 'Recompensas', icon: <Award />, path: '/admin/rewards', onClick: () => router.push('/admin/rewards') },
    { label: 'Campañas Push', icon: <Bell />, path: '/admin/campaigns', onClick: () => router.push('/admin/campaigns') },
  ];

  // Función para manejar el envío de la campaña push
  const handleSendPush = (e) => {
    e.preventDefault();
    if (customerCount === 0) {
      setStatus({ type: 'error', text: 'No tienes clientes registrados para enviar notificaciones.' });
      return;
    }

    setStatus({ type: 'loading', text: 'Enviando campaña a los dispositivos...' });

    // Simulamos un tiempo de espera de red (FCM - Firebase Cloud Messaging)
    setTimeout(() => {
      setStatus({ 
        type: 'success', 
        text: `¡Campaña enviada con éxito a ${customerCount} dispositivos!` 
      });
      
      // Mostrar una notificación local de prueba si el usuario (dueño) dio permisos a su navegador
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(message.title, { 
          body: message.body,
          icon: '/icons/icon-192x192.png' // Icono de la PWA (asegúrate de tenerlo en public/icons/)
        });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }

      // Limpiar el formulario
      setMessage({ title: '', body: '' });
    }, 1500);
  };

  if (authLoading || loadingData) return null;

  return (
    <AdminLayout 
      businessName={business?.name} 
      navItems={navItems} 
      activePath="/admin/campaigns"
    >
      <div className="max-w-2xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Campañas Push</h1>
          <p className="text-slate-500 mt-1">Envía notificaciones directamente a los teléfonos de tus clientes.</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          
          <div className="flex items-center gap-4 mb-8 p-4 bg-indigo-50 text-indigo-800 rounded-xl border border-indigo-100">
            <Bell className="shrink-0" size={24} />
            <p className="text-sm font-medium">
              Esta campaña se enviará a <strong>{customerCount} clientes</strong> que han aceptado recibir notificaciones de tu negocio.
            </p>
          </div>

          <form onSubmit={handleSendPush} className="space-y-6">
            <Input
              label="Título de la Notificación"
              id="pushTitle"
              placeholder="Ej: ¡2x1 en toda la tienda!"
              value={message.title}
              onChange={(e) => setMessage({...message, title: e.target.value})}
              required
              maxLength={50}
            />

            <div className="w-full">
              <label htmlFor="pushBody" className="block text-sm font-medium text-slate-700 mb-1.5">
                Mensaje <span className="text-red-500">*</span>
              </label>
              <textarea
                id="pushBody"
                placeholder="Válido solo por hoy presentando tu tarjeta digital en la caja..."
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400 text-slate-800 h-32 resize-none"
                value={message.body}
                onChange={(e) => setMessage({...message, body: e.target.value})}
                required
                maxLength={150}
              />
              <p className="text-right text-xs text-slate-400 mt-1">{message.body.length}/150</p>
            </div>

            <Button 
              type="submit" 
              fullWidth 
              disabled={status.type === 'loading' || customerCount === 0}
              className="flex items-center justify-center gap-2"
            >
              {status.type === 'loading' ? 'Procesando envío...' : (
                <>
                  <Send size={18} /> Enviar Campaña
                </>
              )}
            </Button>
          </form>

          {/* Feedback de estado */}
          {status.text && (
            <div className={`mt-6 p-4 rounded-xl text-center font-bold text-sm ${
              status.type === 'success' ? 'bg-emerald-100 text-emerald-800' :
              status.type === 'error' ? 'bg-red-100 text-red-800' : 'text-slate-500'
            }`}>
              {status.text}
            </div>
          )}
          
        </div>

      </div>
    </AdminLayout>
  );
}
