baseQueue contains a mixture of updates at different priorities
`hook.queue` is stable. We could create that on mount, and use that to stash eager states.
`hook.memoizedState` is updated during update to be the newly computed state, and
is compared with the previous state to determine if an update should be reported.

## Plan

1. Create an object with both a sync update and transition update.
2. Use that as the hook queue
3. Close over that object in the subscription
4. On update, eagerly compute the new state and write it to the correct queue property.
5. During the render phase, check the current lane, if it's a transition, read from the transition eager state, otherwise read from the sync eager state.
6. Check if this is different than the previous memoized state, and if so, mark a pending update and update the memoized state.
7. Return the memoized state.

## Next

1. Enqueue updates tagged by lane
2. Method to compute state for lane
3. On commit, update base state and filter out processed updates
4. Root subscribes to store and schedules updates

- [ ] Look at dispatch to see how an update is assigned a lane. Can we do the same for store updates?
- [ ] We should include an update if isSubsetOfLanes(renderLanes, update.lane)
  - [ ] Small caveat relating to offscreen (see isHiddenUpdate in updateReducerImpl)