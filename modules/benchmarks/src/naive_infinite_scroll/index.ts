import {bootstrap} from '@angular/platform-browser';

import {App} from './app';

import {bind, provide} from '@angular/core';

export function main() {
  bootstrap(App, createBindings());
}

function createBindings(): any[] {
  return [];
}
