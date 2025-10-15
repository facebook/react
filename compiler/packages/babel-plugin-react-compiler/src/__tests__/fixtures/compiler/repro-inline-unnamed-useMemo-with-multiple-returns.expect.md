
## Input

```javascript
import {useMemo} from 'react';
import {identity, useIdentity} from 'shared-runtime';

// Adapted from https://github.com/facebook/react/issues/34750
function useLocalCampaignBySlug(slug: string) {
  const campaigns = useIdentity({a: {slug: 'a', name: 'campaign'}});
  // The useMemo result is never assigned to a local so we did not previously ensure
  // that there was a variable declaration for it when promoting the result temporary
  return useMemo(() => {
    for (const id of Object.keys(campaigns)) {
      const campaign = campaigns[id];
      if (campaign.slug === slug) {
        return identity(campaign);
      }
    }
    return null;
  }, [campaigns, slug]);
}

function Component() {
  const campaign = useLocalCampaignBySlug('a');
  return <div>{campaign.name}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useMemo } from "react";
import { identity, useIdentity } from "shared-runtime";

// Adapted from https://github.com/facebook/react/issues/34750
function useLocalCampaignBySlug(slug) {
  const $ = _c(4);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = { a: { slug: "a", name: "campaign" } };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const campaigns = useIdentity(t0);
  let t1;
  if ($[1] !== campaigns || $[2] !== slug) {
    bb0: {
      for (const id of Object.keys(campaigns)) {
        const campaign = campaigns[id];
        if (campaign.slug === slug) {
          t1 = identity(campaign);
          break bb0;
        }
      }

      t1 = null;
    }
    $[1] = campaigns;
    $[2] = slug;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

function Component() {
  const $ = _c(2);
  const campaign = useLocalCampaignBySlug("a");
  let t0;
  if ($[0] !== campaign.name) {
    t0 = <div>{campaign.name}</div>;
    $[0] = campaign.name;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <div>campaign</div>