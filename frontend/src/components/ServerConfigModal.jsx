'use client';

import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../services/api';
import axios from 'axios';
import { Server, CheckCircle2, AlertCircle, RefreshCw, Settings, X } from 'lucide-react';

export default function ServerConfigModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [status, setStatus] = useState(null); // 'testing' | 'success' | 'error'
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('TIEN_NHA_API_URL');
      setServerUrl(saved || getApiBaseUrl());
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    setStatus('testing');
    setStatusMsg('Đang kiểm tra kết nối tới Backend Render...');

    let cleanUrl = serverUrl.trim().replace(/\/+$/, '');
    if (!cleanUrl.endsWith('/api')) {
      cleanUrl = `${cleanUrl}/api`;
    }
    // Root URL check
    const rootUrl = cleanUrl.replace(/\/api$/, '/');

    try {
      const res = await axios.get(rootUrl, { timeout: 10000 });
      if (res.status === 200) {
        setStatus('success');
        setStatusMsg('Kết nối thành công! Server Backend đang hoạt động bình thường.');
      } else {
        setStatus('error');
        setStatusMsg(`Server phản hồi mã HTTP ${res.status}.`);
      }
    } catch (err) {
      console.error('Test connection error:', err);
      setStatus('error');
      setStatusMsg(
        'Không thể kết nối. Hãy kiểm tra xem bạn đã điền đúng URL Render chưa (VD: https://tien-nha-904b-backend.onrender.com).'
      );
    }
  };

  const handleSave = () => {
    let cleanUrl = serverUrl.trim().replace(/\/+$/, '');
    if (cleanUrl) {
      localStorage.setItem('TIEN_NHA_API_URL', cleanUrl);
      window.location.reload(); // Reload để áp dụng URL mới
    }
  };

  const handleReset = () => {
    localStorage.removeItem('TIEN_NHA_API_URL');
    window.location.reload();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition"
      >
        <Settings className="w-3.5 h-3.5 text-emerald-400" />
        <span>Cấu Hình Server Backend</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100">Cấu Hình URL Backend Server</h3>
                <p className="text-xs text-slate-400">
                  Dán đường dẫn Backend đã deploy trên Render.com vào đây
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Backend Server URL
              </label>
              <input
                type="text"
                placeholder="VD: https://tien-nha-904b-backend.onrender.com"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                URL mặc định đang dùng: <code className="text-emerald-400 font-mono">{getApiBaseUrl()}</code>
              </p>
            </div>

            {status && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  status === 'testing'
                    ? 'bg-slate-800 text-slate-300 border border-slate-700'
                    : status === 'success'
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                }`}
              >
                {status === 'testing' && <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />}
                {status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {status === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
                <span>{statusMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
              >
                Đặt lại mặc định
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handleTestConnection}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-700"
                >
                  Kiểm tra kết nối
                </button>

                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-500/20"
                >
                  Lưu & Tải lại
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
