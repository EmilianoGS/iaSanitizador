// src/components/TextPreview.jsx
import React, { useState } from 'react';
import './TextPreview.css';

function TextPreview({ text, title = 'Texto original' }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  const previewText = text.slice(0, 500);
  const isLong = text.length > 500;

  return (
    <div className="text-preview">
      <div className="preview-header">
        <h3>{title}</h3>
        <span className="char-count">{text.length} caracteres</span>
      </div>
      <div className="preview-content">
        <pre className={`preview-text ${isExpanded ? 'expanded' : ''}`}>
          {isExpanded ? text : previewText}
        </pre>
        {isLong && (
          <button 
            className="btn-toggle"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Ver menos' : 'Ver más...'}
          </button>
        )}
      </div>
    </div>
  );
}

export default TextPreview;