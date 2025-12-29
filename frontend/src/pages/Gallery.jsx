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
    const [selectedImage, setSelectedImage] = useState(null);
    const [tags, setTags] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [newTag, setNewTag] = useState('');

    useEffect(() => {
        if (user) {
        const delayDebounceFn = setTimeout(() => {
            fetchImages(searchTerm);
        }, 500); // 防抖处理
        return () => clearTimeout(delayDebounceFn);
        }
    }, [searchTerm, user]);

    const fetchImages = async (title = '') => {
        try {
            const res = await api.get(`/images?title=${title}`);
            setImages(res.data);
        } catch (err) {
            console.error("加载图片失败", err);
        } finally {
            setLoading(false);
        }
    };
    // 打开弹窗并加载标签
    const openModal = async (img) => {
        setSelectedImage(img);
        try {
            const res = await api.get(`/images/${img.id}/tags`);
            setTags(res.data);
        } catch (err) {
            setTags([]);
        }
    };

    // 删除图片逻辑
    const handleDelete = async (id) => {
        if (!window.confirm("确定要永久删除这张照片吗？")) return;
        try {
            await api.delete(`/images/${id}`);
            setImages(images.filter(img => img.id !== id)); // 更新 UI
            setSelectedImage(null); // 关闭弹窗
            alert("删除成功");
        } catch (err) {
            alert("删除失败");
        }
    };
    const handleAddTag = async (e) => {
        e.preventDefault();
        if (!newTag.trim()) return;

        try {
            await api.post(`/images/${selectedImage.id}/tags`, { tagName: newTag });
            setTags([...tags, { name: newTag }]); // 立即更新 UI
            setNewTag(''); // 清空输入框
        } catch (err) {
            alert("标签添加失败");
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
    if (loading) {
        return (
            <div style={{ 
                textAlign: 'center', 
                marginTop: '50px', 
                padding: '40px',
                fontSize: '18px',
                color: '#666'
            }}>
                <div style={{ marginBottom: '20px' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: 'var(--primary)' }}></i>
                </div>
                正在加载您的图片库...
            </div>
        );
    }

    return (
        <div style={{ padding: '30px 5%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                <h2>我的照片库 ({images.length})</h2>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                    <input 
                        type="text" 
                        placeholder="搜索图片标题..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ 
                            padding: '10px 15px 10px 40px', 
                            borderRadius: '25px', 
                            border: '1px solid #ddd', 
                            width: '300px',
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                </div>
            </div>

            {images.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', background: '#fff', borderRadius: '12px' }}>
                    <p>你还没有上传过照片哦</p>
                    <Link to="/upload">现在去上传第一张</Link>
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
                        {images.map(img => (
                            <div key={img.id} 
                                className="image-card" 
                                onClick={() => openModal(img)}
                                style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow)' , cursor: 'pointer' ,transition: 'transform 0.2s ease, box-shadow 0.2s ease'}}>
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
                    {selectedImage && (
                        <div className="modal-overlay" onClick={() => setSelectedImage(null)} style={{
                            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                            backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', 
                            alignItems: 'center', zIndex: 1000, padding: '20px'
                        }}>
                            <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                                background: 'white', borderRadius: '12px', maxWidth: '900px', width: '100%',
                                maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column'
                            }}>
                                {/* 头部：标题和关闭 */}
                                <div style={{ padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                                    <h3>{selectedImage.title}</h3>
                                    <button onClick={() => setSelectedImage(null)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', padding: '20px', gap: '20px' }}>
                                    {/* 左侧：原图展示 */}
                                    <div style={{ flex: '1.5', minWidth: '300px' }}>
                                        <img 
                                            src={`http://localhost:3000/${selectedImage.file_path}`} 
                                            alt="原图" 
                                            style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                                        />
                                    </div>

                                    {/* 右侧：EXIF信息与操作 */}
                                    <div style={{ flex: '1', minWidth: '250px' }}>
                                        <h4>图片详情</h4>
                                        <div style={{ margin: '15px 0', fontSize: '14px', lineHeight: '2' }}>
                                            <p><strong>拍摄时间:</strong> {selectedImage.captured_at ? new Date(selectedImage.captured_at).toLocaleString() : '未知'}</p>
                                            <p><strong>分辨率:</strong> {selectedImage.width} x {selectedImage.height}</p>
                                            <p><strong>文件大小:</strong> {(selectedImage.file_size / 1024 / 1024).toFixed(2)} MB</p>
                                            <p><strong>地理位置:</strong> {selectedImage.location_address || '无 GPS 数据'}</p>
                                        </div>

                                        <div style={{ marginBottom: '20px' }}>
                                            <strong>标签:</strong>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                                                {tags.length > 0 ? tags.map((t, i) => (
                                                    <span key={i} style={{ background: '#eef2ff', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>#{t.name}</span>
                                                )) : <span style={{ color: '#999', fontSize: '12px' }}>暂无标签</span>}
                                            </div>
                                            <form onSubmit={handleAddTag} style={{ display: 'flex', gap: '5px' }}>
                                                <input 
                                                    type="text" 
                                                    placeholder="添加新标签..." 
                                                    value={newTag}
                                                    onChange={(e) => setNewTag(e.target.value)}
                                                    style={{ flex: 1, padding: '5px 10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '12px' }}
                                                />
                                                <button type="submit" style={{ padding: '5px 10px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>添加</button>
                                            </form>
                                        </div>

                                        <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', display: 'flex', gap: '10px' }}>
                                            <button className="btn btn-danger" onClick={() => handleDelete(selectedImage.id)} style={{ padding: '8px 15px' }}>
                                                <i className="fas fa-trash"></i> 删除图片
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Gallery;