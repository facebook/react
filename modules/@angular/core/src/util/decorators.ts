import {ConcreteType, Type, global, isFunction, stringify} from '../facade/lang';

var _nextClassId = 0;

/**
 * Declares the interface to be used with {@link Class}.
 */
export interface ClassDefinition {
  /**
   * Optional argument for specifying the superclass.
   */
  extends?: Type;

  /**
   * Required constructor function for a class.
   *
   * The function may be optionally wrapped in an `Array`, in which case additional parameter
   * annotations may be specified.
   * The number of arguments and the number of parameter annotations must match.
   *
   * See {@link Class} for example of usage.
   */
  constructor: Function|any[];

  /**
   * Other methods on the class. Note that values should have type 'Function' but TS requires
   * all properties to have a narrower type than the index signature.
   */
  [x: string]: Type|Function|any[];
}

/**
 * An interface implemented by all Angular type decorators, which allows them to be used as ES7
 * decorators as well as
 * Angular DSL syntax.
 *
 * DSL syntax:
 *
 * ```
 * var MyClass = ng
 *   .Component({...})
 *   .View({...})
 *   .Class({...});
 * ```
 *
 * ES7 syntax:
 *
 * ```
 * @ng.Component({...})
 * @ng.View({...})
 * class MyClass {...}
 * ```
 */
export interface TypeDecorator {
  /**
   * Invoke as ES7 decorator.
   */
  <T extends Type>(type: T): T;

  // Make TypeDecorator assignable to built-in ParameterDecorator type.
  // ParameterDecorator is declared in lib.d.ts as a `declare type`
  // so we cannot declare this interface as a subtype.
  // see https://github.com/angular/angular/issues/3379#issuecomment-126169417
  (target: Object, propertyKey?: string|symbol, parameterIndex?: number): void;

  /**
   * Storage for the accumulated annotations so far used by the DSL syntax.
   *
   * Used by {@link Class} to annotate the generated class.
   */
  annotations: any[];

  /**
   * Generate a class from the definition and annotate it with {@link TypeDecorator#annotations}.
   */
  Class(obj: ClassDefinition): ConcreteType;
}

function extractAnnotation(annotation: any): any {
  if (isFunction(annotation) && annotation.hasOwnProperty('annotation')) {
    // it is a decorator, extract annotation
    annotation = annotation.annotation;
  }
  return annotation;
}

function applyParams(fnOrArray: (Function | any[]), key: string): Function {
  if (fnOrArray === Object || fnOrArray === String || fnOrArray === Function ||
      fnOrArray === Number || fnOrArray === Array) {
    throw new Error(`Can not use native ${stringify(fnOrArray)} as constructor`);
  }
  if (isFunction(fnOrArray)) {
    return <Function>fnOrArray;
  } else if (fnOrArray instanceof Array) {
    var annotations: any[] = fnOrArray;
    var fn: Function = fnOrArray[fnOrArray.length - 1];
    if (!isFunction(fn)) {
      throw new Error(
          `Last position of Class method array must be Function in key ${key} was '${stringify(fn)}'`);
    }
    var annoLength = annotations.length - 1;
    if (annoLength != fn.length) {
      throw new Error(
          `Number of annotations (${annoLength}) does not match number of arguments (${fn.length}) in the function: ${stringify(fn)}`);
    }
    var paramsAnnotations: any[][] = [];
    for (var i = 0, ii = annotations.length - 1; i < ii; i++) {
      var paramAnnotations: any[] = [];
      paramsAnnotations.push(paramAnnotations);
      var annotation = annotations[i];
      if (annotation instanceof Array) {
        for (var j = 0; j < annotation.length; j++) {
          paramAnnotations.push(extractAnnotation(annotation[j]));
        }
      } else if (isFunction(annotation)) {
        paramAnnotations.push(extractAnnotation(annotation));
      } else {
        paramAnnotations.push(annotation);
      }
    }
    Reflect.defineMetadata('parameters', paramsAnnotations, fn);
    return fn;
  } else {
    throw new Error(
        `Only Function or Array is supported in Class definition for key '${key}' is '${stringify(fnOrArray)}'`);
  }
}

/**
 * Provides a way for expressing ES6 classes with parameter annotations in ES5.
 *
 * ## Basic Example
 *
 * ```
 * var Greeter = ng.Class({
 *   constructor: function(name) {
 *     this.name = name;
 *   },
 *
 *   greet: function() {
 *     alert('Hello ' + this.name + '!');
 *   }
 * });
 * ```
 *
 * is equivalent to ES6:
 *
 * ```
 * class Greeter {
 *   constructor(name) {
 *     this.name = name;
 *   }
 *
 *   greet() {
 *     alert('Hello ' + this.name + '!');
 *   }
 * }
 * ```
 *
 * or equivalent to ES5:
 *
 * ```
 * var Greeter = function (name) {
 *   this.name = name;
 * }
 *
 * Greeter.prototype.greet = function () {
 *   alert('Hello ' + this.name + '!');
 * }
 * ```
 *
 * ### Example with parameter annotations
 *
 * ```
 * var MyService = ng.Class({
 *   constructor: [String, [new Query(), QueryList], function(name, queryList) {
 *     ...
 *   }]
 * });
 * ```
 *
 * is equivalent to ES6:
 *
 * ```
 * class MyService {
 *   constructor(name: string, @Query() queryList: QueryList) {
 *     ...
 *   }
 * }
 * ```
 *
 * ### Example with inheritance
 *
 * ```
 * var Shape = ng.Class({
 *   constructor: (color) {
 *     this.color = color;
 *   }
 * });
 *
 * var Square = ng.Class({
 *   extends: Shape,
 *   constructor: function(color, size) {
 *     Shape.call(this, color);
 *     this.size = size;
 *   }
 * });
 * ```
 * @stable
 */
export function Class(clsDef: ClassDefinition): ConcreteType {
  var constructor = applyParams(
      clsDef.hasOwnProperty('constructor') ? clsDef.constructor : undefined, 'constructor');
  var proto = constructor.prototype;
  if (clsDef.hasOwnProperty('extends')) {
    if (isFunction(clsDef.extends)) {
      (<Function>constructor).prototype = proto =
          Object.create((<Function>clsDef.extends).prototype);
    } else {
      throw new Error(
          `Class definition 'extends' property must be a constructor function was: ${stringify(clsDef.extends)}`);
    }
  }
  for (var key in clsDef) {
    if (key != 'extends' && key != 'prototype' && clsDef.hasOwnProperty(key)) {
      proto[key] = applyParams(<any>clsDef[key], key);
    }
  }

  if (this && this.annotations instanceof Array) {
    Reflect.defineMetadata('annotations', this.annotations, constructor);
  }

  if (!constructor['name']) {
    (constructor as any /** TODO #9100 */)['overriddenName'] = `class${_nextClassId++}`;
  }

  return <ConcreteType>constructor;
}

var Reflect = global.Reflect;
// Throw statement at top-level is disallowed by closure compiler in ES6 input.
// Wrap in an IIFE as a work-around.
(function checkReflect() {
  if (!(Reflect && Reflect.getMetadata)) {
    throw 'reflect-metadata shim is required when using class decorators';
  }
})();

export function makeDecorator(
    annotationCls: any /* TODO #9100 */,
    chainFn: (fn: Function) => void = null): (...args: any[]) => (cls: any) => any {
  function DecoratorFactory(objOrType: any /** TODO #9100 */): (cls: any) => any {
    var annotationInstance = new (<any>annotationCls)(objOrType);
    if (this instanceof annotationCls) {
      return annotationInstance;
    } else {
      var chainAnnotation =
          isFunction(this) && this.annotations instanceof Array ? this.annotations : [];
      chainAnnotation.push(annotationInstance);
      var TypeDecorator: TypeDecorator =
          <TypeDecorator>function TypeDecorator(cls: any /** TODO #9100 */) {
            var annotations = Reflect.getOwnMetadata('annotations', cls);
            annotations = annotations || [];
            annotations.push(annotationInstance);
            Reflect.defineMetadata('annotations', annotations, cls);
            return cls;
          };
      TypeDecorator.annotations = chainAnnotation;
      TypeDecorator.Class = Class;
      if (chainFn) chainFn(TypeDecorator);
      return TypeDecorator;
    }
  }
  DecoratorFactory.prototype = Object.create(annotationCls.prototype);
  (<any>DecoratorFactory).annotationCls = annotationCls;
  return DecoratorFactory;
}

export function makeParamDecorator(annotationCls: any /** TODO #9100 */): any {
  function ParamDecoratorFactory(...args: any[] /** TODO #9100 */): any {
    var annotationInstance = Object.create(annotationCls.prototype);
    annotationCls.apply(annotationInstance, args);
    if (this instanceof annotationCls) {
      return annotationInstance;
    } else {
      (<any>ParamDecorator).annotation = annotationInstance;
      return ParamDecorator;
    }


    function ParamDecorator(
        cls: any /** TODO #9100 */, unusedKey: any /** TODO #9100 */,
        index: any /** TODO #9100 */): any {
      var parameters: any[][] = Reflect.getMetadata('parameters', cls);
      parameters = parameters || [];

      // there might be gaps if some in between parameters do not have annotations.
      // we pad with nulls.
      while (parameters.length <= index) {
        parameters.push(null);
      }

      parameters[index] = parameters[index] || [];
      var annotationsForParam: any[] = parameters[index];
      annotationsForParam.push(annotationInstance);

      Reflect.defineMetadata('parameters', parameters, cls);
      return cls;
    }
  }
  ParamDecoratorFactory.prototype = Object.create(annotationCls.prototype);
  (<any>ParamDecoratorFactory).annotationCls = annotationCls;
  return ParamDecoratorFactory;
}

export function makePropDecorator(annotationCls: any /** TODO #9100 */): any {
  function PropDecoratorFactory(...args: any[] /** TODO #9100 */): any {
    var decoratorInstance = Object.create(annotationCls.prototype);
    annotationCls.apply(decoratorInstance, args);

    if (this instanceof annotationCls) {
      return decoratorInstance;
    } else {
      return function PropDecorator(target: any, name: string) {
        var meta = Reflect.getOwnMetadata('propMetadata', target.constructor);
        meta = meta || {};
        meta[name] = meta[name] || [];
        meta[name].unshift(decoratorInstance);
        Reflect.defineMetadata('propMetadata', meta, target.constructor);
      };
    }
  }
  PropDecoratorFactory.prototype = Object.create(annotationCls.prototype);
  (<any>PropDecoratorFactory).annotationCls = annotationCls;
  return PropDecoratorFactory;
}
