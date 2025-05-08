import React from 'react';
import FileRow from './FileRow';
import CmiFile from '../../../lib/cmios9/src/CmiFile';
import CmiDirectory from '../../../lib/cmios9/src/CmiDirectory';

interface FileListProps {
  directory: CmiDirectory;
  onFileNameChange: (file: CmiFile) => void;
}

const FileList: React.FC<FileListProps> = ({ directory, onFileNameChange }) => {

  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto'}}>
      {directory.files.map((file: CmiFile, i: number) => (
        <FileRow
          key={i}
          index={i}
          file={file}
          onFileNameChange={onFileNameChange}
        />
      ))}
    </div>
  );
};

export default FileList;
