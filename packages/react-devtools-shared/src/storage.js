/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export function localStorageGetItem(key: string): any {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

export function localStorageRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {}
}

export function localStorageSetItem(key: string, value: any): void {
  try {
    return localStorage.setItem(key, value);
  } catch (error) {}
}

export function sessionStorageGetItem(key: string): any {
  try {
    return sessionStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

export function sessionStorageRemoveItem(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {}
}

export function sessionStorageSetItem(key: string, value: any): void {
  try {
    return sessionStorage.setItem(key, value);
  } catch (error) {}
}
