import {beforeEach, ddescribe, describe, expect, iit, inject, it, xit,} from '@angular/core/testing/testing_internal';

import {DartImportGenerator} from '@angular/compiler/src/output/dart_imports';

export function main() {
  describe('DartImportGenerator', () => {
    describe('getImportPath', () => {
      var generator: DartImportGenerator;
      beforeEach(() => { generator = new DartImportGenerator(); });

      it('should calculate relative paths Dart', () => {
        expect(generator.getImportPath('asset:somePkg/lib/modPath', 'asset:somePkg/lib/impPath'))
            .toEqual('impPath');
      });

      it('should calculate relative paths for different constellations', () => {
        expect(generator.getImportPath('asset:somePkg/test/modPath', 'asset:somePkg/test/impPath'))
            .toEqual('impPath');
        expect(
            generator.getImportPath('asset:somePkg/lib/modPath', 'asset:somePkg/lib/dir2/impPath'))
            .toEqual('dir2/impPath');
        expect(
            generator.getImportPath('asset:somePkg/lib/dir1/modPath', 'asset:somePkg/lib/impPath'))
            .toEqual('../impPath');
        expect(generator.getImportPath(
                   'asset:somePkg/lib/dir1/modPath', 'asset:somePkg/lib/dir2/impPath'))
            .toEqual('../dir2/impPath');
      });

      it('should calculate absolute paths', () => {
        expect(
            generator.getImportPath('asset:somePkg/lib/modPath', 'asset:someOtherPkg/lib/impPath'))
            .toEqual('package:someOtherPkg/impPath');
      });

      it('should not allow absolute imports of non lib modules', () => {
        expect(
            () =>
                generator.getImportPath('asset:somePkg/lib/modPath', 'asset:somePkg/test/impPath'))
            .toThrowError(
                `Can't import url asset:somePkg/test/impPath from asset:somePkg/lib/modPath`);
      });

      it('should not allow non asset urls as base url', () => {
        expect(
            () => generator.getImportPath('http:somePkg/lib/modPath', 'asset:somePkg/test/impPath'))
            .toThrowError(`Url http:somePkg/lib/modPath is not a valid asset: url`);
      });

      it('should allow non asset urls as import urls and pass them through', () => {
        expect(generator.getImportPath('asset:somePkg/lib/modPath', 'dart:html'))
            .toEqual('dart:html');
      });
    });
  });
}
