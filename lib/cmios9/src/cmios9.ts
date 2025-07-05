import * as fs from 'fs';
import * as path from 'path';
import * as tmp from 'tmp';
tmp.setGracefulCleanup();
import exec from 'child_process';
import CmiFile from './CmiFile';
import CmiDirectory from './CmiDirectory';
import { dialog } from 'electron';


class cmios9 {

    static BIN_PATH: string = process.env.NODE_ENV === 'development' ? 
        path.join(process.cwd(), `lib/cmios9/bin/${process.platform}/bin`) : path.join(process.resourcesPath, 'bin');
    
    static CMIOS_PATH_WINDOWS: string = '"' + path.join(this.BIN_PATH, 'cmios9.exe') + '"';
    static CMIOS_PATH_MAC: string = '"' + path.join(this.BIN_PATH, `cmios9/${process.arch}/cmios9`) + '"';

    static HXCFE_PATH_WINDOWS: string = '"' + path.join(this.BIN_PATH, 'hxcfe.exe') + '"';
    
    // TODO: to verify if it works on arm64 macs (it should as per https://sourceforge.net/p/hxcfloppyemu/code/2634/)
    static HXCFE_PATH_MAC: string = '"' + path.join(this.BIN_PATH, 'hxcfe/App/hxcfe') + '"';

    static FLOPTOOL_PATH_WINDOWS: string = '"' + path.join(this.BIN_PATH, 'floptool.exe') + '"'

    // TODO: add binary for MAC
    static FLOPTOOL_PATH_MAC: string = ''


    static DISK_LAYOUT_PATH_WINDOWS: string = 'fairlight_layout.xml'; //path.normalize('"' + path.join(this.BIN_PATH, 'fairlight_layout.xml') + '"');
    static DISK_LAYOUT_PATH_MAC: string = 'hxcfe/fairlight_layout.xml'; //path.normalize('"' + path.join(this.BIN_PATH, 'hxcfe/fairlight_layout.xml') + '"');

    static HXCFE_RAW_LOADER: string = ' -conv:RAW_LOADER ';
    static HXCFE_IMD_LOADER: string = ' -conv:IMD_IMG ';
    static HXCFE_HFE_LOADER: string = ' -conv:HXC_HFE ';
    static HXCFE_MFI_LOADER: string = ' -conv:MAME_MFI ';
    static HXCFE_DISK_LAYOUT: string = ' -uselayout:' + (process.platform == 'darwin' ? cmios9.DISK_LAYOUT_PATH_MAC : cmios9.DISK_LAYOUT_PATH_WINDOWS)

    static FLAGS: string = ' -q1 ';

    static floptoolCommand: string = process.platform == 'darwin' ? cmios9.FLOPTOOL_PATH_MAC : cmios9.FLOPTOOL_PATH_WINDOWS;
    static cmiosCommand: string = process.platform == 'darwin' ? cmios9.CMIOS_PATH_MAC : cmios9.CMIOS_PATH_WINDOWS;
    static hxcfeCommand: string = process.platform == 'darwin' ? cmios9.HXCFE_PATH_MAC : cmios9.HXCFE_PATH_WINDOWS;

    static async _createProcess(command: string, inputs?: string[]): Promise<string> {
        return new Promise((resolve, reject) => {
            const proc = exec.exec(command, (error, stdout, stderr) => {
                if (error != null)
                    reject(Object.assign(error, {stderr}).message); // TODO: maybe is not enough information
                else 
                    resolve(stdout);
            });
            proc.on('spawn', () => {
                if(proc.stdin != null) {
                    if(inputs)
                        inputs.forEach((input, index) => {
                            proc.stdin!.write(input + '\n');
                        })
                    proc.stdin.write('quit\n');
                }
            });
        });
    }

    static _validatePath(source: string, checkExists: boolean = true): string {
        const normalizedPath: string = path.normalize(source);
        if(checkExists)
            if(fs.existsSync(normalizedPath))
                return normalizedPath;
            else
                throw Error('Error: the provided path  doesn\'t exist. ("' + normalizedPath + '")');
        return normalizedPath;
    }    

    static _validateLength(s: string, l: number, strict: boolean = false): boolean {
        return strict ? s.length == l : s.length <= l;
    }

    // Method to list files inside a IMG floppy disk.
    static async list(img_path: string): Promise<string> {
        img_path = cmios9._validatePath(img_path);
        const command: string = cmios9.cmiosCommand + cmios9.FLAGS + '"' + img_path + '"'
        const inputs: string[] = [
            'dir'
        ]
        return await cmios9._createProcess(command, inputs);
    }

    // Method to change the label of a IMG floppy disk.
    static async newlabel(img_path: string, label: string, version: string, date: string, user: string): Promise<boolean> {

        img_path = cmios9._validatePath(img_path);

        if(!cmios9._validateLength(label, 8))
            throw Error('Error: label "' + label + '" is too long (maximum 8 characters).');

        if(!cmios9._validateLength(version, 4))
            throw Error('Error: version "' + version + '" is too long (maximum 4 characters).');

        if(!cmios9._validateLength(date, 6))
            throw Error('Error: date "' + date + '" is too long (maximum 6 characters).');

        if(!cmios9._validateLength(user, 20))
            throw Error('Error: username "' + user + '" is too long (maximum 20 characters).');

        const command: string = cmios9.cmiosCommand + cmios9.FLAGS + '"' + img_path + '"';
        const inputs: string[] = [
            'newlabel',
            'yes',
            label.trim(),
            version.trim(),
            date.trim(),
            user.trim()
        ]

        const output: string = await cmios9._createProcess(command, inputs);
        const lines: string[] = output.split('\n');
        if(lines[lines.length - 1].trim() == 'done')
            return true;
        return false;

    }

    // Method to rename a file.
    static async rename(img_path: string, fullfilename: string, new_fullfilename: string): Promise<boolean> {

        img_path = cmios9._validatePath(img_path);

        if(!cmios9._validateLength(fullfilename, 11))
            throw Error('Error: file name "' + new_fullfilename + '" is too long (maximum 11 characters).');

        const command: string = cmios9.cmiosCommand + cmios9.FLAGS + '"' + img_path + '"';
        const inputs: string[] = [
            `rename ${fullfilename} ${new_fullfilename}`
        ];
        
        const output: string = await cmios9._createProcess(command, inputs);
        const lines: string[] = output.split('\n');
        if(lines[lines.length - 1].trim() == '')
            return true;
        return false;

    }

    static async partinfo(img_path: string): Promise<string> {
        img_path = cmios9._validatePath(img_path);
        const command: string = cmios9.cmiosCommand + cmios9.FLAGS + '"' + img_path + '"'
        const inputs: string[] = [
            'partinfo'
        ]
        return await cmios9._createProcess(command, inputs);
    }

    // TODO: handle other type of files than just IMD
    static async saveFloppy(dir: CmiDirectory): Promise<boolean> {
        // let parts: string[] = img_path.split('.');
        // if(fs.existsSync(img_path))
        //     parts[parts.length - 1] = 'IMD';
        // else
        //     return false;
        //const out_path: string = parts.join('.');
        if(!fs.existsSync(dir.imgPath))
            return false;

        if(path.extname(dir.path).toLowerCase() == '.img'){
            fs.copyFileSync(dir.imgPath, dir.path);
            return true;
        }

        const command: string = 'cd "' + cmios9.BIN_PATH + '" && ' + cmios9.hxcfeCommand + ' -finput:"' + dir.imgPath + '"' + cmios9.HXCFE_IMD_LOADER + cmios9.HXCFE_DISK_LAYOUT + ' -foutput:"' + dir.path + '"';
        await cmios9._createProcess(command, []);
        if(fs.existsSync(dir.path))
            return true;
        return false;
    }

    // TODO: is not perfect, could overwrite existing file.
    static async extractIMG(floppy_path: string): Promise<string> {
        // let parts: string[] = floppy_path.split('.');
        // if(parts[parts.length - 1].toLowerCase() == 'img' && fs.existsSync(floppy_path))
        //     return floppy_path;
        //parts[parts.length - 1] = 'IMG';
        const img_path: string = tmp.tmpNameSync({postfix: '.IMG'});
        if(path.extname(floppy_path).toLowerCase() == '.img' && fs.existsSync(floppy_path)){
            fs.copyFileSync(floppy_path, img_path);
            return img_path;
        }

        let command: string = 'cd "' + cmios9.BIN_PATH + '" && ' + cmios9.hxcfeCommand + ' -finput:"' + floppy_path + '"' + cmios9.HXCFE_RAW_LOADER + ' -foutput:"' + img_path + '"';

        if(path.extname(floppy_path).toLowerCase() == '.mfm' && fs.existsSync(floppy_path)){

            // TODO: temporay, the floptool for darwin should be added in the future
            if(process.platform == 'darwin') {
                throw Error('Unsupported format on MacOS.');
            }

            const mfi_path: string = tmp.tmpNameSync({postfix: '.MFI'});
            const imd_path: string = tmp.tmpNameSync({postfix: '.IMD'});
            command = 'cd "' + cmios9.BIN_PATH + '" && ' + cmios9.floptoolCommand + ' flopconvert mfm mfi "' + floppy_path + '" "' + mfi_path + '"' +
            ' && ' + cmios9.hxcfeCommand + ' -finput:"' + mfi_path + '"' + cmios9.HXCFE_IMD_LOADER + ' -foutput:"' + imd_path + '"' +
            ' && ' + cmios9.hxcfeCommand + ' -finput:"' + imd_path + '"' + cmios9.HXCFE_RAW_LOADER + ' -foutput:"' + img_path + '"';
        } else if(path.extname(floppy_path).toLowerCase() == '.mfi' && fs.existsSync(floppy_path)){
            const imd_path: string = tmp.tmpNameSync({postfix: '.IMD'});
            command = 'cd "' + cmios9.BIN_PATH + '" && ' + cmios9.hxcfeCommand + ' -finput:"' + floppy_path + '"' + cmios9.HXCFE_IMD_LOADER + ' -foutput:"' + imd_path + '"' +
            ' && ' + cmios9.hxcfeCommand + ' -finput:"' + imd_path + '"' + cmios9.HXCFE_RAW_LOADER + ' -foutput:"' + img_path + '"';
        }

        console.log(command);

        await cmios9._createProcess(command, []);
        if(fs.existsSync(img_path))
            return img_path;
        return '';
    }

    static async reloadDirectory(directory: CmiDirectory): Promise<CmiDirectory|undefined> {
        return new CmiDirectory(directory.path, directory.imgPath, await cmios9.partinfo(directory.imgPath));
    }

    static async getDirectory(floppy_path: string): Promise<CmiDirectory|undefined> {
        const img_path: string = await cmios9.extractIMG(floppy_path);
        if(img_path != '')
            return new CmiDirectory(floppy_path, img_path, await cmios9.partinfo(img_path));
        return;
    }

    static async getFiles(img_path: string): Promise<CmiFile[]> {
        const output: string = await cmios9.list(img_path);
        const lines: string[] = output.split('\n');
        let files: CmiFile[] = [];
        for (let line of lines) {
            try {
                files.push(new CmiFile(img_path, line));
            } catch(e) {
                //console.log(e);
            }
        }
        return files;
    }

    static async vc2wav(img_path: string, vc_filename: string, output_path?: string): Promise<string> {
        img_path = cmios9._validatePath(img_path);
        if(!output_path)
            output_path = tmp.fileSync().name;
        const command: string = 'cd "' + path.dirname(output_path) + '" && ' + cmios9.cmiosCommand + cmios9.FLAGS + '"' + img_path + '"'
        const inputs: string[] = [
            'vc2wav ' + vc_filename + ' ' + path.basename(output_path)
        ];
        const output: string = await cmios9._createProcess(command, inputs);
        const lines: string[] = output.split('\n');
        const error: string = lines[lines.length - 1].trim();
        if(error == '') {
            return fs.readFileSync(output_path).toString('base64');
        } else {
            throw Error(error);
        }
    }

    static async wav2vc(img_path: string, wav_filename: string, output_vc_filename: string): Promise<boolean> {
        img_path = cmios9._validatePath(img_path);
        const command: string = 'cd "' + path.dirname(wav_filename) + '" && ' + cmios9.cmiosCommand + cmios9.FLAGS + '"' + img_path + '"'
        const inputs: string[] = [
            'wav2vc2 ' + path.basename(wav_filename) + ' ' + output_vc_filename
        ];
        const output: string = await cmios9._createProcess(command, inputs);
        const lines: string[] = output.split('\n');
        const error: string = lines[lines.length - 1].trim();
        if(error == '') {
            return true;
        } else {
            throw Error(error);
        }
    }

    static async exportFile(img_path: string, filename: string, output_path?: string): Promise<string> {
        img_path = cmios9._validatePath(img_path);
        if(!output_path)
            output_path = tmp.dirSync().name;
        const command: string = 'cd "' + output_path + '" && ' + cmios9.cmiosCommand + cmios9.FLAGS + '"' + img_path + '"'
        const inputs: string[] = [
            'export ' + filename
        ];
        const output: string = await cmios9._createProcess(command, inputs);
        const lines: string[] = output.split('\n');
        const error: string = lines[lines.length - 1].trim();
        if(error == '') {
            return fs.readFileSync(path.join(output_path, filename)).toString('base64');
        } else {
            throw Error(error);
        }
    }

    static async deleteFile(img_path: string, filename: string): Promise<boolean> {
        img_path = cmios9._validatePath(img_path);
        const command: string = cmios9.cmiosCommand + cmios9.FLAGS + '"' + img_path + '"'
        const inputs: string[] = [
            'del ' + filename
        ];
        const output: string = await cmios9._createProcess(command, inputs);
        const lines: string[] = output.split('\n');
        const error: string = lines[lines.length - 1].trim();
        if(error == '') {
            return true;
        } else {
            throw Error(error);
        }
    }

    static async importFile(img_path: string, file_path: string): Promise<boolean> {
        img_path = cmios9._validatePath(img_path);
        const file_root: string = path.dirname(file_path);
        const file_name: string = path.basename(file_path);
        const command: string = 'cd "' + file_root + '" && ' + cmios9.cmiosCommand + cmios9.FLAGS + '"' + img_path + '"'
        const inputs: string[] = [
            'import ' + file_name
        ];
        dialog.showErrorBox('test', command);
        dialog.showErrorBox('test', inputs.toString());
        const output: string = await cmios9._createProcess(command, inputs);
        const lines: string[] = output.split('\n');
        const error: string = lines[lines.length - 1].trim();
        if(error == '') {
            return true;
        } else {
            throw Error(error);
        }
    }

}
  
export default cmios9;
  