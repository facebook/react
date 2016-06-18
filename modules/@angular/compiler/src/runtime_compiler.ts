import {ComponentFactory, ComponentResolver, Injectable} from '@angular/core';

import {BaseException} from '../src/facade/exceptions';
import {IS_DART, Type, isBlank, isString} from '../src/facade/lang';

import {ListWrapper,} from '../src/facade/collection';
import {PromiseWrapper} from '../src/facade/async';
import {createHostComponentMeta, CompileDirectiveMetadata, CompilePipeMetadata, CompileIdentifierMetadata} from './compile_metadata';
import {TemplateAst,} from './template_ast';
import {StyleCompiler, StylesCompileDependency, StylesCompileResult} from './style_compiler';
import {ViewCompiler} from './view_compiler/view_compiler';
import {TemplateParser} from './template_parser';
import {DirectiveNormalizer} from './directive_normalizer';
import {CompileMetadataResolver} from './metadata_resolver';
import {CompilerConfig} from './config';
import * as ir from './output/output_ast';
import {jitStatements} from './output/output_jit';
import {interpretStatements} from './output/output_interpreter';
import {InterpretiveAppViewInstanceFactory} from './output/interpretive_view';
import {XHR} from './xhr';

/**
 * An internal module of the Angular compiler that begins with component types,
 * extracts templates, and eventually produces a compiled version of the component
 * ready for linking into an application.
 */
@Injectable()
export class RuntimeCompiler implements ComponentResolver {
  private _styleCache: Map<string, Promise<string>> = new Map<string, Promise<string>>();
  private _hostCacheKeys = new Map<Type, any>();
  private _compiledTemplateCache = new Map<any, CompiledTemplate>();
  private _compiledTemplateDone = new Map<any, Promise<CompiledTemplate>>();

  constructor(
      private _metadataResolver: CompileMetadataResolver,
      private _templateNormalizer: DirectiveNormalizer, private _templateParser: TemplateParser,
      private _styleCompiler: StyleCompiler, private _viewCompiler: ViewCompiler, private _xhr: XHR,
      private _genConfig: CompilerConfig) {}

  resolveComponent(component: Type|string): Promise<ComponentFactory<any>> {
    if (isString(component)) {
      return PromiseWrapper.reject(
          new BaseException(`Cannot resolve component using '${component}'.`), null);
    }

    let componentType = <Type>component;
    var compMeta: CompileDirectiveMetadata =
        this._metadataResolver.getDirectiveMetadata(componentType);
    var hostCacheKey = this._hostCacheKeys.get(componentType);
    if (isBlank(hostCacheKey)) {
      hostCacheKey = new Object();
      this._hostCacheKeys.set(componentType, hostCacheKey);
      assertComponent(compMeta);
      var hostMeta: CompileDirectiveMetadata =
          createHostComponentMeta(compMeta.type, compMeta.selector);

      this._loadAndCompileComponent(hostCacheKey, hostMeta, [compMeta], [], []);
    }
    return this._compiledTemplateDone.get(hostCacheKey)
        .then(
            (compiledTemplate: CompiledTemplate) => new ComponentFactory(
                compMeta.selector, compiledTemplate.viewFactory, componentType));
  }

  clearCache(): void {
    this._styleCache.clear();
    this._compiledTemplateCache.clear();
    this._compiledTemplateDone.clear();
    this._hostCacheKeys.clear();
  }


  private _loadAndCompileComponent(
      cacheKey: any, compMeta: CompileDirectiveMetadata, viewDirectives: CompileDirectiveMetadata[],
      pipes: CompilePipeMetadata[], compilingComponentsPath: any[]): CompiledTemplate {
    var compiledTemplate = this._compiledTemplateCache.get(cacheKey);
    var done = this._compiledTemplateDone.get(cacheKey);
    if (isBlank(compiledTemplate)) {
      compiledTemplate = new CompiledTemplate();
      this._compiledTemplateCache.set(cacheKey, compiledTemplate);
      done =
          PromiseWrapper
              .all([<any>this._compileComponentStyles(compMeta)].concat(viewDirectives.map(
                  dirMeta => this._templateNormalizer.normalizeDirective(dirMeta))))
              .then((stylesAndNormalizedViewDirMetas: any[]) => {
                var normalizedViewDirMetas = stylesAndNormalizedViewDirMetas.slice(1);
                var styles = stylesAndNormalizedViewDirMetas[0];
                var parsedTemplate = this._templateParser.parse(
                    compMeta, compMeta.template.template, normalizedViewDirMetas, pipes,
                    compMeta.type.name);

                var childPromises: Promise<any>[] = [];
                compiledTemplate.init(this._compileComponent(
                    compMeta, parsedTemplate, styles, pipes, compilingComponentsPath,
                    childPromises));
                return PromiseWrapper.all(childPromises).then((_) => { return compiledTemplate; });
              });
      this._compiledTemplateDone.set(cacheKey, done);
    }
    return compiledTemplate;
  }

  private _compileComponent(
      compMeta: CompileDirectiveMetadata, parsedTemplate: TemplateAst[], styles: string[],
      pipes: CompilePipeMetadata[], compilingComponentsPath: any[],
      childPromises: Promise<any>[]): Function {
    var compileResult = this._viewCompiler.compileComponent(
        compMeta, parsedTemplate,
        new ir.ExternalExpr(new CompileIdentifierMetadata({runtime: styles})), pipes);
    compileResult.dependencies.forEach((dep) => {
      var childCompilingComponentsPath = ListWrapper.clone(compilingComponentsPath);

      var childCacheKey = dep.comp.type.runtime;
      var childViewDirectives: CompileDirectiveMetadata[] =
          this._metadataResolver.getViewDirectivesMetadata(dep.comp.type.runtime);
      var childViewPipes: CompilePipeMetadata[] =
          this._metadataResolver.getViewPipesMetadata(dep.comp.type.runtime);
      var childIsRecursive = ListWrapper.contains(childCompilingComponentsPath, childCacheKey);
      childCompilingComponentsPath.push(childCacheKey);

      var childComp = this._loadAndCompileComponent(
          dep.comp.type.runtime, dep.comp, childViewDirectives, childViewPipes,
          childCompilingComponentsPath);
      dep.factoryPlaceholder.runtime = childComp.proxyViewFactory;
      dep.factoryPlaceholder.name = `viewFactory_${dep.comp.type.name}`;
      if (!childIsRecursive) {
        // Only wait for a child if it is not a cycle
        childPromises.push(this._compiledTemplateDone.get(childCacheKey));
      }
    });
    var factory: any;
    if (IS_DART || !this._genConfig.useJit) {
      factory = interpretStatements(
          compileResult.statements, compileResult.viewFactoryVar,
          new InterpretiveAppViewInstanceFactory());
    } else {
      factory = jitStatements(
          `${compMeta.type.name}.template.js`, compileResult.statements,
          compileResult.viewFactoryVar);
    }
    return factory;
  }

  private _compileComponentStyles(compMeta: CompileDirectiveMetadata): Promise<string[]> {
    var compileResult = this._styleCompiler.compileComponent(compMeta);
    return this._resolveStylesCompileResult(compMeta.type.name, compileResult);
  }

  private _resolveStylesCompileResult(sourceUrl: string, result: StylesCompileResult):
      Promise<string[]> {
    var promises = result.dependencies.map((dep) => this._loadStylesheetDep(dep));
    return PromiseWrapper.all(promises)
        .then((cssTexts) => {
          var nestedCompileResultPromises: Promise<string[]>[] = [];
          for (var i = 0; i < result.dependencies.length; i++) {
            var dep = result.dependencies[i];
            var cssText = cssTexts[i];
            var nestedCompileResult =
                this._styleCompiler.compileStylesheet(dep.moduleUrl, cssText, dep.isShimmed);
            nestedCompileResultPromises.push(
                this._resolveStylesCompileResult(dep.moduleUrl, nestedCompileResult));
          }
          return PromiseWrapper.all(nestedCompileResultPromises);
        })
        .then((nestedStylesArr) => {
          for (var i = 0; i < result.dependencies.length; i++) {
            var dep = result.dependencies[i];
            dep.valuePlaceholder.runtime = nestedStylesArr[i];
            dep.valuePlaceholder.name = `importedStyles${i}`;
          }
          if (IS_DART || !this._genConfig.useJit) {
            return interpretStatements(
                result.statements, result.stylesVar, new InterpretiveAppViewInstanceFactory());
          } else {
            return jitStatements(`${sourceUrl}.css.js`, result.statements, result.stylesVar);
          }
        });
  }

  private _loadStylesheetDep(dep: StylesCompileDependency): Promise<string> {
    var cacheKey = `${dep.moduleUrl}${dep.isShimmed ? '.shim' : ''}`;
    var cssTextPromise = this._styleCache.get(cacheKey);
    if (isBlank(cssTextPromise)) {
      cssTextPromise = this._xhr.get(dep.moduleUrl);
      this._styleCache.set(cacheKey, cssTextPromise);
    }
    return cssTextPromise;
  }
}

class CompiledTemplate {
  viewFactory: Function = null;
  proxyViewFactory: Function;
  constructor() {
    this.proxyViewFactory =
        (viewUtils: any /** TODO #9100 */, childInjector: any /** TODO #9100 */,
         contextEl: any /** TODO #9100 */) => this.viewFactory(viewUtils, childInjector, contextEl);
  }

  init(viewFactory: Function) { this.viewFactory = viewFactory; }
}

function assertComponent(meta: CompileDirectiveMetadata) {
  if (!meta.isComponent) {
    throw new BaseException(`Could not compile '${meta.type.name}' because it is not a component.`);
  }
}
