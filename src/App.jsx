// src/App.jsx
import React, { useState } from 'react';
import './App.css';
import FileUploader from './components/FileUploader';
import TextPreview from './components/TextPreview';
import SanitizedOutput from './components/SanitizedOutput';
import { sanitizeText } from './utils/sanitizer';

function App() {
  const [originalText, setOriginalText] = useState('');
  const [sanitizedData, setSanitizedData] = useState(null);

  const handleFileUpload = (text) => {
    setOriginalText(text);
    const result = sanitizeText(text);
    setSanitizedData(result);
  };

  const handleReset = () => {
    setOriginalText('');
    setSanitizedData(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🔍 Sanitizador de Código</h1>
          <p className="subtitle">
            Detecta y reemplaza datos sensibles en archivos de código antes de compartirlos con IA
          </p>
          <div className="badge-container">
            <span className="badge">🔐 API Keys</span>
            <span className="badge">🌐 URLs</span>
            <span className="badge">📧 Emails</span>
            <span className="badge">🔑 Tokens</span>
            <span className="badge">📊 Parámetros</span>
            <span className="badge">📱 IPs</span>
          </div>
        </div>
      </header>

      <main className="app-main">
        <FileUploader onFileUpload={handleFileUpload} />

        {originalText && (
          <>
            <div className="preview-section">
              <TextPreview text={originalText} title="📄 Texto Original" />
            </div>

            {sanitizedData && (
              <div className="output-section">
                <SanitizedOutput 
                  sanitizedData={sanitizedData} 
                  originalText={originalText}
                />
              </div>
            )}

            <div className="action-section">
              <button className="btn btn-reset" onClick={handleReset}>
                🔄 Limpiar todo
              </button>
            </div>
          </>
        )}

        {!originalText && (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <h2>No hay archivo cargado</h2>
            <p>Sube un archivo o pega texto para comenzar</p>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          🚀 Los datos solo se procesan en tu navegador. Nunca se almacenan ni se envían a ningún servidor.
        </p>
      </footer>
    </div>
  );
}

export default App;