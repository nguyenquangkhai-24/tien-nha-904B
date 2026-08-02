import React, { useState, useEffect } from 'react';
import { getMembers, addMember, updateMember, deleteMember, getSettings, updateSetting } from '../services/api';
import { X, Users, Settings as SettingsIcon, Save, Plus, Trash2, Edit2, Loader2, DollarSign, KeyRound } from 'lucide-react';

export default function SystemConfigModal({ onClose, onUpdated }) {
  const [activeTab, setActiveTab] = useState('members');
  const [loading, setLoading] = useState(false);
  
  // Member state
  const [members, setMembers] = useState([]);
  const [editingMember, setEditingMember] = useState(null);
  const [newMember, setNewMember] = useState({ name: '', fixed_rent: '' });
  const [isAdding, setIsAdding] = useState(false);

  // Settings state
  const [serviceFee, setServiceFee] = useState('');
  const [adminPin, setAdminPin] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersData, settingsData] = await Promise.all([
        getMembers(),
        getSettings()
      ]);
      setMembers(membersData);
      setServiceFee(settingsData.service_fee || 133000);
      setAdminPin(settingsData.admin_pin || '');
    } catch (err) {
      console.error('Lỗi tải dữ liệu cấu hình:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveServiceFee = async () => {
    try {
      await updateSetting('service_fee', parseInt(serviceFee, 10));
      alert('Đã cập nhật Phí Dịch Vụ Mặc Định');
      if (onUpdated) onUpdated();
    } catch (err) {
      alert('Lỗi khi lưu cấu hình');
    }
  };

  const handleSaveAdminPin = async () => {
    if (!adminPin || adminPin.length < 4) {
      alert('Mã PIN phải có ít nhất 4 ký tự!');
      return;
    }
    try {
      await updateSetting('admin_pin', adminPin);
      localStorage.setItem('adminPin', adminPin); // Cập nhật local luôn
      alert('Đã đổi Mã PIN Quản Trị thành công!');
    } catch (err) {
      alert('Lỗi khi đổi mã PIN');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMember.name || !newMember.fixed_rent) return;
    try {
      await addMember(newMember.name, parseInt(newMember.fixed_rent, 10));
      setIsAdding(false);
      setNewMember({ name: '', fixed_rent: '' });
      fetchData();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert('Lỗi thêm thành viên');
    }
  };

  const handleUpdateMember = async (e) => {
    e.preventDefault();
    if (!editingMember) return;
    try {
      await updateMember(editingMember.id, editingMember.name, parseInt(editingMember.fixed_rent, 10));
      setEditingMember(null);
      fetchData();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert('Lỗi cập nhật thành viên');
    }
  };

  const handleDeleteMember = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa thành viên "${name}" khỏi nhà không?`)) return;
    try {
      await deleteMember(id);
      fetchData();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert('Lỗi xóa thành viên');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative max-w-2xl w-full bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-800 p-5 md:p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-emerald-400" /> Quản Lý Hệ Thống
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-rose-500/80 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 bg-slate-800/50">
          <button 
            className={`flex-1 py-3 px-4 font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'members' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-slate-800' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            onClick={() => setActiveTab('members')}
          >
            <Users className="w-4 h-4" /> Thành viên
          </button>
          <button 
            className={`flex-1 py-3 px-4 font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'settings' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-slate-800' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            onClick={() => setActiveTab('settings')}
          >
            <SettingsIcon className="w-4 h-4" /> Phí Chung
          </button>
        </div>

        {/* Body */}
        <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            </div>
          ) : activeTab === 'members' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-slate-300 font-semibold">Danh sách Khách trọ</h3>
                <button 
                  onClick={() => setIsAdding(!isAdding)}
                  className="flex items-center gap-1 text-sm bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/30 hover:bg-emerald-500 hover:text-white transition"
                >
                  {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {isAdding ? 'Hủy' : 'Thêm người'}
                </button>
              </div>

              {/* Form thêm mới */}
              {isAdding && (
                <form onSubmit={handleAddMember} className="bg-slate-950 p-4 rounded-xl border border-slate-700 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Tên hiển thị</label>
                      <input 
                        required
                        type="text" 
                        value={newMember.name}
                        onChange={e => setNewMember({...newMember, name: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:border-emerald-500 outline-none"
                        placeholder="Ví dụ: Khải"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Tiền phòng cố định (VNĐ)</label>
                      <input 
                        required
                        type="number" 
                        inputMode="numeric"
                        value={newMember.fixed_rent}
                        onChange={e => setNewMember({...newMember, fixed_rent: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:border-emerald-500 outline-none font-mono"
                        placeholder="3750000"
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-sm transition">
                    Lưu Thành Viên Mới
                  </button>
                </form>
              )}

              {/* Danh sách */}
              <div className="space-y-3">
                {members.map(member => (
                  <div key={member.id} className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {editingMember && editingMember.id === member.id ? (
                      <form onSubmit={handleUpdateMember} className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                        <input 
                          required type="text" 
                          value={editingMember.name} 
                          onChange={e => setEditingMember({...editingMember, name: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm" 
                        />
                        <div className="flex gap-2">
                          <input 
                            required type="number" 
                            value={editingMember.fixed_rent} 
                            onChange={e => setEditingMember({...editingMember, fixed_rent: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm font-mono" 
                          />
                          <button type="submit" className="p-2 bg-emerald-500 text-slate-950 rounded-lg hover:bg-emerald-400"><Save className="w-4 h-4" /></button>
                          <button type="button" onClick={() => setEditingMember(null)} className="p-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"><X className="w-4 h-4" /></button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-100 text-lg">{member.name}</span>
                          <span className="text-sm text-emerald-400 font-mono">Tiền phòng: {new Intl.NumberFormat('vi-VN').format(member.fixed_rent)}đ</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingMember(member)} className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition" title="Sửa">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteMember(member.id, member.name)} className="p-2 bg-rose-500/20 hover:bg-rose-500 border border-rose-500/50 hover:text-white text-rose-400 rounded-lg transition" title="Xóa">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <h3 className="text-slate-300 font-semibold mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" /> Phí Dịch Vụ Chung (Mặc định)
                </h3>
                <p className="text-sm text-slate-400 mb-4">Khoản tiền này sẽ được cộng vào hoá đơn hàng tháng của tất cả mọi người (Bao gồm Internet, Rác, Máy giặt...)</p>
                
                <div className="flex gap-3">
                  <input 
                    type="number"
                    inputMode="numeric"
                    value={serviceFee}
                    onChange={e => setServiceFee(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 font-mono focus:border-emerald-500 outline-none transition"
                  />
                  <button 
                    onClick={handleSaveServiceFee}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Lưu
                  </button>
                </div>
              </div>

              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <h3 className="text-slate-300 font-semibold mb-2 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-rose-400" /> Mã PIN Quản Trị Viên
                </h3>
                <p className="text-sm text-slate-400 mb-4">Mã PIN dùng để đăng nhập quyền Chủ nhà. Mặc định là 123456.</p>
                
                <div className="flex gap-3">
                  <input 
                    type="text"
                    maxLength={10}
                    value={adminPin}
                    onChange={e => setAdminPin(e.target.value)}
                    placeholder="Nhập mã PIN mới..."
                    className="flex-1 bg-slate-950 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 font-mono focus:border-rose-500 outline-none transition"
                  />
                  <button 
                    onClick={handleSaveAdminPin}
                    className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Đổi PIN
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
