'use strict';

/** @flow */

async function addItem(page, newItemText) {
  await page.evaluate(text => {
    const {createTestNameSelector, findAllNodes} = window.REACT_DOM_APP;
    const container = document.getElementById('iframe').contentDocument;

    const input = findAllNodes(container, [
      createTestNameSelector('AddItemInput'),
    ])[0];
    input.value = text;

    const button = findAllNodes(container, [
      createTestNameSelector('AddItemButton'),
    ])[0];

    button.click();
  }, newItemText);
}

module.exports = {
  addItem,
};
