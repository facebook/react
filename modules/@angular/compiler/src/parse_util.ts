export class ParseLocation {
  constructor(
      public file: ParseSourceFile, public offset: number, public line: number,
      public col: number) {}

  toString(): string { return `${this.file.url}@${this.line}:${this.col}`; }
}

export class ParseSourceFile {
  constructor(public content: string, public url: string) {}
}

export class ParseSourceSpan {
  constructor(public start: ParseLocation, public end: ParseLocation) {}

  toString(): string {
    return this.start.file.content.substring(this.start.offset, this.end.offset);
  }
}

export enum ParseErrorLevel {
  WARNING,
  FATAL
}

export abstract class ParseError {
  constructor(
      public span: ParseSourceSpan, public msg: string,
      public level: ParseErrorLevel = ParseErrorLevel.FATAL) {}

  toString(): string {
    var source = this.span.start.file.content;
    var ctxStart = this.span.start.offset;
    if (ctxStart > source.length - 1) {
      ctxStart = source.length - 1;
    }
    var ctxEnd = ctxStart;
    var ctxLen = 0;
    var ctxLines = 0;

    while (ctxLen < 100 && ctxStart > 0) {
      ctxStart--;
      ctxLen++;
      if (source[ctxStart] == '\n') {
        if (++ctxLines == 3) {
          break;
        }
      }
    }

    ctxLen = 0;
    ctxLines = 0;
    while (ctxLen < 100 && ctxEnd < source.length - 1) {
      ctxEnd++;
      ctxLen++;
      if (source[ctxEnd] == '\n') {
        if (++ctxLines == 3) {
          break;
        }
      }
    }

    let context = source.substring(ctxStart, this.span.start.offset) + '[ERROR ->]' +
        source.substring(this.span.start.offset, ctxEnd + 1);

    return `${this.msg} ("${context}"): ${this.span.start}`;
  }
}
