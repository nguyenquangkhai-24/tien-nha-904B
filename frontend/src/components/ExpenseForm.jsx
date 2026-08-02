'use client';

import React, { useState, useEffect } from 'react';
import { createExpense, getMembers } from '../services/api';
import { ShoppingCart, Plus, CheckCircle, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';

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
  const [billImage, setBillImage] = useState(null); // Lưu trữ base64 của ảnh bill

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn một tệp hình ảnh hợp lệ.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Khởi tạo canvas để nén ảnh
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Xuất ra dạng Base64 JPEG chất lượng 70%
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setBillImage(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

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
        bill_url: billImage,
      });

      setSuccessMsg(`Đã thêm chi phí "${itemName.trim()}" (${parsedAmount.toLocaleString('vi-VN')}đ) thành công!`);
      setItemName('');
      setAmount('');
      setBillImage(null);
      // Reset input file (tùy chọn nhưng tốt cho UX)
      const fileInput = document.getElementById('bill_image_input');
      if (fileInput) fileInput.value = '';

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
    <div className="bg-slate-800/80 backdrop-blur-md p-4 md:p-6 rounded-2xl border border-slate-700/60 shadow-xl w-full">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 pb-4 border-b border-slate-700/60">
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
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="VD: 150000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="1000"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono"
            />
          </div>

          {/* Field 4: Ảnh Bill (File Input) */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-2">
              4. Ảnh Bill / Biên lai (Tuỳ chọn)
            </label>
            <div className="relative flex items-center">
              <input
                id="bill_image_input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-slate-200 hover:file:bg-slate-600 transition cursor-pointer bg-slate-900 border border-slate-700 rounded-xl"
              />
              {billImage && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg text-xs font-semibold">
                  <CheckCircle className="w-4 h-4" /> Đã nén ảnh
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">Ảnh sẽ được tự động nén nhỏ gọn để tiết kiệm dung lượng hệ thống.</p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
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
