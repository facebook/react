import {AnimationAnimateMetadata, AnimationEntryMetadata, AnimationGroupMetadata, AnimationKeyframesSequenceMetadata, AnimationMetadata, AnimationStateDeclarationMetadata, AnimationStateMetadata, AnimationStateTransitionMetadata, AnimationStyleMetadata, AnimationWithStepsMetadata, AttributeMetadata, ComponentMetadata, HostMetadata, Inject, InjectMetadata, Injectable, Optional, OptionalMetadata, Provider, QueryMetadata, SelfMetadata, SkipSelfMetadata, ViewMetadata, ViewQueryMetadata, resolveForwardRef} from '@angular/core';

import {LIFECYCLE_HOOKS_VALUES, ReflectorReader, createProvider, isProviderLiteral, reflector} from '../core_private';
import {StringMapWrapper} from '../src/facade/collection';
import {BaseException} from '../src/facade/exceptions';
import {Type, isArray, isBlank, isPresent, isString, isStringMap, stringify} from '../src/facade/lang';

import {assertArrayOfStrings} from './assertions';
import * as cpl from './compile_metadata';
import {CompilerConfig} from './config';
import {hasLifecycleHook} from './directive_lifecycle_reflector';
import {DirectiveResolver} from './directive_resolver';
import {PipeResolver} from './pipe_resolver';
import {getUrlScheme} from './url_resolver';
import {MODULE_SUFFIX, ValueTransformer, sanitizeIdentifier, visitValue} from './util';
import {ViewResolver} from './view_resolver';

@Injectable()
export class CompileMetadataResolver {
  private _directiveCache = new Map<Type, cpl.CompileDirectiveMetadata>();
  private _pipeCache = new Map<Type, cpl.CompilePipeMetadata>();
  private _anonymousTypes = new Map<Object, number>();
  private _anonymousTypeIndex = 0;

  constructor(
      private _directiveResolver: DirectiveResolver, private _pipeResolver: PipeResolver,
      private _viewResolver: ViewResolver, private _config: CompilerConfig,
      private _reflector: ReflectorReader = reflector) {}

  private sanitizeTokenName(token: any): string {
    let identifier = stringify(token);
    if (identifier.indexOf('(') >= 0) {
      // case: anonymous functions!
      let found = this._anonymousTypes.get(token);
      if (isBlank(found)) {
        this._anonymousTypes.set(token, this._anonymousTypeIndex++);
        found = this._anonymousTypes.get(token);
      }
      identifier = `anonymous_token_${found}_`;
    }
    return sanitizeIdentifier(identifier);
  }

  getAnimationEntryMetadata(entry: AnimationEntryMetadata): cpl.CompileAnimationEntryMetadata {
    var defs = entry.definitions.map(def => this.getAnimationStateMetadata(def));
    return new cpl.CompileAnimationEntryMetadata(entry.name, defs);
  }

  getAnimationStateMetadata(value: AnimationStateMetadata): cpl.CompileAnimationStateMetadata {
    if (value instanceof AnimationStateDeclarationMetadata) {
      var styles = this.getAnimationStyleMetadata(value.styles);
      return new cpl.CompileAnimationStateDeclarationMetadata(value.stateNameExpr, styles);
    } else if (value instanceof AnimationStateTransitionMetadata) {
      return new cpl.CompileAnimationStateTransitionMetadata(
          value.stateChangeExpr, this.getAnimationMetadata(value.steps));
    }
    return null;
  }

  getAnimationStyleMetadata(value: AnimationStyleMetadata): cpl.CompileAnimationStyleMetadata {
    return new cpl.CompileAnimationStyleMetadata(value.offset, value.styles);
  }

  getAnimationMetadata(value: AnimationMetadata): cpl.CompileAnimationMetadata {
    if (value instanceof AnimationStyleMetadata) {
      return this.getAnimationStyleMetadata(value);
    } else if (value instanceof AnimationKeyframesSequenceMetadata) {
      return new cpl.CompileAnimationKeyframesSequenceMetadata(
          value.steps.map(entry => this.getAnimationStyleMetadata(entry)));
    } else if (value instanceof AnimationAnimateMetadata) {
      let animateData =
          <cpl.CompileAnimationStyleMetadata|cpl.CompileAnimationKeyframesSequenceMetadata>this
              .getAnimationMetadata(value.styles);
      return new cpl.CompileAnimationAnimateMetadata(value.timings, animateData);
    } else if (value instanceof AnimationWithStepsMetadata) {
      var steps = value.steps.map(step => this.getAnimationMetadata(step));
      if (value instanceof AnimationGroupMetadata) {
        return new cpl.CompileAnimationGroupMetadata(steps);
      } else {
        return new cpl.CompileAnimationSequenceMetadata(steps);
      }
    }
    return null;
  }

  getDirectiveMetadata(directiveType: Type): cpl.CompileDirectiveMetadata {
    var meta = this._directiveCache.get(directiveType);
    if (isBlank(meta)) {
      var dirMeta = this._directiveResolver.resolve(directiveType);
      var templateMeta: cpl.CompileTemplateMetadata = null;
      var changeDetectionStrategy: any /** TODO #9100 */ = null;
      var viewProviders: any[] /** TODO #9100 */ = [];
      var moduleUrl = staticTypeModuleUrl(directiveType);
      if (dirMeta instanceof ComponentMetadata) {
        assertArrayOfStrings('styles', dirMeta.styles);
        var cmpMeta = <ComponentMetadata>dirMeta;
        var viewMeta = this._viewResolver.resolve(directiveType);
        assertArrayOfStrings('styles', viewMeta.styles);
        var animations = isPresent(viewMeta.animations) ?
            viewMeta.animations.map(e => this.getAnimationEntryMetadata(e)) :
            null;

        templateMeta = new cpl.CompileTemplateMetadata({
          encapsulation: viewMeta.encapsulation,
          template: viewMeta.template,
          templateUrl: viewMeta.templateUrl,
          styles: viewMeta.styles,
          styleUrls: viewMeta.styleUrls,
          animations: animations
        });
        changeDetectionStrategy = cmpMeta.changeDetection;
        if (isPresent(dirMeta.viewProviders)) {
          viewProviders = this.getProvidersMetadata(dirMeta.viewProviders);
        }
        moduleUrl = componentModuleUrl(this._reflector, directiveType, cmpMeta);
      }

      var providers: any[] /** TODO #9100 */ = [];
      if (isPresent(dirMeta.providers)) {
        providers = this.getProvidersMetadata(dirMeta.providers);
      }
      var queries: any[] /** TODO #9100 */ = [];
      var viewQueries: any[] /** TODO #9100 */ = [];
      if (isPresent(dirMeta.queries)) {
        queries = this.getQueriesMetadata(dirMeta.queries, false, directiveType);
        viewQueries = this.getQueriesMetadata(dirMeta.queries, true, directiveType);
      }
      meta = cpl.CompileDirectiveMetadata.create({
        selector: dirMeta.selector,
        exportAs: dirMeta.exportAs,
        isComponent: isPresent(templateMeta),
        type: this.getTypeMetadata(directiveType, moduleUrl),
        template: templateMeta,
        changeDetection: changeDetectionStrategy,
        inputs: dirMeta.inputs,
        outputs: dirMeta.outputs,
        host: dirMeta.host,
        lifecycleHooks:
            LIFECYCLE_HOOKS_VALUES.filter(hook => hasLifecycleHook(hook, directiveType)),
        providers: providers,
        viewProviders: viewProviders,
        queries: queries,
        viewQueries: viewQueries
      });
      this._directiveCache.set(directiveType, meta);
    }
    return meta;
  }

  /**
   * @param someType a symbol which may or may not be a directive type
   * @returns {cpl.CompileDirectiveMetadata} if possible, otherwise null.
   */
  maybeGetDirectiveMetadata(someType: Type): cpl.CompileDirectiveMetadata {
    try {
      return this.getDirectiveMetadata(someType);
    } catch (e) {
      if (e.message.indexOf('No Directive annotation') !== -1) {
        return null;
      }
      throw e;
    }
  }

  getTypeMetadata(type: Type, moduleUrl: string): cpl.CompileTypeMetadata {
    return new cpl.CompileTypeMetadata({
      name: this.sanitizeTokenName(type),
      moduleUrl: moduleUrl,
      runtime: type,
      diDeps: this.getDependenciesMetadata(type, null)
    });
  }

  getFactoryMetadata(factory: Function, moduleUrl: string): cpl.CompileFactoryMetadata {
    return new cpl.CompileFactoryMetadata({
      name: this.sanitizeTokenName(factory),
      moduleUrl: moduleUrl,
      runtime: factory,
      diDeps: this.getDependenciesMetadata(factory, null)
    });
  }

  getPipeMetadata(pipeType: Type): cpl.CompilePipeMetadata {
    var meta = this._pipeCache.get(pipeType);
    if (isBlank(meta)) {
      var pipeMeta = this._pipeResolver.resolve(pipeType);
      meta = new cpl.CompilePipeMetadata({
        type: this.getTypeMetadata(pipeType, staticTypeModuleUrl(pipeType)),
        name: pipeMeta.name,
        pure: pipeMeta.pure,
        lifecycleHooks: LIFECYCLE_HOOKS_VALUES.filter(hook => hasLifecycleHook(hook, pipeType)),
      });
      this._pipeCache.set(pipeType, meta);
    }
    return meta;
  }

  getViewDirectivesMetadata(component: Type): cpl.CompileDirectiveMetadata[] {
    var view = this._viewResolver.resolve(component);
    var directives = flattenDirectives(view, this._config.platformDirectives);
    for (var i = 0; i < directives.length; i++) {
      if (!isValidType(directives[i])) {
        throw new BaseException(
            `Unexpected directive value '${stringify(directives[i])}' on the View of component '${stringify(component)}'`);
      }
    }
    return directives.map(type => this.getDirectiveMetadata(type));
  }

  getViewPipesMetadata(component: Type): cpl.CompilePipeMetadata[] {
    var view = this._viewResolver.resolve(component);
    var pipes = flattenPipes(view, this._config.platformPipes);
    for (var i = 0; i < pipes.length; i++) {
      if (!isValidType(pipes[i])) {
        throw new BaseException(
            `Unexpected piped value '${stringify(pipes[i])}' on the View of component '${stringify(component)}'`);
      }
    }
    return pipes.map(type => this.getPipeMetadata(type));
  }

  getDependenciesMetadata(typeOrFunc: Type|Function, dependencies: any[]):
      cpl.CompileDiDependencyMetadata[] {
    let hasUnknownDeps = false;
    let params = isPresent(dependencies) ? dependencies : this._reflector.parameters(typeOrFunc);
    if (isBlank(params)) {
      params = [];
    }
    let dependenciesMetadata: cpl.CompileDiDependencyMetadata[] = params.map((param) => {
      if (isBlank(param)) {
        return null;
      }
      let isAttribute = false;
      let isHost = false;
      let isSelf = false;
      let isSkipSelf = false;
      let isOptional = false;
      let query: QueryMetadata = null;
      let viewQuery: ViewQueryMetadata = null;
      var token: any = null;
      if (isArray(param)) {
        (<any[]>param).forEach((paramEntry) => {
          if (paramEntry instanceof HostMetadata) {
            isHost = true;
          } else if (paramEntry instanceof SelfMetadata) {
            isSelf = true;
          } else if (paramEntry instanceof SkipSelfMetadata) {
            isSkipSelf = true;
          } else if (paramEntry instanceof OptionalMetadata) {
            isOptional = true;
          } else if (paramEntry instanceof AttributeMetadata) {
            isAttribute = true;
            token = paramEntry.attributeName;
          } else if (paramEntry instanceof QueryMetadata) {
            if (paramEntry.isViewQuery) {
              viewQuery = paramEntry;
            } else {
              query = paramEntry;
            }
          } else if (paramEntry instanceof InjectMetadata) {
            token = paramEntry.token;
          } else if (isValidType(paramEntry) && isBlank(token)) {
            token = paramEntry;
          }
        });
      } else {
        token = param;
      }
      if (isBlank(token)) {
        hasUnknownDeps = true;
        return null;
      }
      return new cpl.CompileDiDependencyMetadata({
        isAttribute: isAttribute,
        isHost: isHost,
        isSelf: isSelf,
        isSkipSelf: isSkipSelf,
        isOptional: isOptional,
        query: isPresent(query) ? this.getQueryMetadata(query, null, typeOrFunc) : null,
        viewQuery: isPresent(viewQuery) ? this.getQueryMetadata(viewQuery, null, typeOrFunc) : null,
        token: this.getTokenMetadata(token)
      });

    });

    if (hasUnknownDeps) {
      let depsTokens =
          dependenciesMetadata.map((dep) => { return dep ? stringify(dep.token) : '?'; })
              .join(', ');
      throw new BaseException(
          `Can't resolve all parameters for ${stringify(typeOrFunc)}: (${depsTokens}).`);
    }

    return dependenciesMetadata;
  }

  getTokenMetadata(token: any): cpl.CompileTokenMetadata {
    token = resolveForwardRef(token);
    var compileToken: any /** TODO #9100 */;
    if (isString(token)) {
      compileToken = new cpl.CompileTokenMetadata({value: token});
    } else {
      compileToken = new cpl.CompileTokenMetadata({
        identifier: new cpl.CompileIdentifierMetadata({
          runtime: token,
          name: this.sanitizeTokenName(token),
          moduleUrl: staticTypeModuleUrl(token)
        })
      });
    }
    return compileToken;
  }

  getProvidersMetadata(providers: any[]):
      Array<cpl.CompileProviderMetadata|cpl.CompileTypeMetadata|any[]> {
    return providers.map((provider) => {
      provider = resolveForwardRef(provider);
      if (isArray(provider)) {
        return this.getProvidersMetadata(provider);
      } else if (provider instanceof Provider) {
        return this.getProviderMetadata(provider);
      } else if (isProviderLiteral(provider)) {
        return this.getProviderMetadata(createProvider(provider));
      } else {
        return this.getTypeMetadata(provider, staticTypeModuleUrl(provider));
      }
    });
  }

  getProviderMetadata(provider: Provider): cpl.CompileProviderMetadata {
    var compileDeps: any /** TODO #9100 */;
    if (isPresent(provider.useClass)) {
      compileDeps = this.getDependenciesMetadata(provider.useClass, provider.dependencies);
    } else if (isPresent(provider.useFactory)) {
      compileDeps = this.getDependenciesMetadata(provider.useFactory, provider.dependencies);
    }
    return new cpl.CompileProviderMetadata({
      token: this.getTokenMetadata(provider.token),
      useClass: isPresent(provider.useClass) ?
          this.getTypeMetadata(provider.useClass, staticTypeModuleUrl(provider.useClass)) :
          null,
      useValue: convertToCompileValue(provider.useValue),
      useFactory: isPresent(provider.useFactory) ?
          this.getFactoryMetadata(provider.useFactory, staticTypeModuleUrl(provider.useFactory)) :
          null,
      useExisting: isPresent(provider.useExisting) ? this.getTokenMetadata(provider.useExisting) :
                                                     null,
      deps: compileDeps,
      multi: provider.multi
    });
  }

  getQueriesMetadata(
      queries: {[key: string]: QueryMetadata}, isViewQuery: boolean,
      directiveType: Type): cpl.CompileQueryMetadata[] {
    var compileQueries: any[] /** TODO #9100 */ = [];
    StringMapWrapper.forEach(
        queries, (query: any /** TODO #9100 */, propertyName: any /** TODO #9100 */) => {
          if (query.isViewQuery === isViewQuery) {
            compileQueries.push(this.getQueryMetadata(query, propertyName, directiveType));
          }
        });
    return compileQueries;
  }

  getQueryMetadata(q: QueryMetadata, propertyName: string, typeOrFunc: Type|Function):
      cpl.CompileQueryMetadata {
    var selectors: cpl.CompileTokenMetadata[];
    if (q.isVarBindingQuery) {
      selectors = q.varBindings.map(varName => this.getTokenMetadata(varName));
    } else {
      if (!isPresent(q.selector)) {
        throw new BaseException(
            `Can't construct a query for the property "${propertyName}" of "${stringify(typeOrFunc)}" since the query selector wasn't defined.`);
      }
      selectors = [this.getTokenMetadata(q.selector)];
    }
    return new cpl.CompileQueryMetadata({
      selectors: selectors,
      first: q.first,
      descendants: q.descendants,
      propertyName: propertyName,
      read: isPresent(q.read) ? this.getTokenMetadata(q.read) : null
    });
  }
}

function flattenDirectives(view: ViewMetadata, platformDirectives: any[]): Type[] {
  let directives: Type[] = [];
  if (isPresent(platformDirectives)) {
    flattenArray(platformDirectives, directives);
  }
  if (isPresent(view.directives)) {
    flattenArray(view.directives, directives);
  }
  return directives;
}

function flattenPipes(view: ViewMetadata, platformPipes: any[]): Type[] {
  let pipes: Type[] = [];
  if (isPresent(platformPipes)) {
    flattenArray(platformPipes, pipes);
  }
  if (isPresent(view.pipes)) {
    flattenArray(view.pipes, pipes);
  }
  return pipes;
}

function flattenArray(tree: any[], out: Array<Type|any[]>): void {
  for (var i = 0; i < tree.length; i++) {
    var item = resolveForwardRef(tree[i]);
    if (isArray(item)) {
      flattenArray(item, out);
    } else {
      out.push(item);
    }
  }
}

function isStaticType(value: any): boolean {
  return isStringMap(value) && isPresent(value['name']) && isPresent(value['filePath']);
}

function isValidType(value: any): boolean {
  return isStaticType(value) || (value instanceof Type);
}

function staticTypeModuleUrl(value: any): string {
  return isStaticType(value) ? value['filePath'] : null;
}

function componentModuleUrl(
    reflector: ReflectorReader, type: any, cmpMetadata: ComponentMetadata): string {
  if (isStaticType(type)) {
    return staticTypeModuleUrl(type);
  }

  if (isPresent(cmpMetadata.moduleId)) {
    var moduleId = cmpMetadata.moduleId;
    var scheme = getUrlScheme(moduleId);
    return isPresent(scheme) && scheme.length > 0 ? moduleId :
                                                    `package:${moduleId}${MODULE_SUFFIX}`;
  }

  return reflector.importUri(type);
}

// Only fill CompileIdentifierMetadata.runtime if needed...
function convertToCompileValue(value: any): any {
  return visitValue(value, new _CompileValueConverter(), null);
}

class _CompileValueConverter extends ValueTransformer {
  visitOther(value: any, context: any): any {
    if (isStaticType(value)) {
      return new cpl.CompileIdentifierMetadata(
          {name: value['name'], moduleUrl: staticTypeModuleUrl(value)});
    } else {
      return new cpl.CompileIdentifierMetadata({runtime: value});
    }
  }
}
