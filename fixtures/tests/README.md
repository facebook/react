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
Scheduler in stable
    Node 14
      ✓ node-14-node-node (515 ms)
      ✓ node-14-node-jsdom (953 ms)
      ✓ node-14-jest-env-node (3035 ms)
      ✓ node-14-jest-env-jsdom (2942 ms)
      ✓ node-14-jest-env-node-jsdom (2306 ms)
    Node 15
      ✕ node-15-node-node (5213 ms)
      ✕ node-15-node-jsdom (5216 ms)
      ✓ node-15-jest-env-node (2775 ms)
      ✓ node-15-jest-env-jsdom (3199 ms)
      ✓ node-15-jest-env-node-jsdom (2893 ms)
```
### Main
Uses setImmediate in window environments.

Fails because MessageChannel exists in Node 15, but setImmediate does not exist in JSDOM, so MessageChannel is used.
 
```bash
Scheduler on main
    Node 14
      ✓ node-14-node-node (473 ms)
      ✓ node-14-node-jsdom (976 ms)
      ✓ node-14-jest-env-node (2749 ms)
      ✓ node-14-jest-env-jsdom (2858 ms)
      ✓ node-14-jest-env-node-jsdom (2421 ms)
    Node 15
      ✓ node-15-node-node (438 ms)
      ✕ node-15-node-jsdom (5223 ms)
      ✓ node-15-jest-env-node (3501 ms)
      ✓ node-15-jest-env-jsdom (3837 ms)
      ✓ node-15-jest-env-node-jsdom (3387 ms)
```
### PR (Suggested for 18)
Uses setImmediate in node environments.

Fails because setImmediate crashes. Fix in 18 is to use async act.

```bash
Scheduler in PR (recommended for React 18)
    Node 14
      ✓ node-14-node-node (511 ms)
      ✓ node-14-node-jsdom (1138 ms)
      ✓ node-14-jest-env-node (3239 ms)
      ✕ node-14-jest-env-jsdom (2927 ms)
      ✓ node-14-jest-env-node-jsdom (2319 ms)
    Node 15
      ✓ node-15-node-node (429 ms)
      ✓ node-15-node-jsdom (907 ms)
      ✓ node-15-jest-env-node (3160 ms)
      ✕ node-15-jest-env-jsdom (3247 ms)
      ✓ node-15-jest-env-node-jsdom (2309 ms)
```

### Suggested for 17.0.1

Removes setImmediate. Adds window check to MessageChannel.

Remaining failing test fails in stable and I argue should continue to fail.

```bash
Scheduler recommended for 17.1.0
    Node 14
      ✓ node-14-node-node (435 ms)
      ✓ node-14-node-jsdom (904 ms)
      ✓ node-14-jest-env-node (2639 ms)
      ✓ node-14-jest-env-jsdom (2920 ms)
      ✓ node-14-jest-env-node-jsdom (2231 ms)
    Node 15
      ✕ node-15-node-node (5217 ms)
      ✓ node-15-node-jsdom (1019 ms)
      ✓ node-15-jest-env-node (2764 ms)
      ✓ node-15-jest-env-jsdom (2664 ms)
      ✓ node-15-jest-env-node-jsdom (2338 ms)
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
