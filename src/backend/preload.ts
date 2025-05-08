// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer, webUtils } from 'electron';
import CmiDirectory from '../../lib/cmios9/src/CmiDirectory';
import CmiFile from '../../lib/cmios9/src/CmiFile';

contextBridge.exposeInMainWorld('electronAPI', {

  startDrag: (files: CmiFile[]) => {
    ipcRenderer.send('ondragstart', files);
  },

  exportFiles: (files: CmiFile[]) => {
    ipcRenderer.send('export-files', files);
  },

  renameFile: (file: CmiFile, new_fullfilename: string) => {
    ipcRenderer.send('rename-file', file, new_fullfilename);
  },

  setNewLabel: (dir: CmiDirectory) => {
    ipcRenderer.send('new-label', dir);
  },

  saveIMD: (dir: CmiDirectory) => {
    ipcRenderer.send('save-IMD', dir);
  },

  deleteFiles: (files: CmiFile[]) => {
    ipcRenderer.send('delete-files', files);
  },

  onDeletedFiles: (callback: (event: any, files: CmiFile[]) => void) =>
    ipcRenderer.on('deleted-files', callback),
  removeOnDeletedFilesListeners: () => ipcRenderer.removeAllListeners('deleted-files'),

  onImportedFiles: (callback: (event: any, files: CmiFile[]) => void) =>
    ipcRenderer.on('imported-files', callback),
  removeOnImportedFilesListeners: () => ipcRenderer.removeAllListeners('imported-files'),

  // onImportedFiles: (callback: (event: any, files: CmiFile[]) => void) =>
  //   ipcRenderer.on('deleted-files', callback),
  // removeOnDeletedFilesListeners: () => ipcRenderer.removeAllListeners('deleted-files'),

  onStartIMGLoading: (callback: (event: any) => void) =>
    ipcRenderer.on('IMG-start-loading', callback),
  onIMGLoadingError: (callback: (event: any, error: string) => void) =>
    ipcRenderer.on('IMG-loading-error', callback),
  onIMGLoaded: (callback: (event: any, dir: CmiDirectory) => void) =>
    ipcRenderer.on('IMG-loaded', callback),

  removeStartIMGLoadingListeners: () => ipcRenderer.removeAllListeners('IMG-start-loading'),
  removeIMGLoadingErrorListeners: () => ipcRenderer.removeAllListeners('IMG-loading-error'),
  removeIMGLoadedListeners: () => ipcRenderer.removeAllListeners('IMG-loaded'),
});


document.addEventListener('dragover', (event) => {
  event.preventDefault();
  event.stopPropagation();
});

document.addEventListener('drop', (event) => {
  event.preventDefault();
  event.stopPropagation();

  console.log(event.dataTransfer.files);

  let fileList = [];
  for (const f of event.dataTransfer.files) {
      // // Using the path attribute to get absolute file path
      // console.log('File Path of dragged files: ', f.path)
      // pathArr.push(f.path); // assemble array for main.js
      fileList.push({
        path: webUtils.getPathForFile(f), 
        name: f.name, 
        type: f.type, 
        size: f.size
      });
  }
  console.log(fileList);
  const ret = ipcRenderer.sendSync('dropped-file', fileList);
  console.log(ret);
});