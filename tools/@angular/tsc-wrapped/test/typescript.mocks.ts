import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

export interface Directory { [name: string]: (Directory|string); }

export class Host implements ts.LanguageServiceHost {
  constructor(private directory: Directory, private scripts: string[]) {}

  getCompilationSettings(): ts.CompilerOptions {
    return {
      experimentalDecorators: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES5
    };
  }

  getScriptFileNames(): string[] { return this.scripts; }

  getScriptVersion(fileName: string): string { return '1'; }

  getScriptSnapshot(fileName: string): ts.IScriptSnapshot {
    let content = this.getFileContent(fileName);
    if (content) return ts.ScriptSnapshot.fromString(content);
  }

  getCurrentDirectory(): string { return '/'; }

  getDefaultLibFileName(options: ts.CompilerOptions): string { return 'lib.d.ts'; }

  private getFileContent(fileName: string): string {
    const names = fileName.split(path.sep);
    if (names[names.length - 1] === 'lib.d.ts') {
      return fs.readFileSync(ts.getDefaultLibFilePath(this.getCompilationSettings()), 'utf8');
    }
    let current: Directory|string = this.directory;
    if (names.length && names[0] === '') names.shift();
    for (const name of names) {
      if (!current || typeof current === 'string') return undefined;
      current = (<any>current)[name];
    }
    if (typeof current === 'string') return current;
  }
}

export class MockNode implements ts.Node {
  constructor(
      public kind: ts.SyntaxKind = ts.SyntaxKind.Identifier, public flags: ts.NodeFlags = 0,
      public pos: number = 0, public end: number = 0) {}
  getSourceFile(): ts.SourceFile { return null; }
  getChildCount(sourceFile?: ts.SourceFile): number { return 0 }
  getChildAt(index: number, sourceFile?: ts.SourceFile): ts.Node { return null; }
  getChildren(sourceFile?: ts.SourceFile): ts.Node[] { return []; }
  getStart(sourceFile?: ts.SourceFile): number { return 0; }
  getFullStart(): number { return 0; }
  getEnd(): number { return 0; }
  getWidth(sourceFile?: ts.SourceFile): number { return 0; }
  getFullWidth(): number { return 0; }
  getLeadingTriviaWidth(sourceFile?: ts.SourceFile): number { return 0; }
  getFullText(sourceFile?: ts.SourceFile): string { return ''; }
  getText(sourceFile?: ts.SourceFile): string { return ''; }
  getFirstToken(sourceFile?: ts.SourceFile): ts.Node { return null; }
  getLastToken(sourceFile?: ts.SourceFile): ts.Node { return null; }
}

export class MockIdentifier extends MockNode implements ts.Identifier {
  public text: string;
  public _primaryExpressionBrand: any;
  public _memberExpressionBrand: any;
  public _leftHandSideExpressionBrand: any;
  public _incrementExpressionBrand: any;
  public _unaryExpressionBrand: any;
  public _expressionBrand: any;

  constructor(
      public name: string, kind: ts.SyntaxKind = ts.SyntaxKind.Identifier, flags: ts.NodeFlags = 0,
      pos: number = 0, end: number = 0) {
    super(kind, flags, pos, end);
    this.text = name;
  }
}

export class MockVariableDeclaration extends MockNode implements ts.VariableDeclaration {
  public _declarationBrand: any;

  constructor(
      public name: ts.Identifier, kind: ts.SyntaxKind = ts.SyntaxKind.VariableDeclaration,
      flags: ts.NodeFlags = 0, pos: number = 0, end: number = 0) {
    super(kind, flags, pos, end);
  }

  static of (name: string): MockVariableDeclaration {
    return new MockVariableDeclaration(new MockIdentifier(name));
  }
}

export class MockSymbol implements ts.Symbol {
  constructor(
      public name: string, private node: ts.Declaration = MockVariableDeclaration.of(name),
      public flags: ts.SymbolFlags = 0) {}

  getFlags(): ts.SymbolFlags { return this.flags; }
  getName(): string { return this.name; }
  getDeclarations(): ts.Declaration[] { return [this.node]; }
  getDocumentationComment(): ts.SymbolDisplayPart[] { return []; }

  static of (name: string): MockSymbol { return new MockSymbol(name); }
}

export function expectNoDiagnostics(diagnostics: ts.Diagnostic[]) {
  for (const diagnostic of diagnostics) {
    let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    let {line, character} = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
  }
  expect(diagnostics.length).toBe(0);
}

export function expectValidSources(service: ts.LanguageService, program: ts.Program) {
  expectNoDiagnostics(service.getCompilerOptionsDiagnostics());
  for (const sourceFile of program.getSourceFiles()) {
    expectNoDiagnostics(service.getSyntacticDiagnostics(sourceFile.fileName));
    expectNoDiagnostics(service.getSemanticDiagnostics(sourceFile.fileName));
  }
}

export function allChildren<T>(node: ts.Node, cb: (node: ts.Node) => T): T {
  return ts.forEachChild(node, child => {
    const result = cb(node);
    if (result) {
      return result;
    }
    return allChildren(child, cb);
  })
}

export function findClass(sourceFile: ts.SourceFile, name: string): ts.ClassDeclaration {
  return ts.forEachChild(
      sourceFile, node => isClass(node) && isNamed(node.name, name) ? node : undefined);
}

export function findVar(sourceFile: ts.SourceFile, name: string): ts.VariableDeclaration {
  return allChildren(
      sourceFile, node => isVar(node) && isNamed(node.name, name) ? node : undefined);
}

export function isClass(node: ts.Node): node is ts.ClassDeclaration {
  return node.kind === ts.SyntaxKind.ClassDeclaration;
}

export function isNamed(node: ts.Node, name: string): node is ts.Identifier {
  return node.kind === ts.SyntaxKind.Identifier && (<ts.Identifier>node).text === name;
}

export function isVar(node: ts.Node): node is ts.VariableDeclaration {
  return node.kind === ts.SyntaxKind.VariableDeclaration;
}
