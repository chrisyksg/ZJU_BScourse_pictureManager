// src/pages/Gallery.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Search, MapPin, Calendar } from 'lucide-react';

const Gallery = () => {
    const { user } = useContext(AuthContext);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchImages();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchImages = async () => {
        try {
            const res = await api.get('/images');
            setImages(res.data);
        } catch (err) {
            console.error("加载图片失败", err);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
          <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <h1>欢迎来到智能图片管理系统</h1>
            <p style={{ color: '#666', margin: '20px 0' }}>请先登录以查看和管理您的照片</p>
            <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>立即登录</Link>
          </div>
        );
    }

    return (
        <div style={{ padding: '30px 5%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                <h2>我的照片库 ({images.length})</h2>
                {/* 这里以后可以放搜索框 */}
            </div>

            {images.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', background: '#fff', borderRadius: '12px' }}>
                    <p>你还没有上传过照片哦</p>
                    <Link to="/upload">现在去上传第一张</Link>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
                    {images.map(img => (
                        <div key={img.id} className="image-card" style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
                            <div style={{ height: '200px', overflow: 'hidden' }}>
                                <img 
                                    src={`http://localhost:3000/${img.thumbnail_path}`} 
                                    alt={img.title} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                            <div style={{ padding: '15px' }}>
                                <h4 style={{ marginBottom: '10px' }}>{img.title}</h4>
                                <div style={{ fontSize: '12px', color: '#888' }}>
                                    {img.location_address && <p><MapPin size={12}/> {img.location_address}</p>}
                                    <p><Calendar size={12}/> {new Date(img.captured_at || img.upload_date).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Gallery;