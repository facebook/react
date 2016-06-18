import {AppElement, AppView, DebugAppView} from '../../core_private';
import {BaseException} from '../facade/exceptions';
import {isPresent} from '../facade/lang';

import {DynamicInstance, InstanceFactory} from './output_interpreter';

export class InterpretiveAppViewInstanceFactory implements InstanceFactory {
  createInstance(
      superClass: any, clazz: any, args: any[], props: Map<string, any>,
      getters: Map<string, Function>, methods: Map<string, Function>): any {
    if (superClass === AppView) {
      // We are always using DebugAppView as parent.
      // However, in prod mode we generate a constructor call that does
      // not have the argument for the debugNodeInfos.
      args = args.concat([null]);
      return new _InterpretiveAppView(args, props, getters, methods);
    } else if (superClass === DebugAppView) {
      return new _InterpretiveAppView(args, props, getters, methods);
    }
    throw new BaseException(`Can't instantiate class ${superClass} in interpretative mode`);
  }
}

class _InterpretiveAppView extends DebugAppView<any> implements DynamicInstance {
  constructor(
      args: any[], public props: Map<string, any>, public getters: Map<string, Function>,
      public methods: Map<string, Function>) {
    super(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
  }
  createInternal(rootSelector: string|any): AppElement {
    var m = this.methods.get('createInternal');
    if (isPresent(m)) {
      return m(rootSelector);
    } else {
      return super.createInternal(rootSelector);
    }
  }
  injectorGetInternal(token: any, nodeIndex: number, notFoundResult: any): any {
    var m = this.methods.get('injectorGetInternal');
    if (isPresent(m)) {
      return m(token, nodeIndex, notFoundResult);
    } else {
      return super.injectorGet(token, nodeIndex, notFoundResult);
    }
  }
  detachInternal(): void {
    var m = this.methods.get('detachInternal');
    if (isPresent(m)) {
      return m();
    } else {
      return super.detachInternal();
    }
  }
  destroyInternal(): void {
    var m = this.methods.get('destroyInternal');
    if (isPresent(m)) {
      return m();
    } else {
      return super.destroyInternal();
    }
  }
  dirtyParentQueriesInternal(): void {
    var m = this.methods.get('dirtyParentQueriesInternal');
    if (isPresent(m)) {
      return m();
    } else {
      return super.dirtyParentQueriesInternal();
    }
  }
  detectChangesInternal(throwOnChange: boolean): void {
    var m = this.methods.get('detectChangesInternal');
    if (isPresent(m)) {
      return m(throwOnChange);
    } else {
      return super.detectChangesInternal(throwOnChange);
    }
  }
}
