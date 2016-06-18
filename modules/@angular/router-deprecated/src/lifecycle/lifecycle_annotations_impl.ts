
/* @ts2dart_const */
export class RouteLifecycleHook {
  constructor(public name: string) {}
}

/* @ts2dart_const */
export class CanActivate {
  constructor(public fn: Function) {}
}

export const routerCanReuse: RouteLifecycleHook =
    /*@ts2dart_const*/ new RouteLifecycleHook('routerCanReuse');
export const routerCanDeactivate: RouteLifecycleHook =
    /*@ts2dart_const*/ new RouteLifecycleHook('routerCanDeactivate');
export const routerOnActivate: RouteLifecycleHook =
    /*@ts2dart_const*/ new RouteLifecycleHook('routerOnActivate');
export const routerOnReuse: RouteLifecycleHook =
    /*@ts2dart_const*/ new RouteLifecycleHook('routerOnReuse');
export const routerOnDeactivate: RouteLifecycleHook =
    /*@ts2dart_const*/ new RouteLifecycleHook('routerOnDeactivate');
