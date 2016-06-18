/**
 * This class should not be used directly by an application developer. Instead, use
 * {@link Location}.
 *
 * `PlatformLocation` encapsulates all calls to DOM apis, which allows the Router to be platform
 * agnostic.
 * This means that we can have different implementation of `PlatformLocation` for the different
 * platforms
 * that angular supports. For example, the default `PlatformLocation` is {@link
 * BrowserPlatformLocation},
 * however when you run your app in a WebWorker you use {@link WebWorkerPlatformLocation}.
 *
 * The `PlatformLocation` class is used directly by all implementations of {@link LocationStrategy}
 * when
 * they need to interact with the DOM apis like pushState, popState, etc...
 *
 * {@link LocationStrategy} in turn is used by the {@link Location} service which is used directly
 * by
 * the {@link Router} in order to navigate between routes. Since all interactions between {@link
 * Router} /
 * {@link Location} / {@link LocationStrategy} and DOM apis flow through the `PlatformLocation`
 * class
 * they are all platform independent.
 *
 * @stable
 */
export abstract class PlatformLocation {
  abstract getBaseHrefFromDOM(): string;
  abstract onPopState(fn: UrlChangeListener): void;
  abstract onHashChange(fn: UrlChangeListener): void;

  /* abstract */ get pathname(): string { return null; }
  /* abstract */ get search(): string { return null; }
  /* abstract */ get hash(): string { return null; }

  abstract replaceState(state: any, title: string, url: string): void;

  abstract pushState(state: any, title: string, url: string): void;

  abstract forward(): void;

  abstract back(): void;
}

/**
 * A serializable version of the event from onPopState or onHashChange
 *
 * @stable
 */
export interface UrlChangeEvent { type: string; }

export interface UrlChangeListener { (e: UrlChangeEvent): any; }
