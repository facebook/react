import {Injectable} from '@angular/core';

@Injectable()
export class RenderStore {
  private _nextIndex: number = 0;
  private _lookupById: Map<number, any>;
  private _lookupByObject: Map<any, number>;

  constructor() {
    this._lookupById = new Map<number, any>();
    this._lookupByObject = new Map<any, number>();
  }

  allocateId(): number { return this._nextIndex++; }

  store(obj: any, id: number): void {
    this._lookupById.set(id, obj);
    this._lookupByObject.set(obj, id);
  }

  remove(obj: any): void {
    var index = this._lookupByObject.get(obj);
    this._lookupByObject.delete(obj);
    this._lookupById.delete(index);
  }

  deserialize(id: number): any {
    if (id == null) {
      return null;
    }

    if (!this._lookupById.has(id)) {
      return null;
    }

    return this._lookupById.get(id);
  }

  serialize(obj: any): number {
    if (obj == null) {
      return null;
    }
    return this._lookupByObject.get(obj);
  }
}
