import {Attribute, ComponentFactory, ComponentRef, Directive, ReflectiveInjector, ResolvedReflectiveProvider, ViewContainerRef} from '@angular/core';

import {DEFAULT_OUTLET_NAME} from '../constants';
import {isBlank, isPresent} from '../facade/lang';
import {RouterOutletMap} from '../router';


/**
 * A router outlet is a placeholder that Angular dynamically fills based on the application's route.
 *
 * ## Use
 *
 * ```
 * <router-outlet></router-outlet>
 * ```
 *
 * Outlets can be named.
 *
 * ```
 * <router-outlet name="right"></router-outlet>
 * ```
 */
@Directive({selector: 'router-outlet'})
export class RouterOutlet {
  private _activated: ComponentRef<any>;
  public outletMap: RouterOutletMap;

  constructor(
      parentOutletMap: RouterOutletMap, private _location: ViewContainerRef,
      @Attribute('name') name: string) {
    parentOutletMap.registerOutlet(isBlank(name) ? DEFAULT_OUTLET_NAME : name, this);
  }

  deactivate(): void {
    this._activated.destroy();
    this._activated = null;
  }

  /**
   * Returns the loaded component.
   */
  get component(): Object { return isPresent(this._activated) ? this._activated.instance : null; }

  /**
   * Returns true is the outlet is not empty.
   */
  get isActivated(): boolean { return isPresent(this._activated); }

  /**
   * Called by the Router to instantiate a new component.
   */
  activate(
      factory: ComponentFactory<any>, providers: ResolvedReflectiveProvider[],
      outletMap: RouterOutletMap): ComponentRef<any> {
    this.outletMap = outletMap;
    let inj = ReflectiveInjector.fromResolvedProviders(providers, this._location.parentInjector);
    this._activated = this._location.createComponent(factory, this._location.length, inj, []);
    return this._activated;
  }
}
