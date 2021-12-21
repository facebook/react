'use strict';

/** @flow */

async function clickButton(page, buttonTestName) {
  await page.evaluate(testName => {
    const {createTestNameSelector, findAllNodes} = window.REACT_DOM_DEVTOOLS;
    const container = document.getElementById('devtools');

    const button = findAllNodes(container, [
      createTestNameSelector(testName),
    ])[0];
    button.click();
  }, buttonTestName);
}

async function getElementCount(page, displayName) {
  return await page.evaluate(listItemText => {
    const {
      createTestNameSelector,
      createTextSelector,
      findAllNodes,
    } = window.REACT_DOM_DEVTOOLS;
    const container = document.getElementById('devtools');
    const rows = findAllNodes(container, [
      createTestNameSelector('ComponentTreeListItem'),
      createTextSelector(listItemText),
    ]);
    return rows.length;
  }, displayName);
}

async function selectElement(page, displayName, waitForOwnersText) {
  await page.evaluate(listItemText => {
    const {
      createTestNameSelector,
      createTextSelector,
      findAllNodes,
    } = window.REACT_DOM_DEVTOOLS;
    const container = document.getElementById('devtools');

    const listItem = findAllNodes(container, [
      createTestNameSelector('ComponentTreeListItem'),
      createTextSelector(listItemText),
    ])[0];
    listItem.click();
  }, displayName);

  if (waitForOwnersText) {
    // Wait for selected element's props to load.
    await page.waitForFunction(
      ({titleText, ownersListText}) => {
        const {
          createTestNameSelector,
          findAllNodes,
        } = window.REACT_DOM_DEVTOOLS;
        const container = document.getElementById('devtools');

        const title = findAllNodes(container, [
          createTestNameSelector('InspectedElement-Title'),
        ])[0];

        const ownersList = findAllNodes(container, [
          createTestNameSelector('InspectedElementView-Owners'),
        ])[0];

        return (
          title &&
          title.innerText.includes(titleText) &&
          ownersList &&
          ownersList.innerText.includes(ownersListText)
        );
      },
      {titleText: displayName, ownersListText: waitForOwnersText}
    );
  }
}

module.exports = {
  clickButton,
  getElementCount,
  selectElement,
};
