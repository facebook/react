import {ddescribe, describe, it, iit, xit, expect, beforeEach, afterEach, inject,} from '@angular/core/testing/testing_internal';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';
import {TestComponentBuilder} from '@angular/compiler/testing';
import {Json, StringWrapper} from '../../src/facade/lang';

import {Component} from '@angular/core';
import {JsonPipe} from '@angular/common';

export function main() {
  describe('JsonPipe', () => {
    var regNewLine = '\n';
    var inceptionObj: any;
    var inceptionObjString: string;
    var pipe: JsonPipe;

    function normalize(obj: string): string { return StringWrapper.replace(obj, regNewLine, ''); }

    beforeEach(() => {
      inceptionObj = {dream: {dream: {dream: 'Limbo'}}};
      inceptionObjString = '{\n' +
          '  "dream": {\n' +
          '    "dream": {\n' +
          '      "dream": "Limbo"\n' +
          '    }\n' +
          '  }\n' +
          '}';


      pipe = new JsonPipe();
    });

    describe('transform', () => {
      it('should return JSON-formatted string',
         () => { expect(pipe.transform(inceptionObj)).toEqual(inceptionObjString); });

      it('should return JSON-formatted string even when normalized', () => {
        var dream1 = normalize(pipe.transform(inceptionObj));
        var dream2 = normalize(inceptionObjString);
        expect(dream1).toEqual(dream2);
      });

      it('should return JSON-formatted string similar to Json.stringify', () => {
        var dream1 = normalize(pipe.transform(inceptionObj));
        var dream2 = normalize(Json.stringify(inceptionObj));
        expect(dream1).toEqual(dream2);
      });
    });

    describe('integration', () => {
      it('should work with mutable objects',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.createAsync(TestComp).then((fixture) => {
                 let mutable: number[] = [1];
                 fixture.debugElement.componentInstance.data = mutable;
                 fixture.detectChanges();
                 expect(fixture.debugElement.nativeElement).toHaveText('[\n  1\n]');

                 mutable.push(2);
                 fixture.detectChanges();
                 expect(fixture.debugElement.nativeElement).toHaveText('[\n  1,\n  2\n]');

                 async.done();
               });
             }));
    });
  });
}

@Component({selector: 'test-comp', template: '{{data | json}}', pipes: [JsonPipe]})
class TestComp {
  data: any;
}
