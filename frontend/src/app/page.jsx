'use client';

import { useEffect, useState } from 'react';
import { Lock, LogOut } from 'lucide-react';
import Dashboard from '../components/Dashboard';
import UtilityForm from '../components/UtilityForm';
import AdminLoginModal from '../components/AdminLoginModal';
import { clearAdminPin } from '../services/api';

export default function Home() {
  const [period, setPeriod] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);

  useEffect(() => {
    const now = new Date();
    setPeriod({ month: now.getMonth() + 1, year: now.getFullYear() });

    const handleAuthError = () => {
      clearAdminPin();
      setIsAuthenticated(false);
      setShowLogin(true);
    };
    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, []);

  const handleDataUpdated = () => setRefreshKey((value) => value + 1);

  const handleLogout = () => {
    clearAdminPin();
    setIsAuthenticated(false);
    setShowLogin(true);
  };

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="border-b border-slate-700 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
            Quản Lý Tiền Nhà 904B 🏠
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Chốt sổ minh bạch, đồng bộ và có kiểm soát truy cập
          </p>
        </div>

        {isAuthenticated ? (
          <button
            type="button"
            onClick={handleLogout}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-600 bg-slate-800 text-slate-200 hover:bg-rose-500/15 hover:text-rose-300 hover:border-rose-500/40 transition"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Khóa phiên
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowLogin(true)}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition"
          >
            <Lock className="w-4 h-4" aria-hidden="true" />
            Mở khóa dữ liệu
          </button>
        )}
      </header>

      {!period ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-8 text-center text-slate-300">
          Đang xác định kỳ chốt sổ…
        </div>
      ) : isAuthenticated ? (
        <>
          <UtilityForm
            month={period.month}
            year={period.year}
            onUpdated={handleDataUpdated}
          />
          <Dashboard
            month={period.month}
            year={period.year}
            onPeriodChange={setPeriod}
            refreshKey={refreshKey}
            onUpdated={handleDataUpdated}
          />
        </>
      ) : (
        <section className="rounded-2xl border border-slate-700 bg-slate-800/80 p-8 md:p-12 text-center shadow-xl">
          <Lock className="w-10 h-10 mx-auto text-emerald-400 mb-4" aria-hidden="true" />
          <h2 className="text-xl font-bold text-slate-100">Dữ liệu đang được khóa</h2>
          <p className="mt-2 text-sm text-slate-400">Nhập PIN truy cập để xem hoặc thay đổi chốt sổ.</p>
        </section>
      )}

      {showLogin && !isAuthenticated && (
        <AdminLoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => {
            setIsAuthenticated(true);
            setShowLogin(false);
          }}
        />
      )}
    </main>
  );
}
