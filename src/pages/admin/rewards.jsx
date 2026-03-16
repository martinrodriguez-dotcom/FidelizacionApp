import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { BarChart3, QrCode, Users, Award, Bell, Plus, Trash2, Gift } from 'lucide-react';
import { db } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout from '../../components/layouts/AdminLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

/**
 * Página de Gestión de Recompensas (Ruta: /admin/rewards)
 * Permite al negocio crear y eliminar reglas de recompensas para sus clientes.
 */
export default function RewardsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [business, setBusiness] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado del formulario para nueva recompensa
  const [formData, setFormData] = useState({
    title: '',
    conditionType: 'visits', // 'visits' o 'points'
    conditionValue: 10
  });

  // Proteger la ruta
  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  // Cargar negocio y suscribirse a la colección de recompensas
  useEffect(() => {
    if (!user) return;

    const fetchBusinessAndRewards = async () => {
      try {
        // 1. Obtener el negocio del usuario actual
        const q = query(collection(db, 'businesses'), where('ownerId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const businessData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
          setBusiness(businessData);

          // 2. Escuchar en tiempo real las recompensas de este negocio
          const rewardsQuery = query(
            collection(db, 'rewards'),
            where('businessId', '==', businessData.id)
          );

          const unsubscribe = onSnapshot(rewardsQuery, (snapshot) => {
            const rewardsList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setRewards(rewardsList);
            setLoadingData(false);
          });

          return () => unsubscribe();
        } else {
          setLoadingData(false);
        }
      } catch (error) {
        console.error("Error cargando recompensas:", error);
        setLoadingData(false);
      }
    };

    fetchBusinessAndRewards();
  }, [user]);

  // Configuración del menú lateral
  const navItems = [
    { label: 'Dashboard', icon: <BarChart3 />, path: '/admin', onClick: () => router.push('/admin') },
    { label: 'Escanear QR', icon: <QrCode />, path: '/admin/scan', onClick: () => router.push('/admin/scan') },
    { label: 'Clientes', icon: <Users />, path: '/admin/customers', onClick: () => router.push('/admin/customers') },
    { label: 'Recompensas', icon: <Award />, path: '/admin/rewards', onClick: () => router.push('/admin/rewards') },
    { label: 'Campañas Push', icon: <Bell />, path: '/admin/campaigns', onClick: () => router.push('/admin/campaigns') },
  ];

  // Manejar la creación de una nueva recompensa
  const handleAddReward = async (e) => {
    e.preventDefault();
    if (!business || !formData.title.trim() || formData.conditionValue <= 0) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'rewards'), {
        businessId: business.id,
        title: formData.title,
        conditionType: formData.conditionType,
        conditionValue: parseInt(formData.conditionValue),
        createdAt: new Date().toISOString()
      });

      // Limpiar formulario tras guardar
      setFormData({ title: '', conditionType: 'visits', conditionValue: 10 });
    } catch (error) {
      console.error("Error al crear recompensa:", error);
      alert("Hubo un error al guardar la recompensa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar la eliminación de una recompensa
  const handleDeleteReward = async (rewardId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta recompensa?")) return;
    
    try {
      await deleteDoc(doc(db, 'rewards', rewardId));
    } catch (error) {
      console.error("Error al eliminar recompensa:", error);
      alert("Hubo un error al eliminar la recompensa.");
    }
  };

  if (authLoading || loadingData) return null;

  return (
    <AdminLayout 
      businessName={business?.name} 
      navItems={navItems} 
      activePath="/admin/rewards"
    >
      <div className="space-y-8 max-w-4xl">
        
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Reglas de Recompensas</h1>
          <p className="text-slate-500 mt-1">Configura qué premios obtienen tus clientes al alcanzar ciertas metas.</p>
        </div>

        {/* Formulario para agregar nueva recompensa */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Plus className="text-indigo-600" /> Crear Nueva Recompensa
          </h2>
          
          <form onSubmit={handleAddReward} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-5">
              <Input
                label="Premio o Beneficio"
                id="title"
                placeholder="Ej: Un café americano gratis"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>
            
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Condición de Desbloqueo</label>
              <select 
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-800"
                value={formData.conditionType}
                onChange={(e) => setFormData({...formData, conditionType: e.target.value})}
              >
                <option value="visits">Cantidad de Visitas</option>
                <option value="points">Puntos Acumulados</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <Input
                label="Meta requerida"
                id="conditionValue"
                type="number"
                min="1"
                value={formData.conditionValue}
                onChange={(e) => setFormData({...formData, conditionValue: e.target.value})}
                required
              />
            </div>

            <div className="md:col-span-2 pb-0.5">
              <Button type="submit" fullWidth disabled={isSubmitting}>
                Añadir
              </Button>
            </div>
          </form>
        </div>

        {/* Lista de Recompensas Activas */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">Recompensas Activas ({rewards.length})</h3>
          
          {rewards.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center">
              <Gift size={48} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No tienes recompensas configuradas.</p>
              <p className="text-sm text-slate-400 mt-1">Tus clientes no tendrán metas que alcanzar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rewards.map(reward => (
                <div key={reward.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-start group hover:border-indigo-200 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Award size={18} className="text-amber-500" />
                      <h4 className="font-bold text-lg text-slate-800 leading-tight">{reward.title}</h4>
                    </div>
                    <p className="text-slate-500 text-sm flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                      Se desbloquea al alcanzar <strong className="text-slate-700">{reward.conditionValue}</strong> {reward.conditionType === 'visits' ? 'visitas' : 'puntos'}.
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDeleteReward(reward.id)} 
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar recompensa"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
