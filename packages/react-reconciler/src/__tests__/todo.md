baseQueue contains a mixture of updates at different priorities
`hook.queue` is stable. We could create that on mount, and use that to stash eager states.