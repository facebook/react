import {I18nSelectPipe} from '@angular/common';
import {PipeResolver} from '@angular/compiler/src/pipe_resolver';
import {afterEach, beforeEach, ddescribe, describe, expect, iit, it, xit} from '@angular/core/testing/testing_internal';

export function main() {
  describe('I18nSelectPipe', () => {
    var pipe: I18nSelectPipe;
    var mapping = {'male': 'Invite him.', 'female': 'Invite her.', 'other': 'Invite them.'};

    beforeEach(() => { pipe = new I18nSelectPipe(); });

    it('should be marked as pure',
       () => { expect(new PipeResolver().resolve(I18nSelectPipe).pure).toEqual(true); });

    describe('transform', () => {
      it('should return male text if value is male', () => {
        var val = pipe.transform('male', mapping);
        expect(val).toEqual('Invite him.');
      });

      it('should return female text if value is female', () => {
        var val = pipe.transform('female', mapping);
        expect(val).toEqual('Invite her.');
      });

      it('should return other text if value is anything other than male or female', () => {
        var val = pipe.transform('Anything else', mapping);
        expect(val).toEqual('Invite them.');
      });

      it('should use \'other\' if value is undefined', () => {
        var val = pipe.transform(void(0), mapping);
        expect(val).toEqual('Invite them.');
      });

      it('should not support bad arguments',
         () => { expect(() => pipe.transform('male', <any>'hey')).toThrowError(); });
    });

  });
}
