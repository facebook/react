import {AngularCompilerOptions, MetadataCollector, ModuleMetadata} from '@angular/tsc-wrapped';
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

import {AssetUrl, ImportGenerator} from './compiler_private';
import {StaticReflectorHost, StaticSymbol} from './static_reflector';

const EXT = /(\.ts|\.d\.ts|\.js|\.jsx|\.tsx)$/;
const DTS = /\.d\.ts$/;

export interface ReflectorHostContext {
  exists(fileName: string): boolean;
  read(fileName: string): string;
  write(fileName: string, data: string): void;
}

export class ReflectorHost implements StaticReflectorHost, ImportGenerator {
  private metadataCollector = new MetadataCollector();
  private context: ReflectorHostContext;
  constructor(
      private program: ts.Program, private compilerHost: ts.CompilerHost,
      private options: AngularCompilerOptions, context?: ReflectorHostContext) {
    this.context = context || new NodeReflectorHostContext();
  }

  angularImportLocations() {
    return {
      coreDecorators: '@angular/core/src/metadata',
      diDecorators: '@angular/core/src/di/decorators',
      diMetadata: '@angular/core/src/di/metadata',
      diOpaqueToken: '@angular/core/src/di/opaque_token',
      animationMetadata: '@angular/core/src/animation/metadata',
      provider: '@angular/core/src/di/provider'
    };
  }
  private resolve(m: string, containingFile: string) {
    const resolved =
        ts.resolveModuleName(m, containingFile, this.options, this.compilerHost).resolvedModule;
    return resolved ? resolved.resolvedFileName : null;
  };

  private normalizeAssetUrl(url: string): string {
    let assetUrl = AssetUrl.parse(url);
    return assetUrl ? `${assetUrl.packageName}/${assetUrl.modulePath}` : null;
  }

  private resolveAssetUrl(url: string, containingFile: string): string {
    let assetUrl = this.normalizeAssetUrl(url);
    if (assetUrl) {
      return this.resolve(assetUrl, containingFile);
    }
    return url;
  }

  /**
   * We want a moduleId that will appear in import statements in the generated code.
   * These need to be in a form that system.js can load, so absolute file paths don't work.
   * Relativize the paths by checking candidate prefixes of the absolute path, to see if
   * they are resolvable by the moduleResolution strategy from the CompilerHost.
   */
  getImportPath(containingFile: string, importedFile: string) {
    importedFile = this.resolveAssetUrl(importedFile, containingFile);
    containingFile = this.resolveAssetUrl(containingFile, '');

    // TODO(tbosch): if a file does not yet exist (because we compile it later),
    // we still need to create it so that the `resolve` method works!
    if (!this.compilerHost.fileExists(importedFile)) {
      if (this.options.trace) {
        console.log(`Generating empty file ${importedFile} to allow resolution of import`);
      }
      this.compilerHost.writeFile(importedFile, '', false);
      this.context.write(importedFile, '');
    }

    const importModuleName = importedFile.replace(EXT, '');
    const parts = importModuleName.split(path.sep).filter(p => !!p);

    for (let index = parts.length - 1; index >= 0; index--) {
      let candidate = parts.slice(index, parts.length).join(path.sep);
      if (this.resolve('.' + path.sep + candidate, containingFile) === importedFile) {
        return `./${candidate}`;
      }
      if (this.resolve(candidate, containingFile) === importedFile) {
        return candidate;
      }
    }

    // Try a relative import
    let candidate = path.relative(path.dirname(containingFile), importModuleName);
    if (this.resolve(candidate, containingFile) === importedFile) {
      return candidate;
    }

    throw new Error(
        `Unable to find any resolvable import for ${importedFile} relative to ${containingFile}`);
  }

  findDeclaration(
      module: string, symbolName: string, containingFile: string,
      containingModule?: string): StaticSymbol {
    if (!containingFile || !containingFile.length) {
      if (module.indexOf('.') === 0) {
        throw new Error('Resolution of relative paths requires a containing file.');
      }
      // Any containing file gives the same result for absolute imports
      containingFile = path.join(this.options.basePath, 'index.ts');
    }

    try {
      let assetUrl = this.normalizeAssetUrl(module);
      if (assetUrl) {
        module = assetUrl;
      }
      const filePath = this.resolve(module, containingFile);

      if (!filePath) {
        throw new Error(`Could not resolve module ${module} relative to ${containingFile}`);
      }

      const tc = this.program.getTypeChecker();
      const sf = this.program.getSourceFile(filePath);
      if (!sf || !(<any>sf).symbol) {
        // The source file was not needed in the compile but we do need the values from
        // the corresponding .ts files stored in the .metadata.json file.  Just assume the
        // symbol and file we resolved to be correct as we don't need this to be the
        // cannonical reference as this reference could have only been generated by a
        // .metadata.json file resolving values.
        return this.getStaticSymbol(filePath, symbolName);
      }

      let symbol = tc.getExportsOfModule((<any>sf).symbol).find(m => m.name === symbolName);
      if (!symbol) {
        throw new Error(`can't find symbol ${symbolName} exported from module ${filePath}`);
      }
      if (symbol &&
          symbol.flags & ts.SymbolFlags.Alias) {  // This is an alias, follow what it aliases
        symbol = tc.getAliasedSymbol(symbol);
      }
      const declaration = symbol.getDeclarations()[0];
      const declarationFile = declaration.getSourceFile().fileName;

      return this.getStaticSymbol(declarationFile, symbol.getName());
    } catch (e) {
      console.error(`can't resolve module ${module} from ${containingFile}`);
      throw e;
    }
  }

  private typeCache = new Map<string, StaticSymbol>();

  /**
   * getStaticSymbol produces a Type whose metadata is known but whose implementation is not loaded.
   * All types passed to the StaticResolver should be pseudo-types returned by this method.
   *
   * @param declarationFile the absolute path of the file where the symbol is declared
   * @param name the name of the type.
   */
  getStaticSymbol(declarationFile: string, name: string): StaticSymbol {
    let key = `"${declarationFile}".${name}`;
    let result = this.typeCache.get(key);
    if (!result) {
      result = new StaticSymbol(declarationFile, name);
      this.typeCache.set(key, result);
    }
    return result;
  }

  // TODO(alexeagle): take a statictype
  getMetadataFor(filePath: string): ModuleMetadata {
    if (!this.context.exists(filePath)) {
      throw new Error(`No such file '${filePath}'`);
    }
    if (DTS.test(filePath)) {
      const metadataPath = filePath.replace(DTS, '.metadata.json');
      if (this.context.exists(metadataPath)) {
        return this.readMetadata(metadataPath);
      }
    }

    let sf = this.program.getSourceFile(filePath);
    if (!sf) {
      throw new Error(`Source file ${filePath} not present in program.`);
    }
    const metadata = this.metadataCollector.getMetadata(sf);
    return metadata;
  }

  readMetadata(filePath: string) {
    try {
      const result = JSON.parse(this.context.read(filePath));
      return result;
    } catch (e) {
      console.error(`Failed to read JSON file ${filePath}`);
      throw e;
    }
  }
}

export class NodeReflectorHostContext implements ReflectorHostContext {
  exists(fileName: string): boolean { return fs.existsSync(fileName); }

  read(fileName: string): string { return fs.readFileSync(fileName, 'utf8'); }

  write(fileName: string, data: string): void { fs.writeFileSync(fileName, data, 'utf8'); }
}
