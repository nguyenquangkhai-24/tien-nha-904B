import axios from 'axios';

// Domain Production Backend mặc định trên Render.com
// Tự động nhận diện khi web chạy trên Vercel/Internet
const PRODUCTION_BACKEND_URL = 'https://tien-nha-904b-backend.onrender.com/api';

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

// Interceptor tự động chọn URL phù hợp trước mỗi request
api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  return config;
});

export const getMonthlyBilling = async (month, year) => {
  const response = await api.get(`/billing/${month}/${year}`);
  return response.data;
};

export const updateMonthlyUtilities = async (month, year, { electricity_amount, water_amount }) => {
  const response = await api.put(`/monthly/${month}/${year}`, {
    electricity_amount,
    water_amount,
  });
  return response.data;
};

export const createExpense = async ({ buyer_id, item_name, amount, month, year, cycle_id }) => {
  const response = await api.post('/expenses', {
    buyer_id,
    item_name,
    amount,
    month,
    year,
    cycle_id,
  });
  return response.data;
};

export const deleteExpense = async (expenseId) => {
  const response = await api.delete(`/expenses/${expenseId}`);
  return response.data;
};

export const getExpensesByMonth = async (month, year) => {
  const response = await api.get(`/expenses/${month}/${year}`);
  return response.data;
};

export const updateParkingOverride = async ({ member_id, month, year, parking_fee }) => {
  const response = await api.put('/overrides', {
    member_id,
    month,
    year,
    parking_fee,
  });
  return response.data;
};

export const getMembers = async () => {
  const response = await api.get('/members');
  return response.data;
};

export default api;
