import { useState } from 'react';

/**
 * ArtifactPreviewPanel — Fase 2D (PASSO 6: histórico local de revisão)
 *
 * Painel de decisão humana sobre o artefato gerado pelo Construtor.
 * Exibe summary, status de validação/execução, lista de arquivos,
 * preview do conteúdo e permite: aprovar, solicitar ajuste ou rejeitar.
 *
 * Props:
 *   preview        {object}   — objeto retornado por generatePreview() / /api/artifact-preview
 *   onDecision     {function} — callback(decision, feedback) chamado ao aprovar/rejeitar
 *   onRevision     {function} — callback({category, focusFile, comment}) chamado ao solicitar ajuste
 *   loading        {boolean}  — exibir estado de carregamento
 *   delivery       {object}   — { zipBase64 } retornado na aprovação (opcional)
 *   lastAdjustment {object}   — último ajuste solicitado {category, focusFile, comment, timestamp} (opcional)
 *   reviewHistory  {Array}    — histórico de eventos de revisão [{type, text, timestamp}] (opcional)
 *   artifactVersion {number}  — versão atual do artefato no ciclo de revisão (opcional, padrão 1)
 *   onClearCycle   {function} — callback chamado ao encerrar/limpar o ciclo de revisão (opcional)
 */

// PASSO 4 — Categorias de ajuste (opcionais)
const ADJUSTMENT_CATEGORIES = [
  { key: 'estrutura', label: '🏗️ Estrutura', description: 'Organização dos arquivos ou blocos' },
  { key: 'conteudo', label: '📝 Conteúdo', description: 'Texto, dados ou lógica do código' },
  { key: 'legibilidade', label: '👁️ Legibilidade', description: 'Clareza, formatação, separação' },
  { key: 'incompletude', label: '⚠️ Incompletude', description: 'Partes faltando ou truncadas' },
  { key: 'visual', label: '🎨 Visual', description: 'Apresentação e aparência' },
];

// PASSO 6 — Limite de caracteres para exibição de texto no histórico de revisão
const MAX_REVIEW_TEXT_LENGTH = 120;

export default function ArtifactPreviewPanel({ preview, onDecision, onRevision, loading = false, delivery, lastAdjustment = null, reviewHistory = [], artifactVersion = 1, onClearCycle }) {
  const [rejectionFeedback, setRejectionFeedback] = useState('');
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [adjustmentFeedback, setAdjustmentFeedback] = useState('');
  const [showAdjustInput, setShowAdjustInput] = useState(false);
  // PASSO 4 — estados do feedback estruturado
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  if (loading) {
    return (
      <div className="artifact-preview-panel artifact-preview-loading">
        <span>⏳ Gerando preview do artefato...</span>
      </div>
    );
  }

  if (!preview || !preview.previewAvailable) {
    return (
      <div className="artifact-preview-panel artifact-preview-unavailable">
        <span>⚠️ Preview não disponível</span>
      </div>
    );
  }

  const { summary, decision, feedback, decisionTimestamp } = preview;

  const validationBadge = summary.validation?.valid
    ? <span className="artifact-badge artifact-badge-ok">✅ Válido</span>
    : <span className="artifact-badge artifact-badge-error">❌ Inválido ({summary.validation?.errorCount || 0} erros)</span>;

  const executionBadge = summary.execution
    ? summary.execution.executed
      ? <span className="artifact-badge artifact-badge-ok">⚡ Executado ({summary.execution.durationMs}ms)</span>
      : <span className="artifact-badge artifact-badge-info">📄 Não executável</span>
    : <span className="artifact-badge artifact-badge-info">📄 Não executável</span>;

  const decisionBadge = {
    pending: <span className="artifact-badge artifact-badge-pending">🟡 Pendente</span>,
    approved: <span className="artifact-badge artifact-badge-ok">🟢 Aprovado</span>,
    rejected: <span className="artifact-badge artifact-badge-error">🔴 Rejeitado</span>,
  }[decision] || null;

  const handleApprove = () => {
    setShowRejectionInput(false);
    setShowAdjustInput(false);
    onDecision?.('approved', null);
  };

  const handleRejectClick = () => {
    setShowAdjustInput(false);
    setShowRejectionInput(true);
  };

  const handleRejectConfirm = () => {
    onDecision?.('rejected', rejectionFeedback || null);
    setShowRejectionInput(false);
  };

  const handleAdjustClick = () => {
    setShowRejectionInput(false);
    setShowAdjustInput(true);
  };

  const handleAdjustConfirm = () => {
    // PASSO 4 — enviar objeto estruturado em vez de string crua
    const structuredFeedback = {
      category: selectedCategory || null,
      focusFile: selectedFile || null,
      comment: adjustmentFeedback || null,
    };
    onRevision?.(structuredFeedback);
    setAdjustmentFeedback('');
    setSelectedCategory(null);
    setSelectedFile(null);
    setShowAdjustInput(false);
  };

  const isPending = decision === 'pending';
  const validationErrorCount = summary.validation?.errorCount ?? summary.validation?.errors?.length ?? 0;
  const hasValidationIssues = summary.validation?.valid === false || validationErrorCount > 0;
  const filesCount = summary.filesSummary?.totalFiles ?? summary.files?.length ?? 0;
  const artifactExportState = !hasValidationIssues && filesCount > 0 ? 'ready' : 'review';
  const artifactExportLabel = artifactExportState === 'ready'
    ? '✅ Válido e pronto para exportar ZIP após aprovação.'
    : '⚠️ Artefato/ZIP com pendências — revise antes de aprovar/exportar.';

  const handleDownload = () => {
    if (!delivery?.zipBase64) return;
    const byteNums = Uint8Array.from(atob(delivery.zipBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([byteNums], { type: 'application/zip' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `artifact-${summary.id || 'download'}.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 100);
  };

  return (
    <div className="artifact-preview-panel">
      {/* Cabeçalho */}
      <div className="artifact-preview-header">
        <span className="artifact-preview-title">🔍 Revisão do Artefato</span>
        <span className={`artifact-version-badge${artifactVersion > 1 ? ' artifact-version-revised' : ''}`}>
          v{artifactVersion}
        </span>
        {decisionBadge}
      </div>
      {isPending && (
        <>
          <p className="artifact-preview-hint">Revise o artefato e escolha uma ação abaixo.</p>
          <div
            className={`artifact-export-readiness artifact-export-readiness-${artifactExportState}`}
            role="status"
            aria-live="polite"
            data-testid="artifact-export-status"
            data-state={artifactExportState}
          >
            <span className="artifact-export-readiness-label">📦 Status do artefato/ZIP:</span>
            <span className="artifact-export-readiness-text">{artifactExportLabel}</span>
          </div>
        </>
      )}

      {/* PASSO 5 — Banner de continuidade: último ajuste solicitado */}
      {lastAdjustment && (
        <div className="artifact-last-adjustment">
          <span className="artifact-last-adjustment-label">🔁 Ajuste em andamento:</span>
          <div className="artifact-last-adjustment-details">
            {lastAdjustment.category && (
              <span className="artifact-last-adjustment-chip">{lastAdjustment.category}</span>
            )}
            {lastAdjustment.focusFile && (
              <span className="artifact-last-adjustment-file">{lastAdjustment.focusFile}</span>
            )}
            {lastAdjustment.comment && (
              <span className="artifact-last-adjustment-comment">{lastAdjustment.comment}</span>
            )}
            {!lastAdjustment.category && !lastAdjustment.focusFile && !lastAdjustment.comment && (
              <span className="artifact-last-adjustment-comment">Revisão geral solicitada</span>
            )}
          </div>
        </div>
      )}

      {/* Status Geral */}
      {summary.status && (
        <div className={`artifact-preview-status-geral artifact-status-${summary.status.level}`}>
          <span className="artifact-status-label">{summary.status.label}</span>
          <span className="artifact-status-description">{summary.status.description}</span>
        </div>
      )}

      {/* Resumo Estrutural */}
      {summary.filesSummary && (
        <div className="artifact-preview-files-summary">
          <span className="artifact-label">
            {summary.filesSummary.totalFiles} arquivo(s)
            {summary.filesSummary.contentType ? ` — ${summary.filesSummary.contentType}` : ''}
          </span>
          {summary.filesSummary.fileNames?.length > 0 && (
            <ul className="artifact-files-summary-list">
              {summary.filesSummary.fileNames.map((name, i) => (
                <li key={i} className="artifact-files-summary-item">{name}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Errors e Warnings expandidos */}
      {(summary.validation?.errors?.length > 0 || summary.validation?.warnings?.length > 0) && (
        <div className="artifact-preview-messages">
          {summary.validation.errors?.map((msg, i) => (
            <div key={`error-${i}`} className="artifact-message artifact-message-error">
              ❌ {msg}
            </div>
          ))}
          {summary.validation.warnings?.map((msg, i) => (
            <div key={`warning-${i}`} className="artifact-message artifact-message-warning">
              ⚠️ {msg}
            </div>
          ))}
        </div>
      )}

      {/* Metadados */}
      <div className="artifact-preview-meta">
        <div className="artifact-preview-row">
          <span className="artifact-label">ID:</span>
          <span className="artifact-value artifact-id">{summary.id || '—'}</span>
        </div>
        <div className="artifact-preview-row">
          <span className="artifact-label">Versão:</span>
          <span className="artifact-value">{summary.version}</span>
        </div>
        <div className="artifact-preview-row">
          <span className="artifact-label">Gerado em:</span>
          <span className="artifact-value">
            {summary.timestamp ? new Date(summary.timestamp).toLocaleString('pt-BR') : '—'}
          </span>
        </div>
        <div className="artifact-preview-row">
          <span className="artifact-label">Modelo:</span>
          <span className="artifact-value">{summary.origin?.model || '—'}</span>
        </div>
        <div className="artifact-preview-row">
          <span className="artifact-label">Prompt ID:</span>
          <span className="artifact-value">{summary.origin?.promptId || '—'}</span>
        </div>
      </div>

      {/* Status de validação e execução */}
      <div className="artifact-preview-status">
        {validationBadge}
        {executionBadge}
      </div>

      {/* Arquivos */}
      {summary.files?.length > 0 && (
        <div className="artifact-preview-files">
          <span className="artifact-label">Arquivos:</span>
          <ul className="artifact-file-list">
            {summary.files.map((f) => (
              <li key={f.path} className="artifact-file-item">
                <span className="artifact-file-path">{f.path}</span>
                <span className="artifact-file-size">{formatBytes(f.size)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview do conteúdo */}
      {summary.contentPreview && (
        <div className="artifact-preview-content">
          <span className="artifact-label">Conteúdo (prévia):</span>
          <pre className="artifact-content-preview">{summary.contentPreview}</pre>
        </div>
      )}

      {/* Decisão já tomada */}
      {!isPending && (
        <div className="artifact-preview-decision-info">
          <span className="artifact-label">Decisão registrada em:</span>{' '}
          <span className="artifact-value">
            {decisionTimestamp ? new Date(decisionTimestamp).toLocaleString('pt-BR') : '—'}
          </span>
          {feedback && (
            <div className="artifact-preview-feedback">
              <span className="artifact-label">Feedback:</span>{' '}
              <span className="artifact-value">{feedback}</span>
            </div>
          )}
        </div>
      )}

      {/* Botão de download após aprovação */}
      {decision === 'approved' && delivery?.zipBase64 && (
        <div className="artifact-preview-actions">
          <button
            className="artifact-btn artifact-btn-approve"
            onClick={handleDownload}
          >
            📥 Baixar Artefato (.zip)
          </button>
        </div>
      )}

      {/* Ações */}
      {isPending && (
        <div className="artifact-preview-actions">
          {!showRejectionInput && !showAdjustInput ? (
            <>
              <button
                className="artifact-btn artifact-btn-approve"
                onClick={handleApprove}
              >
                ✅ Aprovar
              </button>
              <button
                className="artifact-btn artifact-btn-adjust"
                onClick={handleAdjustClick}
              >
                🔄 Solicitar ajuste
              </button>
              <button
                className="artifact-btn artifact-btn-reject"
                onClick={handleRejectClick}
              >
                ❌ Rejeitar
              </button>
            </>
          ) : showAdjustInput ? (
            <div className="artifact-rejection-form">
              {/* PASSO 4 — Chips de categoria (opcionais) */}
              <div className="artifact-adjust-categories">
                {ADJUSTMENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    className={`artifact-category-chip${selectedCategory === cat.key ? ' selected' : ''}`}
                    title={cat.description}
                    onClick={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
                    type="button"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              {/* PASSO 4 — Seletor de arquivo-foco (aparece quando há arquivos) */}
              {(summary.filesSummary?.fileNames?.length > 0 || summary.files?.length > 0) && (
                <div className="artifact-adjust-file-select">
                  <select
                    value={selectedFile || ''}
                    onChange={(e) => setSelectedFile(e.target.value || null)}
                    aria-label="Arquivo-foco do ajuste"
                  >
                    <option value="">Arquivo-foco (opcional)</option>
                    {(summary.filesSummary?.fileNames || summary.files?.map((f) => f.path) || []).map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              )}
              <p className="artifact-adjust-hint">Categoria e arquivo são opcionais — texto livre também funciona</p>
              <textarea
                className="artifact-rejection-textarea"
                placeholder="O que deve ser ajustado? (opcional)"
                value={adjustmentFeedback}
                onChange={(e) => setAdjustmentFeedback(e.target.value)}
                rows={3}
                aria-label="Notas de ajuste"
              />
              <div className="artifact-rejection-buttons">
                <button
                  className="artifact-btn artifact-btn-adjust"
                  onClick={handleAdjustConfirm}
                >
                  🔄 Confirmar ajuste
                </button>
                <button
                  className="artifact-btn artifact-btn-cancel"
                  onClick={() => {
                    setShowAdjustInput(false);
                    setSelectedCategory(null);
                    setSelectedFile(null);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="artifact-rejection-form">
              <textarea
                className="artifact-rejection-textarea"
                placeholder="Motivo da rejeição (opcional)..."
                value={rejectionFeedback}
                onChange={(e) => setRejectionFeedback(e.target.value)}
                rows={3}
                aria-label="Motivo da rejeição"
              />
              <div className="artifact-rejection-buttons">
                <button
                  className="artifact-btn artifact-btn-reject"
                  onClick={handleRejectConfirm}
                >
                  ❌ Confirmar Rejeição
                </button>
                <button
                  className="artifact-btn artifact-btn-cancel"
                  onClick={() => setShowRejectionInput(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PASSO 6 — Histórico de Revisão */}
      {reviewHistory.length > 0 && (
        <div className="artifact-review-history">
          <span className="artifact-review-history-title">
            📋 Histórico de Revisão ({reviewHistory.length} {reviewHistory.length === 1 ? 'evento' : 'eventos'})
          </span>
          <ul className="artifact-review-history-list">
            {reviewHistory.map((event, i) => {
              const iconMap = {
                approved: '✅',
                rejected: '❌',
                adjustment_requested: '🔄',
                revision_generated: '📝',
              };
              const labelMap = {
                approved: 'Aprovado',
                rejected: 'Rejeitado',
                adjustment_requested: 'Ajuste solicitado',
                revision_generated: 'Revisão gerada',
              };
              const icon = iconMap[event.type] || '•';
              const label = labelMap[event.type] || event.type;
              const text = event.text && event.text.length > MAX_REVIEW_TEXT_LENGTH
                ? `${event.text.slice(0, MAX_REVIEW_TEXT_LENGTH)}...`
                : event.text;
              const isLatest = i === reviewHistory.length - 1;
              return (
                <li
                  key={`${event.type}-${event.timestamp}`}
                  className={`artifact-review-history-item${isLatest ? ' artifact-review-history-item--latest' : ''}`}
                >
                  <span className="artifact-review-history-index">#{i + 1}</span>
                  <span className="artifact-review-history-icon">{icon}</span>
                  <span className="artifact-review-history-label">{label}</span>
                  {text && <span className="artifact-review-history-text">{text}</span>}
                  <span className="artifact-review-history-time">
                    {new Date(event.timestamp).toLocaleString('pt-BR')}
                  </span>
                </li>
              );
            })}
          </ul>
          {/* PASSO 10 — Encerrar ciclo de revisão */}
          {onClearCycle && (
            <button
              className="artifact-btn artifact-btn-clear-cycle"
              onClick={() => {
                if (window.confirm('Encerrar o ciclo de revisão atual? Isso limpará o histórico, versão e ajuste pendente.')) {
                  onClearCycle();
                }
              }}
            >
              🧹 Encerrar ciclo
            </button>
          )}
        </div>
      )}

      {/* Revisão após rejeição */}
      {decision === 'rejected' && onRevision && (
        <div className="artifact-preview-actions">
          <button
            className="artifact-btn artifact-btn-cancel"
            onClick={() => onRevision(feedback)}
          >
            🔄 Solicitar Revisão
          </button>
        </div>
      )}
    </div>
  );
}

/** Formata bytes em unidade legível. */
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
