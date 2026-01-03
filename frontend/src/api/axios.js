// src/api/axios.js
import axios from 'axios';

// 获取当前主机地址
const getBaseURL = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  // 如果是本地开发
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000/api';
  }
  
  // 如果是IP地址访问（手机访问）
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    // 使用相同的IP地址，但端口是3000
    return `${protocol}//${hostname}:3000/api`;
  }
  
  // 其他情况（如域名访问）
  return `${protocol}//${hostname}${port ? ':' + port : ''}/api`;
};

const instance = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000, // 10秒超时
});

// 自动拦截器：如果本地有 Token，自动加在 Header 里
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
// 响应拦截器
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // token过期
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance;