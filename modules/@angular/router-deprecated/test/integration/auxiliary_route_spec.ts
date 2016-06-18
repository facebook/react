import {TEST_ROUTER_PROVIDERS, ddescribeRouter, describeRouter, describeWith, describeWithAndWithout, describeWithout, itShouldRoute} from './util';

import {beforeEachProviders, describe,} from '@angular/core/testing/testing_internal';

import {registerSpecs} from './impl/aux_route_spec_impl';

export function main() {
  describe('auxiliary route spec', () => {

    beforeEachProviders(() => TEST_ROUTER_PROVIDERS);

    registerSpecs();

    describeRouter('aux routes', () => {
      itShouldRoute();
      describeWith('a primary route', itShouldRoute);
    });
  });
}
