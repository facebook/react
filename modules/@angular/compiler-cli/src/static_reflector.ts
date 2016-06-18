import {AttributeMetadata, ComponentMetadata, ContentChildMetadata, ContentChildrenMetadata, DirectiveMetadata, HostBindingMetadata, HostListenerMetadata, HostMetadata, InjectMetadata, InjectableMetadata, InputMetadata, OptionalMetadata, OutputMetadata, PipeMetadata, Provider, QueryMetadata, SelfMetadata, SkipSelfMetadata, ViewChildMetadata, ViewChildrenMetadata, ViewQueryMetadata, animate, group, keyframes, sequence, state, style, transition, trigger} from '@angular/core';

import {ReflectorReader} from './core_private';

const SUPPORTED_SCHEMA_VERSION = 1;

/**
 * The host of the static resolver is expected to be able to provide module metadata in the form of
 * ModuleMetadata. Angular 2 CLI will produce this metadata for a module whenever a .d.ts files is
 * produced and the module has exported variables or classes with decorators. Module metadata can
 * also be produced directly from TypeScript sources by using MetadataCollector in tools/metadata.
 */
export interface StaticReflectorHost {
  /**
   * Return a ModuleMetadata for the given module.
   *
   * @param modulePath is a string identifier for a module as an absolute path.
   * @returns the metadata for the given module.
   */
  getMetadataFor(modulePath: string): {[key: string]: any};

  /**
   * Resolve a symbol from an import statement form, to the file where it is declared.
   * @param module the location imported from
   * @param containingFile for relative imports, the path of the file containing the import
   */
  findDeclaration(modulePath: string, symbolName: string, containingFile?: string): StaticSymbol;

  getStaticSymbol(declarationFile: string, name: string): StaticSymbol;

  angularImportLocations(): {
    coreDecorators: string,
    diDecorators: string,
    diMetadata: string,
    diOpaqueToken: string,
    animationMetadata: string,
    provider: string
  };
}

/**
 * A token representing the a reference to a static type.
 *
 * This token is unique for a filePath and name and can be used as a hash table key.
 */
export class StaticSymbol {
  constructor(public filePath: string, public name: string) {}
}

/**
 * A static reflector implements enough of the Reflector API that is necessary to compile
 * templates statically.
 */
export class StaticReflector implements ReflectorReader {
  private annotationCache = new Map<StaticSymbol, any[]>();
  private propertyCache = new Map<StaticSymbol, {[key: string]: any}>();
  private parameterCache = new Map<StaticSymbol, any[]>();
  private metadataCache = new Map<string, {[key: string]: any}>();
  private conversionMap = new Map<StaticSymbol, (context: StaticSymbol, args: any[]) => any>();
  private opaqueToken: StaticSymbol;

  constructor(private host: StaticReflectorHost) { this.initializeConversionMap(); }

  importUri(typeOrFunc: StaticSymbol): string {
    var staticSymbol = this.host.findDeclaration(typeOrFunc.filePath, typeOrFunc.name, '');
    return staticSymbol ? staticSymbol.filePath : null;
  }

  public annotations(type: StaticSymbol): any[] {
    let annotations = this.annotationCache.get(type);
    if (!annotations) {
      let classMetadata = this.getTypeMetadata(type);
      if (classMetadata['decorators']) {
        annotations = this.simplify(type, classMetadata['decorators']);
      } else {
        annotations = [];
      }
      this.annotationCache.set(type, annotations.filter(ann => !!ann));
    }
    return annotations;
  }

  public propMetadata(type: StaticSymbol): {[key: string]: any} {
    let propMetadata = this.propertyCache.get(type);
    if (!propMetadata) {
      let classMetadata = this.getTypeMetadata(type);
      let members = classMetadata ? classMetadata['members'] : {};
      propMetadata = mapStringMap(members, (propData, propName) => {
        let prop = (<any[]>propData).find(a => a['__symbolic'] == 'property');
        if (prop && prop['decorators']) {
          return this.simplify(type, prop['decorators']);
        } else {
          return [];
        }
      });
      this.propertyCache.set(type, propMetadata);
    }
    return propMetadata;
  }

  public parameters(type: StaticSymbol): any[] {
    if (!(type instanceof StaticSymbol)) {
      throw new Error(`parameters received ${JSON.stringify(type)} which is not a StaticSymbol`);
    }
    try {
      let parameters = this.parameterCache.get(type);
      if (!parameters) {
        let classMetadata = this.getTypeMetadata(type);
        let members = classMetadata ? classMetadata['members'] : null;
        let ctorData = members ? members['__ctor__'] : null;
        if (ctorData) {
          let ctor = (<any[]>ctorData).find(a => a['__symbolic'] == 'constructor');
          let parameterTypes = <any[]>this.simplify(type, ctor['parameters'] || []);
          let parameterDecorators = <any[]>this.simplify(type, ctor['parameterDecorators'] || []);

          parameters = [];
          parameterTypes.forEach((paramType, index) => {
            let nestedResult: any[] = [];
            if (paramType) {
              nestedResult.push(paramType);
            }
            let decorators = parameterDecorators ? parameterDecorators[index] : null;
            if (decorators) {
              nestedResult.push(...decorators);
            }
            parameters.push(nestedResult);
          });
        }
        if (!parameters) {
          parameters = [];
        }
        this.parameterCache.set(type, parameters);
      }
      return parameters;
    } catch (e) {
      console.log(`Failed on type ${JSON.stringify(type)} with error ${e}`);
      throw e;
    }
  }

  hasLifecycleHook(type: any, lcInterface: /*Type*/ any, lcProperty: string): boolean {
    if (!(type instanceof StaticSymbol)) {
      throw new Error(
          `hasLifecycleHook received ${JSON.stringify(type)} which is not a StaticSymbol`);
    }
    let classMetadata = this.getTypeMetadata(type);
    let members = classMetadata ? classMetadata['members'] : null;
    let member: any[] = members ? members[lcProperty] : null;
    return member ? member.some(a => a['__symbolic'] == 'method') : false;
  }

  private registerDecoratorOrConstructor(type: StaticSymbol, ctor: any): void {
    this.conversionMap.set(type, (context: StaticSymbol, args: any[]) => {
      var metadata = Object.create(ctor.prototype);
      ctor.apply(metadata, args);
      return metadata;
    });
  }

  private registerFunction(type: StaticSymbol, fn: any): void {
    this.conversionMap.set(
        type, (context: StaticSymbol, args: any[]) => { return fn.apply(undefined, args); });
  }

  private initializeConversionMap(): void {
    const {coreDecorators, diDecorators, diMetadata, diOpaqueToken, animationMetadata, provider} =
        this.host.angularImportLocations();
    this.opaqueToken = this.host.findDeclaration(diOpaqueToken, 'OpaqueToken');
    this.registerDecoratorOrConstructor(this.host.findDeclaration(provider, 'Provider'), Provider);

    this.registerDecoratorOrConstructor(
        this.host.findDeclaration(diDecorators, 'Host'), HostMetadata);
    this.registerDecoratorOrConstructor(
        this.host.findDeclaration(diDecorators, 'Injectable'), InjectableMetadata);
    this.registerDecoratorOrConstructor(
        this.host.findDeclaration(diDecorators, 'Self'), SelfMetadata);
    this.registerDecoratorOrConstructor(
        this.host.findDeclaration(diDecorators, 'SkipSelf'), SkipSelfMetadata);
    this.registerDecoratorOrConstructor(
        this.host.findDeclaration(diDecorators, 'Inject'), InjectMetadata);
    this.registerDecoratorOrConstructor(
        this.host.findDeclaration(diDecorators, 'Optional'), OptionalMetadata);
    this.registerDecoratorOrConstructor(
        this.host.findDeclaration(coreDecorators, 'Attribute'), AttributeMetadata);
    this.registerDecoratorOrConstructor(
        this.host.findDeclaration(coreDecorators, 'Query'), QueryMetadata);
    this.registerDecoratorOrConstructor(
        this.host.findDeclaration(coreDecorators, 'ViewQuery'), ViewQueryMetadata);
    this.registerDecoratorOrConstructor(
        this.host.findDeclaration(coreDecorators, 'ContentChild'), ContentChildMetadata);
    this.registerDecoratorOrConstructor(
        this.host.findDeclaration(coreDecorators, 'ContentChildren'), ContentChildrenMetadata);
    this.registerDecoratorOrConstructor(
        this.host.findDeclaration(coreDecorators, 'ViewChild'), ViewChildMetadata);
    this.registerDecoratorOrConstructor(
        this.host.findDeclaration(coreDecorators, 'ViewChildren'), ViewChildrenMetadata);
    this.registerDecoratorOrConstructor(
        this.host.findDeclaration(coreDecorators, 'Input'), InputMetadata);
    this.registerDecoratorOrConstructor(
        this.host.findDeclaration(coreDecorators, 'Output'), OutputMetadata);
    this.registerDecoratorOrConstructor(
        this.host.findDeclaration(coreDecorators, 'Pipe'), PipeMetadata);
    this.registerDecoratorOrConstructor(
        this.host.findDeclaration(coreDecorators, 'HostBinding'), HostBindingMetadata);
    this.registerDecoratorOrConstructor(
        this.host.findDeclaration(coreDecorators, 'HostListener'), HostListenerMetadata);
    this.registerDecoratorOrConstructor(
        this.host.findDeclaration(coreDecorators, 'Directive'), DirectiveMetadata);
    this.registerDecoratorOrConstructor(
        this.host.findDeclaration(coreDecorators, 'Component'), ComponentMetadata);

    // Note: Some metadata classes can be used directly with Provider.deps.
    this.registerDecoratorOrConstructor(
        this.host.findDeclaration(diMetadata, 'HostMetadata'), HostMetadata);
    this.registerDecoratorOrConstructor(
        this.host.findDeclaration(diMetadata, 'SelfMetadata'), SelfMetadata);
    this.registerDecoratorOrConstructor(
        this.host.findDeclaration(diMetadata, 'SkipSelfMetadata'), SkipSelfMetadata);
    this.registerDecoratorOrConstructor(
        this.host.findDeclaration(diMetadata, 'OptionalMetadata'), OptionalMetadata);

    this.registerFunction(this.host.findDeclaration(animationMetadata, 'trigger'), trigger);
    this.registerFunction(this.host.findDeclaration(animationMetadata, 'state'), state);
    this.registerFunction(this.host.findDeclaration(animationMetadata, 'transition'), transition);
    this.registerFunction(this.host.findDeclaration(animationMetadata, 'style'), style);
    this.registerFunction(this.host.findDeclaration(animationMetadata, 'animate'), animate);
    this.registerFunction(this.host.findDeclaration(animationMetadata, 'keyframes'), keyframes);
    this.registerFunction(this.host.findDeclaration(animationMetadata, 'sequence'), sequence);
    this.registerFunction(this.host.findDeclaration(animationMetadata, 'group'), group);
  }

  /** @internal */
  public simplify(context: StaticSymbol, value: any): any {
    let _this = this;
    let scope = BindingScope.empty;
    let calling = new Map<StaticSymbol, boolean>();

    function simplifyInContext(context: StaticSymbol, value: any, depth: number): any {
      function resolveReference(expression: any): StaticSymbol {
        let staticSymbol: StaticSymbol;
        if (expression['module']) {
          staticSymbol = _this.host.findDeclaration(
              expression['module'], expression['name'], context.filePath);
        } else {
          staticSymbol = _this.host.getStaticSymbol(context.filePath, expression['name']);
        }
        return staticSymbol;
      }

      function isOpaqueToken(value: any): boolean {
        if (value && value.__symbolic === 'new' && value.expression) {
          let target = value.expression;
          if (target.__symbolic == 'reference') {
            return sameSymbol(resolveReference(target), _this.opaqueToken);
          }
        }
        return false;
      }

      function simplifyCall(expression: any) {
        let context: {[name: string]: string}|undefined = undefined;
        if (expression['__symbolic'] == 'call') {
          let target = expression['expression'];
          if (target && target.__symbolic === 'reference') {
            context = {name: target.name};
          }
          let targetFunction = simplify(target);
          if (targetFunction['__symbolic'] == 'function') {
            if (calling.get(targetFunction)) {
              throw new Error('Recursion not supported');
            }
            calling.set(targetFunction, true);
            let value = targetFunction['value'];
            if (value) {
              // Determine the arguments
              let args = (expression['arguments'] || []).map((arg: any) => simplify(arg));
              let parameters: string[] = targetFunction['parameters'];
              let functionScope = BindingScope.build();
              for (let i = 0; i < parameters.length; i++) {
                functionScope.define(parameters[i], args[i]);
              }
              let oldScope = scope;
              let result: any;
              try {
                scope = functionScope.done();
                result = simplify(value);
              } finally {
                scope = oldScope;
              }
              return result;
            }
            calling.delete(targetFunction);
          }
        }

        if (depth === 0) {
          // If depth is 0 we are evaluating the top level expression that is describing element
          // decorator. In this case, it is a decorator we don't understand, such as a custom
          // non-angular decorator, and we should just ignore it.
          return {__symbolic: 'ignore'};
        }
        return simplify({__symbolic: 'error', message: 'Function call not supported', context});
      }

      function simplify(expression: any): any {
        if (isPrimitive(expression)) {
          return expression;
        }
        if (expression instanceof Array) {
          let result: any[] = [];
          for (let item of (<any>expression)) {
            // Check for a spread expression
            if (item && item.__symbolic === 'spread') {
              let spreadArray = simplify(item.expression);
              if (Array.isArray(spreadArray)) {
                for (let spreadItem of spreadArray) {
                  result.push(spreadItem);
                }
                continue;
              }
            }
            let value = simplify(item);
            if (shouldIgnore(value)) {
              continue;
            }
            result.push(value);
          }
          return result;
        }
        if (expression) {
          if (expression['__symbolic']) {
            let staticSymbol: StaticSymbol;
            switch (expression['__symbolic']) {
              case 'binop':
                let left = simplify(expression['left']);
                if (shouldIgnore(left)) return left;
                let right = simplify(expression['right']);
                if (shouldIgnore(right)) return right;
                switch (expression['operator']) {
                  case '&&':
                    return left && right;
                  case '||':
                    return left || right;
                  case '|':
                    return left | right;
                  case '^':
                    return left ^ right;
                  case '&':
                    return left & right;
                  case '==':
                    return left == right;
                  case '!=':
                    return left != right;
                  case '===':
                    return left === right;
                  case '!==':
                    return left !== right;
                  case '<':
                    return left < right;
                  case '>':
                    return left > right;
                  case '<=':
                    return left <= right;
                  case '>=':
                    return left >= right;
                  case '<<':
                    return left << right;
                  case '>>':
                    return left >> right;
                  case '+':
                    return left + right;
                  case '-':
                    return left - right;
                  case '*':
                    return left * right;
                  case '/':
                    return left / right;
                  case '%':
                    return left % right;
                }
                return null;
              case 'pre':
                let operand = simplify(expression['operand']);
                if (shouldIgnore(operand)) return operand;
                switch (expression['operator']) {
                  case '+':
                    return operand;
                  case '-':
                    return -operand;
                  case '!':
                    return !operand;
                  case '~':
                    return ~operand;
                }
                return null;
              case 'index':
                let indexTarget = simplify(expression['expression']);
                let index = simplify(expression['index']);
                if (indexTarget && isPrimitive(index)) return indexTarget[index];
                return null;
              case 'select':
                let selectTarget = simplify(expression['expression']);
                let member = simplify(expression['member']);
                if (selectTarget && isPrimitive(member)) return selectTarget[member];
                return null;
              case 'reference':
                if (!expression.module) {
                  let name: string = expression['name'];
                  let localValue = scope.resolve(name);
                  if (localValue != BindingScope.missing) {
                    return localValue;
                  }
                }
                staticSymbol = resolveReference(expression);
                let result: any = staticSymbol;
                let moduleMetadata = _this.getModuleMetadata(staticSymbol.filePath);
                let declarationValue =
                    moduleMetadata ? moduleMetadata['metadata'][staticSymbol.name] : null;
                if (declarationValue) {
                  if (isOpaqueToken(declarationValue)) {
                    // If the referenced symbol is initalized by a new OpaqueToken we can keep the
                    // reference to the symbol.
                    return staticSymbol;
                  }
                  result = simplifyInContext(staticSymbol, declarationValue, depth + 1);
                }
                return result;
              case 'class':
                return context;
              case 'function':
                return expression;
              case 'new':
              case 'call':
                // Determine if the function is a built-in conversion
                let target = expression['expression'];
                if (target['module']) {
                  staticSymbol = _this.host.findDeclaration(
                      target['module'], target['name'], context.filePath);
                } else {
                  staticSymbol = _this.host.getStaticSymbol(context.filePath, target['name']);
                }
                let converter = _this.conversionMap.get(staticSymbol);
                if (converter) {
                  let args: any[] = expression['arguments'];
                  if (!args) {
                    args = [];
                  }
                  return converter(
                      context, args.map(arg => simplifyInContext(context, arg, depth + 1)));
                }

                // Determine if the function is one we can simplify.
                return simplifyCall(expression);

              case 'error':
                let message = produceErrorMessage(expression);
                if (expression['line']) {
                  message =
                      `${message} (position ${expression['line']}:${expression['character']} in the original .ts file)`;
                }
                throw new Error(message);
            }
            return null;
          }
          return mapStringMap(expression, (value, name) => simplify(value));
        }
        return null;
      }

      try {
        return simplify(value);
      } catch (e) {
        throw new Error(`${e.message}, resolving symbol ${context.name} in ${context.filePath}`);
      }
    }

    let result = simplifyInContext(context, value, 0);
    if (shouldIgnore(result)) {
      return undefined;
    }
    return result;
  }

  /**
   * @param module an absolute path to a module file.
   */
  public getModuleMetadata(module: string): {[key: string]: any} {
    let moduleMetadata = this.metadataCache.get(module);
    if (!moduleMetadata) {
      moduleMetadata = this.host.getMetadataFor(module);
      if (Array.isArray(moduleMetadata)) {
        moduleMetadata = (<Array<any>>moduleMetadata)
                             .find(element => element.version === SUPPORTED_SCHEMA_VERSION) ||
            moduleMetadata[0];
      }
      if (!moduleMetadata) {
        moduleMetadata =
            {__symbolic: 'module', version: SUPPORTED_SCHEMA_VERSION, module: module, metadata: {}};
      }
      if (moduleMetadata['version'] != SUPPORTED_SCHEMA_VERSION) {
        throw new Error(
            `Metadata version mismatch for module ${module}, found version ${moduleMetadata['version']}, expected ${SUPPORTED_SCHEMA_VERSION}`);
      }
      this.metadataCache.set(module, moduleMetadata);
    }
    return moduleMetadata;
  }

  private getTypeMetadata(type: StaticSymbol): {[key: string]: any} {
    let moduleMetadata = this.getModuleMetadata(type.filePath);
    let result = moduleMetadata['metadata'][type.name];
    if (!result) {
      result = {__symbolic: 'class'};
    }
    return result;
  }
}

function expandedMessage(error: any): string {
  switch (error.message) {
    case 'Reference to non-exported class':
      if (error.context && error.context.className) {
        return `Reference to a non-exported class ${error.context.className}`;
      }
      break;
    case 'Variable not initialized':
      return 'Only initialized variables and constants can be referenced';
    case 'Destructuring not supported':
      return 'Referencing an exported destructured variable or constant is not supported';
    case 'Could not resolve type':
      if (error.context && error.context.typeName) {
        return `Could not resolve type ${error.context.typeName}`;
      }
      break;
    case 'Function call not supported':
      let prefix =
          error.context && error.context.name ? `Calling function '${error.context.name}', f` : 'F';
      return prefix +
          'unction calls are not supported. Consider replacing the function or lambda with a reference to an exported function';
  }
  return error.message;
}

function produceErrorMessage(error: any): string {
  return `Error encountered resolving symbol values statically. ${expandedMessage(error)}`;
}

function mapStringMap(input: {[key: string]: any}, transform: (value: any, key: string) => any):
    {[key: string]: any} {
  if (!input) return {};
  var result: {[key: string]: any} = {};
  Object.keys(input).forEach((key) => {
    let value = transform(input[key], key);
    if (!shouldIgnore(value)) {
      result[key] = value;
    }
  });
  return result;
}

function isPrimitive(o: any): boolean {
  return o === null || (typeof o !== 'function' && typeof o !== 'object');
}

interface BindingScopeBuilder {
  define(name: string, value: any): BindingScopeBuilder;
  done(): BindingScope;
}

abstract class BindingScope {
  abstract resolve(name: string): any;
  public static missing = {};
  public static empty: BindingScope = {resolve: name => BindingScope.missing};

  public static build(): BindingScopeBuilder {
    let current = new Map<string, any>();
    let parent: BindingScope = undefined;
    return {
      define: function(name, value) {
        current.set(name, value);
        return this;
      },
      done: function() {
        return current.size > 0 ? new PopulatedScope(current) : BindingScope.empty;
      }
    };
  }
}

class PopulatedScope extends BindingScope {
  constructor(private bindings: Map<string, any>) { super(); }

  resolve(name: string): any {
    return this.bindings.has(name) ? this.bindings.get(name) : BindingScope.missing;
  }
}

function sameSymbol(a: StaticSymbol, b: StaticSymbol): boolean {
  return a === b || (a.name == b.name && a.filePath == b.filePath);
}

function shouldIgnore(value: any): boolean {
  return value && value.__symbolic == 'ignore';
}