import {ChangeDetectionStrategy, ViewEncapsulation} from '@angular/core';

import {CHANGE_DETECTION_STRATEGY_VALUES, LIFECYCLE_HOOKS_VALUES, LifecycleHooks, VIEW_ENCAPSULATION_VALUES, reflector} from '../core_private';
import {ListWrapper, StringMapWrapper} from '../src/facade/collection';
import {BaseException, unimplemented} from '../src/facade/exceptions';
import {NumberWrapper, RegExpWrapper, Type, isArray, isBlank, isBoolean, isNumber, isPresent, isString, normalizeBlank, normalizeBool, serializeEnum} from '../src/facade/lang';

import {CssSelector} from './selector';
import {getUrlScheme} from './url_resolver';
import {sanitizeIdentifier, splitAtColon} from './util';


// group 2: "event" from "(event)"
var HOST_REG_EXP = /^(?:(?:\[([^\]]+)\])|(?:\(([^\)]+)\)))$/g;

export abstract class CompileMetadataWithIdentifier {
  abstract toJson(): {[key: string]: any};

  get identifier(): CompileIdentifierMetadata { return <CompileIdentifierMetadata>unimplemented(); }
}

export abstract class CompileMetadataWithType extends CompileMetadataWithIdentifier {
  abstract toJson(): {[key: string]: any};

  get type(): CompileTypeMetadata { return <CompileTypeMetadata>unimplemented(); }

  get identifier(): CompileIdentifierMetadata { return <CompileIdentifierMetadata>unimplemented(); }
}

export function metadataFromJson(data: {[key: string]: any}): any {
  return (_COMPILE_METADATA_FROM_JSON as any /** TODO #9100 */)[data['class']](data);
}

export class CompileAnimationEntryMetadata {
  static fromJson(data: {[key: string]: any}): CompileAnimationEntryMetadata {
    var value = data['value'];
    var defs = _arrayFromJson(value['definitions'], metadataFromJson);
    return new CompileAnimationEntryMetadata(value['name'], defs);
  }

  constructor(
      public name: string = null, public definitions: CompileAnimationStateMetadata[] = null) {}

  toJson(): {[key: string]: any} {
    return {
      'class': 'AnimationEntryMetadata',
      'value': {'name': this.name, 'definitions': _arrayToJson(this.definitions)}
    };
  }
}

export abstract class CompileAnimationStateMetadata {}

export class CompileAnimationStateDeclarationMetadata extends CompileAnimationStateMetadata {
  static fromJson(data: {[key: string]: any}): CompileAnimationStateDeclarationMetadata {
    var value = data['value'];
    var styles = _objFromJson(value['styles'], metadataFromJson);
    return new CompileAnimationStateDeclarationMetadata(value['stateNameExpr'], styles);
  }

  constructor(public stateNameExpr: string, public styles: CompileAnimationStyleMetadata) {
    super();
  }

  toJson(): {[key: string]: any} {
    return {
      'class': 'AnimationStateDeclarationMetadata',
      'value': {'stateNameExpr': this.stateNameExpr, 'styles': this.styles.toJson()}
    };
  }
}

export class CompileAnimationStateTransitionMetadata extends CompileAnimationStateMetadata {
  static fromJson(data: {[key: string]: any}): CompileAnimationStateTransitionMetadata {
    var value = data['value'];
    var steps = _objFromJson(value['steps'], metadataFromJson);
    return new CompileAnimationStateTransitionMetadata(value['stateChangeExpr'], steps);
  }

  constructor(public stateChangeExpr: string, public steps: CompileAnimationMetadata) { super(); }

  toJson(): {[key: string]: any} {
    return {
      'class': 'AnimationStateTransitionMetadata',
      'value': {'stateChangeExpr': this.stateChangeExpr, 'steps': this.steps.toJson()}
    };
  }
}

export abstract class CompileAnimationMetadata { abstract toJson(): {[key: string]: any}; }

export class CompileAnimationKeyframesSequenceMetadata extends CompileAnimationMetadata {
  static fromJson(data: {[key: string]: any}): CompileAnimationKeyframesSequenceMetadata {
    var steps = _arrayFromJson(data['value'], metadataFromJson);
    return new CompileAnimationKeyframesSequenceMetadata(<CompileAnimationStyleMetadata[]>steps);
  }

  constructor(public steps: CompileAnimationStyleMetadata[] = []) { super(); }

  toJson(): {[key: string]: any} {
    return {'class': 'AnimationKeyframesSequenceMetadata', 'value': _arrayToJson(this.steps)};
  }
}

export class CompileAnimationStyleMetadata extends CompileAnimationMetadata {
  static fromJson(data: {[key: string]: any}): CompileAnimationStyleMetadata {
    var value = data['value'];
    var offsetVal = value['offset'];
    var offset = isPresent(offsetVal) ? NumberWrapper.parseFloat(offsetVal) : null;
    var styles = <Array<string|{[key: string]: string | number}>>value['styles'];
    return new CompileAnimationStyleMetadata(offset, styles);
  }

  constructor(
      public offset: number, public styles: Array<string|{[key: string]: string | number}> = null) {
    super();
  }

  toJson(): {[key: string]: any} {
    return {
      'class': 'AnimationStyleMetadata',
      'value': {'offset': this.offset, 'styles': this.styles}
    };
  }
}

export class CompileAnimationAnimateMetadata extends CompileAnimationMetadata {
  static fromJson(data: {[key: string]: any}): CompileAnimationAnimateMetadata {
    var value = data['value'];
    var timings = <string|number>value['timings'];
    var styles = _objFromJson(value['styles'], metadataFromJson);
    return new CompileAnimationAnimateMetadata(timings, styles);
  }

  constructor(
      public timings: string|number = 0, public styles: CompileAnimationStyleMetadata|
      CompileAnimationKeyframesSequenceMetadata = null) {
    super();
  }

  toJson(): {[key: string]: any} {
    return {
      'class': 'AnimationAnimateMetadata',
      'value': {'timings': this.timings, 'styles': _objToJson(this.styles)}
    };
  }
}

export abstract class CompileAnimationWithStepsMetadata extends CompileAnimationMetadata {
  constructor(public steps: CompileAnimationMetadata[] = null) { super(); }
}

export class CompileAnimationSequenceMetadata extends CompileAnimationWithStepsMetadata {
  static fromJson(data: {[key: string]: any}): CompileAnimationSequenceMetadata {
    var steps = _arrayFromJson(data['value'], metadataFromJson);
    return new CompileAnimationSequenceMetadata(steps);
  }

  constructor(steps: CompileAnimationMetadata[] = null) { super(steps); }

  toJson(): {[key: string]: any} {
    return {'class': 'AnimationSequenceMetadata', 'value': _arrayToJson(this.steps)};
  }
}

export class CompileAnimationGroupMetadata extends CompileAnimationWithStepsMetadata {
  static fromJson(data: {[key: string]: any}): CompileAnimationGroupMetadata {
    var steps = _arrayFromJson(data['value'], metadataFromJson);
    return new CompileAnimationGroupMetadata(steps);
  }

  constructor(steps: CompileAnimationMetadata[] = null) { super(steps); }

  toJson(): {[key: string]: any} {
    return {'class': 'AnimationGroupMetadata', 'value': _arrayToJson(this.steps)};
  }
}

export class CompileIdentifierMetadata implements CompileMetadataWithIdentifier {
  runtime: any;
  name: string;
  prefix: string;
  moduleUrl: string;
  value: any;

  constructor(
      {runtime, name, moduleUrl, prefix, value}:
          {runtime?: any, name?: string, moduleUrl?: string, prefix?: string, value?: any} = {}) {
    this.runtime = runtime;
    this.name = name;
    this.prefix = prefix;
    this.moduleUrl = moduleUrl;
    this.value = value;
  }

  static fromJson(data: {[key: string]: any}): CompileIdentifierMetadata {
    let value = isArray(data['value']) ? _arrayFromJson(data['value'], metadataFromJson) :
                                         _objFromJson(data['value'], metadataFromJson);
    return new CompileIdentifierMetadata(
        {name: data['name'], prefix: data['prefix'], moduleUrl: data['moduleUrl'], value: value});
  }

  toJson(): {[key: string]: any} {
    let value = isArray(this.value) ? _arrayToJson(this.value) : _objToJson(this.value);
    return {
      // Note: Runtime type can't be serialized...
      'class': 'Identifier',
      'name': this.name,
      'moduleUrl': this.moduleUrl,
      'prefix': this.prefix,
      'value': value
    };
  }

  get identifier(): CompileIdentifierMetadata { return this; }
}

export class CompileDiDependencyMetadata {
  isAttribute: boolean;
  isSelf: boolean;
  isHost: boolean;
  isSkipSelf: boolean;
  isOptional: boolean;
  isValue: boolean;
  query: CompileQueryMetadata;
  viewQuery: CompileQueryMetadata;
  token: CompileTokenMetadata;
  value: any;

  constructor(
      {isAttribute, isSelf, isHost, isSkipSelf, isOptional, isValue, query, viewQuery, token,
       value}: {
        isAttribute?: boolean,
        isSelf?: boolean,
        isHost?: boolean,
        isSkipSelf?: boolean,
        isOptional?: boolean,
        isValue?: boolean,
        query?: CompileQueryMetadata,
        viewQuery?: CompileQueryMetadata,
        token?: CompileTokenMetadata,
        value?: any
      } = {}) {
    this.isAttribute = normalizeBool(isAttribute);
    this.isSelf = normalizeBool(isSelf);
    this.isHost = normalizeBool(isHost);
    this.isSkipSelf = normalizeBool(isSkipSelf);
    this.isOptional = normalizeBool(isOptional);
    this.isValue = normalizeBool(isValue);
    this.query = query;
    this.viewQuery = viewQuery;
    this.token = token;
    this.value = value;
  }

  static fromJson(data: {[key: string]: any}): CompileDiDependencyMetadata {
    return new CompileDiDependencyMetadata({
      token: _objFromJson(data['token'], CompileTokenMetadata.fromJson),
      query: _objFromJson(data['query'], CompileQueryMetadata.fromJson),
      viewQuery: _objFromJson(data['viewQuery'], CompileQueryMetadata.fromJson),
      value: data['value'],
      isAttribute: data['isAttribute'],
      isSelf: data['isSelf'],
      isHost: data['isHost'],
      isSkipSelf: data['isSkipSelf'],
      isOptional: data['isOptional'],
      isValue: data['isValue']
    });
  }

  toJson(): {[key: string]: any} {
    return {
      'token': _objToJson(this.token),
      'query': _objToJson(this.query),
      'viewQuery': _objToJson(this.viewQuery),
      'value': this.value,
      'isAttribute': this.isAttribute,
      'isSelf': this.isSelf,
      'isHost': this.isHost,
      'isSkipSelf': this.isSkipSelf,
      'isOptional': this.isOptional,
      'isValue': this.isValue
    };
  }
}

export class CompileProviderMetadata {
  token: CompileTokenMetadata;
  useClass: CompileTypeMetadata;
  useValue: any;
  useExisting: CompileTokenMetadata;
  useFactory: CompileFactoryMetadata;
  deps: CompileDiDependencyMetadata[];
  multi: boolean;

  constructor({token, useClass, useValue, useExisting, useFactory, deps, multi}: {
    token?: CompileTokenMetadata,
    useClass?: CompileTypeMetadata,
    useValue?: any,
    useExisting?: CompileTokenMetadata,
    useFactory?: CompileFactoryMetadata,
    deps?: CompileDiDependencyMetadata[],
    multi?: boolean
  }) {
    this.token = token;
    this.useClass = useClass;
    this.useValue = useValue;
    this.useExisting = useExisting;
    this.useFactory = useFactory;
    this.deps = normalizeBlank(deps);
    this.multi = normalizeBool(multi);
  }

  static fromJson(data: {[key: string]: any}): CompileProviderMetadata {
    return new CompileProviderMetadata({
      token: _objFromJson(data['token'], CompileTokenMetadata.fromJson),
      useClass: _objFromJson(data['useClass'], CompileTypeMetadata.fromJson),
      useExisting: _objFromJson(data['useExisting'], CompileTokenMetadata.fromJson),
      useValue: _objFromJson(data['useValue'], CompileIdentifierMetadata.fromJson),
      useFactory: _objFromJson(data['useFactory'], CompileFactoryMetadata.fromJson),
      multi: data['multi'],
      deps: _arrayFromJson(data['deps'], CompileDiDependencyMetadata.fromJson)
    });
  }

  toJson(): {[key: string]: any} {
    return {
      // Note: Runtime type can't be serialized...
      'class': 'Provider',
      'token': _objToJson(this.token),
      'useClass': _objToJson(this.useClass),
      'useExisting': _objToJson(this.useExisting),
      'useValue': _objToJson(this.useValue),
      'useFactory': _objToJson(this.useFactory),
      'multi': this.multi,
      'deps': _arrayToJson(this.deps)
    };
  }
}

export class CompileFactoryMetadata implements CompileIdentifierMetadata,
    CompileMetadataWithIdentifier {
  runtime: Function;
  name: string;
  prefix: string;
  moduleUrl: string;
  value: any;
  diDeps: CompileDiDependencyMetadata[];

  constructor({runtime, name, moduleUrl, prefix, diDeps, value}: {
    runtime?: Function,
    name?: string,
    prefix?: string,
    moduleUrl?: string,
    value?: boolean,
    diDeps?: CompileDiDependencyMetadata[]
  }) {
    this.runtime = runtime;
    this.name = name;
    this.prefix = prefix;
    this.moduleUrl = moduleUrl;
    this.diDeps = _normalizeArray(diDeps);
    this.value = value;
  }

  get identifier(): CompileIdentifierMetadata { return this; }

  static fromJson(data: {[key: string]: any}): CompileFactoryMetadata {
    return new CompileFactoryMetadata({
      name: data['name'],
      prefix: data['prefix'],
      moduleUrl: data['moduleUrl'],
      value: data['value'],
      diDeps: _arrayFromJson(data['diDeps'], CompileDiDependencyMetadata.fromJson)
    });
  }

  toJson(): {[key: string]: any} {
    return {
      'class': 'Factory',
      'name': this.name,
      'prefix': this.prefix,
      'moduleUrl': this.moduleUrl,
      'value': this.value,
      'diDeps': _arrayToJson(this.diDeps)
    };
  }
}

var UNDEFINED = new Object();

export class CompileTokenMetadata implements CompileMetadataWithIdentifier {
  value: any;
  identifier: CompileIdentifierMetadata;
  identifierIsInstance: boolean;
  private _assetCacheKey = UNDEFINED;

  constructor(
      {value, identifier, identifierIsInstance}:
          {value?: any, identifier?: CompileIdentifierMetadata, identifierIsInstance?: boolean}) {
    this.value = value;
    this.identifier = identifier;
    this.identifierIsInstance = normalizeBool(identifierIsInstance);
  }

  static fromJson(data: {[key: string]: any}): CompileTokenMetadata {
    return new CompileTokenMetadata({
      value: data['value'],
      identifier: _objFromJson(data['identifier'], CompileIdentifierMetadata.fromJson),
      identifierIsInstance: data['identifierIsInstance']
    });
  }

  toJson(): {[key: string]: any} {
    return {
      'value': this.value,
      'identifier': _objToJson(this.identifier),
      'identifierIsInstance': this.identifierIsInstance
    };
  }

  get runtimeCacheKey(): any {
    if (isPresent(this.identifier)) {
      return this.identifier.runtime;
    } else {
      return this.value;
    }
  }

  get assetCacheKey(): any {
    if (this._assetCacheKey === UNDEFINED) {
      if (isPresent(this.identifier)) {
        if (isPresent(this.identifier.moduleUrl) &&
            isPresent(getUrlScheme(this.identifier.moduleUrl))) {
          var uri = reflector.importUri(
              {'filePath': this.identifier.moduleUrl, 'name': this.identifier.name});
          this._assetCacheKey = `${this.identifier.name}|${uri}|${this.identifierIsInstance}`;
        } else {
          this._assetCacheKey = null;
        }
      } else {
        this._assetCacheKey = this.value;
      }
    }
    return this._assetCacheKey;
  }

  equalsTo(token2: CompileTokenMetadata): boolean {
    var rk = this.runtimeCacheKey;
    var ak = this.assetCacheKey;
    return (isPresent(rk) && rk == token2.runtimeCacheKey) ||
        (isPresent(ak) && ak == token2.assetCacheKey);
  }

  get name(): string {
    return isPresent(this.value) ? sanitizeIdentifier(this.value) : this.identifier.name;
  }
}

export class CompileTokenMap<VALUE> {
  private _valueMap = new Map<any, VALUE>();
  private _values: VALUE[] = [];

  add(token: CompileTokenMetadata, value: VALUE) {
    var existing = this.get(token);
    if (isPresent(existing)) {
      throw new BaseException(`Can only add to a TokenMap! Token: ${token.name}`);
    }
    this._values.push(value);
    var rk = token.runtimeCacheKey;
    if (isPresent(rk)) {
      this._valueMap.set(rk, value);
    }
    var ak = token.assetCacheKey;
    if (isPresent(ak)) {
      this._valueMap.set(ak, value);
    }
  }
  get(token: CompileTokenMetadata): VALUE {
    var rk = token.runtimeCacheKey;
    var ak = token.assetCacheKey;
    var result: any /** TODO #9100 */;
    if (isPresent(rk)) {
      result = this._valueMap.get(rk);
    }
    if (isBlank(result) && isPresent(ak)) {
      result = this._valueMap.get(ak);
    }
    return result;
  }
  values(): VALUE[] { return this._values; }
  get size(): number { return this._values.length; }
}

/**
 * Metadata regarding compilation of a type.
 */
export class CompileTypeMetadata implements CompileIdentifierMetadata, CompileMetadataWithType {
  runtime: Type;
  name: string;
  prefix: string;
  moduleUrl: string;
  isHost: boolean;
  value: any;
  diDeps: CompileDiDependencyMetadata[];

  constructor({runtime, name, moduleUrl, prefix, isHost, value, diDeps}: {
    runtime?: Type,
    name?: string,
    moduleUrl?: string,
    prefix?: string,
    isHost?: boolean,
    value?: any,
    diDeps?: CompileDiDependencyMetadata[]
  } = {}) {
    this.runtime = runtime;
    this.name = name;
    this.moduleUrl = moduleUrl;
    this.prefix = prefix;
    this.isHost = normalizeBool(isHost);
    this.value = value;
    this.diDeps = _normalizeArray(diDeps);
  }

  static fromJson(data: {[key: string]: any}): CompileTypeMetadata {
    return new CompileTypeMetadata({
      name: data['name'],
      moduleUrl: data['moduleUrl'],
      prefix: data['prefix'],
      isHost: data['isHost'],
      value: data['value'],
      diDeps: _arrayFromJson(data['diDeps'], CompileDiDependencyMetadata.fromJson)
    });
  }

  get identifier(): CompileIdentifierMetadata { return this; }
  get type(): CompileTypeMetadata { return this; }

  toJson(): {[key: string]: any} {
    return {
      // Note: Runtime type can't be serialized...
      'class': 'Type',
      'name': this.name,
      'moduleUrl': this.moduleUrl,
      'prefix': this.prefix,
      'isHost': this.isHost,
      'value': this.value,
      'diDeps': _arrayToJson(this.diDeps)
    };
  }
}

export class CompileQueryMetadata {
  selectors: Array<CompileTokenMetadata>;
  descendants: boolean;
  first: boolean;
  propertyName: string;
  read: CompileTokenMetadata;

  constructor({selectors, descendants, first, propertyName, read}: {
    selectors?: Array<CompileTokenMetadata>,
    descendants?: boolean,
    first?: boolean,
    propertyName?: string,
    read?: CompileTokenMetadata
  } = {}) {
    this.selectors = selectors;
    this.descendants = normalizeBool(descendants);
    this.first = normalizeBool(first);
    this.propertyName = propertyName;
    this.read = read;
  }

  static fromJson(data: {[key: string]: any}): CompileQueryMetadata {
    return new CompileQueryMetadata({
      selectors: _arrayFromJson(data['selectors'], CompileTokenMetadata.fromJson),
      descendants: data['descendants'],
      first: data['first'],
      propertyName: data['propertyName'],
      read: _objFromJson(data['read'], CompileTokenMetadata.fromJson)
    });
  }

  toJson(): {[key: string]: any} {
    return {
      'selectors': _arrayToJson(this.selectors),
      'descendants': this.descendants,
      'first': this.first,
      'propertyName': this.propertyName,
      'read': _objToJson(this.read)
    };
  }
}

/**
 * Metadata regarding compilation of a template.
 */
export class CompileTemplateMetadata {
  encapsulation: ViewEncapsulation;
  template: string;
  templateUrl: string;
  styles: string[];
  styleUrls: string[];
  animations: CompileAnimationEntryMetadata[];
  ngContentSelectors: string[];
  constructor(
      {encapsulation, template, templateUrl, styles, styleUrls, animations, ngContentSelectors}: {
        encapsulation?: ViewEncapsulation,
        template?: string,
        templateUrl?: string,
        styles?: string[],
        styleUrls?: string[],
        ngContentSelectors?: string[],
        animations?: CompileAnimationEntryMetadata[]
      } = {}) {
    this.encapsulation = encapsulation;
    this.template = template;
    this.templateUrl = templateUrl;
    this.styles = isPresent(styles) ? styles : [];
    this.styleUrls = isPresent(styleUrls) ? styleUrls : [];
    this.animations = isPresent(animations) ? ListWrapper.flatten(animations) : [];
    this.ngContentSelectors = isPresent(ngContentSelectors) ? ngContentSelectors : [];
  }

  static fromJson(data: {[key: string]: any}): CompileTemplateMetadata {
    var animations =
        <CompileAnimationEntryMetadata[]>_arrayFromJson(data['animations'], metadataFromJson);
    return new CompileTemplateMetadata({
      encapsulation: isPresent(data['encapsulation']) ?
          VIEW_ENCAPSULATION_VALUES[data['encapsulation']] :
          data['encapsulation'],
      template: data['template'],
      templateUrl: data['templateUrl'],
      styles: data['styles'],
      styleUrls: data['styleUrls'],
      animations: animations,
      ngContentSelectors: data['ngContentSelectors']
    });
  }

  toJson(): {[key: string]: any} {
    return {
      'encapsulation': isPresent(this.encapsulation) ? serializeEnum(this.encapsulation) :
                                                       this.encapsulation,
      'template': this.template,
      'templateUrl': this.templateUrl,
      'styles': this.styles,
      'styleUrls': this.styleUrls,
      'animations': _objToJson(this.animations),
      'ngContentSelectors': this.ngContentSelectors
    };
  }
}

/**
 * Metadata regarding compilation of a directive.
 */
export class CompileDirectiveMetadata implements CompileMetadataWithType {
  static create(
      {type, isComponent, selector, exportAs, changeDetection, inputs, outputs, host,
       lifecycleHooks, providers, viewProviders, queries, viewQueries, template}: {
        type?: CompileTypeMetadata,
        isComponent?: boolean,
        selector?: string,
        exportAs?: string,
        changeDetection?: ChangeDetectionStrategy,
        inputs?: string[],
        outputs?: string[],
        host?: {[key: string]: string},
        lifecycleHooks?: LifecycleHooks[],
        providers?:
            Array<CompileProviderMetadata|CompileTypeMetadata|CompileIdentifierMetadata|any[]>,
        viewProviders?:
            Array<CompileProviderMetadata|CompileTypeMetadata|CompileIdentifierMetadata|any[]>,
        queries?: CompileQueryMetadata[],
        viewQueries?: CompileQueryMetadata[],
        template?: CompileTemplateMetadata
      } = {}): CompileDirectiveMetadata {
    var hostListeners: {[key: string]: string} = {};
    var hostProperties: {[key: string]: string} = {};
    var hostAttributes: {[key: string]: string} = {};
    if (isPresent(host)) {
      StringMapWrapper.forEach(host, (value: string, key: string) => {
        var matches = RegExpWrapper.firstMatch(HOST_REG_EXP, key);
        if (isBlank(matches)) {
          hostAttributes[key] = value;
        } else if (isPresent(matches[1])) {
          hostProperties[matches[1]] = value;
        } else if (isPresent(matches[2])) {
          hostListeners[matches[2]] = value;
        }
      });
    }
    var inputsMap: {[key: string]: string} = {};
    if (isPresent(inputs)) {
      inputs.forEach((bindConfig: string) => {
        // canonical syntax: `dirProp: elProp`
        // if there is no `:`, use dirProp = elProp
        var parts = splitAtColon(bindConfig, [bindConfig, bindConfig]);
        inputsMap[parts[0]] = parts[1];
      });
    }
    var outputsMap: {[key: string]: string} = {};
    if (isPresent(outputs)) {
      outputs.forEach((bindConfig: string) => {
        // canonical syntax: `dirProp: elProp`
        // if there is no `:`, use dirProp = elProp
        var parts = splitAtColon(bindConfig, [bindConfig, bindConfig]);
        outputsMap[parts[0]] = parts[1];
      });
    }

    return new CompileDirectiveMetadata({
      type: type,
      isComponent: normalizeBool(isComponent),
      selector: selector,
      exportAs: exportAs,
      changeDetection: changeDetection,
      inputs: inputsMap,
      outputs: outputsMap,
      hostListeners: hostListeners,
      hostProperties: hostProperties,
      hostAttributes: hostAttributes,
      lifecycleHooks: isPresent(lifecycleHooks) ? lifecycleHooks : [],
      providers: providers,
      viewProviders: viewProviders,
      queries: queries,
      viewQueries: viewQueries,
      template: template
    });
  }
  type: CompileTypeMetadata;
  isComponent: boolean;
  selector: string;
  exportAs: string;
  changeDetection: ChangeDetectionStrategy;
  inputs: {[key: string]: string};
  outputs: {[key: string]: string};
  hostListeners: {[key: string]: string};
  hostProperties: {[key: string]: string};
  hostAttributes: {[key: string]: string};
  lifecycleHooks: LifecycleHooks[];
  providers: CompileProviderMetadata[];
  viewProviders: CompileProviderMetadata[];
  queries: CompileQueryMetadata[];
  viewQueries: CompileQueryMetadata[];

  template: CompileTemplateMetadata;
  constructor(
      {type, isComponent, selector, exportAs, changeDetection, inputs, outputs, hostListeners,
       hostProperties, hostAttributes, lifecycleHooks, providers, viewProviders, queries,
       viewQueries, template}: {
        type?: CompileTypeMetadata,
        isComponent?: boolean,
        selector?: string,
        exportAs?: string,
        changeDetection?: ChangeDetectionStrategy,
        inputs?: {[key: string]: string},
        outputs?: {[key: string]: string},
        hostListeners?: {[key: string]: string},
        hostProperties?: {[key: string]: string},
        hostAttributes?: {[key: string]: string},
        lifecycleHooks?: LifecycleHooks[],
        providers?:
            Array<CompileProviderMetadata|CompileTypeMetadata|CompileIdentifierMetadata|any[]>,
        viewProviders?:
            Array<CompileProviderMetadata|CompileTypeMetadata|CompileIdentifierMetadata|any[]>,
        queries?: CompileQueryMetadata[],
        viewQueries?: CompileQueryMetadata[],
        template?: CompileTemplateMetadata
      } = {}) {
    this.type = type;
    this.isComponent = isComponent;
    this.selector = selector;
    this.exportAs = exportAs;
    this.changeDetection = changeDetection;
    this.inputs = inputs;
    this.outputs = outputs;
    this.hostListeners = hostListeners;
    this.hostProperties = hostProperties;
    this.hostAttributes = hostAttributes;
    this.lifecycleHooks = _normalizeArray(lifecycleHooks);
    this.providers = _normalizeArray(providers);
    this.viewProviders = _normalizeArray(viewProviders);
    this.queries = _normalizeArray(queries);
    this.viewQueries = _normalizeArray(viewQueries);
    this.template = template;
  }

  get identifier(): CompileIdentifierMetadata { return this.type; }

  static fromJson(data: {[key: string]: any}): CompileDirectiveMetadata {
    return new CompileDirectiveMetadata({
      isComponent: data['isComponent'],
      selector: data['selector'],
      exportAs: data['exportAs'],
      type: isPresent(data['type']) ? CompileTypeMetadata.fromJson(data['type']) : data['type'],
      changeDetection: isPresent(data['changeDetection']) ?
          CHANGE_DETECTION_STRATEGY_VALUES[data['changeDetection']] :
          data['changeDetection'],
      inputs: data['inputs'],
      outputs: data['outputs'],
      hostListeners: data['hostListeners'],
      hostProperties: data['hostProperties'],
      hostAttributes: data['hostAttributes'],
      lifecycleHooks:
          (<any[]>data['lifecycleHooks']).map(hookValue => LIFECYCLE_HOOKS_VALUES[hookValue]),
      template: isPresent(data['template']) ? CompileTemplateMetadata.fromJson(data['template']) :
                                              data['template'],
      providers: _arrayFromJson(data['providers'], metadataFromJson),
      viewProviders: _arrayFromJson(data['viewProviders'], metadataFromJson),
      queries: _arrayFromJson(data['queries'], CompileQueryMetadata.fromJson),
      viewQueries: _arrayFromJson(data['viewQueries'], CompileQueryMetadata.fromJson)
    });
  }

  toJson(): {[key: string]: any} {
    return {
      'class': 'Directive',
      'isComponent': this.isComponent,
      'selector': this.selector,
      'exportAs': this.exportAs,
      'type': isPresent(this.type) ? this.type.toJson() : this.type,
      'changeDetection': isPresent(this.changeDetection) ? serializeEnum(this.changeDetection) :
                                                           this.changeDetection,
      'inputs': this.inputs,
      'outputs': this.outputs,
      'hostListeners': this.hostListeners,
      'hostProperties': this.hostProperties,
      'hostAttributes': this.hostAttributes,
      'lifecycleHooks': this.lifecycleHooks.map(hook => serializeEnum(hook)),
      'template': isPresent(this.template) ? this.template.toJson() : this.template,
      'providers': _arrayToJson(this.providers),
      'viewProviders': _arrayToJson(this.viewProviders),
      'queries': _arrayToJson(this.queries),
      'viewQueries': _arrayToJson(this.viewQueries)
    };
  }
}

/**
 * Construct {@link CompileDirectiveMetadata} from {@link ComponentTypeMetadata} and a selector.
 */
export function createHostComponentMeta(
    componentType: CompileTypeMetadata, componentSelector: string): CompileDirectiveMetadata {
  var template = CssSelector.parse(componentSelector)[0].getMatchingElementTemplate();
  return CompileDirectiveMetadata.create({
    type: new CompileTypeMetadata({
      runtime: Object,
      name: `${componentType.name}_Host`,
      moduleUrl: componentType.moduleUrl,
      isHost: true
    }),
    template: new CompileTemplateMetadata({
      template: template,
      templateUrl: '',
      styles: [],
      styleUrls: [],
      ngContentSelectors: [],
      animations: []
    }),
    changeDetection: ChangeDetectionStrategy.Default,
    inputs: [],
    outputs: [],
    host: {},
    lifecycleHooks: [],
    isComponent: true,
    selector: '*',
    providers: [],
    viewProviders: [],
    queries: [],
    viewQueries: []
  });
}


export class CompilePipeMetadata implements CompileMetadataWithType {
  type: CompileTypeMetadata;
  name: string;
  pure: boolean;
  lifecycleHooks: LifecycleHooks[];

  constructor({type, name, pure, lifecycleHooks}: {
    type?: CompileTypeMetadata,
    name?: string,
    pure?: boolean,
    lifecycleHooks?: LifecycleHooks[]
  } = {}) {
    this.type = type;
    this.name = name;
    this.pure = normalizeBool(pure);
    this.lifecycleHooks = _normalizeArray(lifecycleHooks);
  }
  get identifier(): CompileIdentifierMetadata { return this.type; }

  static fromJson(data: {[key: string]: any}): CompilePipeMetadata {
    return new CompilePipeMetadata({
      type: isPresent(data['type']) ? CompileTypeMetadata.fromJson(data['type']) : data['type'],
      name: data['name'],
      pure: data['pure']
    });
  }

  toJson(): {[key: string]: any} {
    return {
      'class': 'Pipe',
      'type': isPresent(this.type) ? this.type.toJson() : null,
      'name': this.name,
      'pure': this.pure
    };
  }
}

var _COMPILE_METADATA_FROM_JSON = {
  'Directive': CompileDirectiveMetadata.fromJson,
  'Pipe': CompilePipeMetadata.fromJson,
  'Type': CompileTypeMetadata.fromJson,
  'Provider': CompileProviderMetadata.fromJson,
  'Identifier': CompileIdentifierMetadata.fromJson,
  'Factory': CompileFactoryMetadata.fromJson,
  'AnimationEntryMetadata': CompileAnimationEntryMetadata.fromJson,
  'AnimationStateDeclarationMetadata': CompileAnimationStateDeclarationMetadata.fromJson,
  'AnimationStateTransitionMetadata': CompileAnimationStateTransitionMetadata.fromJson,
  'AnimationSequenceMetadata': CompileAnimationSequenceMetadata.fromJson,
  'AnimationGroupMetadata': CompileAnimationGroupMetadata.fromJson,
  'AnimationAnimateMetadata': CompileAnimationAnimateMetadata.fromJson,
  'AnimationStyleMetadata': CompileAnimationStyleMetadata.fromJson,
  'AnimationKeyframesSequenceMetadata': CompileAnimationKeyframesSequenceMetadata.fromJson
};

function _arrayFromJson(obj: any[], fn: (a: {[key: string]: any}) => any): any {
  return isBlank(obj) ? null : obj.map(o => _objFromJson(o, fn));
}

function _arrayToJson(obj: any[]): string|{[key: string]: any} {
  return isBlank(obj) ? null : obj.map(_objToJson);
}

function _objFromJson(obj: any, fn: (a: {[key: string]: any}) => any): any {
  if (isArray(obj)) return _arrayFromJson(obj, fn);
  if (isString(obj) || isBlank(obj) || isBoolean(obj) || isNumber(obj)) return obj;
  return fn(obj);
}

function _objToJson(obj: any): string|{[key: string]: any} {
  if (isArray(obj)) return _arrayToJson(obj);
  if (isString(obj) || isBlank(obj) || isBoolean(obj) || isNumber(obj)) return obj;
  return obj.toJson();
}

function _normalizeArray(obj: any[]): any[] {
  return isPresent(obj) ? obj : [];
}
