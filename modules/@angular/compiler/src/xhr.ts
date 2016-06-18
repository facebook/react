// TODO: vsavkin rename it into TemplateLoader
/**
 * An interface for retrieving documents by URL that the compiler uses
 * to load templates.
 */
export class XHR {
  get(url: string): Promise<string> { return null; }
}
