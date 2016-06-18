import {Injectable, ViewMetadata, ComponentMetadata,} from '@angular/core';

import {ReflectorReader, reflector} from '../core_private';

import {Type, stringify, isBlank, isPresent} from '../src/facade/lang';
import {BaseException} from '../src/facade/exceptions';
import {Map} from '../src/facade/collection';

/**
 * Resolves types to {@link ViewMetadata}.
 */
@Injectable()
export class ViewResolver {
  /** @internal */
  _cache = new Map<Type, ViewMetadata>();

  constructor(private _reflector: ReflectorReader = reflector) {}

  resolve(component: Type): ViewMetadata {
    var view = this._cache.get(component);

    if (isBlank(view)) {
      view = this._resolve(component);
      this._cache.set(component, view);
    }

    return view;
  }

  /** @internal */
  _resolve(component: Type): ViewMetadata {
    var compMeta: ComponentMetadata;

    this._reflector.annotations(component).forEach(m => {
      if (m instanceof ComponentMetadata) {
        compMeta = m;
      }
    });

    if (isPresent(compMeta)) {
      if (isBlank(compMeta.template) && isBlank(compMeta.templateUrl)) {
        throw new BaseException(
            `Component '${stringify(component)}' must have either 'template' or 'templateUrl' set.`);

      } else {
        return new ViewMetadata({
          templateUrl: compMeta.templateUrl,
          template: compMeta.template,
          directives: compMeta.directives,
          pipes: compMeta.pipes,
          encapsulation: compMeta.encapsulation,
          styles: compMeta.styles,
          styleUrls: compMeta.styleUrls,
          animations: compMeta.animations
        });
      }
    } else {
      throw new BaseException(
          `Could not compile '${stringify(component)}' because it is not a component.`);
    }
  }
}
