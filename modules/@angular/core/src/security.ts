/**
 * A SecurityContext marks a location that has dangerous security implications, e.g. a DOM property
 * like `innerHTML` that could cause Cross Site Scripting (XSS) security bugs when improperly
 * handled.
 *
 * See DomSanitizationService for more details on security in Angular applications.
 */
export enum SecurityContext {
  NONE,
  HTML,
  STYLE,
  SCRIPT,
  URL,
  RESOURCE_URL,
}

/**
 * SanitizationService is used by the views to sanitize potentially dangerous values. This is a
 * private API, use code should only refer to DomSanitizationService.
 */
export abstract class SanitizationService {
  abstract sanitize(context: SecurityContext, value: string): string;
}
