import axios from 'axios';

// const API = axios.create({ baseURL: 'http://localhost:5000/api' });
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,  // 30s timeout (Render free tier cold starts)
});

// Request interceptor — log in dev
API.interceptors.request.use(config => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`→ ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

// Response interceptor — global error handling
API.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.error || err.message || 'Network error';
    console.error('API Error:', msg);
    return Promise.reject(err);
  }
);

export const getProducts      = ()          => API.get('/products');
export const createProduct      = (data)     => API.post('/products', data);
export const updateStock      = (id, qty)   => API.put(`/products/${id}/stock`, { currentStock: qty });

export const getSales         = (id, days)  => API.get(`/sales/${id}?days=${days}`);
export const recordSale       = (data)      => API.post('/sales', data);
export const recordBulkSales    = (sales)    => API.post('/sales/bulk', { sales });
export const getDailySummary    = (days)     => API.get(`/sales/summary/daily?days=${days}`);
export const getCategorySummary = (days)     => API.get(`/sales/summary/category?days=${days}`);

export const getPrediction    = (id, days)  => API.get(`/predictions/${id}?days=${days}`);
export const getBatchPredict  = (days = 7)  => API.get(`/predictions/batch/all?days=${days}`);

