'use client';

import { useState } from 'react';
import Dashboard from '../components/Dashboard';
import UtilityForm from '../components/UtilityForm';

export default function Home() {
  const currentDate = new Date();
  const [activeMonth, setActiveMonth] = useState(currentDate.getMonth() + 1);
  const [activeYear, setActiveYear] = useState(currentDate.getFullYear());
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataUpdated = () => {
    // Tự động làm mới dữ liệu chốt sổ khi có thay đổi
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
          Quản Lý Tiền Nhà 904B 🏠
        </h1>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Chốt sổ tự động, minh bạch & chính xác theo luật nhà 904B
        </p>
      </header>

      <div>
        <UtilityForm
          month={activeMonth}
          year={activeYear}
          onUpdated={handleDataUpdated}
        />

      </div>

      {/* Bảng chốt sổ tổng quan */}
      <Dashboard key={refreshKey} />
    </main>
  );
}
