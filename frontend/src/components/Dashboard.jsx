'use client';

import React, { useState, useEffect } from 'react';
import { getMonthlyBilling } from '../services/api';
import { 
  Calendar, 
  Copy, 
  Check, 
  RefreshCw, 
  Receipt, 
  User, 
  DollarSign, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

export default function Dashboard() {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [billingData, setBillingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchBillingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMonthlyBilling(month, year);
      setBillingData(data || []);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu chốt sổ:', err);
      setError('Không thể tải dữ liệu chốt sổ. Vui lòng kiểm tra backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, [month, year]);

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0) + 'đ';
  };

  const handleCopyMessenger = () => {
    if (!billingData || billingData.length === 0) return;

    let text = `📌 CHỐT SỔ TIỀN NHÀ THÁNG ${month}/${year} - 904B 🏠\n`;
    text += `----------------------------------\n`;

    let totalAll = 0;
    billingData.forEach((item, index) => {
      text += `${index + 1}. ${item.name}: ${formatVND(item.total_due)}\n`;
      totalAll += item.total_due;
    });

    text += `----------------------------------\n`;
    text += `👉 TỔNG THU CẢ NHÀ: ${formatVND(totalAll)}\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const grandTotal = billingData.reduce((acc, curr) => acc + (curr.total_due || 0), 0);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Controller Bar */}
      <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Bảng Chốt Sổ Tiền Nhà
              <span className="text-xs bg-emerald-500/20 text-emerald-300 font-medium px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Tháng {month}/{year}
              </span>
            </h2>
            <p className="text-xs text-slate-400">Xem và xuất danh sách chia tiền theo đúng Luật 904B</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month Select */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5">
            <span className="text-xs text-slate-400 mr-2">Tháng:</span>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none text-sm cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m} className="bg-slate-800 text-slate-200">
                  Tháng {m}
                </option>
              ))}
            </select>
          </div>

          {/* Year Select */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5">
            <span className="text-xs text-slate-400 mr-2">Năm:</span>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none text-sm cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y} className="bg-slate-800 text-slate-200">
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchBillingData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-medium transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Tải lại</span>
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopyMessenger}
            disabled={billingData.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition shadow-lg active:scale-95 disabled:opacity-50 ${
              copied
                ? 'bg-emerald-600 text-white border border-emerald-400'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Đã copy Messenger!' : 'Copy tin nhắn Messenger'}</span>
          </button>
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/60 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-4 px-5">Thành viên</th>
                <th className="py-4 px-4 text-right">Tiền phòng</th>
                <th className="py-4 px-4 text-right">Dịch vụ</th>
                <th className="py-4 px-4 text-right">Gửi xe</th>
                <th className="py-4 px-4 text-right">Điện + Nước (/6)</th>
                <th className="py-4 px-4 text-right">Phát sinh (/6)</th>
                <th className="py-4 px-4 text-right text-amber-400">Đã ứng (Trừ)</th>
                <th className="py-4 px-5 text-right font-bold text-emerald-400">TỔNG ĐÓNG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="flex justify-center items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                      <span>Đang tính toán dữ liệu chốt sổ...</span>
                    </div>
                  </td>
                </tr>
              ) : billingData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    Chưa có dữ liệu chốt sổ cho Tháng {month}/{year}.
                  </td>
                </tr>
              ) : (
                billingData.map((item, index) => (
                  <tr
                    key={item.member_id || index}
                    className="hover:bg-slate-700/40 transition-colors"
                  >
                    <td className="py-4 px-5 font-semibold text-slate-100 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-emerald-400">
                        {item.name ? item.name.charAt(0) : '?'}
                      </div>
                      <span>{item.name}</span>
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-slate-300">
                      {formatVND(item.fixed_rent)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-slate-300">
                      {formatVND(item.service_fee)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-slate-300">
                      {formatVND(item.parking_fee)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-slate-300">
                      {formatVND(item.utility_share)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-slate-300">
                      {formatVND(item.extra_expense_share)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-amber-400 font-semibold">
                      -{formatVND(item.offset_amount)}
                    </td>
                    <td className="py-4 px-5 text-right font-mono font-bold text-base text-emerald-400 bg-emerald-500/5">
                      {formatVND(item.total_due)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {billingData.length > 0 && (
              <tfoot className="bg-slate-900/90 font-bold border-t-2 border-slate-600 text-slate-200">
                <tr>
                  <td className="py-4 px-5 text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>TỔNG CỘNG THU:</span>
                  </td>
                  <td colSpan="6"></td>
                  <td className="py-4 px-5 text-right text-lg text-emerald-400 font-mono">
                    {formatVND(grandTotal)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
