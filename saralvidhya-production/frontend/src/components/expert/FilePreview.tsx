import React from 'react';

/**
 * Props for the FilePreview component
 */
export interface FilePreviewProps {
  selectedFile: string;
}

/**
 * Component for previewing audio and image files
 */
export default function FilePreview({ selectedFile }: FilePreviewProps) {
  const ext = selectedFile.split('.').pop()?.toLowerCase();
  
  if (['mp3', 'wav', 'ogg'].includes(ext || '')) {
    const audioUrl = `${import.meta.env.BASE_URL}generated_resources/${selectedFile}`;
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.5)', borderRadius: 16, border: '1px solid rgba(168, 85, 247, 0.15)' }}>
        <div style={{ marginBottom: 20, color: '#A855F7', animation: 'float 6s ease-in-out infinite' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
        </div>
        <h3 style={{ margin: '0 0 24px 0', color: '#1E293B', fontWeight: 800 }}>Audio Preview</h3>
        <audio controls src={audioUrl} style={{ width: '100%', maxWidth: '400px' }}></audio>
      </div>
    );
  } else if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) {
    const imgUrl = `${import.meta.env.BASE_URL}generated_resources/${selectedFile}`;
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.5)', borderRadius: 16, border: '1px solid rgba(168, 85, 247, 0.15)', padding: 24 }}>
        <img src={imgUrl} alt={selectedFile} style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} />
      </div>
    );
  }
  
  return null;
}
