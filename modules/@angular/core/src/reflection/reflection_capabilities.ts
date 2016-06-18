import {BaseException} from '../facade/exceptions';
import {ConcreteType, Type, global, isFunction, isPresent, stringify} from '../facade/lang';

import {PlatformReflectionCapabilities} from './platform_reflection_capabilities';
import {GetterFn, MethodFn, SetterFn} from './types';

export class ReflectionCapabilities implements PlatformReflectionCapabilities {
  private _reflect: any;

  constructor(reflect?: any) { this._reflect = isPresent(reflect) ? reflect : global.Reflect; }

  isReflectionEnabled(): boolean { return true; }

  factory(t: ConcreteType): Function {
    switch (t.length) {
      case 0:
        return () => new t();
      case 1:
        return (a1: any) => new t(a1);
      case 2:
        return (a1: any, a2: any) => new t(a1, a2);
      case 3:
        return (a1: any, a2: any, a3: any) => new t(a1, a2, a3);
      case 4:
        return (a1: any, a2: any, a3: any, a4: any) => new t(a1, a2, a3, a4);
      case 5:
        return (a1: any, a2: any, a3: any, a4: any, a5: any) => new t(a1, a2, a3, a4, a5);
      case 6:
        return (a1: any, a2: any, a3: any, a4: any, a5: any, a6: any) =>
                   new t(a1, a2, a3, a4, a5, a6);
      case 7:
        return (a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any) =>
                   new t(a1, a2, a3, a4, a5, a6, a7);
      case 8:
        return (a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any, a8: any) =>
                   new t(a1, a2, a3, a4, a5, a6, a7, a8);
      case 9:
        return (a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any, a8: any, a9: any) =>
                   new t(a1, a2, a3, a4, a5, a6, a7, a8, a9);
      case 10:
        return (a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any, a8: any, a9: any,
                a10: any) => new t(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
      case 11:
        return (a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any, a8: any, a9: any,
                a10: any, a11: any) => new t(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
      case 12:
        return (a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any, a8: any, a9: any,
                a10: any, a11: any, a12: any) =>
                   new t(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
      case 13:
        return (a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any, a8: any, a9: any,
                a10: any, a11: any, a12: any, a13: any) =>
                   new t(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13);
      case 14:
        return (a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any, a8: any, a9: any,
                a10: any, a11: any, a12: any, a13: any, a14: any) =>
                   new t(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14);
      case 15:
        return (a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any, a8: any, a9: any,
                a10: any, a11: any, a12: any, a13: any, a14: any, a15: any) =>
                   new t(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15);
      case 16:
        return (a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any, a8: any, a9: any,
                a10: any, a11: any, a12: any, a13: any, a14: any, a15: any, a16: any) =>
                   new t(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16);
      case 17:
        return (a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any, a8: any, a9: any,
                a10: any, a11: any, a12: any, a13: any, a14: any, a15: any, a16: any, a17: any) =>
                   new t(
                       a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17);
      case 18:
        return (a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any, a8: any, a9: any,
                a10: any, a11: any, a12: any, a13: any, a14: any, a15: any, a16: any, a17: any,
                a18: any) =>
                   new t(
                       a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17,
                       a18);
      case 19:
        return (a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any, a8: any, a9: any,
                a10: any, a11: any, a12: any, a13: any, a14: any, a15: any, a16: any, a17: any,
                a18: any, a19: any) =>
                   new t(
                       a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17,
                       a18, a19);
      case 20:
        return (a1: any, a2: any, a3: any, a4: any, a5: any, a6: any, a7: any, a8: any, a9: any,
                a10: any, a11: any, a12: any, a13: any, a14: any, a15: any, a16: any, a17: any,
                a18: any, a19: any, a20: any) =>
                   new t(
                       a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17,
                       a18, a19, a20);
    };

    throw new Error(
        `Cannot create a factory for '${stringify(t)}' because its constructor has more than 20 arguments`);
  }

  /** @internal */
  _zipTypesAndAnnotations(
      paramTypes: any /** TODO #9100 */, paramAnnotations: any /** TODO #9100 */): any[][] {
    var result: any /** TODO #9100 */;

    if (typeof paramTypes === 'undefined') {
      result = new Array(paramAnnotations.length);
    } else {
      result = new Array(paramTypes.length);
    }

    for (var i = 0; i < result.length; i++) {
      // TS outputs Object for parameters without types, while Traceur omits
      // the annotations. For now we preserve the Traceur behavior to aid
      // migration, but this can be revisited.
      if (typeof paramTypes === 'undefined') {
        result[i] = [];
      } else if (paramTypes[i] != Object) {
        result[i] = [paramTypes[i]];
      } else {
        result[i] = [];
      }
      if (isPresent(paramAnnotations) && isPresent(paramAnnotations[i])) {
        result[i] = result[i].concat(paramAnnotations[i]);
      }
    }
    return result;
  }

  parameters(typeOrFunc: Type): any[][] {
    // Prefer the direct API.
    if (isPresent((<any>typeOrFunc).parameters)) {
      return (<any>typeOrFunc).parameters;
    }

    // API of tsickle for lowering decorators to properties on the class.
    if (isPresent((<any>typeOrFunc).ctorParameters)) {
      let ctorParameters = (<any>typeOrFunc).ctorParameters;
      let paramTypes =
          ctorParameters.map((ctorParam: any /** TODO #9100 */) => ctorParam && ctorParam.type);
      let paramAnnotations = ctorParameters.map(
          (ctorParam: any /** TODO #9100 */) =>
              ctorParam && convertTsickleDecoratorIntoMetadata(ctorParam.decorators));
      return this._zipTypesAndAnnotations(paramTypes, paramAnnotations);
    }

    // API for metadata created by invoking the decorators.
    if (isPresent(this._reflect) && isPresent(this._reflect.getMetadata)) {
      var paramAnnotations = this._reflect.getMetadata('parameters', typeOrFunc);
      var paramTypes = this._reflect.getMetadata('design:paramtypes', typeOrFunc);
      if (isPresent(paramTypes) || isPresent(paramAnnotations)) {
        return this._zipTypesAndAnnotations(paramTypes, paramAnnotations);
      }
    }
    // The array has to be filled with `undefined` because holes would be skipped by `some`
    let parameters = new Array((<any>typeOrFunc.length));
    parameters.fill(undefined);
    return parameters;
  }

  annotations(typeOrFunc: Type): any[] {
    // Prefer the direct API.
    if (isPresent((<any>typeOrFunc).annotations)) {
      var annotations = (<any>typeOrFunc).annotations;
      if (isFunction(annotations) && annotations.annotations) {
        annotations = annotations.annotations;
      }
      return annotations;
    }

    // API of tsickle for lowering decorators to properties on the class.
    if (isPresent((<any>typeOrFunc).decorators)) {
      return convertTsickleDecoratorIntoMetadata((<any>typeOrFunc).decorators);
    }

    // API for metadata created by invoking the decorators.
    if (isPresent(this._reflect) && isPresent(this._reflect.getMetadata)) {
      var annotations = this._reflect.getMetadata('annotations', typeOrFunc);
      if (isPresent(annotations)) return annotations;
    }
    return [];
  }

  propMetadata(typeOrFunc: any): {[key: string]: any[]} {
    // Prefer the direct API.
    if (isPresent((<any>typeOrFunc).propMetadata)) {
      var propMetadata = (<any>typeOrFunc).propMetadata;
      if (isFunction(propMetadata) && propMetadata.propMetadata) {
        propMetadata = propMetadata.propMetadata;
      }
      return propMetadata;
    }

    // API of tsickle for lowering decorators to properties on the class.
    if (isPresent((<any>typeOrFunc).propDecorators)) {
      let propDecorators = (<any>typeOrFunc).propDecorators;
      let propMetadata = <{[key: string]: any[]}>{};
      Object.keys(propDecorators).forEach(prop => {
        propMetadata[prop] = convertTsickleDecoratorIntoMetadata(propDecorators[prop]);
      });
      return propMetadata;
    }

    // API for metadata created by invoking the decorators.
    if (isPresent(this._reflect) && isPresent(this._reflect.getMetadata)) {
      var propMetadata = this._reflect.getMetadata('propMetadata', typeOrFunc);
      if (isPresent(propMetadata)) return propMetadata;
    }
    return {};
  }

  // Note: JavaScript does not support to query for interfaces during runtime.
  // However, we can't throw here as the reflector will always call this method
  // when asked for a lifecycle interface as this is what we check in Dart.
  interfaces(type: Type): any[] { return []; }

  hasLifecycleHook(type: any, lcInterface: Type, lcProperty: string): boolean {
    if (!(type instanceof Type)) return false;

    var proto = (<any>type).prototype;
    return !!proto[lcProperty];
  }

  getter(name: string): GetterFn { return <GetterFn>new Function('o', 'return o.' + name + ';'); }

  setter(name: string): SetterFn {
    return <SetterFn>new Function('o', 'v', 'return o.' + name + ' = v;');
  }

  method(name: string): MethodFn {
    let functionBody = `if (!o.${name}) throw new Error('"${name}" is undefined');
        return o.${name}.apply(o, args);`;
    return <MethodFn>new Function('o', 'args', functionBody);
  }

  // There is not a concept of import uri in Js, but this is useful in developing Dart applications.
  importUri(type: any): string {
    // StaticSymbol
    if (typeof type === 'object' && type['filePath']) {
      return type['filePath'];
    }
    // Runtime type
    return `./${stringify(type)}`;
  }
}

function convertTsickleDecoratorIntoMetadata(decoratorInvocations: any[]): any[] {
  if (!decoratorInvocations) {
    return [];
  }
  return decoratorInvocations.map(decoratorInvocation => {
    var decoratorType = decoratorInvocation.type;
    var annotationCls = decoratorType.annotationCls;
    var annotationArgs = decoratorInvocation.args ? decoratorInvocation.args : [];
    var annotation = Object.create(annotationCls.prototype);
    annotationCls.apply(annotation, annotationArgs);
    return annotation;
  });
}
