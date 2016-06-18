import {bootstrap} from '@angular/platform-browser-dynamic';
import {JSONP_PROVIDERS} from '@angular/http';
import {JsonpCmp} from './app/jsonp_comp';

export function main() {
  bootstrap(JsonpCmp, [JSONP_PROVIDERS]);
}
