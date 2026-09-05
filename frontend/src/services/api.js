import axios from 'axios';

// Domain Production Backend mặc định trên Render.com
// Tự động nhận diện khi web chạy trên Vercel/Internet
const PRODUCTION_BACKEND_URL = 'https://tien-nha-904b-backend.onrender.com/api';
let adminSessionInMemory = '';

const newIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

export const setAdminSession = (token) => {
  adminSessionInMemory = String(token || '');
};

export const clearAdminSession = () => {
  adminSessionInMemory = '';
};

export const getApiBaseUrl = () => {
  // 1. Ưu tiên biến môi trường NEXT_PUBLIC_API_URL nếu có
  if (process.env.NEXT_PUBLIC_API_URL) {
    let envUrl = process.env.NEXT_PUBLIC_API_URL.trim().replace(/\/+$/, '');
    if (!envUrl.endsWith('/api')) envUrl = `${envUrl}/api`;
    return envUrl;
  }

  // 2. Mặc định LUÔN sử dụng Render Backend URL để đảm bảo kết nối thành công 
  // (người dùng không phải nhập thủ công, ngay cả khi test ở localhost)
  return PRODUCTION_BACKEND_URL;
};

// Khởi tạo Axios instance
const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor tự động chọn URL phù hợp và gắn Auth Header trước mỗi request
api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  
  if (!config.url?.endsWith('/auth/login')) {
    if (adminSessionInMemory) config.headers.Authorization = `Bearer ${adminSessionInMemory}`;
  }
  return config;
});

// Bắt lỗi 401 từ backend
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Bắn ra sự kiện để UI hiển thị Admin Login Modal
      window.dispatchEvent(new CustomEvent('auth-error'));
      return Promise.reject(new Error(error.response.data.detail || 'Không có quyền truy cập.'));
    }
    return Promise.reject(error);
  }
);

export const verifyAdminPin = async (pin) => {
  const response = await api.post('/auth/login', { pin });
  if (response.data?.success && response.data?.session_token) {
    setAdminSession(response.data.session_token);
  }
  return response.data;
};

export const getMonthlyBilling = async (month, year) => {
  const response = await api.get(`/billing/${month}/${year}`);
  return response.data;
};

export const updateMonthlyUtilities = async (month, year, { electricity_amount, water_amount, expected_version, idempotency_key }) => {
  const response = await api.put(`/monthly/${month}/${year}`, {
    electricity_amount,
    water_amount,
    expected_version,
    idempotency_key: idempotency_key || newIdempotencyKey(),
  });
  return response.data;
};

export const updatePaymentStatus = async (memberId, month, year, isPaid, expectedVersion) => {
  const response = await api.put('/overrides/status', {
    member_id: memberId,
    month,
    year,
    is_paid: isPaid,
    expected_version: expectedVersion,
    idempotency_key: newIdempotencyKey(),
  });
  return response.data;
};

export const updateMemberOverride = async ({ member_id, month, year, parking_fee, is_excluded, expected_version }) => {
  const response = await api.put('/overrides', {
    member_id,
    month,
    year,
    parking_fee,
    is_excluded,
    expected_version,
    idempotency_key: newIdempotencyKey(),
  });
  return response.data;
};

export const getMembers = async () => {
  const response = await api.get('/members');
  return response.data;
};

export const getYearlyStats = async (year) => {
  const response = await api.get(`/yearly/${year}`);
  return response.data;
};

// --- MEMBERS API ---
export const addMember = async (name, fixed_rent) => {
  const response = await api.post('/members', { name, fixed_rent });
  return response.data;
};

export const updateMember = async (member_id, name, fixed_rent, expected_version) => {
  const response = await api.put(`/members/${member_id}`, { name, fixed_rent, expected_version });
  return response.data;
};

export const deleteMember = async (member_id, expectedVersion) => {
  const response = await api.delete(`/members/${member_id}`, {
    params: { expected_version: expectedVersion },
  });
  return response.data;
};

// --- SETTINGS API ---
export const getSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

export const updateServiceFee = async (value, expectedVersion) => {
  const response = await api.put('/settings/service-fee', { value, expected_version: expectedVersion });
  return response.data;
};

export const updateAdminPin = async (pin, expectedVersion) => {
  const response = await api.put('/settings/admin-pin', { pin, expected_version: expectedVersion });
  if (response.data?.session_token) setAdminSession(response.data.session_token);
  return response.data;
};

export default api;
