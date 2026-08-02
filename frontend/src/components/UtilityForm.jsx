'use client';

import React, { useState, useEffect } from 'react';
import { updateMonthlyUtilities } from '../services/api';
import { Zap, Droplets, Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function UtilityForm({ month, year, onUpdated }) {
  const [electricity, setElectricity] = useState('');
  const [water, setWater] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const parsedElec = parseInt(electricity || '0', 10);
    const parsedWater = parseInt(water || '0', 10);

    if (isNaN(parsedElec) || parsedElec < 0) {
      setErrorMsg('Vui lòng nhập tiền điện hợp lệ (>= 0).');
      return;
    }
    if (isNaN(parsedWater) || parsedWater < 0) {
      setErrorMsg('Vui lòng nhập tiền nước hợp lệ (>= 0).');
      return;
    }

    setLoading(true);

    try {
      await updateMonthlyUtilities(month, year, {
        electricity_amount: parsedElec,
        water_amount: parsedWater,
      });

      const totalUtil = parsedElec + parsedWater;
      const sharePerPerson = Math.round(totalUtil / 6);

      setSuccessMsg(
        `Đã lưu Tiền Điện (${parsedElec.toLocaleString('vi-VN')}đ) & Tiền Nước (${parsedWater.toLocaleString('vi-VN')}đ) Tháng ${month}/${year}. Mỗi người: ${sharePerPerson.toLocaleString('vi-VN')}đ/tháng.`
      );

      if (onUpdated) {
        onUpdated();
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật tiền điện nước:', err);
      let msg = 'Không thể kết nối Backend server để lưu tiền điện nước.';
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        msg = typeof detail === 'string' ? detail : JSON.stringify(detail);
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-md p-4 md:p-6 rounded-2xl border border-slate-700/60 shadow-xl w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Nhập Tiền Điện & Tiền Nước
              <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/30">
                Tháng {month}/{year}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Tổng tiền điện nước sẽ tự động cộng lại và chia 6 cho mỗi thành viên
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-emerald-300 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-rose-300 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tiền Điện */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Tổng Tiền Điện (VNĐ)</span>
            </label>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="VD: 550000"
              value={electricity}
              onChange={(e) => setElectricity(e.target.value)}
              min="0"
              step="1000"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition font-mono"
            />
          </div>

          {/* Tiền Nước */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tổng Tiền Nước (VNĐ)</span>
            </label>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="VD: 150000"
              value={water}
              onChange={(e) => setWater(e.target.value)}
              min="0"
              step="1000"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500 transition font-mono"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-semibold rounded-xl text-sm transition shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Lưu Điện & Nước</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
