import React, { useState, useEffect } from 'react';
import { getYearlyStats } from '../services/api';
import { BarChart3, ChevronLeft, ChevronRight, Zap, Droplet, ShoppingCart, Loader2 } from 'lucide-react';

export default function AnalyticsChart({ currentYear }) {
  const [year, setYear] = useState(currentYear || new Date().getFullYear());
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, [year]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getYearlyStats(year);
      setStats(data);
    } catch (err) {
      console.error('Lỗi lấy thống kê:', err);
      setError('Không thể tải dữ liệu thống kê.');
    } finally {
      setLoading(false);
    }
  };

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatK = (amount) => {
    if (amount === 0) return '0';
    return `${Math.round(amount / 1000)}k`;
  };

  // Find the maximum total to scale the chart
  const maxTotal = stats.reduce((max, item) => Math.max(max, item.total), 0) || 1; // avoid divide by 0
  const CHART_HEIGHT = 200; // base height for visual reference

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl w-full max-w-7xl mx-auto mt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-100">Thống Kê Chi Phí Chung</h2>
            <p className="text-sm text-slate-400">Điện, Nước & Phát sinh theo từng tháng</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-fit">
          <button 
            onClick={() => setYear(y => y - 1)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-bold text-slate-100 min-w-[60px] text-center">
            {year}
          </span>
          <button 
            onClick={() => setYear(y => y + 1)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error ? (
        <div className="text-center py-10 text-rose-400 bg-rose-500/10 rounded-xl border border-rose-500/20">
          {error}
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center py-20 text-slate-500 gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          Đang tải dữ liệu...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-sm text-slate-300 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]"></div>
              <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Điện</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
              <span className="flex items-center gap-1"><Droplet className="w-3.5 h-3.5" /> Nước</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
              <span className="flex items-center gap-1"><ShoppingCart className="w-3.5 h-3.5" /> Phát sinh</span>
            </div>
          </div>

          {/* Chart Area */}
          <div className="relative pt-6 pb-2 pl-2 pr-2 overflow-x-auto custom-scrollbar">
            <div className="min-w-[600px] flex items-end justify-between gap-2 h-[250px] md:h-[300px]">
              
              {/* Y-axis Guides (Background lines) */}
              <div className="absolute inset-0 z-0 flex flex-col justify-between pointer-events-none pb-8 pt-6">
                {[4, 3, 2, 1, 0].map((step) => (
                  <div key={step} className="w-full border-b border-slate-700/30 flex items-end">
                    <span className="text-[10px] md:text-xs text-slate-500 -translate-y-2 bg-slate-900 pr-2">
                      {formatK((maxTotal / 4) * step)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bars */}
              {stats.map((item) => {
                const totalHeight = (item.total / maxTotal) * 100;
                const elecHeight = item.total > 0 ? (item.electricity / item.total) * 100 : 0;
                const waterHeight = item.total > 0 ? (item.water / item.total) * 100 : 0;
                const extraHeight = item.total > 0 ? (item.extra / item.total) * 100 : 0;
                
                const hasData = item.total > 0;

                return (
                  <div key={item.month} className="relative z-10 flex flex-col items-center flex-1 group cursor-crosshair">
                    
                    {/* Tooltip on Hover */}
                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                      <div className="bg-slate-800 border border-slate-600 rounded-xl p-3 shadow-2xl w-48 backdrop-blur-md">
                        <div className="text-center font-bold text-slate-200 mb-2 border-b border-slate-700 pb-2">
                          Tháng {item.month}
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between items-center text-sky-400">
                            <span>Điện:</span>
                            <span className="font-mono">{formatVND(item.electricity)}</span>
                          </div>
                          <div className="flex justify-between items-center text-emerald-400">
                            <span>Nước:</span>
                            <span className="font-mono">{formatVND(item.water)}</span>
                          </div>
                          <div className="flex justify-between items-center text-rose-400">
                            <span>Phát sinh:</span>
                            <span className="font-mono">{formatVND(item.extra)}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-200 font-bold border-t border-slate-700 pt-1.5 mt-1.5">
                            <span>Tổng:</span>
                            <span className="font-mono">{formatVND(item.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* The Bar */}
                    <div className="w-10 md:w-16 h-full flex flex-col justify-end">
                      <div 
                        className="w-full flex flex-col-reverse rounded-t-lg overflow-hidden transition-all duration-500 ease-out shadow-lg group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:brightness-110"
                        style={{ height: `${totalHeight}%`, minHeight: hasData ? '4px' : '0' }}
                      >
                        <div className="w-full bg-sky-500 transition-all duration-300" style={{ height: `${elecHeight}%` }}></div>
                        <div className="w-full bg-emerald-500 transition-all duration-300" style={{ height: `${waterHeight}%` }}></div>
                        <div className="w-full bg-rose-500 transition-all duration-300" style={{ height: `${extraHeight}%` }}></div>
                      </div>
                    </div>

                    {/* X-axis Label */}
                    <div className="mt-3 text-xs md:text-sm font-semibold text-slate-400 group-hover:text-slate-100 transition-colors">
                      T{item.month}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
