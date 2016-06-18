import {SecurityContext} from '../core_private';
import {ElementSchemaRegistry} from '../index';
import {isPresent} from '../src/facade/lang';

export class MockSchemaRegistry implements ElementSchemaRegistry {
  constructor(
      public existingProperties: {[key: string]: boolean},
      public attrPropMapping: {[key: string]: string}) {}

  hasProperty(tagName: string, property: string): boolean {
    var result = this.existingProperties[property];
    return isPresent(result) ? result : true;
  }

  securityContext(tagName: string, property: string): SecurityContext {
    return SecurityContext.NONE;
  }

  getMappedPropName(attrName: string): string {
    var result = this.attrPropMapping[attrName];
    return isPresent(result) ? result : attrName;
  }
}
