'use client';

import React, { useState, useEffect } from 'react';
import { createExpense, getMembers } from '../services/api';
import { ShoppingCart, Plus, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const DEFAULT_MEMBERS = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Duy' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Khải' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'P.Khang' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'N.Khang' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Thịnh' },
  { id: '66666666-6666-6666-6666-666666666666', name: 'Khoa' },
];

export default function ExpenseForm({ month, year, onExpenseAdded }) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(month || currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(year || currentDate.getFullYear());

  const [members, setMembers] = useState(DEFAULT_MEMBERS);
  const [buyerId, setBuyerId] = useState(DEFAULT_MEMBERS[0].id);
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Lấy danh sách thành viên từ backend
  useEffect(() => {
    const fetchMembersList = async () => {
      try {
        const data = await getMembers();
        if (Array.isArray(data) && data.length > 0) {
          setMembers(data);
          setBuyerId(data[0].id);
        }
      } catch (err) {
        console.warn('Dùng danh sách thành viên mặc định:', err);
        setMembers(DEFAULT_MEMBERS);
        setBuyerId(DEFAULT_MEMBERS[0].id);
      }
    };
    fetchMembersList();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!buyerId) {
      setErrorMsg('Vui lòng chọn người mua.');
      return;
    }
    if (!itemName.trim()) {
      setErrorMsg('Vui lòng nhập tên vật phẩm.');
      return;
    }
    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Vui lòng nhập số tiền hợp lệ (> 0).');
      return;
    }

    setLoading(true);

    try {
      await createExpense({
        buyer_id: buyerId,
        item_name: itemName.trim(),
        amount: parsedAmount,
        month: Number(selectedMonth),
        year: Number(selectedYear),
      });

      setSuccessMsg(`Đã thêm chi phí "${itemName.trim()}" (${parsedAmount.toLocaleString('vi-VN')}đ) thành công!`);
      setItemName('');
      setAmount('');

      if (onExpenseAdded) {
        onExpenseAdded();
      }
    } catch (err) {
      console.error('Lỗi khi thêm chi phí:', err);

      // Xử lý thông báo lỗi an toàn tránh làm crash React (Objects are not valid as a React child)
      let msg = 'Không thể thêm chi phí. Vui lòng kiểm tra kết nối Backend.';
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          msg = detail;
        } else if (Array.isArray(detail)) {
          msg = detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
        } else if (typeof detail === 'object') {
          msg = JSON.stringify(detail);
        }
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/60 shadow-xl w-full">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700/60">
        <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
          <ShoppingCart className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-100">Thêm Chi Phí Mua Đồ Chung</h3>
          <p className="text-xs text-slate-400">Nhập món đồ người dùng đã ứng trước để trừ tiền chốt sổ</p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-emerald-300 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{String(successMsg)}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-rose-300 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{String(errorMsg)}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Field 1: Người mua (Dropdown) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              1. Người Mua đồ
            </label>
            <select
              value={buyerId}
              onChange={(e) => setBuyerId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition cursor-pointer"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-800">
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Field 2: Vật phẩm (Text Input) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              2. Tên Vật Phẩm
            </label>
            <input
              type="text"
              placeholder="VD: Nước rửa chén, Xà phòng..."
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Field 3: Số tiền (Number Input) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              3. Số Tiền (VNĐ)
            </label>
            <input
              type="number"
              placeholder="VD: 150000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="1000"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Thêm Chi Phí</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
