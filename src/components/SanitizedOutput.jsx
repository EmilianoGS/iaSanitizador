// src/components/SanitizedOutput.jsx
import React, { useState, useMemo } from 'react';
import { 
  FiGlobe, FiLink, FiKey, FiLock, FiServer, 
  FiMail, FiMapPin, FiCpu, FiDatabase, FiFileText,
  FiEye, FiEyeOff, FiCopy, FiDownload, FiChevronDown,
  FiChevronRight, FiGrid, FiList
} from 'react-icons/fi';
import { FaRegBuilding } from 'react-icons/fa';
import './SanitizedOutput.css';

function SanitizedOutput({ sanitizedData }) {
  const [copied, setCopied] = useState(false);
  const [filterType, setFilterType] = useState('todos');
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [showFindings, setShowFindings] = useState(true);

  if (!sanitizedData) return null;

  const { sanitizedText, findings, totalFindings, envVars } = sanitizedData;

  // ============================================================
  // CONFIGURACIÓN DE TIPOS - Con iconos de react-icons
  // ============================================================
  const TYPE_CONFIG = {
    url: { label: 'URLs', icon: FiGlobe, color: '#3b82f6' },
    apiParam: { label: 'Parámetros API', icon: FiLink, color: '#8b5cf6' },
    apiKey: { label: 'API Keys', icon: FiKey, color: '#ef4444' },
    jwt: { label: 'JWT Tokens', icon: FiLock, color: '#f59e0b' },
    ip: { label: 'IPs', icon: FiMapPin, color: '#10b981' },
    email: { label: 'Emails', icon: FiMail, color: '#6366f1' },
    // phone: ELIMINADO - ya no se considera dato sensible
    hash: { label: 'Hashes', icon: FiCpu, color: '#14b8a6' },
    creditCard: { label: 'Tarjetas', icon: FiServer, color: '#f43f5e' },
    dbConnection: { label: 'Conexiones DB', icon: FiDatabase, color: '#8b5cf6' },
    envDeclaration: { label: 'Variables ENV', icon: FiFileText, color: '#06b6d4' },
    envLoaded: { label: 'Cargas ENV', icon: FiFileText, color: '#22c55e' },
    credentials: { label: 'Credenciales', icon: FiLock, color: '#dc2626' },
    authString: { label: 'Auth Strings', icon: FiLock, color: '#d946ef' },
  };

  // ============================================================
  // AGRUPAR HALLAZGOS POR TIPO
  // ============================================================
  const groupedFindings = useMemo(() => {
    const groups = {};
    for (const finding of findings) {
      const type = finding.type || 'unknown';
      if (!groups[type]) groups[type] = [];
      groups[type].push(finding);
    }
    return groups;
  }, [findings]);

  const types = useMemo(() => Object.keys(groupedFindings).sort(), [groupedFindings]);

  const typeCounts = useMemo(() => {
    const counts = {};
    for (const [type, items] of Object.entries(groupedFindings)) {
      counts[type] = items.length;
    }
    return counts;
  }, [groupedFindings]);

  // ============================================================
  // TOGGLES
  // ============================================================
  const toggleGroup = (type) => {
    const newSet = new Set(expandedGroups);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setExpandedGroups(newSet);
  };

  const expandAll = () => setExpandedGroups(new Set(types));
  const collapseAll = () => setExpandedGroups(new Set());

  // ============================================================
  // COPIAR TEXTO SANITIZADO
  // ============================================================
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sanitizedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = sanitizedText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([sanitizedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sanitized_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="sanitized-output">
      {/* HEADER */}
      <div className="output-header">
        <div className="header-left">
          <FaRegBuilding className="header-icon" />
          <h3>Texto Sanitizado</h3>
          <span className="findings-badge">
            {totalFindings} reemplazos
          </span>
        </div>
        <div className="header-actions">
          <button 
            className={`btn-icon ${showFindings ? 'active' : ''}`}
            onClick={() => setShowFindings(!showFindings)}
          >
            {showFindings ? <FiEyeOff /> : <FiEye />}
            Hallazgos
          </button>
          <button className="btn-icon" onClick={handleCopy}>
            <FiCopy />
            {copied ? 'Copiado' : 'Copiar'}
          </button>
          <button className="btn-icon" onClick={handleDownload}>
            <FiDownload />
            Descargar
          </button>
        </div>
      </div>

      {/* STATS BAR */}
      <div className="stats-bar">
        <span>{totalFindings} datos sensibles</span>
        <span>{types.length} tipos</span>
        {envVars && envVars.length > 0 && (
          <span>{envVars.length} variables ENV</span>
        )}
        <span className="stats-hint">{sanitizedText.length.toLocaleString()} caracteres</span>
      </div>

      {/* TEXTO SANITIZADO */}
      <div className="output-body">
        <div className="sanitized-text-container">
          <div className="sanitized-text-header">
            <span className="sanitized-text-label">
              <FiFileText /> Texto limpio
            </span>
            <button className="copy-mini-btn" onClick={handleCopy}>
              <FiCopy /> {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <pre className="sanitized-text">{sanitizedText}</pre>
        </div>

        {/* HALLAZGOS */}
        {showFindings && findings.length > 0 && (
          <>
            <div className="filter-bar">
              <button
                className={`filter-btn ${filterType === 'todos' ? 'active' : ''}`}
                onClick={() => setFilterType('todos')}
              >
                <FiGrid /> Todos ({totalFindings})
              </button>
              {types.map(type => {
                const config = TYPE_CONFIG[type] || { label: type, icon: FiFileText, color: '#6b7280' };
                const Icon = config.icon;
                return (
                  <button
                    key={type}
                    className={`filter-btn ${filterType === type ? 'active' : ''}`}
                    onClick={() => setFilterType(type)}
                    style={{ '--accent-color': config.color }}
                  >
                    <Icon /> {config.label} ({typeCounts[type]})
                  </button>
                );
              })}
            </div>

            <div className="group-actions">
              <button className="group-action-btn" onClick={expandAll}>
                <FiChevronDown /> Expandir todos
              </button>
              <button className="group-action-btn" onClick={collapseAll}>
                <FiChevronRight /> Colapsar todos
              </button>
            </div>

            <div className="findings-container">
              <h4>Datos reemplazados</h4>

              <div className="findings-groups">
                {types.map(type => {
                  const items = groupedFindings[type] || [];
                  const config = TYPE_CONFIG[type] || { label: type, icon: FiFileText, color: '#6b7280' };
                  const Icon = config.icon;
                  const isExpanded = expandedGroups.has(type);

                  if (filterType !== 'todos' && filterType !== type) return null;

                  return (
                    <div key={type} className="finding-group">
                      <div
                        className="finding-group-header"
                        onClick={() => toggleGroup(type)}
                        style={{ borderLeftColor: config.color }}
                      >
                        <span className="group-icon">
                          {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                        </span>
                        <Icon className="group-icon-type" style={{ color: config.color }} />
                        <span className="group-label">{config.label}</span>
                        <span className="group-count" style={{ background: config.color }}>
                          {items.length}
                        </span>
                      </div>

                      {isExpanded && (
                        <div className="finding-group-items">
                          {items.map((finding, index) => (
                            <div key={index} className="finding-item">
                              <span className="finding-line">L{String(finding.line).padStart(4, ' ')}</span>
                              {finding.varName && (
                                <span className="finding-var">{finding.varName}</span>
                              )}
                              <span className="finding-original">{finding.original}</span>
                              <span className="finding-arrow">→</span>
                              <span className="finding-replacement">{finding.replacement}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* VARIABLES DE ENTORNO */}
        {envVars && envVars.length > 0 && (
          <div className="env-vars-summary">
            <h4><FiFileText /> Variables de entorno detectadas</h4>
            <div className="env-tags">
              {envVars.map((v, i) => (
                <span key={i} className="env-tag">{v}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SanitizedOutput;