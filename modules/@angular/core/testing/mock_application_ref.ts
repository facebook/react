import {ApplicationRef, ComponentFactory, ComponentRef, Injectable, Injector, NgZone, Type} from '../index';


/**
 * A no-op implementation of {@link ApplicationRef}, useful for testing.
 */
@Injectable()
export class MockApplicationRef extends ApplicationRef {
  registerBootstrapListener(listener: (ref: ComponentRef<any>) => void): void {}

  registerDisposeListener(dispose: () => void): void {}

  bootstrap<C>(componentFactory: ComponentFactory<C>): ComponentRef<C> { return null; }

  get injector(): Injector { return null; };

  get zone(): NgZone { return null; };

  run(callback: Function): any { return null; }

  waitForAsyncInitializers(): Promise<any> { return null; }

  dispose(): void {}

  tick(): void {}

  get componentTypes(): Type[] { return null; };
}
