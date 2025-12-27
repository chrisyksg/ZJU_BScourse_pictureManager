// src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <nav style={{ background: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <Link to="/" style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary)', textDecoration: 'none' }}>📸 PictureManager</Link>
            <div>
                <Link to="/" style={{ marginRight: '20px', textDecoration: 'none', color: '#333' }}>首页库</Link>
                <Link to="/upload" style={{ marginRight: '20px', textDecoration: 'none', color: '#333' }}>上传图片</Link>
                <button onClick={handleLogout} style={{ background: 'none', border: '1px solid #ddd', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>退出</button>
            </div>
        </nav>
    );
};

export default Navbar;