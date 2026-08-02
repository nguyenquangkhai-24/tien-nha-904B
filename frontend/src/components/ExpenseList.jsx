'use client';

import React, { useState, useEffect } from 'react';
import { getExpensesByMonth, deleteExpense, getMembers } from '../services/api';
import { List, Trash2, Loader2, AlertCircle, Eye, X } from 'lucide-react';

export default function ExpenseList({ month, year, refreshKey, onExpenseDeleted }) {
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await getMembers();
        if (Array.isArray(data)) {
          setMembers(data);
        }
      } catch (err) {
        console.warn('Lỗi lấy danh sách thành viên:', err);
      }
    };
    fetchMembers();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await getExpensesByMonth(month, year);
      if (Array.isArray(data)) {
        setExpenses(data);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách chi phí:', err);
      setErrorMsg('Không thể tải danh sách chi phí.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [month, year, refreshKey]);

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chi phí này không?')) return;
    
    setDeletingId(id);
    try {
      await deleteExpense(id);
      if (onExpenseDeleted) {
        onExpenseDeleted();
      }
    } catch (err) {
      console.error('Lỗi khi xóa chi phí:', err);
      alert('Không thể xóa chi phí này. Vui lòng thử lại.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0) + 'đ';
  };

  const getMemberName = (buyerId) => {
    const member = members.find((m) => m.id === buyerId);
    return member ? member.name : 'Không rõ';
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/60 shadow-xl w-full">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-700/60">
        <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
          <List className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-100">Danh Sách Chi Phí Phát Sinh</h3>
          <p className="text-xs text-slate-400">Quản lý và xóa các chi phí đã thêm sai</p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading && expenses.length === 0 ? (
        <div className="flex justify-center items-center py-6 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Đang tải...</span>
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-sm">
          Không có chi phí phát sinh nào trong tháng này.
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          {expenses.map((expense) => (
            <div key={expense.id} className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-700 rounded-xl hover:border-slate-600 transition">
              <div className="flex-1">
                <div className="font-semibold text-slate-200 text-sm">{expense.item_name}</div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-medium">Người mua: {getMemberName(expense.buyer_id)}</span>
                  <span>•</span>
                  <span className="font-mono">{formatVND(expense.amount)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-3">
                {expense.bill_url && (
                  <button
                    onClick={() => setSelectedImage(expense.bill_url)}
                    className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors border border-emerald-500/20 hover:border-transparent active:scale-95"
                    title="Xem Bill"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  onClick={() => handleDelete(expense.id)}
                  disabled={deletingId === expense.id}
                  className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-colors border border-rose-500/20 hover:border-transparent active:scale-95 disabled:opacity-50"
                  title="Xóa chi phí"
                >
                  {deletingId === expense.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Xem Ảnh Bill */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 p-2 text-slate-300 hover:text-white bg-slate-800/50 hover:bg-rose-500/80 rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={selectedImage} 
              alt="Hoá đơn chi phí" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-slate-700"
            />
          </div>
        </div>
      )}
    </div>
  );
}
