import CmiFile from "./CmiFile";
import cmios9 from "./cmios9";

import path from 'path';
import * as tmp from 'tmp';
tmp.setGracefulCleanup();


class CmiDirectory {

    public imgPath: string;
    public path: string;
    public name: string;
    public label: string;
    public version: string;
    public date: string;
    public user: string;
    public size: {
      total: number;
      used: number;
      free: number;
      usedPercentage: number;
      freePercentage: number;
    }
    public files?: CmiFile[];

    private did_id: string;
    private did_vn: string;
    private did_rn: string;
    private did_dt: string;
    private did_nm: string;
    private totfree: number;
    private totsize: number;

    constructor(floppy_path: string, img_path: string, partinfo: string) {
      const result: any = this._parseOutput(partinfo);
      this.path = floppy_path;
      this.imgPath = img_path;
      this.name = path.basename(this.path);
      this.did_id = result['did_id'];
      this.did_vn = result['did_vn'];
      this.did_rn = result['did_rn'];
      this.did_dt = result['did_dt'];
      this.did_nm = result['did_nm'];
      this.totfree = result['totfree'];
      this.totsize = result['totsize'];

      this.label = this.getLabel();
      this.version = this.getVersion();
      this.date = this.getDate();
      this.user = this.getUser();
      this.size = {
        total: this.getTotSize(),
        used: this.getUsedSize(),
        free: this.getFreeSize(),
        usedPercentage: this.getUsedPercentage(),
        freePercentage: this.getFreePercentage()
      }

    }

    private _parseOutput(partinfo: string) {
      const result: any = {};

      // Regex patterns for the required fields
      const patterns: Object = {
        did_id: /did_id:\s+(.*)/,
        did_vn: /did_vn:\s+(.*)/,
        did_rn: /did_rn:\s+(.*)/,
        did_dt: /did_dt:\s+(.*)/,
        did_nm: /did_nm:\s+(.*)/,
        totfree: /totfree:\s+[^\s]+\sblocks\s+=\s+[^\s]+\sbytes\s+=\s+(\d+)\sKB/,
        totsize: /of\s+[^\s]+\sblocks\s+=\s+[^\s]+\sbytes\s+=\s+(\d+)\sKB/
      };
    
      // Extract values using regex
      for (const [key, pattern] of Object.entries(patterns)) {
        const match: RegExpMatchArray | null = partinfo.match(pattern);
        if (match) {
          result[key] = key === "totfree" || key === "totsize" ? parseInt(match[1], 10) : match[1];
        } else {
          throw Error("Error: partinfo string is not valid.");
        }
      }

      // TODO: if totfree is less than 1KB, the regex could not take the value, so we make it 0.
      if (result.totfree == undefined)
        result.totfree = 0;
    
      return result;
    }

    public getTotSize(): number {
      return this.totsize;
    }

    public getFreeSize(): number {
      return this.totfree;
    }

    public getFreePercentage(): number {
      return (this.totfree / this.totsize)*100;
    }

    public getUsedSize(): number {
      return this.totsize - this.totfree;
    }

    public getUsedPercentage(): number {
      return (this.getUsedSize() / this.totsize)*100;
    }

    public getLabel(): string {
      return this.did_id.trim();
    } 

    public getUser(): string {
      return this.did_nm.trim();
    }

    public getDate(): string {
      const dt: RegExpMatchArray | null = this.did_dt.match(/^(\d{2})-(\d{2})-(\d{2})$/);
      if(dt && dt.length > 3)
        return dt[1] + '-' + dt[2] + '-' + dt[3]
      return '';
    }

    public getVersion(): string {
      return this.did_vn + '.' + this.did_rn;
    }

    public getFiles(): CmiFile[] | undefined {
      return this.files;
    }

    public async loadFiles(): Promise<CmiFile[]> {
      this.files = await cmios9.getFiles(this.imgPath)
      const tmpfolder: string = tmp.dirSync().name;
      const tmpfile: string = tmp.fileSync({postfix: '.wav'}).name;
      for(let i = 0; i < this.files.length; i++) {
        await this.files[i].loadFullFileContent(tmpfolder);
        await this.files[i].loadFileContent(tmpfile);
      }
      return this.files;
    }

    // Method to return all parameters as an object
    public toObject(): Record<string, any> {
      return {
        path: this.path,
        imgPath: this.imgPath,
        name: this.name,
        label: this.getLabel(),
        version: this.getVersion(),
        date: this.getDate(),
        user: this.getUser(),
        size: {
          total: this.getTotSize(),
          used: this.getUsedSize(),
          free: this.getFreeSize(),
          usedPercentage: this.getUsedPercentage(),
          freePercentage: this.getFreePercentage()
        },
        files: this.getFiles()
      };
    }

}

export default CmiDirectory;