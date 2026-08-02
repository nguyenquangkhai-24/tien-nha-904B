import axios from 'axios';

// Lấy URL từ biến môi trường
let rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Chuẩn hóa URL: Tự động loại bỏ dấu / thừa ở cuối
rawUrl = rawUrl.trim().replace(/\/+$/, '');

// Tự động bổ sung /api nếu người dùng lỡ điền URL chỉ có domain
if (!rawUrl.endsWith('/api')) {
  rawUrl = `${rawUrl}/api`;
}

const API_BASE_URL = rawUrl;

// Khởi tạo Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Timeout 10 giây nếu server không phản hồi
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
