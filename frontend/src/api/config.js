// src/api/config.js
export const getBackendURL = () => {
  // 从环境变量获取，或者动态计算
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL || 'https://yourdomain.com/api';
  }
  
  // 开发环境：根据当前访问地址自动计算
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // 如果是IP地址访问
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `${protocol}//${hostname}:3000`;
  }
  
  // 本地开发
  return 'http://localhost:3000';
};

export const getBackendBaseURL = () => {
  return getBackendURL().replace('/api', '');
};