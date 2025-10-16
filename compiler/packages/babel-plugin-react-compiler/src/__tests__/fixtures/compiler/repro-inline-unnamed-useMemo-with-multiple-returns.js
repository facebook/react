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
