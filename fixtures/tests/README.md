# Overview

## Instructions

```bash
# Test scheduler in 0.20.1
yarn stable
yarn test

# Test scheduler on main
yarn main
yarn test

# Test schedler on PR
yarn pr
yarn test

# Test suggest window.MessageChannel fix
yarn suggested
yarn test
```

## Results

### Stable
Fails in Node 15 because MessageChannel hangs.

```bash
 FAIL  __tests__/all.js (48.327 s)
  Node <15
    ✓ node-14 (302 ms)
    ✓ node-14-jsdom (755 ms)
    ✓ node-14-jest-env-node (2577 ms)
    ✓ node-14-jest-env-node-jsdom (2147 ms)
    ✓ node-14-jest-env-jsdom (2520 ms)
  Node 15
    ✕ node-15 (10219 ms)
    ✕ node-15-jsdom (10238 ms)
    ✓ node-15-jest-env-node (3092 ms)
    ✓ node-15-jest-env-node-jsdom (2478 ms)
    ✓ node-15-jest-env-jsdom (2766 ms)
```
### Main
Uses setImmediate in window environments.

Fails because MessageChannel exists in Node 15, but setImmediate does not exist in JSDOM, so MessageChannel is used.
 
```bash
 FAIL  __tests__/all.js (48.327 s)
  Node <15
    ✓ node-14 (302 ms)
    ✓ node-14-jsdom (755 ms)
    ✓ node-14-jest-env-node (2577 ms)
    ✓ node-14-jest-env-node-jsdom (2147 ms)
    ✓ node-14-jest-env-jsdom (2520 ms)
  Node 15
    ✓ node-15 (10219 ms)
    ✕ node-15-jsdom (10238 ms)
    ✓ node-15-jest-env-node (3092 ms)
    ✓ node-15-jest-env-node-jsdom (2478 ms)
    ✓ node-15-jest-env-jsdom (2766 ms)
```
### PR (Suggested for 18)
Uses setImmediate in node environments.

Fails because setImmediate crashes. Fix in 18 is to use async act.

```bash
 FAIL  __tests__/all.js (48.327 s)
  Node <15
    ✓ node-14 (302 ms)
    ✓ node-14-jsdom (755 ms)
    ✕ node-14-jest-env-node (2577 ms)
    ✓ node-14-jest-env-node-jsdom (2147 ms)
    ✕ node-14-jest-env-jsdom (2520 ms)
  Node 15
    ✓ node-15 (10219 ms)
    ✓ node-15-jsdom (10238 ms)
    ✕ node-15-jest-env-node (3092 ms)
    ✓ node-15-jest-env-node-jsdom (2478 ms)
    ✕ node-15-jest-env-jsdom (2766 ms)
```

### Suggested for 17.0.1

Removes setImmediate. Adds window check to MessageChannel.

Remaining failing test fails in stable and I argue should continue to fail.

```bash
 FAIL  __tests__/all.js (48.327 s)
  Node <15
    ✓ node-14 (302 ms)
    ✓ node-14-jsdom (755 ms)
    ✓ node-14-jest-env-node (2577 ms)
    ✓ node-14-jest-env-node-jsdom (2147 ms)
    ✓ node-14-jest-env-jsdom (2520 ms)
  Node 15
    ✕ node-15 (10219 ms)
    ✓ node-15-jsdom (10238 ms)
    ✓ node-15-jest-env-node (3092 ms)
    ✓ node-15-jest-env-node-jsdom (2478 ms)
    ✓ node-15-jest-env-jsdom (2766 ms)
```

## Test cases:

### Node <15
- Node<15
- Node<15 + jsdom
- Node<15 + jest + jest-environment-node
- Node<15 + jest + jest-environment-node + jsdom
- Node<15 + jest + jest-environment-jsdom + jsdom

### Node >= 15
- Node>=15
- Node>=15 + jsdom
- Node>=15 + jest + jest-environment-node
- Node>=15 + jest + jest-environment-node + jsdom
- Node>=15 + jest + jest-environment-jsdom + jsdom
