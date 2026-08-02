'use client';

import { useState } from 'react';
import Dashboard from '../components/Dashboard';
import ExpenseForm from '../components/ExpenseForm';

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleExpenseAdded = () => {
    // Tự động làm mới dữ liệu chốt sổ khi có chi phí mới
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
            Quản Lý Tiền Nhà 904B 🏠
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Chốt sổ tự động, minh bạch & chính xác theo luật nhà 904B
          </p>
        </div>
      </header>

      {/* Form nhập chi phí mua đồ phát sinh */}
      <ExpenseForm onExpenseAdded={handleExpenseAdded} />

      {/* Bảng chốt sổ */}
      <Dashboard key={refreshKey} />
    </main>
  );
}
