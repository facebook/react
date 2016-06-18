import {I18nPluralPipe} from '@angular/common';
import {PipeResolver} from '@angular/compiler/src/pipe_resolver';
import {afterEach, beforeEach, ddescribe, describe, expect, iit, it, xit} from '@angular/core/testing/testing_internal';

export function main() {
  describe('I18nPluralPipe', () => {
    var pipe: I18nPluralPipe;
    var mapping = {'=0': 'No messages.', '=1': 'One message.', 'other': 'There are some messages.'};
    var interpolatedMapping = {
      '=0': 'No messages.',
      '=1': 'One message.',
      'other': 'There are # messages, that is #.'
    };

    beforeEach(() => { pipe = new I18nPluralPipe(); });

    it('should be marked as pure',
       () => { expect(new PipeResolver().resolve(I18nPluralPipe).pure).toEqual(true); });

    describe('transform', () => {
      it('should return 0 text if value is 0', () => {
        var val = pipe.transform(0, mapping);
        expect(val).toEqual('No messages.');
      });

      it('should return 1 text if value is 1', () => {
        var val = pipe.transform(1, mapping);
        expect(val).toEqual('One message.');
      });

      it('should return other text if value is anything other than 0 or 1', () => {
        var val = pipe.transform(6, mapping);
        expect(val).toEqual('There are some messages.');
      });

      it('should interpolate the value into the text where indicated', () => {
        var val = pipe.transform(6, interpolatedMapping);
        expect(val).toEqual('There are 6 messages, that is 6.');
      });

      it('should use \'other\' if value is undefined', () => {
        var val = pipe.transform(void(0), interpolatedMapping);
        expect(val).toEqual('There are  messages, that is .');
      });

      it('should not support bad arguments',
         () => { expect(() => pipe.transform(0, <any>'hey')).toThrowError(); });
    });

  });
}
