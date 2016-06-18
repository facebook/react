declare module 'broccoli-writer' {
  class Writer {
    write(readTree: (tree: BroccoliTree) => Promise<string>, destDir: string): Promise<any>;
  }
  export = Writer;
}
