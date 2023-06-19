import React from 'react';
import {render, fireEvent} from 'react-dom';
import ComponentsSettings from '../devtools/views/Settings/ComponentsSettings';

describe('ComponentsSettings', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  it('should add a filter when "Add filter" button is clicked', () => {
    render(<ComponentsSettings />, container);
    const addButton = container.querySelector('button');
    fireEvent.click(addButton);

    // Assert that a new filter is added
    expect(container.textContent).toContain('Filter matches');
  });

  it('should remove a filter when "Delete filter" button is clicked', () => {
    render(<ComponentsSettings />, container);
    const addButton = container.querySelector('button');
    const deleteButton = container.querySelector('button');

    fireEvent.click(addButton);
    fireEvent.click(deleteButton);

    // Assert that the filter is removed
    expect(container.textContent).not.toContain('Filter matches');
  });

  it('should update the collapseNodesByDefault setting when expand/collapse checkbox is clicked', () => {
    render(<ComponentsSettings />, container);
    const expandCollapseCheckbox = container.querySelector(
      'input[type="checkbox"]',
    );

    fireEvent.click(expandCollapseCheckbox);

    // Assert that the setting is updated
    expect(expandCollapseCheckbox.checked).toBe(false);
  });

  it('should update the parseHookNames setting when parse hook names checkbox is clicked', () => {
    render(<ComponentsSettings />, container);
    const parseHookNamesCheckbox = container.querySelector(
      'input[type="checkbox"]',
    );

    fireEvent.click(parseHookNamesCheckbox);

    // Assert that the setting is updated
    expect(parseHookNamesCheckbox.checked).toBe(true);
  });

  it('should update the openInEditorURLPreset and openInEditorURL settings when selecting a different preset', () => {
    render(<ComponentsSettings />, container);
    const openInEditorURLPresetSelect = container.querySelector('select');
    const openInEditorURLInput = container.querySelector('input[type="text"]');

    // Select the "VS Code" preset
    fireEvent.change(openInEditorURLPresetSelect, {target: {value: 'vscode'}});

    // Assert that the preset and URL input are updated
    expect(openInEditorURLPresetSelect.value).toBe('vscode');
    expect(openInEditorURLInput.value).toBe('vscode://file/{path}:{line}');

    // Select the "Custom" preset
    fireEvent.change(openInEditorURLPresetSelect, {target: {value: 'custom'}});

    // Assert that the preset and URL input are updated
    expect(openInEditorURLPresetSelect.value).toBe('custom');
    expect(openInEditorURLInput.value).toBe('');

    // Update the custom URL input
    fireEvent.change(openInEditorURLInput, {
      target: {value: 'https://example.com'},
    });

    // Assert that the custom URL input is updated
    expect(openInEditorURLInput.value).toBe('https://example.com');
  });

  it('should update the filter type when selecting a different type in the filter dropdown', () => {
    render(<ComponentsSettings />, container);
    const addButton = container.querySelector('button');
    fireEvent.click(addButton);

    const filterTypeSelect = container.querySelector('select');
    fireEvent.change(filterTypeSelect, {target: {value: 'location'}});

    // Assert that the filter type is updated
    expect(filterTypeSelect.value).toBe('location');
  });

  it('should update the filter value when entering a value in the filter input field', () => {
    render(<ComponentsSettings />, container);
    const addButton = container.querySelector('button');
    fireEvent.click(addButton);

    const filterInput = container.querySelector('input[type="text"]');
    fireEvent.change(filterInput, {target: {value: 'example'}});

    // Assert that the filter value is updated
    expect(filterInput.value).toBe('example');
  });

  // Add more test cases for other functionality and interactions
});
