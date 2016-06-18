import {Injectable, PipeMetadata, resolveForwardRef} from '@angular/core';

import {ReflectorReader, reflector} from '../core_private';
import {BaseException} from '../src/facade/exceptions';
import {Type, isPresent, stringify} from '../src/facade/lang';

function _isPipeMetadata(type: any): boolean {
  return type instanceof PipeMetadata;
}

/**
 * Resolve a `Type` for {@link PipeMetadata}.
 *
 * This interface can be overridden by the application developer to create custom behavior.
 *
 * See {@link Compiler}
 */
@Injectable()
export class PipeResolver {
  constructor(private _reflector: ReflectorReader = reflector) {}

  /**
   * Return {@link PipeMetadata} for a given `Type`.
   */
  resolve(type: Type): PipeMetadata {
    var metas = this._reflector.annotations(resolveForwardRef(type));
    if (isPresent(metas)) {
      var annotation = metas.find(_isPipeMetadata);
      if (isPresent(annotation)) {
        return annotation;
      }
    }
    throw new BaseException(`No Pipe decorator found on ${stringify(type)}`);
  }
}