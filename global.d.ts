import CmiDirectory from "lib/cmios9/src/CmiDirectory";

// global.d.ts
interface ElectronAPI {
    startDrag: (files: CmiFile[]) => void,
    exportFiles: (files: CmiFile[]) => void;
    deleteFiles: (files: CmiFile[]) => void;
    renameFile: (file: CmiFile, new_fullfilename: string) => void;
    setNewLabel: (dir: CmiDirectory) => void;
    saveIMD: (dir: CmiDirectory) => void;

    onImportedFiles: (callback: (event: any, files: CmiFile[]) => void) => void;
    removeOnImportedFilesListeners: () => void;
    onDeletedFiles: (callback: (event: any, files: CmiFile[]) => void) => void;
    removeOnDeletedFilesListeners: () => void;

    onStartIMGLoading: (callback: (event: any) => void) => void;
    onIMGLoadingError: (callback: (event: any, error: string) => void) => void;
    onIMGLoaded: (callback: (event: any, dir: CmiDirectory) => void) => void;

    removeStartIMGLoadingListeners: () => void;
    removeIMGLoadingErrorListeners: () => void;
    removeIMGLoadedListeners: () => void;
}
  
// Extend the `window` object
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

declare module '*.module.css' {
    const classes: { [key: string]: string };
    export default classes;
}

export {};
