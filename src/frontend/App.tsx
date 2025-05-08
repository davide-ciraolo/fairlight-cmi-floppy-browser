import React, { useEffect, useState } from 'react';
import FileList from './components/FileList';
import CmiDirectory from '../../lib/cmios9/src/CmiDirectory';
import CmiFile from '../../lib/cmios9/src/CmiFile';
import styles from './App.module.css';
import CircularProgress from '@mui/material/CircularProgress';
import { TextField } from '@mui/material';

const App: React.FC = () => {
  const [directory, setDirectory] = useState<CmiDirectory>(undefined);
  const [isDirectoryLoading, setDirectoryLoading] = useState<boolean>(false);
  const [directoryError, setDirectoryError] = useState<string>(undefined);

  const [isModified, setIsModified] = useState<boolean>(false);

  const [diskUser, setDiskUser] = useState<string>(undefined);
  const [diskLabel, setDiskLabel] = useState<string>(undefined);
  const [diskDate, setDiskDate] = useState<string>(undefined);
  const [diskVersion, setDiskVersion] = useState<string>(undefined);

  //const [changedFiles, setChangedFiles] = useState<CmiFile[]>([]);

  useEffect(() => {
    const handleIMGLoaded = (_: any, dir: CmiDirectory) => {
      setDirectory(dir);
      setDiskUser(dir.user);
      setDiskLabel(dir.label);
      setDiskDate(dir.date);
      setDiskVersion(dir.version);
      //setChangedFiles([]);
      setDirectoryLoading(false);
    };
    const handleStartIMGLoading = (_: any) => {
      setDirectoryLoading(true);
    };
    const handleIMGLoadingError = (_: any, error: string) => {
      //setDirectoryError(error);
      setDirectoryLoading(false);
    };
    const handleOnDeletedFiles = (_: any, files: CmiFile[]) => {
      if(directory){
        directory['files'] = directory['files'].filter(file =>
          !files.some(deletedFile => 
            deletedFile.root === file.root && deletedFile.fullname === file.fullname
          )
        );
        setDirectory(structuredClone(directory));
        setDirectoryLoading(false);
        setIsModified(true);
      }
    };

    const handleOnImportedFiles = (_: any, files: CmiFile[]) => {
      // if(directory){
      //   directory['files'].push(...files);
      //   setDirectory(structuredClone(directory));
      //   setDirectoryLoading(false);
      //   setIsModified(true);
      // }
      setIsModified(true);
    }

    window.electronAPI.onStartIMGLoading(handleStartIMGLoading);
    window.electronAPI.onIMGLoadingError(handleIMGLoadingError);
    window.electronAPI.onIMGLoaded(handleIMGLoaded);
    window.electronAPI.onDeletedFiles(handleOnDeletedFiles);
    window.electronAPI.onImportedFiles(handleOnImportedFiles);

    return () => {
      window.electronAPI.removeStartIMGLoadingListeners();
      window.electronAPI.removeIMGLoadingErrorListeners();
      window.electronAPI.removeIMGLoadedListeners();
      window.electronAPI.removeOnDeletedFilesListeners();
      window.electronAPI.removeOnImportedFilesListeners();
    };
  }, [directory]);

  const handleSaveIMD = (event: any) => {
    event.stopPropagation();
    console.log('save IMD!');
    window.electronAPI.saveIMD(directory);
    setIsModified(false);
  };

  const textFieldClasses: any = {
      root: styles.inputTextRoot,
      //notchedOutline: styles.inputTextOutline,
      input: styles.inputText,
  };

  const onUserTextChange = (e: React.FormEvent<HTMLDivElement>) => {
    let inputValue: string = (e.target as HTMLInputElement).value;
    inputValue = inputValue.toUpperCase(); //.replace(/[^a-zA-Z0-9_-]/g, '') TODO: check if it is possible to use special characters.
    setDiskUser(inputValue);
    (e.target as HTMLInputElement).value = inputValue;
  }

  const onLabelTextChange = (e: React.FormEvent<HTMLDivElement>) => {
    let inputValue: string = (e.target as HTMLInputElement).value;
    inputValue = inputValue.toUpperCase(); //.replace(/[^a-zA-Z0-9_-]/g, '') TODO: check if it is possible to use special characters.
    setDiskLabel(inputValue);
    (e.target as HTMLInputElement).value = inputValue;
  }

  const onDateTextChange = (e: React.FormEvent<HTMLDivElement>) => {
    let inputElement: HTMLInputElement = (e.target as HTMLInputElement);
    let inputValue: string = inputElement.value;

    // Get the current cursor position
    // const currentLength: number = inputValue.length;
    const cursorPosition: number = inputElement.selectionStart || 0;

    // Allow only numbers
    inputValue = inputValue.replace(/[^0-9]/g, '');

    // Pad with zeros to ensure a length of 8
    // inputValue = inputValue.padEnd(6, '0');

    // Add '-' after every 2 characters
    inputValue = inputValue
      .match(/.{1,2}/g) // Split into groups of 2 characters
      ?.join('-') || ''; // Join with '-' or return empty string if input is empty
    setDiskDate(inputValue);
    inputElement.value = inputValue;

    // Restore the cursor position
    inputElement.setSelectionRange(cursorPosition, cursorPosition);
  }

  const onDateTextBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement, Element>) => {
    let inputElement: HTMLInputElement = (e.target as HTMLInputElement);
    let inputValue: string = inputElement.value;
    
    // Pad with zeros to ensure a length of 8
    inputValue = inputValue.replaceAll('-', '').padEnd(6, '0');

    // Add '-' after every 2 characters
    inputValue = inputValue
      .match(/.{1,2}/g) // Split into groups of 2 characters
      ?.join('-') || ''; // Join with '-' or return empty string if input is empty
    setDiskDate(inputValue);
    inputElement.value = inputValue;
  }

  const onVersionTextChange = (e: React.FormEvent<HTMLDivElement>) => {
    let inputElement: HTMLInputElement = (e.target as HTMLInputElement);
    let inputValue: string = inputElement.value;

    // Get the current cursor position
    // const currentLength: number = inputValue.length;
    const cursorPosition: number = inputElement.selectionStart || 0;

    // Allow only numbers
    inputValue = inputValue.replace(/[^0-9]/g, '');

    // Pad with zeros to ensure a length of 8
    // inputValue = inputValue.padEnd(6, '0');

    // Add '-' after every 2 characters
    inputValue = inputValue
      .match(/.{1,2}/g) // Split into groups of 2 characters
      ?.join('.') || ''; // Join with '-' or return empty string if input is empty
    setDiskVersion(inputValue);
    inputElement.value = inputValue;

    // Restore the cursor position
    inputElement.setSelectionRange(cursorPosition, cursorPosition);
  }

  const onVersionTextBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement, Element>) => {
    let inputElement: HTMLInputElement = (e.target as HTMLInputElement);
    let inputValue: string = inputElement.value;
    
    // Pad with zeros to ensure a length of 8
    inputValue = inputValue.replace('.', '').padEnd(4, '0');

    // Add '-' after every 2 characters
    inputValue = inputValue
      .match(/.{1,2}/g) // Split into groups of 2 characters
      ?.join('.') || ''; // Join with '-' or return empty string if input is empty
    setDiskVersion(inputValue);
    inputElement.value = inputValue;
  }

  const saveNewLabel = () => {
    directory.user = diskUser;
    directory.label = diskLabel;
    directory.version = diskVersion;
    directory.date = diskDate;
    window.electronAPI.setNewLabel(directory);
    structuredClone(directory);
    setIsModified(true);
  }

  return (
    <div className={isDirectoryLoading? styles.appContainerDisabled : styles.appContainer}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ width: 'auto' }}>File Browser</h1>
        {directory ? <button className={styles.actionButton} disabled={!isModified} onClick={handleSaveIMD} title="Export file">Save 💾</button> : ''}
      </div>
      {directory ? <div style={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'start', alignItems: 'start' }}>
          {/* <div style={{ width: 'auto', display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'center' }}>
            <TextField slotProps={textFieldStyle} type='text' placeholder='Disk label' value={directory.label}/>
            <button className={styles.actionButton} style={{ padding: 1, marginLeft: 4, height: 'auto' }} title="Save label">✔️</button>
          </div>
          <div style={{ width: 'auto', display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'center', marginLeft: 16 }}>
            <TextField slotProps={textFieldStyle} type='text' placeholder='Disk date' value={directory.date}/>
            <button className={styles.actionButton} style={{ padding: 1, marginLeft: 4, height: 'auto' }} title="Save label">✔️</button>
          </div> */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'center' }}>
            <TextField   
                slotProps={{
                  input: { 
                    classes: textFieldClasses, 
                    style: { marginBottom: 8, width: 352 },
                    endAdornment: <button 
                    className={styles.actionButtonSmall} 
                    style={{ marginRight: 8, display: diskUser != directory.user ? 'inline' : 'none'}} 
                    onClick={() => setDiskUser(directory.user)} 
                    title="cancel">❌</button> },
                  htmlInput: { maxLength: 20 },
                }}
                onInput={onUserTextChange} type='text' placeholder='Disk user' value={diskUser} />
          </div>
          <div style={{ width: 'auto', display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'center' }}>
            <TextField   
              slotProps={{
                input: { 
                  classes: textFieldClasses, 
                  style: { marginRight: 8, maxWidth: 100 },
                  endAdornment: <button 
                  className={styles.actionButtonSmall} 
                  style={{ marginRight: 8, display: diskLabel != directory.label ? 'inline' : 'none'}} 
                  onClick={() => setDiskLabel(directory.label)} 
                  title="cancel">❌</button> },
                htmlInput: { maxLength: 8 },
              }}
              onInput={onLabelTextChange} type='text' placeholder='Disk label' value={diskLabel} />
            <TextField   
              slotProps={{
                input: { 
                  classes: textFieldClasses, 
                  style: { marginRight: 8, maxWidth: 100 },
                  endAdornment: <button 
                  className={styles.actionButtonSmall} 
                  style={{ marginRight: 8, display: diskDate != directory.date ? 'inline' : 'none'}} 
                  onClick={() => setDiskDate(directory.date)} 
                  title="cancel">❌</button> },
                htmlInput: { maxLength: 8 },
              }}
              onInput={onDateTextChange} onBlur={onDateTextBlur} type='text' placeholder='Disk date' value={diskDate} />
            <TextField               slotProps={{
                input: { 
                  classes: textFieldClasses, 
                  style: { marginRight: 8, maxWidth: 100 },
                  endAdornment: <button 
                  className={styles.actionButtonSmall} 
                  style={{ marginRight: 8, display: diskVersion != directory.version ? 'inline' : 'none'}} 
                  onClick={() => setDiskVersion(directory.version)} 
                  title="cancel">❌</button> },
                htmlInput: { maxLength: 5 },
              }} 
              onInput={onVersionTextChange} onBlur={onVersionTextBlur} type='text' placeholder='Disk version' value={diskVersion}/>
            <button 
              className={styles.actionButton} 
              style={{ padding: 1, height: 'auto' }} 
              title="Save label"
              disabled={diskUser == directory.user && diskLabel == directory.label && diskDate == directory.date && diskVersion == directory.version} onClick={saveNewLabel}>✔️</button>
          </div>
        </div>
        <p style={{ fontWeight: 'bold', marginLeft: 16 }}>Used disk space: {directory.size.used} / {directory.size.total} KB ({directory.size.usedPercentage.toFixed(2)}%)</p>
      </div>: ''}

      {/* {directory ? <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p>{directory.label} - {directory.date} - {directory.version}</p><p>{directory.size.used} / {directory.size.total} ({directory.size.usedPercentage.toFixed(2)}%)</p>
      </div>: ''} */}

      {directory && !isDirectoryLoading ? <FileList directory={directory} onFileNameChange={(file: CmiFile) => {
        setIsModified(true);
        //setChangedFiles([...changedFiles, file]);
      }}/> : ''}
      {isDirectoryLoading ? <div onClick={(e) => {e.preventDefault(); e.stopPropagation(); return false;}} style={{
        backgroundColor: 'rgba(200, 200, 200, 0.5)',
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <CircularProgress color='inherit' />
      </div>: ''}
    </div>
    // <div style={{ width: '100%', height: '100%' }}>
    //   <h1>File Browser</h1>
    //   <FileList files={directory ? directory['files'] : []} />
    //   {/* <div onClick={(e) => {e.preventDefault(); e.stopPropagation(); return false;}} style={{
    //     backgroundColor: 'rgba(200, 200, 200, 0.5)',
    //     width: '100%',
    //     height: '100%',
    //     position: 'absolute',
    //     top: 0,
    //     left: 0,
    //     pointerEvents: 'none',
    //     zIndex: 1000
    //   }}/> */}
    // </div>
  );
};

export default App;
