import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Cấu hình Axios instance trỏ tới http://localhost:8000/api
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Các helper API tương ứng với 03_api_endpoints.md
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
