---
title: Refs Must Have Owner Warning
layout: single
permalink: warnings/refs-must-have-owner.html
---

You are probably here because you got the following error messages:

> Warning:
>
> addComponentAsRefTo(...): Only a ReactOwner can have refs. You might be adding a ref to a component that was not created inside a component's `render` method, or you have multiple copies of React loaded.

This usually means one of two things:

- You are trying to add a `ref` to an element that is being created outside of a component's render() function.
- You have multiple (conflicting) copies of React loaded (eg. due to a misconfigured NPM dependency)


## Invalid Refs

Only a ReactOwner can have refs. This usually means that you're trying to add a ref to a component that doesn't have an owner (that is, was not created inside of another component's `render` method). Try rendering this component inside of a new top-level component which will hold the ref.

## Multiple copies of React

Bower does a good job of deduplicating dependencies, but NPM does not. If you aren't doing anything (fancy) with refs, there is a good chance that the problem is not with your refs, but rather an issue with having multiple copies of React loaded into your project. Sometimes, when you pull in a third-party module via npm, you will get a duplicate copy of the dependency library, and this can create problems.

If you are using npm... `npm ls` or `npm ls react` might help illuminate.
