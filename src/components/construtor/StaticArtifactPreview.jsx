export default function StaticArtifactPreview({ html }) {
  if (typeof html !== 'string' || html.trim().length === 0) {
    return null;
  }

  return (
    <div className="artifact-static-preview-panel" data-testid="artifact-static-preview-panel">
      <span className="artifact-observability-title">🖼️ Preview visual estático</span>
      <p className="artifact-static-preview-disclaimer">
        Preview visual estático. Não executa JavaScript. WebContainer desativado. Exportável ≠ executável.
      </p>
      <iframe
        title="Preview visual estático do artefato"
        sandbox=""
        srcDoc={html}
        referrerPolicy="no-referrer"
        loading="lazy"
        className="artifact-static-preview-iframe"
      />
    </div>
  );
}
