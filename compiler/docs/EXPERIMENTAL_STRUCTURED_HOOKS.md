# Experimental Structured Hooks

This experiment asks a narrow but radical question:

> Are the Rules of Hooks describing a semantic truth about React, or mostly a consequence of the current cursor-based runtime representation of hook state?

## Hypothesis

Today, hook identity is derived from call order. That makes conditional hooks unsafe, because React walks a linked list of hook cells in render order and expects the same sequence on every render.

The React Compiler already understands control flow well enough to prove much stronger properties than the runtime can observe. That suggests a different experiment: for a tiny structured subset, lower hook identity to explicit static keys instead of positional cursors.

If that works, then some currently forbidden programs stop being fundamentally impossible. They are only incompatible with the current representation.

## First Prototype

The first branch prototype started as a tiny runtime-only model and now has a second layer that hosts the same keyed cells behind one real React hook call.

- keyed state cells
- keyed memo cells
- dormant branch-local cells stay stored while the branch is hidden
- duplicate keys in one render throw
- changing a key from one hook kind to another throws
- a React-hosted variant can rerender through a single top-level hook

This is enough to prove the core claim: branch-local hook state can survive disappear/reappear cycles when identity is stable and explicit. More importantly, it shows a plausible compiler target that still obeys React's runtime contract by collapsing the experiment to one actual hook call.

## Why It Matters

If this line of research holds, a future compiler experiment could target a small opt-in subset such as:

- statically provable `if` branches
- fixed loop bounds known at compile time
- direct hook calls with compiler-assigned stable keys

That would not abolish the Rules of Hooks for ordinary JavaScript. It would show that React can carve out a new space where some of those rules become compilation constraints instead of universal language laws.