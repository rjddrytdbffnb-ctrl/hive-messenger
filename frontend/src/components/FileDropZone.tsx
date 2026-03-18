// src/components/FileDropZone.tsx
import React, { useState, DragEvent, ChangeEvent } from 'react';

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // в MB
}

const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFilesSelected,
  accept = '*',
  multiple = true,
  maxSize = 10
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
    }
  };

  const processFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const sizeInMB = file.size / 1024 / 1024;
      if (sizeInMB > maxSize) {
        alert(`Файл ${file.name} слишком большой! Максимум ${maxSize}MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  return (
    <div
      className={`drop-zone ${isDragging ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-input')?.click()}
      style={{
        border: `2px dashed ${isDragging ? 'var(--success)' : 'var(--accent-primary)'}`,
        borderRadius: '12px',
        padding: '24px',
        textAlign: 'center',
        background: isDragging ? 'rgba(74, 222, 128, 0.1)' : 'rgba(102, 126, 234, 0.05)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        transform: isDragging ? 'scale(1.02)' : 'scale(1)'
      }}
    >
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>
        {isDragging ? '📥' : '📎'}
      </div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
        {isDragging ? 'Отпустите файлы здесь' : 'Перетащите файлы сюда'}
      </div>
      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
        или нажмите для выбора
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
        Максимальный размер: {maxSize}MB
      </div>
      <input
        id="file-input"
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default FileDropZone;
