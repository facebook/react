import {Type, isBlank, isPresent, isArray,} from '../facade/lang';
import {MapWrapper, ListWrapper} from '../facade/collection';
import {reflector} from '../reflection/reflection';
import {ReflectiveKey} from './reflective_key';
import {InjectMetadata, OptionalMetadata, SelfMetadata, HostMetadata, SkipSelfMetadata, DependencyMetadata} from './metadata';
import {NoAnnotationError, MixingMultiProvidersWithRegularProvidersError, InvalidProviderError} from './reflective_exceptions';
import {resolveForwardRef} from './forward_ref';
import {Provider, ProviderBuilder, provide} from './provider';
import {isProviderLiteral, createProvider} from './provider_util';

/**
 * `Dependency` is used by the framework to extend DI.
 * This is internal to Angular and should not be used directly.
 */
export class ReflectiveDependency {
  constructor(
      public key: ReflectiveKey, public optional: boolean, public lowerBoundVisibility: any,
      public upperBoundVisibility: any, public properties: any[]) {}

  static fromKey(key: ReflectiveKey): ReflectiveDependency {
    return new ReflectiveDependency(key, false, null, null, []);
  }
}

const _EMPTY_LIST: any[] /** TODO #9100 */ = /*@ts2dart_const*/[];

/**
 * An internal resolved representation of a {@link Provider} used by the {@link Injector}.
 *
 * It is usually created automatically by `Injector.resolveAndCreate`.
 *
 * It can be created manually, as follows:
 *
 * ### Example ([live demo](http://plnkr.co/edit/RfEnhh8kUEI0G3qsnIeT?p%3Dpreview&p=preview))
 *
 * ```typescript
 * var resolvedProviders = Injector.resolve([new Provider('message', {useValue: 'Hello'})]);
 * var injector = Injector.fromResolvedProviders(resolvedProviders);
 *
 * expect(injector.get('message')).toEqual('Hello');
 * ```
 */
export interface ResolvedReflectiveProvider {
  /**
   * A key, usually a `Type`.
   */
  key: ReflectiveKey;

  /**
   * Factory function which can return an instance of an object represented by a key.
   */
  resolvedFactories: ResolvedReflectiveFactory[];

  /**
   * Indicates if the provider is a multi-provider or a regular provider.
   */
  multiProvider: boolean;
}

/**
 * See {@link ResolvedProvider} instead.
 *
 * @deprecated
 */
export interface ResolvedReflectiveBinding extends ResolvedReflectiveProvider {}

export class ResolvedReflectiveProvider_ implements ResolvedReflectiveBinding {
  constructor(
      public key: ReflectiveKey, public resolvedFactories: ResolvedReflectiveFactory[],
      public multiProvider: boolean) {}

  get resolvedFactory(): ResolvedReflectiveFactory { return this.resolvedFactories[0]; }
}

/**
 * An internal resolved representation of a factory function created by resolving {@link Provider}.
 * @experimental
 */
export class ResolvedReflectiveFactory {
  constructor(
      /**
       * Factory function which can return an instance of an object represented by a key.
       */
      public factory: Function,

      /**
       * Arguments (dependencies) to the `factory` function.
       */
      public dependencies: ReflectiveDependency[]) {}
}


/**
 * Resolve a single provider.
 */
export function resolveReflectiveFactory(provider: Provider): ResolvedReflectiveFactory {
  var factoryFn: Function;
  var resolvedDeps: any /** TODO #9100 */;
  if (isPresent(provider.useClass)) {
    var useClass = resolveForwardRef(provider.useClass);
    factoryFn = reflector.factory(useClass);
    resolvedDeps = _dependenciesFor(useClass);
  } else if (isPresent(provider.useExisting)) {
    factoryFn = (aliasInstance: any /** TODO #9100 */) => aliasInstance;
    resolvedDeps = [ReflectiveDependency.fromKey(ReflectiveKey.get(provider.useExisting))];
  } else if (isPresent(provider.useFactory)) {
    factoryFn = provider.useFactory;
    resolvedDeps = constructDependencies(provider.useFactory, provider.dependencies);
  } else {
    factoryFn = () => provider.useValue;
    resolvedDeps = _EMPTY_LIST;
  }
  return new ResolvedReflectiveFactory(factoryFn, resolvedDeps);
}

/**
 * Converts the {@link Provider} into {@link ResolvedProvider}.
 *
 * {@link Injector} internally only uses {@link ResolvedProvider}, {@link Provider} contains
 * convenience provider syntax.
 */
export function resolveReflectiveProvider(provider: Provider): ResolvedReflectiveProvider {
  return new ResolvedReflectiveProvider_(
      ReflectiveKey.get(provider.token), [resolveReflectiveFactory(provider)], provider.multi);
}

/**
 * Resolve a list of Providers.
 */
export function resolveReflectiveProviders(
    providers: Array<Type|Provider|{[k: string]: any}|any[]>): ResolvedReflectiveProvider[] {
  var normalized = _normalizeProviders(providers, []);
  var resolved = normalized.map(resolveReflectiveProvider);
  return MapWrapper.values(
      mergeResolvedReflectiveProviders(resolved, new Map<number, ResolvedReflectiveProvider>()));
}

/**
 * Merges a list of ResolvedProviders into a list where
 * each key is contained exactly once and multi providers
 * have been merged.
 */
export function mergeResolvedReflectiveProviders(
    providers: ResolvedReflectiveProvider[],
    normalizedProvidersMap: Map<number, ResolvedReflectiveProvider>):
    Map<number, ResolvedReflectiveProvider> {
  for (var i = 0; i < providers.length; i++) {
    var provider = providers[i];
    var existing = normalizedProvidersMap.get(provider.key.id);
    if (isPresent(existing)) {
      if (provider.multiProvider !== existing.multiProvider) {
        throw new MixingMultiProvidersWithRegularProvidersError(existing, provider);
      }
      if (provider.multiProvider) {
        for (var j = 0; j < provider.resolvedFactories.length; j++) {
          existing.resolvedFactories.push(provider.resolvedFactories[j]);
        }
      } else {
        normalizedProvidersMap.set(provider.key.id, provider);
      }
    } else {
      var resolvedProvider: any /** TODO #9100 */;
      if (provider.multiProvider) {
        resolvedProvider = new ResolvedReflectiveProvider_(
            provider.key, ListWrapper.clone(provider.resolvedFactories), provider.multiProvider);
      } else {
        resolvedProvider = provider;
      }
      normalizedProvidersMap.set(provider.key.id, resolvedProvider);
    }
  }
  return normalizedProvidersMap;
}

function _normalizeProviders(
    providers: Array<Type|Provider|{[k: string]: any}|ProviderBuilder|any[]>,
    res: Provider[]): Provider[] {
  providers.forEach(b => {
    if (b instanceof Type) {
      res.push(provide(b, {useClass: b}));

    } else if (b instanceof Provider) {
      res.push(b);

    } else if (isProviderLiteral(b)) {
      res.push(createProvider(b));

    } else if (b instanceof Array) {
      _normalizeProviders(b, res);

    } else if (b instanceof ProviderBuilder) {
      throw new InvalidProviderError(b.token);

    } else {
      throw new InvalidProviderError(b);
    }
  });

  return res;
}

export function constructDependencies(
    typeOrFunc: any, dependencies: any[]): ReflectiveDependency[] {
  if (isBlank(dependencies)) {
    return _dependenciesFor(typeOrFunc);
  } else {
    var params: any[][] = dependencies.map(t => [t]);
    return dependencies.map(t => _extractToken(typeOrFunc, t, params));
  }
}

function _dependenciesFor(typeOrFunc: any): ReflectiveDependency[] {
  var params = reflector.parameters(typeOrFunc);
  if (isBlank(params)) return [];
  if (params.some(isBlank)) {
    throw new NoAnnotationError(typeOrFunc, params);
  }
  return params.map((p: any[]) => _extractToken(typeOrFunc, p, params));
}

function _extractToken(
    typeOrFunc: any /** TODO #9100 */, metadata: any /** TODO #9100 */ /*any[] | any*/,
    params: any[][]): ReflectiveDependency {
  var depProps: any[] /** TODO #9100 */ = [];
  var token: any /** TODO #9100 */ = null;
  var optional = false;

  if (!isArray(metadata)) {
    if (metadata instanceof InjectMetadata) {
      return _createDependency(metadata.token, optional, null, null, depProps);
    } else {
      return _createDependency(metadata, optional, null, null, depProps);
    }
  }

  var lowerBoundVisibility: any /** TODO #9100 */ = null;
  var upperBoundVisibility: any /** TODO #9100 */ = null;

  for (var i = 0; i < metadata.length; ++i) {
    var paramMetadata = metadata[i];

    if (paramMetadata instanceof Type) {
      token = paramMetadata;

    } else if (paramMetadata instanceof InjectMetadata) {
      token = paramMetadata.token;

    } else if (paramMetadata instanceof OptionalMetadata) {
      optional = true;

    } else if (paramMetadata instanceof SelfMetadata) {
      upperBoundVisibility = paramMetadata;

    } else if (paramMetadata instanceof HostMetadata) {
      upperBoundVisibility = paramMetadata;

    } else if (paramMetadata instanceof SkipSelfMetadata) {
      lowerBoundVisibility = paramMetadata;

    } else if (paramMetadata instanceof DependencyMetadata) {
      if (isPresent(paramMetadata.token)) {
        token = paramMetadata.token;
      }
      depProps.push(paramMetadata);
    }
  }

  token = resolveForwardRef(token);

  if (isPresent(token)) {
    return _createDependency(token, optional, lowerBoundVisibility, upperBoundVisibility, depProps);
  } else {
    throw new NoAnnotationError(typeOrFunc, params);
  }
}

function _createDependency(
    token: any /** TODO #9100 */, optional: any /** TODO #9100 */,
    lowerBoundVisibility: any /** TODO #9100 */, upperBoundVisibility: any /** TODO #9100 */,
    depProps: any /** TODO #9100 */): ReflectiveDependency {
  return new ReflectiveDependency(
      ReflectiveKey.get(token), optional, lowerBoundVisibility, upperBoundVisibility, depProps);
}
