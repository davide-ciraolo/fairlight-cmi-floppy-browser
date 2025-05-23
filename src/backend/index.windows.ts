import { app, BrowserWindow, dialog, ipcMain, Menu } from 'electron';
// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

import path from 'path';
import * as fs from 'fs';
import * as tmp from 'tmp';
tmp.setGracefulCleanup();
import { deleteFiles, exportFiles, importFiles, openFileDialog, renameFile, saveFloppy, setNewLabel } from './cmifs';
import CmiFile from '../../lib/cmios9/src/CmiFile';
import CmiDirectory from '../../lib/cmios9/src/CmiDirectory';
import cmios9 from '../../lib/cmios9/src/cmios9';

const APP_NAME: string = 'Fairlight CMI2x Floppy Browser';
const APP_ICON: string = process.env.NODE_ENV === 'development' ? path.join(process.cwd(), 'images/icon/icon.ico') : path.join(process.resourcesPath, 'icon.ico');
const FILE_DROP_IMG: string = process.env.NODE_ENV === 'development' ? path.join(process.cwd(), 'images/assets/file48.png') : path.join(process.resourcesPath, 'assets/file48.png');
const tmpDir: string = tmp.dirSync().name;
let currentCmiDirectory: CmiDirectory = undefined;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = async () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    title: APP_NAME,
    icon: APP_ICON,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // mainWindow.webContents.on('did-start-loading', () => {
  //     mainWindow.setTitle(APP_NAME + ' * Loading ....');
  //     mainWindow.setProgressBar(2, { mode: 'indeterminate' }) // second parameter optional
  // });

  // mainWindow.webContents.on('did-stop-loading', () => {
  //     mainWindow.setTitle(APP_NAME);
  //     mainWindow.setProgressBar(-1);
  // });

  // Set up context menu
  // const contextMenu = Menu.buildFromTemplate([
  //   {
  //     label: 'Load IMG',
  //     click: async () => {
  //       const file = await openFileDialog();
  //       mainWindow?.webContents.send('files-added', file);
  //     },
  //   },
  // ]);
  // mainWindow.webContents.on('context-menu', () => {
  //   contextMenu.popup();
  // });

  // Create application menu
  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          id: 'load',
          label: 'Load',
          click: async () => {
            const IMGdir: CmiDirectory | undefined = await openFileDialog();
            if(IMGdir) {
              mainWindow?.webContents.send('IMG-start-loading');
              IMGdir.loadFiles().then((files: CmiFile[]) => {
                mainWindow?.webContents.send('IMG-loaded', IMGdir);
                currentCmiDirectory = IMGdir;
                menu.getMenuItemById('import-files').enabled = true;
              }).catch((reason) => {
                mainWindow?.webContents.send('IMG-loading-error', reason + '');
              })
            }
          },
        },
        {
          id: 'import-files',
          label: 'Import Files',
          enabled: currentCmiDirectory != undefined,
          click: async () => {
            menu.getMenuItemById('import-files').enabled = false;
            const ret: boolean = await importFiles(currentCmiDirectory.imgPath);
            if(ret) {
              const IMGdir: CmiDirectory = await cmios9.reloadDirectory(currentCmiDirectory);
              mainWindow?.webContents.send('IMG-start-loading');
              IMGdir.loadFiles().then((files: CmiFile[]) => {
                mainWindow?.webContents.send('IMG-loaded', IMGdir);
                mainWindow?.webContents.send('imported-files', IMGdir);
                currentCmiDirectory = IMGdir;
                menu.getMenuItemById('import-files').enabled = true;
              }).catch((reason) => {
                mainWindow?.webContents.send('IMG-loading-error', reason + '');
                menu.getMenuItemById('import-files').enabled = true;
              });
            } else {
              dialog.showErrorBox('Error importing files', 'An error occoured while importing files.');
              menu.getMenuItemById('import-files').enabled = true;
            }
            
            //mainWindow?.webContents.send('imported-files', ret);
            // const IMGdir: CmiDirectory = await openFileDialog();
            // mainWindow?.webContents.send('IMG-start-loading');
            // IMGdir.loadFiles().then((files: CmiFile[]) => {
            //   mainWindow?.webContents.send('IMG-loaded', IMGdir);
            // }).catch((reason) => {
            //   mainWindow?.webContents.send('IMG-loading-error', reason + '');
            // })
          },
          
        },
        { role: 'quit' }, // Adds "Quit" option
      ],
    },
  ]);

  Menu.setApplicationMenu(menu);

  // ipcMain.handle('get-files', async (_, directory: string) => {
  //   return await getFiles(directory);
  // });

  ipcMain.on('dropped-file', async (event, files) => {
    let filePaths: string[] = [];
    for (const f of files) {
      if(f.path.startsWith(tmpDir))
        console.log('File from application!');
      else
        filePaths.push(f.path);
    }
  
    if(filePaths.length > 0) {
      menu.getMenuItemById('import-files').enabled = false;
      const ret: boolean = await importFiles(currentCmiDirectory.imgPath, filePaths);
      if(ret) {
        const IMGdir: CmiDirectory = await cmios9.reloadDirectory(currentCmiDirectory);
        mainWindow?.webContents.send('IMG-start-loading');
        IMGdir.loadFiles().then((files: CmiFile[]) => {
          mainWindow?.webContents.send('IMG-loaded', IMGdir);
          currentCmiDirectory = IMGdir;
          mainWindow?.webContents.send('imported-files', IMGdir);
          menu.getMenuItemById('import-files').enabled = true;
        }).catch((reason) => {
          mainWindow?.webContents.send('IMG-loading-error', reason + '');
          menu.getMenuItemById('import-files').enabled = true;
        });
        console.log('Dropped File(s):', files);
        event.returnValue = `Received ${files.length} paths.`; // Synchronous reply
      } else {
        dialog.showErrorBox('Error importing files', 'An error occoured while importing files.');
        event.returnValue = `Error importing ${files.length} files.`; // Synchronous reply
        menu.getMenuItemById('import-files').enabled = true;
      }
      return ret;
    }

    event.returnValue = `No files to import.`; // Synchronous reply
    return true;
  });
  

  ipcMain.on('export-files', async (_, files: CmiFile[]) => {
    return await exportFiles(files);
  });

  ipcMain.on('save-IMD', async (_, dir: CmiDirectory) => {
    mainWindow?.webContents.send('IMG-start-loading');
    const ret: boolean = await saveFloppy(dir);
    mainWindow?.webContents.send('IMG-loading-error', '');
    return ret;
  });

  ipcMain.on('new-label', async (_, dir: CmiDirectory) => {
    mainWindow?.webContents.send('IMG-start-loading');
    const ret: boolean = await setNewLabel(dir);
    mainWindow?.webContents.send('IMG-loading-error', '');
    return ret;
  });

  ipcMain.on('rename-file', async (_, file: CmiFile, new_fullfilename: string) => {
    mainWindow?.webContents.send('IMG-start-loading');
    const ret: boolean = await renameFile(file, new_fullfilename);
    mainWindow?.webContents.send('IMG-loading-error', '');
    return ret;
  });

  // ipcMain.on('import-files', async (_, img_file: string, files: string[]) => {
  //   const ret: boolean = await importFiles(img_file);
  //   if(ret) {
  //     const IMGdir: CmiDirectory = await cmios9.getDirectory(currentCmiDirectory.path);
  //     mainWindow?.webContents.send('IMG-start-loading');
  //     IMGdir.loadFiles().then((files: CmiFile[]) => {
  //       mainWindow?.webContents.send('IMG-loaded', IMGdir);
  //       currentCmiDirectory = IMGdir;
  //       menu.getMenuItemById('import-files').enabled = true;
  //     }).catch((reason) => {
  //       mainWindow?.webContents.send('IMG-loading-error', reason + '');
  //     });
  //   } else 
  //     dialog.showErrorBox('Error importing files', 'An error occoured while importing files.');
  //   return ret;
  // });

  ipcMain.on('delete-files', async (_, files: CmiFile[]) => {
    const ret: boolean = await deleteFiles(files);
    if(ret)
      mainWindow?.webContents.send('deleted-files', files);
    return ret;
  });

  if(process.argv.length >= 2 && process.argv[1] != '.') {
    console.log(process.argv);
    let filePath = process.argv[1];
    const ext: string = path.extname(filePath).toLowerCase();
    console.log(filePath, ext);
    if(ext == '.img' || ext == '.imd' || ext == '.hfe') {
      //open, read, handle file
      const IMGdir: CmiDirectory = await cmios9.getDirectory(filePath);
      mainWindow?.webContents.send('IMG-start-loading');
      IMGdir.loadFiles().then((files: CmiFile[]) => {
        mainWindow?.webContents.send('IMG-loaded', IMGdir);
        currentCmiDirectory = IMGdir;
        menu.getMenuItemById('import-files').enabled = true;
      }).catch((reason) => {
        mainWindow?.webContents.send('IMG-loading-error', reason + '');
      });
    } else
      dialog.showErrorBox('Error not supported', 'The selected file is not supported by the application.');
  }

  // app.on('open-file', async (event: Electron.Event, filePath: string) => {
  //   // if(process.argv.length >= 2 && process.argv[1] != '.') {
  // //   console.log(process.argv);
  // //   let filePath = process.argv[1];
  //   const ext: string = path.extname(filePath).toLowerCase();
  //   console.log(filePath, ext);
  //   if(ext == '.img' || ext == '.imd' || ext == '.hfe') {
  //     //open, read, handle file
  //     const IMGdir: CmiDirectory = await cmios9.getDirectory(filePath);
  //     mainWindow?.webContents.send('IMG-start-loading');
  //     IMGdir.loadFiles().then((files: CmiFile[]) => {
  //       mainWindow?.webContents.send('IMG-loaded', IMGdir);
  //       currentCmiDirectory = IMGdir;
  //       menu.getMenuItemById('import-files').enabled = true;
  //     }).catch((reason) => {
  //       mainWindow?.webContents.send('IMG-loading-error', reason + '');
  //     });
  //   } else
  //     dialog.showErrorBox('Error not supported', 'The selected file is not supported by the application.');
  // // }
  // });

};

ipcMain.on('ondragstart', (event: any, files: CmiFile[]) => {
  for (const f of files) {
    let tmpfileName: string = path.join(tmpDir, f.fullname);
    if (fs.existsSync(tmpfileName))
      fs.rmSync(tmpfileName);
    //outputFileName = tmp.tmpNameSync({ dir: tmpDir, name: f.fullname });
    fs.writeFile(tmpfileName, new Uint8Array(atob(f.fullContentBase64).split('').map(char => char.charCodeAt(0))), () => {
        event.sender.startDrag({
          file: tmpfileName,
          icon: FILE_DROP_IMG
        });
        //fs.rmSync(tmpfileName);
    });
    console.log(`File ${f.fullname} dragged!`);
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

//app.disableHardwareAcceleration();

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
