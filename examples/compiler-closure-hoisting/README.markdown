# React Compiler Closure Hoisting Fix Example

## Problem

React Compiler hoists functions causing closure variables (like argument `a`) to become undefined, breaking code.

## Broken Code

Example where `handleChange` is hoisted and loses access to `a`.

## Fixed Code

Refactored by using inline event handler functions to preserve closure scope.

## How to Test

- Use React Compiler 19.1.0-rc.2 or later.
- Observe broken behavior on `getInput-broken.js`.
- Verify fixed behavior on `getInput-fixed.js`.
