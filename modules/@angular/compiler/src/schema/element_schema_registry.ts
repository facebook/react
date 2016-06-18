export abstract class ElementSchemaRegistry {
  abstract hasProperty(tagName: string, propName: string): boolean;
  abstract securityContext(tagName: string, propName: string): any;
  abstract getMappedPropName(propName: string): string;
}
