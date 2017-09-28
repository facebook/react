# Attribute Behavior Fixture

**WIP:** This is a MVP, still needs polish.

### Known Issues
- There are currently two errors thrown when the page loads;
  `SyntaxError: missing ; before statement`

## Instructions

`cd fixtures/attribute-behavior && yarn install && yarn start`

## Interpretation

Each row is an attribute which could be set on some DOM component. Some of
them are invalid or mis-capitalized or mixed up versions of real ones.
Each column is a value which can be passed to that attribute.
Every cell has a box on the left and a box on the right.
The left box shows the property (or attribute) assigned by React 15.\*, and the
right box shows the property (or attribute) assigned by the latest version of
React 16.

Right now we use a purple outline to call out cases where the assigned property
(or attribute) has changed between React 15 and 16.

---


This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).

You can find the guide for how to do things in a CRA [here](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md).
