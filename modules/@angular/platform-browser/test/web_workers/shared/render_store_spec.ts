import {beforeEach, ddescribe, describe, expect, inject, it} from '@angular/core/testing/testing_internal';
import {RenderStore} from '@angular/platform-browser/src/web_workers/shared/render_store';

export function main() {
  describe('RenderStoreSpec', () => {
    var store: RenderStore;
    beforeEach(() => { store = new RenderStore(); });

    it('should allocate ids', () => {
      expect(store.allocateId()).toBe(0);
      expect(store.allocateId()).toBe(1);
    });

    it('should serialize objects', () => {
      var id = store.allocateId();
      var obj = 'testObject';
      store.store(obj, id);
      expect(store.serialize(obj)).toBe(id);
    });

    it('should deserialize objects', () => {
      var id = store.allocateId();
      var obj = 'testObject';
      store.store(obj, id);
      expect(store.deserialize(id)).toBe(obj);
    });

  });
}
