import { dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import cmios9 from '../../lib/cmios9/src/cmios9';
import CmiFile from '../../lib/cmios9/src/CmiFile';
import CmiDirectory from '../../lib/cmios9/src/CmiDirectory';
import * as tmp from 'tmp';
tmp.setGracefulCleanup();

// export const getFiles = async (img_path: string): Promise<CmiFile[]> => {
//   try {
//     return await cmios9.getFiles(img_path);
//   } catch (err) {
//     console.error(`Failed to read directory: ${err}`);
//     return [];
//   }
// };

// let currentCmiDirectory: CmiDirectory = undefined;

// export const setCurrentCmiDirectory = (dir: CmiDirectory) => {
//   currentCmiDirectory = dir;
// }

// export const getCurrentCmiDirectory = () => {
//   return currentCmiDirectory;
// }

export const openFileDialog = async (): Promise<CmiDirectory|undefined> => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'], //, 'multiSelections'],
    filters: [{extensions: ['HFE', 'IMD', 'IMG'], name: '*'}]
  });
  if(result.canceled)
    return undefined;
  try {
    const res: CmiDirectory | undefined = await cmios9.getDirectory(result.filePaths[0]);
    if(res == undefined)
      console.error(`Failed to read file: ${result.filePaths[0]}`);
    return res;
  } catch (err) {
    console.error(`Failed to read file: ${err}`);
    return undefined;
  }
};

export const exportFiles = async (files: CmiFile[]): Promise<boolean> => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  try {
    const output_path: string = result.filePaths[0];
    for (const f of files) {
      await cmios9.vc2wav(f.root, f.fullname, path.join(output_path, f.name + '.wav'));
    }
    return true;
  } catch (err) {
    console.error(`Failed to export file: ${err}`);
    return false;
  }
}

export const importFiles = async (img_file: string, files?: string[]): Promise<boolean> => {
  if(files == undefined) {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{extensions: ['VC', 'CO', 'WAV'], name: '*'}]
    });
    files = result.filePaths;
  }
  try {
    for (const f of files) {
      const parts: string[] = f.split('.');
      if(parts[parts.length - 1].toLowerCase() == 'wav')
        await cmios9.wav2vc(img_file, f, path.basename(f).split('.')[0].substring(0, 8) + '.VC')
      else
        await cmios9.importFile(img_file, f);
    }
    return true;
  } catch (err) {
    console.error(`Failed to import file: ${err}`);
    return false;
  }
}

export const deleteFiles = async (files: CmiFile[]): Promise<boolean> => {
  try {
    for (const f of files) {
      await cmios9.deleteFile(f.root, f.fullname);
    }
    return true;
  } catch (err) {
    console.error(`Failed to delete file: ${err}`);
    return false;
  }
}

export const saveFloppy = async (dir: CmiDirectory): Promise<boolean> => {
  try {
    return await cmios9.saveFloppy(dir);
  } catch (err) {
    console.error(`Failed to save IMD file: ${err}`);
    return false;
  }
}

export const renameFile = async (file: CmiFile, new_fullfilename: string): Promise<boolean> => {
  try {
    return await cmios9.rename(file.root, file.fullname, new_fullfilename);
  } catch (err) {
    console.error(`Failed to rename file: ${err}`);
    return false;
  }
}

export const setNewLabel = async (dir: CmiDirectory): Promise<boolean> => {
  try {
    await cmios9.newlabel(dir.imgPath, dir.label, dir.version.replace('.', ''), dir.date.replaceAll('-', ''), dir.user);
    return true;
  } catch (err) {
    console.error(`Failed to set new label: ${err}`);
    return false;
  }
}