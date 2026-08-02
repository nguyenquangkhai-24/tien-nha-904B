'use client';

import React, { useRef, useState } from 'react';
import { X, Download, Copy, Check, Loader2, Sparkles, Building2 } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

export default function MemberBillModal({ memberData, month, year, onClose }) {
  const receiptRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0) + 'đ';
  };

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await htmlToImage.toPng(receiptRef.current, { quality: 1, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `Bill_TienNha_904B_${memberData.name}_Thang${month}_${year}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Lỗi khi tải ảnh:', err);
      alert('Không thể tải ảnh. Vui lòng thử lại.');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyText = () => {
    const text = `📌 HOÁ ĐƠN TIỀN NHÀ - PHÒNG 904B 🏠
Tháng ${month}/${year}

👤 Người nhận: ${memberData.name}
----------------------------------
🔹 Tiền phòng cố định: ${formatVND(memberData.fixed_rent)}
🔹 Phí dịch vụ: ${formatVND(memberData.service_fee)}
🔹 Phí gửi xe: ${formatVND(memberData.parking_fee)}
🔹 Điện & Nước (chia 6): ${formatVND(memberData.utility_share)}
🔹 Phát sinh chung (chia 6): ${formatVND(memberData.extra_expense_share)}
----------------------------------
👉 TỔNG THANH TOÁN: ${formatVND(memberData.total_due)}

(Vui lòng chuyển khoản đúng số tiền trên. Cảm ơn!)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-w-md w-full max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* Nút đóng */}
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 md:-right-12 md:-top-0 p-2 text-slate-300 hover:text-white bg-slate-800/50 hover:bg-rose-500/80 rounded-full transition-all"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="overflow-y-auto w-full no-scrollbar rounded-2xl">
          {/* Khung Hoá Đơn (Sẽ được chụp ảnh) */}
          <div 
            ref={receiptRef}
            className="w-full bg-slate-900 overflow-hidden border border-slate-700 shadow-2xl relative"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 md:p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
              <Building2 className="w-8 h-8 md:w-10 md:h-10 mx-auto text-white mb-2 opacity-90" />
              <h2 className="text-xl md:text-2xl font-black text-white tracking-wide uppercase shadow-sm">Phòng 904B</h2>
              <p className="text-xs md:text-sm text-emerald-50 font-medium mt-1">Hoá Đơn Tiền Nhà - Tháng {month}/{year}</p>
            </div>

            {/* Body */}
            <div className="p-5 md:p-6 space-y-4 md:space-y-5 bg-slate-900">
              <div className="flex justify-between items-center pb-3 md:pb-4 border-b border-slate-700 border-dashed">
                <span className="text-slate-400 text-xs md:text-sm">Người thanh toán:</span>
                <span className="text-base md:text-lg font-bold text-slate-100">{memberData.name}</span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs md:text-sm">
                  <span className="text-slate-400">Tiền phòng cố định</span>
                  <span className="text-slate-200 font-mono font-medium">{formatVND(memberData.fixed_rent)}</span>
                </div>
                <div className="flex justify-between items-center text-xs md:text-sm">
                  <span className="text-slate-400">Phí dịch vụ chung</span>
                  <span className="text-slate-200 font-mono font-medium">{formatVND(memberData.service_fee)}</span>
                </div>
                <div className="flex justify-between items-center text-xs md:text-sm">
                  <span className="text-slate-400">Phí gửi xe</span>
                  <span className="text-slate-200 font-mono font-medium">{formatVND(memberData.parking_fee)}</span>
                </div>
                <div className="flex justify-between items-center text-xs md:text-sm">
                  <span className="text-slate-400">Điện & Nước (chia 6)</span>
                  <span className="text-slate-200 font-mono font-medium">{formatVND(memberData.utility_share)}</span>
                </div>
                <div className="flex justify-between items-center text-xs md:text-sm">
                  <span className="text-slate-400">Đồ dùng chung (chia 6)</span>
                  <span className="text-slate-200 font-mono font-medium">{formatVND(memberData.extra_expense_share)}</span>
                </div>
              </div>
            </div>

            {/* Footer (Total) */}
            <div className="bg-slate-800 p-5 md:p-6 border-t border-slate-700">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="font-bold uppercase tracking-wider text-xs md:text-sm">Tổng Thanh Toán</span>
                </div>
                <span className="text-xl md:text-2xl font-black text-emerald-400 font-mono">{formatVND(memberData.total_due)}</span>
              </div>
              <p className="text-center text-[10px] md:text-xs text-slate-500 mt-4 italic">
                Vui lòng hoàn tất thanh toán trước ngày mùng 5 hàng tháng. Xin cảm ơn!
              </p>
            </div>
          </div>
        </div>

        {/* Nút Hành Động */}
        <div className="mt-4 flex flex-col sm:flex-row w-full gap-3">
          <button
            onClick={handleCopyText}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition text-sm ${
              copied
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/50'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Đã Copy Text' : 'Copy Text'}
          </button>
          
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold transition text-sm disabled:opacity-50 shadow-lg shadow-emerald-500/20"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Tải Ảnh Bill
          </button>
        </div>
      </div>
    </div>
  );
}
