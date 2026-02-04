import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const formats = {
    document: ['PDF', 'DOCX', 'TXT', 'HTML', 'MD', 'PPT', 'XLSX', 'CSV', 'EPUB'],
    image: ['PDF', 'JPG', 'PNG']
};

const conversionPairs = [
    { from: 'DOCX', to: 'PDF' },
    { from: 'PDF', to: 'DOCX' },
    { from: 'TXT', to: 'PDF' },
    { from: 'PDF', to: 'TXT' },
    { from: 'HTML', to: 'PDF' },
    { from: 'MD', to: 'PDF' },
    { from: 'PPT', to: 'PDF' },
    { from: 'XLSX', to: 'PDF' },
    { from: 'CSV', to: 'PDF' },
    { from: 'EPUB', to: 'PDF' },
    { from: 'JPG', to: 'PDF' },
    { from: 'PNG', to: 'PDF' },
    { from: 'PDF', to: 'JPG' },
    { from: 'PDF', to: 'PNG' },
];

const tools = [
    { id: 'convert', label: 'Convert', icon: ArrowRight, endpoint: '/api/convert' },
    { id: 'merge', label: 'Merge', icon: FileText, endpoint: '/api/merge' },
    { id: 'split', label: 'Split', icon: FileText, endpoint: '/api/split' },
    { id: 'compress', label: 'Compress', icon: FileText, endpoint: '/api/compress' },
    { id: 'extract-text', label: 'Extract Text', icon: FileText, endpoint: '/api/extract/text' },
    { id: 'extract-images', label: 'Extract Images', icon: FileText, endpoint: '/api/extract/images' },
    { id: 'rotate', label: 'Rotate', icon: FileText, endpoint: '/api/rotate' },
    { id: 'reorder', label: 'Reorder', icon: FileText, endpoint: '/api/reorder' },
];

function App() {
    const [activeTool, setActiveTool] = useState('convert');
    const [files, setFiles] = useState([]); // Array for multi-file support
    const [fromFormat, setFromFormat] = useState('DOCX');
    const [toFormat, setToFormat] = useState('PDF');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [rotateAngle, setRotateAngle] = useState('90');
    const [pageOrder, setPageOrder] = useState('1,2,3');
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length > 0) {
            const oversized = selectedFiles.some(f => f.size > 20 * 1024 * 1024);
            if (oversized) {
                setStatus({ type: 'error', message: 'One or more files exceed 20MB limit.' });
                return;
            }

            setFiles(selectedFiles);
            setStatus({ type: '', message: '' });

            if (activeTool === 'convert' && selectedFiles.length === 1) {
                const ext = selectedFiles[0].name.split('.').pop().toUpperCase();
                if (conversionPairs.some(p => p.from === ext)) {
                    setFromFormat(ext);
                    const defaultTo = conversionPairs.find(p => p.from === ext)?.to;
                    if (defaultTo) setToFormat(defaultTo);
                }
            }
        }
    };

    const handleAction = async () => {
        if (files.length === 0) return;

        setLoading(true);
        setStatus({ type: 'info', message: 'Processing your request...' });

        const formData = new FormData();
        const tool = tools.find(t => t.id === activeTool);

        if (activeTool === 'merge') {
            files.forEach(f => formData.append('files', f));
        } else {
            formData.append('file', files[0]);
        }

        if (activeTool === 'convert') {
            formData.append('from', fromFormat.toLowerCase());
            formData.append('to', toFormat.toLowerCase());
        }

        if (activeTool === 'rotate') {
            formData.append('angle', rotateAngle);
        }

        if (activeTool === 'reorder') {
            formData.append('order', pageOrder);
        }

        try {
            const response = await axios.post(tool.endpoint, formData, {
                responseType: 'blob',
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            const isZip = activeTool === 'split' || activeTool === 'extract-images';
            const ext = isZip ? 'zip' : (activeTool === 'convert' ? toFormat.toLowerCase() : 'pdf');
            const outputFilename = `${activeTool}_${Date.now()}.${ext}`;

            link.setAttribute('download', outputFilename);
            document.body.appendChild(link);
            link.click();
            link.remove();

            setStatus({ type: 'success', message: 'Operation successful! Your download should start shortly.' });
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: 'Operation failed. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container">
            <div className="background-blobs">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card"
            >
                <header className="hero">
                    <h1>SwiftConvert</h1>
                    <p>High-performance, secure & free document tools</p>
                </header>

                <nav className="tool-tabs">
                    {tools.map(tool => (
                        <button
                            key={tool.id}
                            className={`tab-btn ${activeTool === tool.id ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTool(tool.id);
                                setFiles([]);
                                setStatus({ type: '', message: '' });
                            }}
                        >
                            {tool.label}
                        </button>
                    ))}
                </nav>

                <section
                    className={`upload-section ${files.length > 0 ? 'active' : ''}`}
                    onClick={() => fileInputRef.current.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        multiple={activeTool === 'merge'}
                        style={{ display: 'none' }}
                    />
                    {files.length > 0 ? (
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                            <CheckCircle size={48} color="var(--success)" style={{ marginBottom: '1rem' }} />
                            <p style={{ fontWeight: 600 }}>
                                {files.length === 1 ? files[0].name : `${files.length} files selected`}
                            </p>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                {(files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB total
                            </p>
                        </motion.div>
                    ) : (
                        <div>
                            <Upload size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                            <p style={{ fontWeight: 600 }}>
                                {activeTool === 'merge' ? 'Select multiple files to merge' : 'Click to upload or drag & drop'}
                            </p>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                Max file size: 20MB
                            </p>
                        </div>
                    )}
                </section>

                <div className="controls">
                    {activeTool === 'convert' && (
                        <div className="select-group">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>FROM</label>
                                <select value={fromFormat} onChange={(e) => setFromFormat(e.target.value)}>
                                    {Array.from(new Set(conversionPairs.map(p => p.from))).sort().map(fmt => (
                                        <option key={fmt} value={fmt}>{fmt}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>TO</label>
                                <select value={toFormat} onChange={(e) => setToFormat(e.target.value)}>
                                    {conversionPairs
                                        .filter(p => p.from === fromFormat)
                                        .map(p => (
                                            <option key={p.to} value={p.to}>{p.to}</option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>
                    )}

                    {activeTool === 'rotate' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>ROTATION ANGLE</label>
                            <select value={rotateAngle} onChange={(e) => setRotateAngle(e.target.value)}>
                                <option value="90">90° Clockwise</option>
                                <option value="180">180°</option>
                                <option value="270">270° Clockwise</option>
                            </select>
                        </div>
                    )}

                    {activeTool === 'reorder' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>PAGE ORDER (e.g. 1,3,2,4-last)</label>
                            <input
                                type="text"
                                value={pageOrder}
                                onChange={(e) => setPageOrder(e.target.value)}
                                style={{
                                    background: 'var(--card-bg)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text)',
                                    padding: '0.8rem 1rem',
                                    borderRadius: '12px',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    )}

                    <button
                        className="convert-btn"
                        disabled={files.length === 0 || loading}
                        onClick={handleAction}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="loading-spinner" />
                                Processing...
                            </>
                        ) : (
                            <>
                                {tools.find(t => t.id === activeTool).label}
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </div>

                <AnimatePresence>
                    {status.message && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`status-msg ${status.type}`}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                {status.type === 'error' && <AlertCircle size={18} />}
                                {status.type === 'success' && <CheckCircle size={18} />}
                                {status.type === 'info' && <Loader2 size={18} className="loading-spinner" style={{ animation: 'spin 1s linear infinite' }} />}
                                {status.message}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <footer style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Powered by Open Source • Privacy Guaranteed • No Data Persisted
                </footer>
            </motion.div>
        </div>
    );
}

export default App;
