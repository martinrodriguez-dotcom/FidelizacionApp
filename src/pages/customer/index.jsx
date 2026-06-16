import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, collection, setDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { Store, ArrowLeft, Heart, Award } from 'lucide-react';

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyBqCo-N8hJo61cksLdW9JgJySSfEFJke64",
  authDomain: "fidelizacionapp-d3e8e.firebaseapp.com",
  projectId: "fidelizacionapp-d3e8e",
  storageBucket: "fidelizacionapp-d3e8e.firebasestorage.app",
  messagingSenderId: "86470097031",
  appId: "1:86470097031:web:fee57a2a8e6d471ccda022"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appIdRaw = typeof __app_id !== 'undefined' ? __app_id : "dulce-sal-app";
const appIdSaaS = appIdRaw.replace(/\//g, '_'); 
const DULCE_SAL_ID = "dulce-sal-id"; 

export default function CustomerView() {
  const [user, setUser] = useState(null);
  const [card, setCard] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [regData, setRegData] = useState({ name: '', phone: '' });

  useEffect(() => {
    const initAuth = async () => { if (!auth.currentUser) await signInAnonymously(auth); };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const cardId = `${DULCE_SAL_ID}_${user.uid}`;
    const unsubCard = onSnapshot(doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'loyalty_cards', cardId), (snap) => {
      if (snap.exists()) setCard(snap.data());
    });
    const unsubRewards = onSnapshot(collection(db, 'artifacts', appIdSaaS, 'public', 'data', 'rewards'), (snap) => {
      setRewards(snap.docs.map(d => ({id: d.id, ...d.data()})).filter(r => r.businessId === DULCE_SAL_ID));
    });
    return () => { unsubCard(); unsubRewards(); };
  }, [user]);

  const handleRegister = async (e) => {
    e.preventDefault();
    const cardId = `${DULCE_SAL_ID}_${user.uid}`;
    await setDoc(doc(db, 'artifacts', appIdSaaS, 'public', 'data', 'loyalty_cards', cardId), {
      businessId: DULCE_SAL_ID, customerName: regData.name, customerPhone: regData.phone,
      customerId: user.uid, points: 0, visits: 0, createdAt: new Date().toISOString()
    });
  };

  return (
    <div className="c-wrapper">
      <style dangerouslySetInnerHTML={{ __html: `
        .c-wrapper { display: flex; flex-direction: column; align-items: center; min-height: 100vh; background-color: #f8fafc; padding: 24px; font-family: system-ui, sans-serif; }
        .c-header { width: 100%; max-width: 450px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .c-back-btn { background: white; border: none; padding: 12px; border-radius: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); cursor: pointer; color: #94a3b8; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
        .c-back-btn:hover { color: #ec4899; }
        .c-brand { display: flex; align-items: center; gap: 12px; font-weight: 900; font-size: 1.25rem; font-style: italic; color: #0f172a; }
        .c-brand-icon { background: #ec4899; color: white; padding: 8px; border-radius: 0.75rem; display: flex; }
        .c-card { background: white; padding: 40px; border-radius: 3rem; width: 100%; max-width: 450px; box-shadow: 0 25px 50px -12px rgba(236,72,153,0.15); text-align: center; box-sizing: border-box; }
        .c-input-group { text-align: left; margin-bottom: 16px; }
        .c-label { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.1em; margin-left: 4px; display: block; margin-bottom: 8px; }
        .c-input { width: 100%; padding: 16px 20px; border-radius: 1.5rem; border: 1px solid #f1f5f9; background: #f8fafc; outline: none; font-weight: bold; color: #0f172a; box-sizing: border-box; transition: 0.2s; }
        .c-input:focus { border-color: #ec4899; background: white; }
        .c-btn { width: 100%; background: #ec4899; color: white; padding: 18px; border-radius: 2rem; font-weight: 900; border: none; cursor: pointer; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 10px 15px -3px rgba(236,72,153,0.3); transition: transform 0.1s; }
        .c-btn:active { transform: scale(0.98); }
        .c-vip { background: #0f172a; color: white; border-radius: 2.5rem; padding: 32px; position: relative; overflow: hidden; margin-bottom: 32px; width: 100%; max-width: 450px; box-sizing: border-box; box-shadow: 0 25px 50px -12px rgba(15,23,42,0.5); }
        .c-vip-glow { position: absolute; top: -40px; right: -40px; width: 150px; height: 150px; background: rgba(236,72,153,0.3); filter: blur(40px); border-radius: 50%; }
        .c-vip-header { display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 10; }
        .c-vip-badge { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #f9a8d4; background: rgba(236,72,153,0.2); padding: 4px 12px; border-radius: 999px; border: 1px solid rgba(236,72,153,0.3); }
        .c-vip-name { font-size: 1.8rem; font-weight: 900; margin: 16px 0 0 0; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
        .c-qr-box { background: white; padding: 8px; border-radius: 1.5rem; }
        .c-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 32px; padding-top: 24px; text-align: center; position: relative; z-index: 10; }
        .c-stat-val { font-size: 3rem; font-weight: 900; margin: 0; line-height: 1; }
        .c-reward-item { background: white; padding: 24px; border-radius: 2rem; border: 1px solid #f1f5f9; margin-bottom: 16px; width: 100%; max-width: 450px; box-sizing: border-box; }
        .c-reward-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .c-progress-bg { width: 100%; height: 8px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
        .c-progress-fill { height: 100%; background: #ec4899; transition: width 1s ease-in-out; }
      `}} />

      <header className="c-header">
        <button className="c-back-btn" onClick={() => window.location.href = '/'}><ArrowLeft size={20}/></button>
        <div className="c-brand"><div className="c-brand-icon"><Store size={18}/></div> Dulce Sal</div>
        <div style={{width: 44}}></div>
      </header>

      {!card ? (
        <div className="c-card">
          <div style={{ background: '#fdf2f8', width: 80, height: 80, borderRadius: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
            <Heart size={40} color="#ec4899" />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, margin: '0 0 8px 0', color: '#0f172a' }}>¡Hola!</h2>
          <p style={{ color: '#94a3b8', marginBottom: 32, fontStyle: 'italic', fontWeight: 500 }}>Regístrate para ganar premios.</p>
          <form onSubmit={handleRegister}>
            <div className="c-input-group">
              <label className="c-label">Nombre</label>
              <input className="c-input" required value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} />
            </div>
            <div className="c-input-group">
              <label className="c-label">WhatsApp</label>
              <input className="c-input" required value={regData.phone} onChange={e => setRegData({...regData, phone: e.target.value})} />
            </div>
            <button type="submit" className="c-btn" style={{marginTop: 16}}>Crear Mi Tarjeta VIP</button>
          </form>
        </div>
      ) : (
        <>
          <div className="c-vip">
            <div className="c-vip-glow"></div>
            <div className="c-vip-header">
              <div>
                <span className="c-vip-badge">Socio VIP</span>
                <h3 className="c-vip-name">{card.customerName}</h3>
              </div>
              <div className="c-qr-box">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${user?.uid}&color=ec4899`} style={{width: 80, height: 80, borderRadius: '1rem'}} alt="QR" />
              </div>
            </div>
            <div className="c-stats">
              <div><p style={{fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 900, margin: '0 0 8px 0'}}>Puntos</p><p className="c-stat-val" style={{color: '#ec4899'}}>{card.points}</p></div>
              <div><p style={{fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 900, margin: '0 0 8px 0'}}>Visitas</p><p className="c-stat-val" style={{color: '#34d399'}}>{card.visits}</p></div>
            </div>
          </div>

          <div style={{ width: '100%', maxWidth: 450 }}>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><Award color="#ec4899"/> Tus Premios</h4>
            {rewards.length === 0 ? <p style={{textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: 32, background: 'white', borderRadius: '2rem'}}>Próximamente...</p> : rewards.map(r => {
              const current = r.conditionType === 'visits' ? card.visits : card.points;
              const unlocked = current >= r.conditionValue;
              const pct = Math.min((current / r.conditionValue) * 100, 100);
              return (
                <div key={r.id} className="c-reward-item" style={{ borderColor: unlocked ? '#a7f3d0' : '#f1f5f9', backgroundColor: unlocked ? '#f0fdf4' : 'white' }}>
                  <div className="c-reward-header">
                    <div>
                      <p style={{ fontWeight: 900, margin: '0 0 4px 0', color: '#0f172a' }}>{r.title}</p>
                      <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>Meta: {r.conditionValue} {r.conditionType}</p>
                    </div>
                    {unlocked && <span style={{ background: '#10b981', color: 'white', padding: '6px 12px', borderRadius: '1rem', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>¡Canjear!</span>}
                  </div>
                  {!unlocked && <div className="c-progress-bg"><div className="c-progress-fill" style={{ width: `${pct}%` }}></div></div>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
