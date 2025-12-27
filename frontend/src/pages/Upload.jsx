// src/pages/Upload.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Upload as UploadIcon, X, Image as ImageIcon, CheckCircle } from 'lucide-react';

const Upload = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [info, setInfo] = useState({ title: '', description: '', privacy: 'private' });
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    // 处理文件选择
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file)); // 创建本地预览
            setInfo({ ...info, title: file.name.split('.')[0] }); // 默认标题为文件名
        }
    };

    // 提交上传
    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) return alert("请先选择图片");

        setUploading(true);
        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('title', info.title);
        formData.append('description', info.description);
        formData.append('privacy', info.privacy);

        try {
            const res = await api.post('/images/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percent);
                }
            });

            console.log("上传成功:", res.data);
            alert("图片上传成功！EXIF信息已提取。");
            navigate('/'); // 上传完跳回首页看图
        } catch (err) {
            console.error("上传失败:", err);
            alert(err.response?.data?.message || "上传失败");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="upload-container" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '20px' }}><UploadIcon size={24} style={{ verticalAlign: 'middle', marginRight: '10px' }} /> 上传新照片</h2>
            
            <div className="upload-card" style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: 'var(--shadow)' }}>
                {!preview ? (
                    // 未选择文件时的占位框
                    <div 
                        className="drop-zone" 
                        onClick={() => fileInputRef.current.click()}
                        style={{ border: '2px dashed #ccc', padding: '40px', textAlign: 'center', cursor: 'pointer', borderRadius: '8px' }}
                    >
                        <ImageIcon size={48} color="#aaa" />
                        <p style={{ marginTop: '10px', color: '#666' }}>点击或拖拽图片到此处上传</p>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" hidden />
                    </div>
                ) : (
                    // 已选择文件时的预览
                    <div className="preview-section">
                        <div style={{ position: 'relative', marginBottom: '20px' }}>
                            <img src={preview} alt="预览" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px' }} />
                            <button onClick={() => {setPreview(null); setSelectedFile(null);}} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '5px', cursor: 'pointer' }}><X size={20}/></button>
                        </div>

                        <form onSubmit={handleUpload}>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label>图片标题</label>
                                <input type="text" className="form-control" value={info.title} onChange={(e) => setInfo({...info, title: e.target.value})} />
                            </div>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label>描述 (可选)</label>
                                <textarea className="form-control" rows="3" value={info.description} onChange={(e) => setInfo({...info, description: e.target.value})}></textarea>
                            </div>
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label>隐私设置</label>
                                <select className="form-control" value={info.privacy} onChange={(e) => setInfo({...info, privacy: e.target.value})}>
                                    <option value="private">仅自己可见 (Private)</option>
                                    <option value="public">公开 (Public)</option>
                                </select>
                            </div>

                            {uploading ? (
                                <div className="progress-container" style={{ marginBottom: '20px' }}>
                                    <div style={{ background: '#eee', borderRadius: '10px', height: '10px' }}>
                                        <div style={{ background: 'var(--primary)', width: `${progress}%`, height: '100%', borderRadius: '10px', transition: 'width 0.3s' }}></div>
                                    </div>
                                    <p style={{ textAlign: 'center', fontSize: '12px', marginTop: '5px' }}>正在上传并处理图片: {progress}%</p>
                                </div>
                            ) : (
                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>开始上传</button>
                            )}
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Upload;