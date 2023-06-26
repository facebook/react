import React, { useEffect } from 'react';
import { RelayEnvironment, StoreSubscription, SubscriptionCounter } from './yourRelayImplementation'; // hypothetical imports
import nullthrows from 'nullthrows'; // hypothetical imports

function Comment({ comment, commentSource }) {
  const currentUserID = comment.viewer.id;
  const environment = RelayEnvironment.forUser(currentUserID);
  const commentID = nullthrows(comment.id);
  
  useEffect(() => {
    const subscription = SubscriptionCounter.subscribeOnce(
      `StoreSubscription_${commentID}`,
      () =>
        StoreSubscription.subscribe(
          environment,
          {
            comment_id: commentID,
          },
          currentUserID,
          commentSource
        )
    );
    
    // This is the cleanup function, which runs when the component unmounts
    return () => subscription.dispose();
  }, [commentID, commentSource, currentUserID, environment]);

  // Render something here, or return null
  return null;
}

export default Comment;
