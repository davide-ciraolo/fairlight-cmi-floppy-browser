
// Alias	Possible Representation
// -------------------------------------------------------------------------
// fnr	    File Number or Index (Primary identifier for the file).
// fnr0	    Secondary Index or Volume Number (possibly a parent or grouping).
// rib	    Relative Index or Block (possibly an offset within storage).
// ov	    Overflow or Version (could indicate file versioning or status).
// lb	    Logical Block (may indicate storage location or partition).
// sl	    Starting Logical Address or another offset.
// la	    Last Address (end address or similar indicator in memory).
// sa	    Starting Address (beginning address or offset in memory).
// size	    Size of the file in bytes or logical units.
// att	    File Attributes (e.g., permissions, flags).
// fmt	    Format or User Type (e.g., file category or ownership).
// name	    File Name (combines filename and extension).

import {PathOrFileDescriptor} from 'fs';
import cmios9 from "./cmios9";

class CmiFile {

    public root: string;
    public fullname: string;

    // Properties extracted from the formatted line
    private fnr: number;
    private fnr0: number;
    private rib: number;
    private ov: number;
    private lb: number;
    private sl: number;
    private la: number;
    private sa: number;
    public size: number;
    private att: string;
    private fmt: string;
    public name: string; // Name part of "name"
    public extension: string; // Extension part of "name"
    public fullContentBase64: string;
    public contentBase64: string;
  
    constructor(img_path: string, line: string) {
      const regex = /^([0-9a-f]{3})\s+([0-9a-f]{3})\s+([0-9a-f]{4})\s+([0-9a-f ]{3})\s+([0-9a-f]{2})\s+([0-9a-f]{4})\s+([0-9a-f]{4})\s+([0-9a-f]{4})\s+([0-9a-f]{6})\s+([a-zA-Z\-]{5})\s+(\w+)\s+([\w]+)\s*\.\s*([\w]+)$/;
      const match = regex.exec(line.trim());
      if (!match) {
        throw new Error("Invalid line format");
      }

      this.fnr = parseInt(match[1], 16);
      this.fnr0 = parseInt(match[2], 16);
      this.rib = parseInt(match[3], 16);
      this.ov = parseInt(match[4], 16);
      this.lb = parseInt(match[5], 16);
      this.sl = parseInt(match[6], 16);
      this.la = parseInt(match[7], 16);
      this.sa = parseInt(match[8], 16);
      this.size = parseInt(match[9], 16);
      this.att = match[10];
      this.fmt = match[11];
      this.name = match[12];
      this.extension = match[13].replace('.', '');
      // this.name = match[12].split('.')[0].trim();
      // this.extension = match[12].split('.')[1];
      this.fullname = this.getFullName();
      this.root = img_path;
      this.contentBase64 = '';
      this.fullContentBase64 = '';
    }
  
    public getFullName() {
        return this.name + '.' + this.extension
    }

    public async loadFullFileContent(output_path?: string): Promise<string> {
      this.fullContentBase64 = await cmios9.exportFile(this.root, this.fullname, output_path);
      return this.fullContentBase64;
    }

    public async loadFileContent(output_path?: string): Promise<string> {
      if(this.extension == 'VC')
        this.contentBase64 = await cmios9.vc2wav(this.root, this.fullname, output_path);
      return this.contentBase64;
    }
  
    // Method to return all parameters as an object
    public toObject(): Record<string, any> {
      return {
        root: this.root,
        fullname: this.fullname,
        name: this.name,
        extension: this.extension,
        size: this.size,
        contentBase64: this.contentBase64,
        fullContentBase64: this.fullContentBase64
      };
    }
  }
  
  export default CmiFile;