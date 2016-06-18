#!/usr/bin/env node

/**
 * Extract i18n messages from source code
 */

// Must be imported first, because angular2 decorators throws on load.
import 'reflect-metadata';

import * as ts from 'typescript';
import * as tsc from '@angular/tsc-wrapped';
import * as path from 'path';
import * as compiler from '@angular/compiler';
import {ViewEncapsulation, lockRunMode} from '@angular/core';

import {StaticReflector} from './static_reflector';
import {CompileMetadataResolver, HtmlParser, DirectiveNormalizer, Lexer, Parser, TemplateParser, DomElementSchemaRegistry, StyleCompiler, ViewCompiler, TypeScriptEmitter, MessageExtractor, removeDuplicates, ExtractionResult, Message, ParseError, serializeXmb,} from './compiler_private';

import {Parse5DomAdapter} from '@angular/platform-server';

import {ReflectorHost} from './reflector_host';
import {StaticAndDynamicReflectionCapabilities} from './static_reflection_capabilities';

function extract(
    ngOptions: tsc.AngularCompilerOptions, program: ts.Program, host: ts.CompilerHost) {
  return Extractor.create(ngOptions, program, host).extract();
}

const _dirPaths = new Map<compiler.CompileDirectiveMetadata, string>();

const _GENERATED_FILES = /\.ngfactory\.ts$|\.css\.ts$|\.css\.shim\.ts$/;

class Extractor {
  constructor(
      private _options: tsc.AngularCompilerOptions, private _program: ts.Program,
      public host: ts.CompilerHost, private staticReflector: StaticReflector,
      private _resolver: CompileMetadataResolver, private _compiler: compiler.OfflineCompiler,
      private _reflectorHost: ReflectorHost, private _extractor: MessageExtractor) {
    lockRunMode();
  }

  private _extractCmpMessages(metadatas: compiler.CompileDirectiveMetadata[]):
      Promise<ExtractionResult> {
    if (!metadatas || !metadatas.length) {
      return null;
    }

    const normalize = (metadata: compiler.CompileDirectiveMetadata) => {
      const directiveType = metadata.type.runtime;
      const directives = this._resolver.getViewDirectivesMetadata(directiveType);
      return Promise.all(directives.map(d => this._compiler.normalizeDirectiveMetadata(d)))
          .then(normalizedDirectives => {
            const pipes = this._resolver.getViewPipesMetadata(directiveType);
            return new compiler.NormalizedComponentWithViewDirectives(
                metadata, normalizedDirectives, pipes);
          });
    };

    return Promise.all(metadatas.map(normalize))
        .then((cmps: compiler.NormalizedComponentWithViewDirectives[]) => {
          let messages: Message[] = [];
          let errors: ParseError[] = [];
          cmps.forEach(cmp => {
            let url = _dirPaths.get(cmp.component);
            let result = this._extractor.extract(cmp.component.template.template, url);
            errors = errors.concat(result.errors);
            messages = messages.concat(result.messages);
          });

          // Extraction Result might contain duplicate messages at this point
          return new ExtractionResult(messages, errors);
        });
  }

  private _readComponents(absSourcePath: string): Promise<compiler.CompileDirectiveMetadata>[] {
    const result: Promise<compiler.CompileDirectiveMetadata>[] = [];
    const metadata = this.staticReflector.getModuleMetadata(absSourcePath);
    if (!metadata) {
      console.log(`WARNING: no metadata found for ${absSourcePath}`);
      return result;
    }

    const symbols = Object.keys(metadata['metadata']);
    if (!symbols || !symbols.length) {
      return result;
    }
    for (const symbol of symbols) {
      const staticType = this._reflectorHost.findDeclaration(absSourcePath, symbol, absSourcePath);
      let directive: compiler.CompileDirectiveMetadata;
      directive = this._resolver.maybeGetDirectiveMetadata(<any>staticType);

      if (directive && directive.isComponent) {
        let promise = this._compiler.normalizeDirectiveMetadata(directive);
        promise.then(md => _dirPaths.set(md, absSourcePath));
        result.push(promise);
      }
    }
    return result;
  }

  extract(): Promise<any> {
    Parse5DomAdapter.makeCurrent();
    _dirPaths.clear();

    const promises = this._program.getSourceFiles()
                         .map(sf => sf.fileName)
                         .filter(f => !_GENERATED_FILES.test(f))
                         .map(
                             (absSourcePath: string): Promise<any> =>
                                 Promise.all(this._readComponents(absSourcePath))
                                     .then(metadatas => this._extractCmpMessages(metadatas))
                                     .catch(e => console.error(e.stack)));

    let messages: Message[] = [];
    let errors: ParseError[] = [];

    return Promise.all(promises).then(extractionResults => {
      extractionResults.filter(result => !!result).forEach(result => {
        messages = messages.concat(result.messages);
        errors = errors.concat(result.errors);
      });

      if (errors.length) {
        throw new Error(errors.map(e => e.toString()).join('\n'));
      }

      messages = removeDuplicates(messages);

      let genPath = path.join(this._options.genDir, 'messages.xmb');
      let msgBundle = serializeXmb(messages);

      this.host.writeFile(genPath, msgBundle, false);
    });
  }

  static create(
      options: tsc.AngularCompilerOptions, program: ts.Program,
      compilerHost: ts.CompilerHost): Extractor {
    const xhr: compiler.XHR = {get: (s: string) => Promise.resolve(compilerHost.readFile(s))};
    const urlResolver: compiler.UrlResolver = compiler.createOfflineCompileUrlResolver();
    const reflectorHost = new ReflectorHost(program, compilerHost, options);
    const staticReflector = new StaticReflector(reflectorHost);
    StaticAndDynamicReflectionCapabilities.install(staticReflector);
    const htmlParser = new HtmlParser();
    const config = new compiler.CompilerConfig({
      genDebugInfo: true,
      defaultEncapsulation: ViewEncapsulation.Emulated,
      logBindingUpdate: false,
      useJit: false,
      platformDirectives: [],
      platformPipes: []
    });
    const normalizer = new DirectiveNormalizer(xhr, urlResolver, htmlParser, config);
    const parser = new Parser(new Lexer());
    const tmplParser = new TemplateParser(
        parser, new DomElementSchemaRegistry(), htmlParser,
        /*console*/ null, []);
    const offlineCompiler = new compiler.OfflineCompiler(
        normalizer, tmplParser, new StyleCompiler(urlResolver), new ViewCompiler(config),
        new TypeScriptEmitter(reflectorHost), xhr);
    const resolver = new CompileMetadataResolver(
        new compiler.DirectiveResolver(staticReflector), new compiler.PipeResolver(staticReflector),
        new compiler.ViewResolver(staticReflector), config, staticReflector);

    // TODO(vicb): handle implicit
    const extractor = new MessageExtractor(htmlParser, parser, [], {});

    return new Extractor(
        options, program, compilerHost, staticReflector, resolver, offlineCompiler, reflectorHost,
        extractor);
  }
}

// Entry point
if (require.main === module) {
  const args = require('minimist')(process.argv.slice(2));
  tsc.main(args.p || args.project || '.', args.basePath, extract)
      .then(exitCode => process.exit(exitCode))
      .catch(e => {
        console.error(e.stack);
        console.error('Compilation failed');
        process.exit(1);
      });
}
