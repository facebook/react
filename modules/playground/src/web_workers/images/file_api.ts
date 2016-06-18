var _FileReader = FileReader;
export {_FileReader as FileReader};

export class Uint8ArrayWrapper {
  static create(buffer: ArrayBuffer) { return new Uint8Array(buffer); }
}
