import React, { useEffect, useState } from 'react';
import styles from './FileRow.module.css';
import CmiFile from '../../../lib/cmios9/src/CmiFile';
import { TextField } from '@mui/material';

interface FileRowProps {
  index: number;
  file: CmiFile;
  onFileNameChange: (file: CmiFile) => void;
}

const audioContext = new (window.AudioContext)();

const FileRow: React.FC<FileRowProps> = ({ index, file, onFileNameChange }) => {

  //const [audioContext] = useState(new (window.AudioContext)());
  const [audioLoaded, setAudioLoaded] = useState<boolean>(false);
  const [isRenameEnabled, setRenameEnabled] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>(file.name);

  const playAudio = async () => {
    try {
      // Convert Base64 string to an ArrayBuffer
      // const audioData = new AudioData({
      //   format: 'u8',
      //   numberOfChannels: 1,
      //   numberOfFrames: 16000,
      //   sampleRate: 44100,
      //   data: new Uint8Array(atob(file.contentBase64).split('').map(char => char.charCodeAt(0))),
      //   timestamp: Date.now()
      // });
      const audioData = new Uint8Array(atob(file.contentBase64).split('').map(char => char.charCodeAt(0)));

      // Decode audio data
      const decodedAudioData = await audioContext.decodeAudioData(audioData.buffer);

      // Create a buffer source and set its buffer to the decoded audio data
      const source = audioContext.createBufferSource();
      source.buffer = decodedAudioData;

      // Connect the source to the audio context's destination (the speakers)
      source.connect(audioContext.destination);

      source.addEventListener('ended', (ev: Event) => {
        setAudioLoaded(false);
      });

      // Start playing the audio
      source.start(0);
      setAudioLoaded(true);

      console.log('Audio is playing...');
    } catch (err) {
      console.error('Error decoding or playing audio:', err);
      setAudioLoaded(false);
    }
  };


  // Convert size to KB or MB for better readability
  const fileSize = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${(file.size / 1024).toFixed(2)} KB`;

  const getFileIcon = (ext: string): string => {
      //const extension = fileName.split('.').pop().toUpperCase();

      // Example logic to return icon based on file extension
      switch (ext) {
      case 'VC':
          return audioLoaded ? '🔊' : '🔈'; // Image icon
      case 'CO':
      case 'IN':
      default:
          return '📄'; // Text icon
      //default:
      //    return '📁'; // Default folder icon
      }
  };

  const handleClick = () => {
    if(file.extension == 'VC')
      playAudio();
  };

  const handleDragStart = (event: any) => {
    event.preventDefault();
    window.electronAPI.startDrag([file]);
  }

  const handleDelete = (event: any) => {
    event.stopPropagation();
    console.log('delete!');
    window.electronAPI.deleteFiles([file]);
  };

  const handleExport = (event: any) => {
    event.stopPropagation();
    console.log('export!');
    window.electronAPI.exportFiles([file]);
  };

  const textFieldClasses: any = {
      root: styles.inputTextRoot,
      //notchedOutline: styles.inputTextOutline,
      input: styles.inputText,
  };

  const renameFile = () => {
    const newFileName: string = fileName + '.' + file.extension;
    if(newFileName != file.fullname) {
      window.electronAPI.renameFile(file, fileName + '.' + file.extension);
      file.name = fileName;
      file.fullname = file.name + '.' + file.extension;
      onFileNameChange(file);
    }
  }

  const onFileNameTextChange = (e: React.FormEvent<HTMLDivElement>) => {
    let inputValue: string = (e.target as HTMLInputElement).value;
    inputValue = inputValue.toUpperCase(); //.replace(/[^a-zA-Z0-9_-]/g, '') TODO: check if it is possible to use special characters.
    setFileName(inputValue);
    (e.target as HTMLInputElement).value = inputValue;
  }

  const onFileNameTextBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement, Element>) => {
    let inputValue: string = (e.target as HTMLInputElement).value;
    inputValue = inputValue.toUpperCase(); //.replace(/[^a-zA-Z0-9_-]/g, '') TODO: check if it is possible to use special characters.
    setFileName(inputValue);
    (e.target as HTMLInputElement).value = inputValue;
    renameFile();
    setRenameEnabled(false);
  }

  return (
    <div className={styles.row} draggable={true} onClick={handleClick} onDragStart={handleDragStart}>
      <div className={styles.index}>{index}</div>
      <div className={styles.icon}>{getFileIcon(file.extension)}</div>
      <div className={styles.name}>{isRenameEnabled ? '' : file.fullname }
        <TextField
          id={`file-row-${index}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onInput={onFileNameTextChange}
          onBlur={onFileNameTextBlur}
          slotProps={{
            input: { 
              classes: textFieldClasses, 
              style: { width: '100%', maxWidth: 130},
              endAdornment: <span style={{ padding: 0, margin: 0, paddingRight: 4 }}>.{file.extension}</span>
              //style: { marginBottom: 8, width: 352 },
              //endAdornment: <button 
              //className={styles.actionButtonSmall} 
              //style={{ marginRight: 8, display: diskUser != directory.user ? 'inline' : 'none'}} 
              //onClick={() => setDiskUser(directory.user)} 
              //title="cancel">❌</button> },
            },
            htmlInput: { maxLength: 8 },
          }}
          value={fileName}
          style={{ display: isRenameEnabled ? 'inline' : 'none'}}
        />
        <button className={styles.actionButtonSmall} 
          style={{ marginLeft: 8 }} 
          onClick={(e) => { 
            e.preventDefault();
            e.stopPropagation();
            if(isRenameEnabled)
              renameFile(); 
            else {
              setTimeout(() => {
                document.getElementById(`file-row-${index}`).focus();
              }, 100);
            }
            setRenameEnabled(!isRenameEnabled);
          }}
          title="rename">{isRenameEnabled ? "❌" : "✏️"}
        </button>
      </div>
      <div className={styles.size}>{fileSize}</div>
      <div className={styles.actions}>
        {file.extension == 'VC' ? 
          <button className={styles.actionButton} onClick={handleExport} title="Export file">📤</button>
        : <button className={styles.actionButton} style={{visibility: 'hidden'}} title="Export file">📤</button>}
        
        <button className={styles.actionButton} onClick={handleDelete} title="Delete file">❌</button>
      </div>
    </div>
  );
};

export default FileRow;
