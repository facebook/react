import {OpaqueToken} from '@angular/core/src/di';
import {DateWrapper} from '@angular/facade';

export class Options {
  static get DEFAULT_PROVIDERS(): any[] { return _DEFAULT_PROVIDERS; }
  // TODO(tbosch): use static initializer when our transpiler supports it
  static get SAMPLE_ID() { return _SAMPLE_ID; }
  // TODO(tbosch): use static initializer when our transpiler supports it
  static get DEFAULT_DESCRIPTION() { return _DEFAULT_DESCRIPTION; }
  // TODO(tbosch): use static initializer when our transpiler supports it
  static get SAMPLE_DESCRIPTION() { return _SAMPLE_DESCRIPTION; }
  // TODO(tbosch): use static initializer when our transpiler supports it
  static get FORCE_GC() { return _FORCE_GC; }
  // TODO(tbosch): use static initializer when our transpiler supports it
  static get PREPARE() { return _PREPARE; }
  // TODO(tbosch): use static initializer when our transpiler supports it
  static get EXECUTE() { return _EXECUTE; }
  // TODO(tbosch): use static initializer when our transpiler supports it
  static get CAPABILITIES() { return _CAPABILITIES; }
  // TODO(tbosch): use static initializer when our transpiler supports it
  static get USER_AGENT() { return _USER_AGENT; }
  // TODO(tbosch): use static initializer when our transpiler supports it
  static get NOW() { return _NOW; }
  // TODO(tbosch): use static values when our transpiler supports them
  static get WRITE_FILE() { return _WRITE_FILE; }
  // TODO(tbosch): use static values when our transpiler supports them
  static get MICRO_METRICS() { return _MICRO_METRICS; }
  // TODO(tbosch): use static values when our transpiler supports them
  static get USER_METRICS() { return _USER_METRICS; }
  // TODO(tbosch): use static values when our transpiler supports them
  static get RECEIVED_DATA() { return _RECEIVED_DATA; }
  // TODO(tbosch): use static values when our transpiler supports them
  static get REQUEST_COUNT() { return _REQUEST_COUNT; }
  // TODO(tbosch): use static values when our transpiler supports them
  static get CAPTURE_FRAMES() { return _CAPTURE_FRAMES; }
}

var _SAMPLE_ID = new OpaqueToken('Options.sampleId');
var _DEFAULT_DESCRIPTION = new OpaqueToken('Options.defaultDescription');
var _SAMPLE_DESCRIPTION = new OpaqueToken('Options.sampleDescription');
var _FORCE_GC = new OpaqueToken('Options.forceGc');
var _PREPARE = new OpaqueToken('Options.prepare');
var _EXECUTE = new OpaqueToken('Options.execute');
var _CAPABILITIES = new OpaqueToken('Options.capabilities');
var _USER_AGENT = new OpaqueToken('Options.userAgent');
var _MICRO_METRICS = new OpaqueToken('Options.microMetrics');
var _USER_METRICS = new OpaqueToken('Options.userMetrics');
var _NOW = new OpaqueToken('Options.now');
var _WRITE_FILE = new OpaqueToken('Options.writeFile');
var _RECEIVED_DATA = new OpaqueToken('Options.receivedData');
var _REQUEST_COUNT = new OpaqueToken('Options.requestCount');
var _CAPTURE_FRAMES = new OpaqueToken('Options.frameCapture');

var _DEFAULT_PROVIDERS = [
  {provide: _DEFAULT_DESCRIPTION, useValue: {}},
  {provide: _SAMPLE_DESCRIPTION, useValue: {}},
  {provide: _FORCE_GC, useValue: false},
  {provide: _PREPARE, useValue: false},
  {provide: _MICRO_METRICS, useValue: {}},
  {provide: _USER_METRICS, useValue: {}},
  {provide: _NOW, useValue: () => DateWrapper.now()},
  {provide: _RECEIVED_DATA, useValue: false},
  {provide: _REQUEST_COUNT, useValue: false},
  {provide: _CAPTURE_FRAMES, useValue: false}
];
