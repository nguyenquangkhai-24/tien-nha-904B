import React, { useState } from 'react';
import { Lock, Unlock, X, Loader2, KeyRound } from 'lucide-react';
import { verifyAdminPin } from '../services/api';

export default function AdminLoginModal({ onClose, onSuccess }) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin) return;
    
    setLoading(true);
    setError('');
    try {
      const res = await verifyAdminPin(pin);
      if (res.success) {
        localStorage.setItem('adminPin', pin);
        onSuccess();
      } else {
        setError('Mã PIN không chính xác!');
        triggerShake();
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className={`relative w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden p-6 text-center transition-transform ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-rose-500/80 rounded-full transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-16 h-16 mx-auto bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-4 border border-rose-500/20">
          <KeyRound className="w-8 h-8" />
        </div>
        
        <h2 className="text-xl font-bold text-slate-100 mb-2">Đăng Nhập Quản Trị</h2>
        <p className="text-sm text-slate-400 mb-6">
          Bạn cần có quyền Chủ nhà để thay đổi dữ liệu hoặc chốt sổ tiền.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input 
              type="password"
              inputMode="numeric"
              autoFocus
              maxLength={6}
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Nhập mã PIN..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-center text-2xl tracking-widest text-slate-100 focus:border-rose-500 outline-none transition"
            />
          </div>
          
          {error && <p className="text-rose-400 text-sm font-semibold">{error}</p>}
          
          <button 
            type="submit" 
            disabled={loading || !pin}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Unlock className="w-5 h-5" />}
            Mở Khóa
          </button>
        </form>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `}} />
    </div>
  );
}
