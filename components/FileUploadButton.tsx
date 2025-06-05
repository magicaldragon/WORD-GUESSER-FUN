
import React, { useRef, useCallback } from 'react';
import { CustomSoundFile } from '../types';

interface FileUploadButtonProps {
  id: string;
  label: string;
  accept: string;
  onFileUpload: (file: CustomSoundFile) => void;
  buttonText?: string;
  className?: string;
  disabled?: boolean;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  id,
  label,
  accept,
  onFileUpload,
  buttonText = 'Upload File',
  className = '',
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      
      const resetInput = () => {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };

      if (file) {
        if (!file.type.startsWith('audio/')) {
          alert(`Invalid file type. Please select an audio file (${accept}).`);
          resetInput();
          return;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
          alert(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit. Please select a smaller file.`);
          resetInput();
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target && typeof e.target.result === 'string') {
            onFileUpload({ name: file.name, data: e.target.result });
          } else {
            console.error("FileReader did not return a string result for file:", file.name);
            alert("Error reading file. The file data could not be processed.");
          }
          resetInput(); // Reset after successful or failed load attempt (within onload)
        };
        reader.onerror = () => {
          console.error("FileReader error:", reader.error, "for file:", file.name);
          alert("Error reading file. Please try again or select a different file.");
          resetInput(); // Reset on error
        };
        reader.readAsDataURL(file);
      }
    },
    [onFileUpload, accept]
  );

  const handleClick = () => {
    if (!disabled) {
        fileInputRef.current?.click();
    }
  };

  return (
    <div className={`flex flex-col items-start ${className}`}>
      <input
        type="file"
        id={id}
        ref={fileInputRef}
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        aria-label={label}
        disabled={disabled} // This disabled is for the input itself, button handles its own.
      />
      <button
        type="button"
        onClick={handleClick}
        className={`futuristic-button bg-cyber-purple/70 hover:bg-cyber-purple text-light-text py-2 px-4 rounded-md text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={disabled}
      >
        {buttonText}
      </button>
    </div>
  );
};
