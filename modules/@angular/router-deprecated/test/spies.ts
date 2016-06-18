import {Location} from '@angular/common';
import {SpyObject, proxy} from '@angular/core/testing/testing_internal';
import {Router, RouterOutlet} from '@angular/router-deprecated';

export class SpyRouter extends SpyObject {
  constructor() { super(Router); }
}

export class SpyRouterOutlet extends SpyObject {
  constructor() { super(RouterOutlet); }
}

export class SpyLocation extends SpyObject {
  constructor() { super(Location); }
}

export class SpyPlatformLocation extends SpyObject {
  pathname: string = null;
  search: string = null;
  hash: string = null;
  constructor() { super(SpyPlatformLocation); }
}
