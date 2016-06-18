import {Component} from '@angular/core';
import {ELEMENT_PROBE_PROVIDERS} from '@angular/platform-browser';
import {bootstrap} from '@angular/platform-browser-dynamic';

@Component({selector: 'my-component'})
class MyAppComponent {
}

// #docregion providers
bootstrap(MyAppComponent, [ELEMENT_PROBE_PROVIDERS]);
// #enddocregion
