import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Search, Calendar, MapPin, ChevronRight, X, Edit2, Check, RefreshCw } from 'lucide-react';
import Cropper from 'react-easy-crop'; // 引入裁剪插件

// 配置工具
import { getBackendURL } from '../api/config';
// Swiper 相关保持不变...
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const Gallery = () => {
    const { user } = useContext(AuthContext);
    const [images, setImages] = useState([]);
    const [carouselTags, setCarouselTags] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [tags, setTags] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [newTag, setNewTag] = useState('');
    // 获取后端基础URL
    const [backendBaseURL, setBackendBaseURL] = useState('');
    useEffect(() => {
        setBackendBaseURL(getBackendURL());
    }, []);

    // --- 新增：图片编辑相关状态 ---
    const [isEditing, setIsEditing] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    //新增：AI识别状态
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // 基础获取逻辑保持不变...
    useEffect(() => {
        if (user) {
            const delayDebounceFn = setTimeout(() => { fetchImages(searchTerm); }, 500);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [searchTerm, user]);

    const fetchImages = async (title = '') => {
        try {
            const res = await api.get(`/images?title=${title}`);
            setImages(res.data);
            if (!title && res.data.length > 0) {
                const top5 = res.data.slice(0, 5);
                const tagMap = {};
                for (let img of top5) {
                    const t = await fetchImageTags(img.id);
                    tagMap[img.id] = t;
                }
                setCarouselTags(tagMap);
            }
        } catch (err) { console.error("加载失败", err); }
        finally { setLoading(false); }
    };

    const fetchImageTags = async (id) => {
        try {
            const res = await api.get(`/images/${id}/tags`);
            return res.data;
        } catch { return []; }
    };

    const openModal = async (img) => {
        setSelectedImage(img);
        setIsEditing(false); // 打开时默认不是编辑模式
        setBrightness(100);
        setContrast(100);
        const t = await fetchImageTags(img.id);
        setTags(t);
    };

    // --- 新增：保存编辑后的图片 ---
    const onCropComplete = useCallback((trimmedArea, pixels) => {
        setCroppedAreaPixels(pixels);
    }, []);

    const handleSaveEdit = async () => {
        if (!croppedAreaPixels) return;
        setIsSaving(true);
        try {
            // 1. 创建 Canvas 处理图片
            const image = new Image();
            //image.src = `http://localhost:3000/${selectedImage.file_path}`;
            image.src = `${backendBaseURL}/${selectedImage.file_path}`;
            image.crossOrigin = "anonymous"; // 处理跨域

            await new Promise((resolve) => (image.onload = resolve));

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = croppedAreaPixels.width;
            canvas.height = croppedAreaPixels.height;

            // 2. 应用色调滤镜
            ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

            // 3. 绘制裁剪后的部分
            ctx.drawImage(
                image,
                croppedAreaPixels.x, croppedAreaPixels.y,
                croppedAreaPixels.width, croppedAreaPixels.height,
                0, 0,
                croppedAreaPixels.width, croppedAreaPixels.height
            );

            // 4. 转为 Blob 并上传
            canvas.toBlob(async (blob) => {
                const formData = new FormData();
                formData.append('image', blob, 'edited_image.jpg');

                // 注意：这里假设后端有一个专门处理编辑的接口，或者复用上传接口
                await api.post(`/images/${selectedImage.id}/edit`, formData);
                
                alert("编辑成功！");
                setIsEditing(false);
                fetchImages(); // 刷新列表
                setSelectedImage(null); // 关闭弹窗
                setIsSaving(false);
            }, 'image/jpeg', 0.9);

        } catch (err) {
            console.error(err);
            alert("保存编辑失败");
            setIsSaving(false);
        }
    };

    // 分组逻辑保持不变...
    const groupedImages = useMemo(() => {
        const groups = {};
        images.forEach(img => {
            const dateSource = img.captured_at || img.upload_date;
            let monthTitle = "未知时期";
            if (dateSource) {
                const date = new Date(dateSource);
                monthTitle = `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
            }
            if (!groups[monthTitle]) groups[monthTitle] = [];
            groups[monthTitle].push(img);
        });
        return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
    }, [images]);

    const handleAddTag = async (e) => {
        e.preventDefault();
        if (!newTag.trim()) return;
        try {
            await api.post(`/images/${selectedImage.id}/tags`, { tagName: newTag });
            setTags([...tags, { name: newTag }]);
            setNewTag('');
        } catch (err) { alert("标签添加失败"); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("确定要永久删除这张照片吗？")) return;
        try {
            await api.delete(`/images/${id}`);
            setImages(images.filter(img => img.id !== id));
            setSelectedImage(null);
        } catch (err) { alert("删除失败"); }
    };

    const handleAIAnalyze = async (imageId) => {
        try {
            setIsAnalyzing(true); // 你可以加一个单独的 loading 状态
            const res = await api.post(`/images/${imageId}/analyze`);
            alert("AI 识别完成: " + res.data.tags.join(', '));
            
            // 建议：执行完成后刷新图片数据或页面
            window.location.reload(); 
        } catch (err) {
            console.error("AI 识别失败", err);
            alert("识别失败，请检查网络或 API 配置");
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (!user) return <div style={{textAlign:'center', padding:'100px'}}>请先登录</div>;
    if (loading) return <div style={{textAlign:'center', padding:'100px'}}>加载中...</div>;

    return (
        <div className="gallery-page" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '50px' }}>
            {/* 1. 搜索区域 */}
            <div style={{ padding: '40px 5%', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
                    <Search style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
                    <input 
                        type="text" placeholder="搜索标题..." value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '12px 15px 12px 45px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none' }}
                    />
                </div>
            </div>

            {/* 2. 轮播图区域  */}
            {images.length > 0 && !searchTerm && (
                <section style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 20px' }}>
                    <h2 style={{ fontSize: '18px', color: '#64748b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={18} /> 精选瞬间
                    </h2>
                    <Swiper
                        modules={[Navigation, Pagination, Autoplay]}
                        navigation pagination={{ clickable: true }}
                        autoplay={{ delay: 5000 }}
                        style={{ background: '#fff', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', height: '420px', overflow: 'hidden' }}
                    >
                        {images.slice(0, 5).map(img => (
                            <SwiperSlide key={`slide-${img.id}`}>
                                <div style={{ display: 'flex', height: '100%' }}>
                                    <div style={{ width: '200px', padding: '30px', background: '#f1f5f9', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>标签</span>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {carouselTags[img.id]?.map((t, i) => (
                                                <span key={i} style={{ background: '#fff', color: '#4338ca', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0' }}>#{t.name}</span>
                                            )) || <span style={{ color: '#94a3b8', fontSize: '12px' }}>无标签</span>}
                                        </div>
                                    </div>
                                    <div style={{ flex: '1', position: 'relative', background: '#000' }}>
                                        <img src={`${backendBaseURL}/${img.file_path}`} alt={img.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', color: '#fff' }}>
                                            <h3 style={{ margin: 0 }}>{img.title}</h3>
                                        </div>
                                    </div>
                                    <div style={{ width: '280px', padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px' }}>
                                            <Calendar size={14} /> {new Date(img.captured_at || img.upload_date).toLocaleDateString()}
                                        </div>
                                        <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: '1.6', fontStyle: 'italic' }}>
                                            "{img.description || '这张图片保持着它的沉默...'}"
                                        </p>
                                        <button onClick={() => openModal(img)} style={{ marginTop: 'auto', border: '1px solid #6366f1', color: '#6366f1', padding: '8px', borderRadius: '8px', cursor: 'pointer', background: 'none' }}>详情</button>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </section>
            )}

            {/* 3. 图片网格  */}
            <main style={{ padding: '0 5%' }}>
                {groupedImages.map(([month, photos]) => (
                    <div key={month} style={{ marginBottom: '40px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>{month} <ChevronRight size={16} /></h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                            {photos.map(img => (
                                <div key={img.id} onClick={() => openModal(img)} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                    <div style={{ height: '180px' }}>
                                        <img src={`${backendBaseURL}/${img.thumbnail_path}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                    </div>
                                    <div style={{ padding: '10px' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{img.title}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </main>

            {/* 4. 增强版详情与编辑弹窗 */}
            {selectedImage && (
                <div className="modal-overlay" onClick={() => !isSaving && setSelectedImage(null)} style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', 
                    alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)'
                }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                        background: 'white', borderRadius: '20px', maxWidth: '1000px', width: '95%',
                        maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column'
                    }}>
                        {/* 弹窗头部 */}
                        <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>{isEditing ? `编辑: ${selectedImage.title}` : selectedImage.title}</h3>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {!isEditing ? (
                                    <>
                                        {/* --- AI 按钮 --- */}
                                        <button 
                                            onClick={() => handleAIAnalyze(selectedImage.id)}
                                            disabled={isAnalyzing}
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '5px', 
                                                padding: '6px 15px', 
                                                borderRadius: '8px', 
                                                border: '1px solid #10b981', // 绿色边框
                                                color: '#10b981', 
                                                background: isAnalyzing ? '#f0fdf4' : 'white',
                                                cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                                                fontWeight: '500',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {isAnalyzing ? (
                                                <RefreshCw className="animate-spin" size={16} />
                                            ) : (
                                                <span>🤖</span> 
                                            )}
                                            {isAnalyzing ? "识别中..." : "AI 识图"}
                                        </button>

                                        {/* --- 编辑按钮 --- */}
                                        <button onClick={() => setIsEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 15px', borderRadius: '8px', border: '1px solid #6366f1', color: '#6366f1', cursor: 'pointer', background: 'white' }}>
                                            <Edit2 size={16} /> 编辑图片
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={handleSaveEdit} disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 15px', borderRadius: '8px', border: 'none', background: '#6366f1', color: 'white', cursor: 'pointer' }}>
                                        {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />} 
                                        {isSaving ? '保存中...' : '应用修改'}
                                    </button>
                                )}
                                <button onClick={() => setSelectedImage(null)} style={{ border: 'none', background: '#f1f5f9', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer' }}>&times;</button>
                            </div>
                        </div>

                        {/* 弹窗主体内容 */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', padding: '20px', gap: '30px' }}>
                            {/* 左侧区域：图片展示或裁剪器 */}
                            <div style={{ flex: '1.5', minWidth: '300px' }}>
                                {isEditing ? (
                                    <div style={{ position: 'relative', width: '100%', height: '400px', background: '#333', borderRadius: '12px', overflow: 'hidden' }}>
                                        <Cropper
                                            //image={`http://localhost:3000/${selectedImage.file_path}`}
                                            image={`${backendBaseURL}/${selectedImage.file_path}`}
                                            crop={crop}
                                            zoom={zoom}
                                            aspect={4 / 3}
                                            onCropChange={setCrop}
                                            onCropComplete={onCropComplete}
                                            onZoomChange={setZoom}
                                            // 关键点：通过 CSS filter 在裁剪预览时显示色调效果
                                            style={{ containerStyle: { filter: `brightness(${brightness}%) contrast(${contrast}%)` } }}
                                        />
                                    </div>
                                ) : (
                                    <img src={`${backendBaseURL}/${selectedImage.file_path}`} alt="原图" style={{ width: '100%', borderRadius: '12px' }} />
                                )}

                                {isEditing && (
                                    <div style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '12px' }}>
                                        <h4 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>色调调节</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <label style={{ fontSize: '12px', color: '#64748b' }}>亮度: {brightness}%</label>
                                            <input type="range" min="50" max="150" value={brightness} onChange={e => setBrightness(e.target.value)} style={{ width: '100%' }} />
                                            
                                            <label style={{ fontSize: '12px', color: '#64748b' }}>对比度: {contrast}%</label>
                                            <input type="range" min="50" max="150" value={contrast} onChange={e => setContrast(e.target.value)} style={{ width: '100%' }} />
                                        </div>
                                    </div>
                                )}
                                
                                {!isEditing && (
                                    <div style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '12px' }}>
                                        <h4 style={{ marginTop: 0, fontSize: '14px', color: '#64748b' }}>图片描述</h4>
                                        <p style={{ lineHeight: '1.6', margin: 0 }}>{selectedImage.description || '暂无描述'}</p>
                                    </div>
                                )}
                            </div>

                            {/* 右侧区域：信息管理 (保持不变) */}
                            <div style={{ flex: '1', minWidth: '250px' }}>
                                <h4>详细信息</h4>
                                <div style={{ fontSize: '14px', lineHeight: '2.5', color: '#475569' }}>
                                    <p>📅 <strong>拍摄时间:</strong> {selectedImage.captured_at ? new Date(selectedImage.captured_at).toLocaleString() : '未知'}</p>
                                    <p>📐 <strong>原始尺寸:</strong> {selectedImage.width} x {selectedImage.height}</p>
                                    <p>📍 <strong>地点:</strong> {selectedImage.location_address || '未标记地点'}</p>
                                </div>
                                <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '20px 0' }} />
                                
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