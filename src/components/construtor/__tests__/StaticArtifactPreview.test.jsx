/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StaticArtifactPreview from '../StaticArtifactPreview.jsx';

describe('StaticArtifactPreview', () => {
  test('iframe usa sandbox vazio e não inclui allow-scripts/allow-same-origin', () => {
    render(<StaticArtifactPreview html="<html><body><h1>ok</h1></body></html>" />);

    const iframe = screen.getByTitle('Preview visual estático do artefato');
    expect(iframe).toHaveAttribute('sandbox', '');
    expect(iframe.getAttribute('sandbox')).not.toContain('allow-scripts');
    expect(iframe.getAttribute('sandbox')).not.toContain('allow-same-origin');
  });

  test('iframe usa srcDoc', () => {
    const html = '<html><body><p>preview</p></body></html>';
    render(<StaticArtifactPreview html={html} />);

    const iframe = screen.getByTitle('Preview visual estático do artefato');
    expect(iframe).toHaveAttribute('srcdoc', html);
  });
});
