import {beforeEachProviders, ddescribe, describe} from '@angular/core/testing/testing_internal';

import {registerSpecs} from './impl/sync_route_spec_impl';
import {TEST_ROUTER_PROVIDERS, ddescribeRouter, describeRouter, describeWith, describeWithAndWithout, describeWithout, itShouldRoute} from './util';

export function main() {
  describe('sync route spec', () => {

    beforeEachProviders(() => TEST_ROUTER_PROVIDERS);

    registerSpecs();

    describeRouter('sync routes', () => {
      describeWithout('children', () => { describeWithAndWithout('params', itShouldRoute); });

      describeWith('sync children', () => {
        describeWithout(
            'default routes', () => { describeWithAndWithout('params', itShouldRoute); });
        describeWith('default routes', () => { describeWithout('params', itShouldRoute); });

      });

      describeWith('dynamic components', itShouldRoute);
    });

  });
}
