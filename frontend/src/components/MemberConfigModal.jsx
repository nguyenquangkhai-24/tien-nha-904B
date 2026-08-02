import React, { useState } from 'react';
import { updateMemberOverride } from '../services/api';
import { X, Save, CarFront, UserMinus, Info, Loader2 } from 'lucide-react';

export default function MemberConfigModal({ memberData, month, year, onClose, onUpdated }) {
  const [parkingFee, setParkingFee] = useState(memberData.parking_fee || 173000);
  const [isExcluded, setIsExcluded] = useState(memberData.is_excluded || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await updateMemberOverride({
        member_id: memberData.member_id,
        month,
        year,
        parking_fee: parseInt(parkingFee, 10),
        is_excluded: isExcluded,
      });
      if (onUpdated) {
        onUpdated(); // Báo cho Dashboard biết để tải lại dữ liệu
      }
      onClose();
    } catch (err) {
      console.error('Lỗi lưu cấu hình thành viên:', err);
      setError('Lưu thất bại. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative max-w-md w-full bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-800 p-5 md:p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-lg md:text-xl font-bold text-slate-100">
            Cài Đặt Thành Viên: <span className="text-emerald-400">{memberData.name}</span>
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-rose-500/80 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-6">
          
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm">
              {error}
            </div>
          )}

          {/* Cấu hình tiền gửi xe */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <CarFront className="w-4 h-4 text-sky-400" />
              Tiền gửi xe (Tháng {month})
            </label>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={parkingFee}
              onChange={(e) => setParkingFee(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition font-mono"
            />
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Info className="w-3 h-3" /> Mặc định là 173.000đ
            </p>
          </div>

          {/* Cấu hình nghỉ phép */}
          <div className="space-y-2 pt-4 border-t border-slate-700/50">
            <label className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
              <UserMinus className="w-4 h-4 text-amber-400" />
              Chế độ nghỉ phép / Vắng mặt
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={isExcluded}
                  onChange={(e) => setIsExcluded(e.target.checked)}
                />
                <div className={`block w-12 h-6 rounded-full transition-colors ${isExcluded ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isExcluded ? 'translate-x-6' : ''}`}></div>
              </div>
              <div className="text-sm text-slate-300">
                Miễn chia Điện, Nước & Phát sinh
              </div>
            </label>

            {isExcluded && (
              <p className="text-xs text-amber-400/80 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                Người này sẽ chỉ phải đóng Tiền phòng và Phí dịch vụ cố định trong tháng này.
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Lưu Cài Đặt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
