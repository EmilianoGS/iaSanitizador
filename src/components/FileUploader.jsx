// src/components/FileUploader.jsx
import React, { useState } from 'react';
import './FileUploader.css';

function FileUploader({ onFileUpload }) {
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file) => {
    if (file) {
      setFileName(file.name);
      setFileSize((file.size / 1024).toFixed(2) + ' KB');
      
      const reader = new FileReader();
      reader.onload = (e) => {
        onFileUpload(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handlePaste = async (e) => {
    const text = e.clipboardData.getData('text');
    if (text) {
      onFileUpload(text);
      setFileName('Texto pegado desde portapapeles');
      setFileSize((text.length / 1024).toFixed(2) + ' KB');
    }
  };

  return (
    <div className="file-uploader">
      <div
        className={`drop-zone ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="drop-zone-content">
          <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="drop-text">
            Arrastra tu archivo aquí o <span className="browse-link">explora</span>
          </p>
          <p className="drop-subtext">
            Soporta archivos .txt, .env, .js, .py, .json, .yml, .yaml, .xml, .html, .css
          </p>
          <input
            type="file"
            onChange={handleFileChange}
            accept=".txt,.env,.js,.py,.json,.yml,.yaml,.xml,.html,.css,.jsx,.tsx,.ts,.md,.sql,.sh,.bash,.conf,.config,.properties,.ini"
            className="file-input"
          />
        </div>
      </div>

      <div className="upload-actions">
        <button onClick={() => document.querySelector('input[type="file"]').click()} 
          className="btn btn-upload">
          Seleccionar archivo
        </button>
        <button onClick={() => {
          const text = prompt('Pega el contenido del archivo aquí:');
          if (text) {
            onFileUpload(text);
            setFileName('Texto pegado manualmente');
            setFileSize((text.length / 1024).toFixed(2) + ' KB');
          }
        }} className="btn btn-paste">
          Pegar texto
        </button>
        <div className="file-info">
          {fileName && (
            <span className="file-name">📄 {fileName} ({fileSize})</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default FileUploader;