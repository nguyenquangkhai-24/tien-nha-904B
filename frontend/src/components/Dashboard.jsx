'use client';

import React, { useState, useEffect } from 'react';
import { getMonthlyBilling } from '../services/api';
import { 
  Calendar, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertCircle,
  Sparkles,
  WifiOff,
  ReceiptText
} from 'lucide-react';

import MemberBillModal from './MemberBillModal';

const FALLBACK_BILLING_DATA = [
  { member_id: '1', name: 'Duy', fixed_rent: 3750000, service_fee: 133000, parking_fee: 173000, utility_share: 0, extra_expense_share: 0, offset_amount: 0, total_due: 4056000 },
  { member_id: '2', name: 'Khải', fixed_rent: 3750000, service_fee: 133000, parking_fee: 173000, utility_share: 0, extra_expense_share: 0, offset_amount: 0, total_due: 4056000 },
  { member_id: '3', name: 'P.Khang', fixed_rent: 3000000, service_fee: 133000, parking_fee: 173000, utility_share: 0, extra_expense_share: 0, offset_amount: 0, total_due: 3306000 },
  { member_id: '4', name: 'N.Khang', fixed_rent: 3000000, service_fee: 133000, parking_fee: 173000, utility_share: 0, extra_expense_share: 0, offset_amount: 0, total_due: 3306000 },
  { member_id: '5', name: 'Thịnh', fixed_rent: 2500000, service_fee: 133000, parking_fee: 173000, utility_share: 0, extra_expense_share: 0, offset_amount: 0, total_due: 2806000 },
  { member_id: '6', name: 'Khoa', fixed_rent: 2000000, service_fee: 133000, parking_fee: 173000, utility_share: 0, extra_expense_share: 0, offset_amount: 0, total_due: 2306000 },
];

export default function Dashboard() {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [billingData, setBillingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOfflineFallback, setIsOfflineFallback] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const fetchBillingData = async () => {
    setLoading(true);
    setError(null);
    setIsOfflineFallback(false);

    try {
      const data = await getMonthlyBilling(month, year);
      if (Array.isArray(data) && data.length > 0) {
        setBillingData(data);
      } else {
        setBillingData(FALLBACK_BILLING_DATA);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu chốt sổ:', err);
      setError('Chưa kết nối tới Backend server (có thể Render đang khởi động lại). Đang hiển thị bảng mặc định 6 thành viên.');
      setIsOfflineFallback(true);
      setBillingData(FALLBACK_BILLING_DATA);
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
        </div>
      </div>

      {/* Offline / Backend status alert */}
      {isOfflineFallback && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-amber-300 text-sm">
          <WifiOff className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
          <div>
            <p className="font-semibold">{error}</p>
            <p className="text-xs text-amber-400/80 mt-1">
              👉 <strong>Nguyên nhân:</strong> Nếu deploy Render bản miễn phí, server sẽ cần ~30 giây để thức dậy khi có truy cập mới.
              Bạn có thể nhấn nút <strong>"Thử lại"</strong> ở góc trên sau ít phút. Bảng dưới đây vẫn đang tự động tính đầy đủ số tiền cố định của 6 người!
            </p>
          </div>
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
                <th className="py-4 px-5 text-right font-bold text-emerald-400">TỔNG ĐÓNG</th>
                <th className="py-4 px-5 text-center">Hoá Đơn</th>
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
                    <td className="py-4 px-5 text-right font-mono font-bold text-base text-emerald-400 bg-emerald-500/5">
                      {formatVND(item.total_due)}
                    </td>
                    <td className="py-4 px-5 text-center">
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
                <tr>
                  <td className="py-4 px-5 text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>TỔNG CỘNG THU:</span>
                  </td>
                  <td colSpan="5"></td>
                  <td className="py-4 px-5 text-right text-lg text-emerald-400 font-mono">
                    {formatVND(grandTotal)}
                  </td>
                  <td></td>
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
    </div>
  );
}
