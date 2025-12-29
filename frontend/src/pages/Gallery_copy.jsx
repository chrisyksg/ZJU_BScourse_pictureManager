// src/pages/Gallery.jsx
import React, { useState, useEffect, useContext, useMemo } from 'react'; // 补上了 useMemo
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
// 补上了 ChevronRight, Tag, Info
import { Search, MapPin, Calendar, ChevronRight, Tag, Info } from 'lucide-react'; 

// Swiper 轮播图组件
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

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
            }, 500);
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

    // 核心逻辑：按月份分组 (修复了报错)
    const groupedImages = useMemo(() => {
        const groups = {};
        images.forEach(img => {
            const dateSource = img.captured_at || img.upload_date;
            let monthTitle = "未知日期";
            
            if (dateSource) {
                const date = new Date(dateSource);
                monthTitle = `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
            }

            if (!groups[monthTitle]) groups[monthTitle] = [];
            groups[monthTitle].push(img);
        });
        
        return Object.entries(groups).sort((a, b) => {
            if (a[0] === "未知日期") return 1;
            if (b[0] === "未知日期") return -1;
            return b[0].localeCompare(a[0]);
        });
    }, [images]);

    const fetchImageTags = async (id) => {
        try {
            const res = await api.get(`/images/${id}/tags`);
            return res.data;
        } catch { return []; }
    };

    const openModal = async (img) => {
        setSelectedImage(img);
        const t = await fetchImageTags(img.id);
        setTags(t);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("确定要永久删除这张照片吗？")) return;
        try {
            await api.delete(`/images/${id}`);
            setImages(images.filter(img => img.id !== id));
            setSelectedImage(null);
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
            setTags([...tags, { name: newTag }]);
            setNewTag('');
        } catch (err) {
            alert("标签添加失败");
        }
    };

    if (!user) return <div style={{textAlign:'center', marginTop:'100px'}}>请先登录</div>;
    if (loading) return <div style={{textAlign:'center', marginTop:'100px'}}>加载中...</div>;

    return (
        <div className="gallery-page" style={{ background: '#fcfcfd', minHeight: '100vh' }}>
            {/* 1. 顶部搜索区域 - 更加高级的毛玻璃效果 */}
            <div className="search-header" style={{ 
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                padding: '40px 5%',
                marginBottom: '30px'
            }}>
                <div className="search-bar-wrapper" style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
                    <Search className="search-icon" size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input 
                        type="text" 
                        placeholder="搜索标题、地点、标签..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ 
                            width: '100%', padding: '15px 15px 15px 50px', borderRadius: '30px', border: 'none',
                            fontSize: '16px', outline: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                        }}
                    />
                </div>
            </div>

            {/* 2. 沉浸式轮播展示 - 优化标签和描述展示 */}
            {images.length > 0 && !searchTerm && (
                <section className="featured-carousel" style={{ margin: '0 5% 40px 5%', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                    <Swiper
                        modules={[Navigation, Pagination, Autoplay, EffectFade]}
                        effect="fade"
                        navigation
                        pagination={{ clickable: true }}
                        autoplay={{ delay: 5000 }}
                        loop={true}
                        style={{ height: '450px' }}
                    >
                        {images.slice(0, 5).map(img => (
                            <SwiperSlide key={`slide-${img.id}`}>
                                <div style={{ position: 'relative', height: '100%', background: '#000' }}>
                                    <img 
                                        src={`http://localhost:3000/${img.file_path}`} 
                                        alt={img.title}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: '0.8' }}
                                    />
                                    {/* 轮播文字层 */}
                                    <div style={{
                                        position: 'absolute', bottom: '0', left: '0', right: '0',
                                        padding: '40px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                                        color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                <span style={{ background: 'var(--primary)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
                                                    {img.location_address || '精彩瞬间'}
                                                </span>
                                            </div>
                                            <h2 style={{ fontSize: '32px', margin: '0' }}>{img.title}</h2>
                                        </div>
                                        
                                        {/* 右侧：描述内容（截断） */}
                                        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                            <div style={{ 
                                                maxWidth: '300px', background: 'rgba(255,255,255,0.1)', 
                                                padding: '15px', borderRadius: '12px', backdropFilter: 'blur(10px)',
                                                border: '1px solid rgba(255,255,255,0.2)'
                                            }}>
                                                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#e2e8f0' }}>
                                                    <Info size={14} style={{ marginRight: '5px' }}/>
                                                    {img.description ? (img.description.length > 60 ? img.description.substring(0, 60) + '...' : img.description) : '这个瞬间没有留下文字记录...'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </section>
            )}

            {/* 3. 按月份分类的列表 */}
            <main className="gallery-main" style={{ padding: '0 5% 50px 5%' }}>
                {groupedImages.map(([month, photos]) => (
                    <div key={month} style={{ marginBottom: '50px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '24px', marginBottom: '25px', color: '#1e293b' }}>
                            {month} 
                            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'normal', background: '#f1f5f9', padding: '4px 12px', borderRadius: '20px' }}>
                                {photos.length} 张照片
                            </span>
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '25px' }}>
                            {photos.map(img => (
                                <div key={img.id} className="photo-card" onClick={() => openModal(img)} style={{
                                    background: '#fff', borderRadius: '16px', overflow: 'hidden', 
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ height: '200px', overflow: 'hidden' }}>
                                        <img src={`http://localhost:3000/${img.thumbnail_path}`} alt={img.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div style={{ padding: '15px' }}>
                                        <h4 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{img.title}</h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '12px' }}>
                                            <Calendar size={12} />
                                            {new Date(img.captured_at || img.upload_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </main>

            {/* 详情弹窗 (保持你之前的逻辑，确保包含描述) */}
            {selectedImage && (
                <div className="modal-overlay" onClick={() => setSelectedImage(null)} style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', 
                    alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)'
                }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                        background: 'white', borderRadius: '20px', maxWidth: '1000px', width: '95%',
                        maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column'
                    }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>{selectedImage.title}</h3>
                            <button onClick={() => setSelectedImage(null)} style={{ border: 'none', background: '#f1f5f9', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer' }}>&times;</button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', padding: '20px', gap: '30px' }}>
                            <div style={{ flex: '1.5', minWidth: '300px' }}>
                                <img src={`http://localhost:3000/${selectedImage.file_path}`} alt="原图" style={{ width: '100%', borderRadius: '12px' }} />
                                <div style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '12px' }}>
                                    <h4 style={{ marginTop: 0, fontSize: '14px', color: '#64748b' }}>图片描述</h4>
                                    <p style={{ lineHeight: '1.6', margin: 0 }}>{selectedImage.description || '暂无描述'}</p>
                                </div>
                            </div>
                            <div style={{ flex: '1', minWidth: '250px' }}>
                                {/* EXIF 信息展示... */}
                                <h4>详细信息</h4>
                                <div style={{ fontSize: '14px', lineHeight: '2.5', color: '#475569' }}>
                                    <p>📅 <strong>拍摄时间:</strong> {selectedImage.captured_at ? new Date(selectedImage.captured_at).toLocaleString() : '未知'}</p>
                                    <p>📐 <strong>尺寸:</strong> {selectedImage.width} x {selectedImage.height}</p>
                                    <p>📍 <strong>地点:</strong> {selectedImage.location_address || '未标记地点'}</p>
                                </div>
                                <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '20px 0' }} />
                                {/* 标签操作... */}
                                <h4>标签管理</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
                                    {tags.map((t, i) => (
                                        <span key={i} style={{ background: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '6px', fontSize: '12px' }}>#{t.name}</span>
                                    ))}
                                </div>
                                <form onSubmit={handleAddTag} style={{ display: 'flex', gap: '10px' }}>
                                    <input 
                                        type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)}
                                        placeholder="输入新标签..."
                                        style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    />
                                    <button type="submit" className="btn btn-primary">添加</button>
                                </form>
                                <button className="btn btn-danger" onClick={() => handleDelete(selectedImage.id)} style={{ width: '100%', marginTop: '30px' }}>删除此照片</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gallery;