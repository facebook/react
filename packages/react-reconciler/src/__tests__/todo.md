# useStore Implementation Notes

Each React root maintains a StoreTracker which is a reference-counted registry of all stores used within that root. For each store, a StoreWrapper is created which tracks the committed and transition state(s) for that store within that root.

The wrapper is also responsible for tracking fibers which are subscribed to the store, and scheduling updates to those fibers when the store changes.


## Todo List

- [ ] Do we need to handle rerenders specially in useStore?
- [ ] Handle case where the store itself changes (similar to selector changing).