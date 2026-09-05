'use client';

import React, { useState, useEffect } from 'react';
import { getMonthlyBilling } from '../services/api';
import { updatePaymentStatus } from '../services/api';
import { 
  Calendar, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertCircle,
  Sparkles,
  WifiOff,
  ReceiptText,
  CheckCircle2,
  XCircle,
  Settings,
  Wrench
} from 'lucide-react';

import MemberBillModal from './MemberBillModal';
import MemberConfigModal from './MemberConfigModal';
import AnalyticsChart from './AnalyticsChart';
import SystemConfigModal from './SystemConfigModal';
export default function Dashboard({ month, year, onPeriodChange, refreshKey, onUpdated }) {
  const [billingData, setBillingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [configMember, setConfigMember] = useState(null);
  const [showSystemConfig, setShowSystemConfig] = useState(false);
  const [togglingStatusId, setTogglingStatusId] = useState(null);

  const fetchBillingData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getMonthlyBilling(month, year);
      if (!Array.isArray(data)) throw new Error('Dữ liệu billing không đúng định dạng.');
      setBillingData(data);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu chốt sổ:', err);
      setError('Không thể tải dữ liệu thật từ máy chủ. Không có dữ liệu mẫu nào được dùng thay thế.');
      setBillingData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, [month, year, refreshKey]);

  const handleTogglePayment = async (memberId, currentStatus) => {
    setTogglingStatusId(memberId);
    try {
      const newStatus = !currentStatus;
      const current = billingData.find((item) => item.member_id === memberId);
      await updatePaymentStatus(memberId, month, year, newStatus, current?.override_version || 0);
      await fetchBillingData();
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái thu tiền:', err);
      alert('Không thể cập nhật trạng thái thu tiền. Vui lòng thử lại.');
    } finally {
      setTogglingStatusId(null);
    }
  };

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0) + 'đ';
  };

  const handleCopyMessenger = async () => {
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

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (_error) {
      setError('Trình duyệt không cho phép sao chép. Hãy thử lại sau khi cấp quyền clipboard.');
    }
  };

  const grandTotal = billingData.reduce((acc, curr) => acc + (curr.total_due || 0), 0);

  const activeMembersCount = billingData.filter(m => !m.is_excluded).length || 1;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6">
      {/* Top Controller Bar */}
      <div className="bg-slate-800/80 backdrop-blur-md p-4 md:p-6 rounded-2xl border border-slate-700/60 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
              onChange={(e) => onPeriodChange({ month: Number(e.target.value), year })}
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
              onChange={(e) => onPeriodChange({ month, year: Number(e.target.value) })}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none text-sm cursor-pointer"
            >
              {Array.from({ length: 2100 - 2024 + 1 }, (_, index) => 2024 + index).map((y) => (
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
            <span>Thử lại</span>
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
          {/* Settings Button */}
          <button
            onClick={() => setShowSystemConfig(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-xl text-sm font-medium transition active:scale-95"
            title="Cài đặt hệ thống"
          >
            <Wrench className="w-4 h-4" />
            <span className="hidden sm:inline">Hệ thống</span>
          </button>
          
        </div>
      </div>

      {/* Offline / Backend status alert */}
      {error && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-amber-300 text-sm">
          <WifiOff className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
          <div>
            <p className="font-semibold">{error}</p>
            <p className="text-xs text-amber-400/80 mt-1">Nhấn “Thử lại”. Nếu lỗi tiếp diễn, không nhập dữ liệu cho đến khi kết nối được khôi phục.</p>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/60 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-3 px-3 md:py-4 md:px-5">Thành viên</th>
                <th className="py-3 px-3 md:py-4 md:px-4 text-right">Tiền phòng</th>
                <th className="py-3 px-3 md:py-4 md:px-4 text-right">Dịch vụ</th>
                <th className="py-3 px-3 md:py-4 md:px-4 text-right">Gửi xe</th>
                <th className="py-3 px-3 md:py-4 md:px-4 text-right">Điện + Nước (/{activeMembersCount})</th>
                <th className="py-3 px-3 md:py-4 md:px-5 text-right font-bold text-emerald-400">TỔNG ĐÓNG</th>
                <th className="py-3 px-3 md:py-4 md:px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-3 md:py-4 md:px-5 text-center">Hoá Đơn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="flex justify-center items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                      <span>Đang kết nối Backend server và tính toán...</span>
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
                    className={`transition-colors text-xs md:text-sm ${item.is_excluded ? 'opacity-50 hover:opacity-100 bg-slate-800/30' : 'hover:bg-slate-700/40'}`}
                  >
                    <td className="py-3 px-3 md:py-4 md:px-5 font-semibold text-slate-100">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 md:gap-2.5">
                          <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full border flex items-center justify-center text-[10px] md:text-xs font-bold ${
                            item.is_excluded 
                              ? 'bg-slate-800 border-slate-700 text-slate-500' 
                              : 'bg-slate-700 border-slate-600 text-emerald-400'
                          }`}>
                            {item.name ? item.name.charAt(0) : '?'}
                          </div>
                          <span className={`truncate ${item.is_excluded ? 'line-through text-slate-400' : ''}`}>
                            {item.name}
                          </span>
                        </div>
                        <button
                          onClick={() => setConfigMember(item)}
                          className="p-1.5 md:p-2 bg-slate-800 hover:bg-emerald-500 hover:text-white text-slate-400 rounded-lg transition-colors border border-slate-700 shadow-sm"
                          title="Cài đặt thành viên"
                        >
                          <Settings className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3 md:py-4 md:px-4 text-right font-mono text-slate-300">
                      {formatVND(item.fixed_rent)}
                    </td>
                    <td className="py-3 px-3 md:py-4 md:px-4 text-right font-mono text-slate-300">
                      {formatVND(item.service_fee)}
                    </td>
                    <td className="py-3 px-3 md:py-4 md:px-4 text-right font-mono text-slate-300">
                      {formatVND(item.parking_fee)}
                    </td>
                    <td className="py-3 px-3 md:py-4 md:px-4 text-right font-mono text-slate-300">
                      {formatVND(item.utility_share)}
                    </td>
                    <td className="py-3 px-3 md:py-4 md:px-5 text-right font-mono font-bold text-sm md:text-base text-emerald-400 bg-emerald-500/5">
                      {formatVND(item.total_due)}
                    </td>
                    <td className="py-3 px-3 md:py-4 md:px-4 text-center">
                      <button
                        onClick={() => handleTogglePayment(item.member_id, item.is_paid)}
                        disabled={togglingStatusId === item.member_id}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                          item.is_paid
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500 hover:text-white'
                            : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:bg-emerald-500/80 hover:text-white hover:border-emerald-500'
                        } disabled:opacity-50`}
                      >
                        {togglingStatusId === item.member_id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : item.is_paid ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden lg:inline">
                          {item.is_paid ? 'Đã Thu' : 'Chưa Thu'}
                        </span>
                      </button>
                    </td>
                    <td className="py-3 px-3 md:py-4 md:px-5 text-center">
                      <button
                        onClick={() => setSelectedMember(item)}
                        className="inline-flex items-center justify-center p-2 bg-slate-700/50 hover:bg-emerald-500 hover:text-white text-slate-300 rounded-xl transition-colors border border-slate-600 hover:border-emerald-500 shadow-sm"
                        title="Xuất Hoá Đơn"
                      >
                        <ReceiptText className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {billingData.length > 0 && (
              <tfoot className="bg-slate-900/90 font-bold border-t-2 border-slate-600 text-slate-200">
                <tr className="text-sm md:text-base">
                  <td className="py-4 px-3 md:px-5 text-emerald-400 flex items-center gap-1.5 whitespace-nowrap">
                    <Sparkles className="w-4 h-4 hidden md:block" />
                    <span>TỔNG CỘNG THU:</span>
                  </td>
                  <td colSpan="4"></td>
                  <td className="py-4 px-3 md:px-5 text-right text-base md:text-lg text-emerald-400 font-mono">
                    {formatVND(grandTotal)}
                  </td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Member Bill Modal */}
      {selectedMember && (
        <MemberBillModal
          memberData={selectedMember}
          month={month}
          year={year}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {/* Member Config Modal */}
      {configMember && (
        <MemberConfigModal
          memberData={configMember}
          month={month}
          year={year}
          onClose={() => setConfigMember(null)}
          onUpdated={fetchBillingData}
        />
      )}

      {/* System Config Modal */}
      {showSystemConfig && (
        <SystemConfigModal
          onClose={() => setShowSystemConfig(false)}
          onUpdated={fetchBillingData}
        />
      )}

      {/* Analytics Chart */}
      <AnalyticsChart year={year} onYearChange={(nextYear) => onPeriodChange({ month, year: nextYear })} />
    </div>
  );
}
