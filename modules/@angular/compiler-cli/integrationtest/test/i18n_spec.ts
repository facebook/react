// Only needed to satisfy the check in core/src/util/decorators.ts
// TODO(alexeagle): maybe remove that check?
require('reflect-metadata');

require('@angular/platform-server/src/parse5_adapter.js').Parse5DomAdapter.makeCurrent();
require('zone.js/dist/zone-node.js');
require('zone.js/dist/long-stack-trace-zone.js');
let serializer = require('@angular/compiler/src/i18n/xmb_serializer.js');

import * as fs from 'fs';
import * as path from 'path';

describe('template i18n extraction output', () => {
  const outDir = '';

  it('should extract i18n messages', () => {
    const xmbOutput = path.join(outDir, 'messages.xmb');
    expect(fs.existsSync(xmbOutput)).toBeTruthy();
    const xmb = fs.readFileSync(xmbOutput, {encoding: 'utf-8'});
    const res = serializer.deserializeXmb(xmb);
    const keys = Object.keys(res.messages);
    expect(keys.length).toEqual(1);
    expect(res.errors.length).toEqual(0);
    expect(res.messages[keys[0]][0].value).toEqual('translate me');
  });
});
