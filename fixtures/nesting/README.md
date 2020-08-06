# Nesting

## What is this fixture?

This fixture demonstrates a build and runtime setup for using two copies of React on the same page.

**Note: this is usually a really bad idea. But in large legacy apps, sometimes the only alternative is to stop upgrading React altogether.** This fixture is meant to demonstrate an alternative solution — partial (e.g. per-route) upgrades/holdouts.

See https://github.com/facebook/react/pull/19531 for more information.

## How do I run this fixture?

```shell
# 1: Install fixture dependencies
cd fixtures/nesting
npm

# 2: Run the app
npm start
```
