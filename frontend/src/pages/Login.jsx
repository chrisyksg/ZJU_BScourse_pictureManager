// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios'; // 引入你配置好的 axios 实例

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // 与后端 login 接口通信 [cite: 399]
            const response = await api.post('/auth/login', { email, password });
            
            // 登录成功处理 
            setSuccess(true);
            localStorage.setItem('token', response.data.token); // 保存通行证
            
            // 延迟跳转到首页/上传页 [cite: 402]
            setTimeout(() => {
                navigate('/'); 
            }, 1500);
        } catch (err) {
            // 登录失败处理 [cite: 403]
            setError(err.response?.data?.message || '登录失败，请检查邮箱和密码');
        }
    };

    return (
        <section className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>欢迎回来</h1>
                    <p>登录您的账户继续使用 PictureManager</p>
                </div>

                {/* 状态反馈消息 [cite: 343] */}
                {success && <div className="success-message" style={{display: 'block'}}>
                    <i className="fas fa-check-circle"></i> 登录成功！正在跳转...
                </div>}
                {error && <div className="error-message" style={{display: 'block'}}>
                    <i className="fas fa-exclamation-circle"></i> {error}
                </div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>邮箱地址</label>
                        <input 
                            type="email" 
                            className="form-control" 
                            placeholder="请输入您的邮箱" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label>密码</label>
                        <input 
                            type="password" 
                            className="form-control" 
                            placeholder="请输入您的密码" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '20px' }}>
                        <i className="fas fa-sign-in-alt"></i> 登录
                    </button>
                </form>

                <div className="form-footer">
                    <span>还没有账户？</span>
                    <Link to="/register" className="auth-link">立即注册</Link>
                </div>
            </div>
        </section>
    );
};

export default Login;