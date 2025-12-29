// src/components/Navbar.jsx
import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, User, Upload, Image as ImageIcon } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    return (
        <nav className="navbar" style={{ background: '#fff', padding: '1rem 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)', textDecoration: 'none' }}>📸 PicManager</Link>
            
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <Link to="/" style={{ textDecoration: 'none', color: '#666' }}>首页</Link>
                
                {user ? (
                    <>
                        <Link to="/upload" style={{ textDecoration: 'none', color: '#666', display: 'flex', alignItems: 'center' }}><Upload size={18}/> 上传</Link>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 15px', background: '#f0f4ff', borderRadius: '20px' }}>
                            <User size={16} color="var(--primary)"/>
                            <span style={{ fontWeight: '600' }}>{user.username}</span>
                        </div>
                        <button onClick={() => { logout(); navigate('/login'); }} style={{ border: 'none', background: 'none', color: '#ff4d4f', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><LogOut size={18}/> 退出</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" style={{ textDecoration: 'none', color: 'var(--primary)' }}>登录</Link>
                        <Link to="/register" style={{ textDecoration: 'none', background: 'var(--primary)', color: 'white', padding: '8px 20px', borderRadius: '5px' }}>注册</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;