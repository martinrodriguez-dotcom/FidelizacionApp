import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { BarChart3, QrCode, Users, Award, Bell, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout from '../../components/layouts/AdminLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

/**
 * Página para Escanear QR y validar visitas (Ruta: /admin/scan)
 * Permite al negocio registrar una nueva visita de un cliente y sumarle puntos.
 */
export default function ScanPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [business, setBusiness] = useState(null);
  const [scannedId, setScannedId] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' }); // type: 'success' | 'error' | 'loading'

  // Proteger la ruta
  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  // Cargar los datos del negocio actual
  useEffect(() => {
    if (!user) return;
    const fetchBusiness = async () => {
      const q = query(collection(db, 'businesses'), where('ownerId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setBusiness({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
      }
    };
    fetchBusiness();
  }, [user]);

  // Configuración del menú lateral
  const navItems = [
    { label: 'Dashboard', icon: <BarChart3 />, path: '/admin', onClick: () => router.push('/admin') },
    { label: 'Escanear QR', icon: <QrCode />, path: '/admin/scan', onClick: () => router.push('/admin/scan') },
    { label: 'Clientes', icon: <Users />, path: '/admin/customers', onClick: () => router.push('/admin/customers') },
    { label: 'Recompensas', icon: <Award />, path: '/admin/rewards', onClick: () => router.push('/admin/rewards') },
    { label: 'Campañas Push', icon: <Bell />, path: '/admin/campaigns', onClick: () => router.push('/admin/campaigns') },
  ];

  // Función principal: Validar el escaneo
  const handleScan = async (e) => {
    e.preventDefault();
    if (!scannedId.trim() || !business) return;

    setStatus({ type: 'loading', message: 'Validando tarjeta...' });

    try {
      // Buscar la tarjeta de fidelidad que coincida con el negocio actual y el ID del cliente
      const cardQuery = query(
        collection(db, 'loyalty_cards'),
        where('businessId', '==', business.id),
        where('customerId', '==', scannedId.trim())
      );
      
      const querySnapshot = await getDocs(cardQuery);

      if (querySnapshot.empty) {
        setStatus({ 
          type: 'error', 
          message: 'Cliente no encontrado o no está registrado en tu programa de fidelización.' 
        });
        return;
      }

      // Obtener el documento de la tarjeta
      const cardDoc = querySnapshot.docs[0];
      const cardData = cardDoc.data();

      // Puntos a sumar por visita (Configurable en el futuro)
      const pointsToEarn = 10; 

      // Actualizar la base de datos
      const cardRef = doc(db, 'loyalty_cards', cardDoc.id);
      await updateDoc(cardRef, {
        visits: cardData.visits + 1,
        points: cardData.points + pointsToEarn,
        lastVisit: new Date().toISOString()
      });

      // Mostrar éxito y limpiar el input
      setStatus({ 
        type: 'success', 
        message: `¡Visita registrada con éxito! ${cardData.customerName} ahora tiene ${cardData.visits + 1} visitas y ${cardData.points + pointsToEarn} puntos.` 
      });
      setScannedId('');

    } catch (error) {
      console.error("Error al validar QR:", error);
      setStatus({ type: 'error', message: 'Ocurrió un error al procesar la visita. Intenta nuevamente.' });
    }
  };

  if (authLoading || !business) return null;

  return (
    <AdminLayout 
      businessName={business.name} 
      navItems={navItems} 
      activePath="/admin/scan"
    >
      <div className="max-w-2xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Escanear Tarjeta</h1>
          <p className="text-slate-500 mt-1">Registra las visitas de tus clientes para otorgarles puntos.</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-center mb-8">
            <div className="bg-indigo-50 p-6 rounded-3xl">
              <QrCode size={80} className="text-indigo-600" />
            </div>
          </div>

          <form onSubmit={handleScan} className="space-y-6">
            <Input
              label="ID del Cliente (Simulador de Escáner)"
              id="scannedId"
              placeholder="Ingresa el ID que aparece bajo el QR del cliente..."
              value={scannedId}
              onChange={(e) => setScannedId(e.target.value)}
              required
            />

            <Button 
              type="submit" 
              fullWidth 
              disabled={status.type === 'loading'}
            >
              {status.type === 'loading' ? 'Validando...' : 'Registrar Visita'}
            </Button>
          </form>

          {/* Mensajes de Feedback */}
          {status.message && (
            <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 border ${
              status.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
              status.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'hidden'
            }`}>
              {status.type === 'success' ? (
                <CheckCircle2 className="shrink-0 mt-0.5" size={20} />
              ) : (
                <AlertCircle className="shrink-0 mt-0.5" size={20} />
              )}
              <p className="font-medium text-sm">{status.message}</p>
            </div>
          )}
        </div>
        
      </div>
    </AdminLayout>
  );
}
