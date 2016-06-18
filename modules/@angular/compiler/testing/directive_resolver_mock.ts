import {ComponentMetadata, DirectiveMetadata, Injectable} from '@angular/core';

import {DirectiveResolver} from '../src/directive_resolver';
import {Map} from '../src/facade/collection';
import {Type, isPresent} from '../src/facade/lang';


/**
 * An implementation of {@link DirectiveResolver} that allows overriding
 * various properties of directives.
 */
@Injectable()
export class MockDirectiveResolver extends DirectiveResolver {
  private _providerOverrides = new Map<Type, any[]>();
  private viewProviderOverrides = new Map<Type, any[]>();

  resolve(type: Type): DirectiveMetadata {
    var dm = super.resolve(type);

    var providerOverrides = this._providerOverrides.get(type);
    var viewProviderOverrides = this.viewProviderOverrides.get(type);

    var providers = dm.providers;
    if (isPresent(providerOverrides)) {
      var originalViewProviders: any[] = isPresent(dm.providers) ? dm.providers : [];
      providers = originalViewProviders.concat(providerOverrides);
    }

    if (dm instanceof ComponentMetadata) {
      var viewProviders = dm.viewProviders;
      if (isPresent(viewProviderOverrides)) {
        var originalViewProviders: any[] = isPresent(dm.viewProviders) ? dm.viewProviders : [];
        viewProviders = originalViewProviders.concat(viewProviderOverrides);
      }

      return new ComponentMetadata({
        selector: dm.selector,
        inputs: dm.inputs,
        outputs: dm.outputs,
        host: dm.host,
        exportAs: dm.exportAs,
        moduleId: dm.moduleId,
        queries: dm.queries,
        changeDetection: dm.changeDetection,
        providers: providers,
        viewProviders: viewProviders
      });
    }

    return new DirectiveMetadata({
      selector: dm.selector,
      inputs: dm.inputs,
      outputs: dm.outputs,
      host: dm.host,
      providers: providers,
      exportAs: dm.exportAs,
      queries: dm.queries
    });
  }

  setProvidersOverride(type: Type, providers: any[]): void {
    this._providerOverrides.set(type, providers);
  }

  setViewProvidersOverride(type: Type, viewProviders: any[]): void {
    this.viewProviderOverrides.set(type, viewProviders);
  }
}
