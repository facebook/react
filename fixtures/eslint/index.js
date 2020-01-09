// This is a testing playground for our lint rules.

// 1. Run yarn && yarn start
// 2. "File > Add Folder to Workspace" this specific folder in VSCode with ESLint extension
// 3. Changes to the rule source should get picked up without restarting ESLint server

function Comment({comment, commentSource}) {
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
    return () => subscription.dispose();
  }, [commentID, commentSource, currentUserID, environment]);
}
