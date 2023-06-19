import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import ComponentsSettings from '../devtools/views/Settings/ComponentsSettings';

describe('ComponentsSettings', () => {
  let container;

  beforeEach(() => {
    // Set up a DOM element as a render target
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up on exiting
    unmountComponentAtNode(container);
    container.remove();
    container = null;
  });

  // @reactVersion >= 17
  it('should update collapseNodesByDefault setting', () => {
    const useContextMock = jest.fn().mockReturnValue({
      collapseNodesByDefault: true,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    });

    render(<ComponentsSettings />, container);

    const toggleElement = container.querySelector('.Settings input[type="checkbox"]');

    expect(toggleElement.checked).toBe(true);

    toggleElement.click();

    expect(useContextMock().collapseNodesByDefault).toBe(false);
  });

  it('should update parseHookNames setting', () => {
    const setParseHookNamesMock = jest.fn();

    const useContextMock = jest.fn().mockReturnValue({
      parseHookNames: true,
      setParseHookNames: setParseHookNamesMock,
    });

    render(<ComponentsSettings />, container);

    const toggleElement = container.querySelector('.Settings input[type="checkbox"]');

    expect(toggleElement.checked).toBe(true);

    toggleElement.click();

    expect(setParseHookNamesMock).toHaveBeenCalledWith(false);
  });

  it('should update openInEditorURLPreset setting', () => {
    const setLocalStorageMock = jest.spyOn(Storage.prototype, 'setItem');

    const useContextMock = jest.fn().mockReturnValue({
      openInEditorURLPreset: 'custom',
      setOpenInEditorURLPreset: jest.fn(),
    });

    render(<ComponentsSettings />, container);

    const selectElement = container.querySelector('.Settings select');

    expect(selectElement.value).toBe('custom');

    selectElement.value = 'vscode';
    selectElement.dispatchEvent(new Event('change'));

    expect(setLocalStorageMock).toHaveBeenCalledWith('OPEN_IN_EDITOR_URL_PRESET', 'vscode');
  });

  it('should update openInEditorURL setting', () => {
    const setLocalStorageMock = jest.spyOn(Storage.prototype, 'setItem');

    const useContextMock = jest.fn().mockReturnValue({
      openInEditorURLPreset: 'custom',
      setOpenInEditorURL: jest.fn(),
    });

    render(<ComponentsSettings />, container);

    const selectElement = container.querySelector('.Settings select');
    const inputElement = container.querySelector('.Settings input[type="text"]');

    selectElement.value = 'custom';
    selectElement.dispatchEvent(new Event('change'));

    inputElement.value = 'https://example.com';
    inputElement.dispatchEvent(new Event('change'));

    expect(setLocalStorageMock).toHaveBeenCalledWith('OPEN_IN_EDITOR_URL', 'https://example.com');
  });

  // Add additional test cases for other functionality...
});
