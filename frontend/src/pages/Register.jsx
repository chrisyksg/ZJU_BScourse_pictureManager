// src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios'; // 确保路径正确

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const { username, email, password, confirmPassword } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // 前端初步校验
        if (password !== confirmPassword) {
            return setError('两次输入的密码不一致');
        }
        if (username.length < 6 || password.length < 6) {
            return setError('用户名和密码必须至少6个字符');
        }

        try {
            // 严格对应后端接口：POST /api/auth/register
            await api.post('/auth/register', {
                username,
                email,
                password
            });

            setSuccess(true);
            // 注册成功后，延迟 2 秒跳转到登录页
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || '注册失败，请稍后再试');
        }
    };

    return (
        <section className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>创建账户</h1>
                    <p>加入 PictureManager，开始管理您的精美照片</p>
                </div>

                {success && (
                    <div className="success-message" style={{ display: 'block' }}>
                        <i className="fas fa-check-circle"></i> 注册成功！正在前往登录页...
                    </div>
                )}
                {error && (
                    <div className="error-message" style={{ display: 'block' }}>
                        <i className="fas fa-exclamation-circle"></i> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>用户名</label>
                        <input
                            type="text"
                            name="username"
                            className="form-control"
                            placeholder="至少6个字符"
                            value={username}
                            onChange={onChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>邮箱地址</label>
                        <input
                            type="email"
                            name="email"
                            className="form-control"
                            placeholder="example@zju.edu.cn"
                            value={email}
                            onChange={onChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>密码</label>
                        <input
                            type="password"
                            name="password"
                            className="form-control"
                            placeholder="至少6个字符"
                            value={password}
                            onChange={onChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>确认密码</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className="form-control"
                            placeholder="请再次输入密码"
                            value={confirmPassword}
                            onChange={onChange}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '20px' }}>
                        <i className="fas fa-user-plus"></i> 立即注册
                    </button>
                </form>

                <div className="form-footer">
                    <span>已有账户？</span>
                    <Link to="/login" className="auth-link">点此登录</Link>
                </div>
            </div>
        </section>
    );
};

export default Register;