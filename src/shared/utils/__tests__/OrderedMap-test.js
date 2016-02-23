/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

let OrderedMap;

/**
 * Shared, reusable objects.
 */
const hasEmptyStringKey = {
  'thisKeyIsFine': {data: []},
  '': {thisShouldCauseAFailure: []},
  'thisKeyIsAlsoFine': {data: []},
};

/**
 * Used as map/forEach callback.
 */
const duplicate = function(itm, key, count) {
  return {
    uniqueID: itm.uniqueID,
    val: itm.val + key + count + this.justToTestScope,
  };
};

// Should not be allowed - because then null/'null' become impossible to
// distinguish. Every key MUST be a string period!
const hasNullAndUndefStringKey = [
  {uniqueID: 'undefined', val: 'thisIsUndefined'},
  {uniqueID: 'null', val: 'thisIsNull'},
];
const hasNullKey = [
  {uniqueID: 'thisKeyIsFine', data: []},
  {uniqueID: 'thisKeyIsAlsoFine', data: []},
  {uniqueID: null, data: []},
];

const hasObjectKey = [
  {uniqueID: 'thisKeyIsFine', data: []},
  {uniqueID: 'thisKeyIsAlsoFine', data: []},
  {uniqueID: {}, data: []},
];

const hasArrayKey = [
  {uniqueID: 'thisKeyIsFine', data: []},
  {uniqueID: 'thisKeyIsAlsoFine', data: []},
  {uniqueID: [], data: []},
];

// This should be allowed
const hasNullStringKey = [
  {uniqueID: 'thisKeyIsFine', data: []},
  {uniqueID: 'thisKeyIsAlsoFine', data: []},
  {uniqueID: 'null', data: []},
];

const hasUndefinedKey = [
  {uniqueID: 'thisKeyIsFine', data: []},
  {uniqueID: 'thisKeyIsAlsoFine', data: []},
  {uniqueID: undefined, data: []},
];

const hasUndefinedStringKey = [
  {uniqueID: 'thisKeyIsFine', data: []},
  {uniqueID: 'thisKeyIsAlsoFine', data: []},
  {uniqueID: 'undefined', data: []},
];

const hasPositiveNumericKey = [
  {uniqueID: 'notANumber', data: []},
  {uniqueID: '5', data: []},
  {uniqueID: 'notAnotherNumber', data: []},
];

const hasZeroStringKey = [
  {uniqueID: 'greg', data: 'grego'},
  {uniqueID: '0', data: '0o'},
  {uniqueID: 'tom', data: 'tomo'},
];

const hasZeroNumberKey = [
  {uniqueID: 'greg', data: 'grego'},
  {uniqueID: 0, data: '0o'},
  {uniqueID: 'tom', data: 'tomo'},
];

const hasAllNumericStringKeys = [
  {uniqueID: '0', name: 'Gregory'},
  {uniqueID: '2', name: 'James'},
  {uniqueID: '1', name: 'Tom'},
];

const hasAllNumericKeys = [
  {uniqueID: 0, name: 'Gregory'},
  {uniqueID: 2, name: 'James'},
  {uniqueID: 1, name: 'Tom'},
];

const hasAllValidKeys = [
  {uniqueID: 'keyOne', value: 'valueOne'},
  {uniqueID: 'keyTwo', value: 'valueTwo'},
];

const hasDuplicateKeys = [
  {uniqueID: 'keyOne', value: 'valueOne'},
  {uniqueID: 'keyTwo', value: 'valueTwo'},
  {uniqueID: 'keyOne', value: 'valueThree'},
];

const idEntities = [
  {uniqueID: 'greg', name: 'Gregory'},
  {uniqueID: 'james', name: 'James'},
  {uniqueID: 'tom', name: 'Tom'},
];

const hasEmptyKey = [
  {uniqueID: 'greg', name: 'Gregory'},
  {uniqueID: '', name: 'James'},
  {uniqueID: 'tom', name: 'Tom'},
];

const extractUniqueID = function(entity) {
  return entity.uniqueID;
};

describe('OrderedMap', function() {
  beforeEach(function() {
    jest.resetModuleRegistry();
    OrderedMap = require('OrderedMap');
  });

  it('should create according to simple object with keys', function() {
    OrderedMap.fromArray(hasAllValidKeys, extractUniqueID);
    // Iterate over and ensure key order.
  });

  it('should create from array when providing an identity CB', function() {
    expect(function() {
      OrderedMap.fromArray(idEntities, extractUniqueID);
    }).not.toThrow();
  });

  it('should throw if constructing from Array without identity CB', function() {
    OrderedMap.fromArray(idEntities, extractUniqueID);
    // Iterate and ensure key order
  });

  it('should not throw when fromArray extracts a numeric key', function() {
    expect(function() {
      OrderedMap.fromArray(hasPositiveNumericKey, extractUniqueID);
    }).not.toThrow();

  });

  it('should throw when any key is the empty string', function() {
    expect(function() {
      OrderedMap.fromArray(hasEmptyKey, extractUniqueID);
    }).toThrow();
  });

  it('should not throw when a key is the string "undefined" or "null"',
    function() {
      const om = OrderedMap.fromArray(hasNullAndUndefStringKey, extractUniqueID);
      expect(om.length).toBe(2);
      expect(om.indexOfKey('undefined')).toBe(0);
      expect(om.indexOfKey('null')).toBe(1);
      expect(om.keyAfter('undefined')).toBe('null');
      expect(om.keyAfter('null')).toBe(undefined);
      expect(om.keyBefore('undefined')).toBe(undefined);
      expect(om.has('undefined')).toBe(true);
      expect(om.has('null')).toBe(true);
      expect(om.get('undefined').val).toBe('thisIsUndefined');
      expect(om.get('null').val).toBe('thisIsNull');
    });


  /**
   * Numeric keys are cast to strings.
   */
  it('should not throw when a key is the number zero', function() {
    const om = OrderedMap.fromArray(hasZeroNumberKey, extractUniqueID);
    expect(om.length).toBe(3);
    expect(om.indexOfKey('0')).toBe(1);
    expect(om.indexOfKey(0)).toBe(1);
  });

  it('should throw when any key is falsey', function() {
    expect(function() {
      OrderedMap.fromArray(hasEmptyStringKey, extractUniqueID);
    }).toThrow();

    expect(function() {
      OrderedMap.fromArray(hasNullKey, extractUniqueID);
    }).toThrow();

    expect(function() {
      OrderedMap.fromArray(hasUndefinedKey, extractUniqueID);
    }).toThrow();
  });

  it('should not throw on string keys "undefined/null"', function() {
    expect(function() {
      OrderedMap.fromArray(hasNullStringKey, extractUniqueID);
    }).not.toThrow();

    expect(function() {
      OrderedMap.fromArray(hasUndefinedStringKey, extractUniqueID);
    }).not.toThrow();
  });

  it('should throw on extracting keys that are not strings/nums', function() {
    expect(function() {
      OrderedMap.fromArray(hasObjectKey, extractUniqueID);
    }).toThrow();

    expect(function() {
      OrderedMap.fromArray(hasArrayKey, extractUniqueID);
    }).toThrow();
  });

  it('should throw if instantiating with duplicate key', function() {
    expect(function() {
      OrderedMap.fromArray(hasDuplicateKeys, extractUniqueID);
    }).toThrow();
  });

  it('should not throw when a key is the string "0"', function() {
    const verifyOM = function(om) {
      expect(om.length).toBe(3);
      expect(om.indexOfKey('greg')).toBe(0);
      expect(om.indexOfKey('0')).toBe(1);
      expect(om.indexOfKey(0)).toBe(1); // Casts on writes and reads.
      expect(om.indexOfKey('tom')).toBe(2);
      expect(om.keyAfter('greg')).toBe('0');
      expect(om.keyAfter('0')).toBe('tom');
      expect(om.keyAfter(0)).toBe('tom');
      expect(om.keyAfter('tom')).toBe(undefined);
      expect(om.keyBefore('greg')).toBe(undefined);
      expect(om.keyBefore(0)).toBe('greg');
      expect(om.keyBefore('0')).toBe('greg');
      expect(om.keyBefore('tom')).toBe('0');
      expect(om.has('undefined')).toBe(false);
      expect(om.has(0)).toBe(true);
      expect(om.has('0')).toBe(true);
    };
    verifyOM(OrderedMap.fromArray(hasZeroStringKey, extractUniqueID));
    verifyOM(OrderedMap.fromArray(hasZeroNumberKey, extractUniqueID));
  });

  it('should throw when getting invalid public key', function() {
    const om = OrderedMap.fromArray(hasAllValidKeys, extractUniqueID);
    expect(function() {
      om.has(undefined);
    }).toThrow();
    expect(function() {
      om.get(undefined);
    }).toThrow();
    expect(function() {
      om.has(null);
    }).toThrow();
    expect(function() {
      om.get(null);
    }).toThrow();
    expect(function() {
      om.has('');
    }).toThrow();
    expect(function() {
      om.get('');
    }).toThrow();
  });

  it('should throw when any key is falsey', function() {
    expect(function() {
      OrderedMap.fromArray(hasEmptyStringKey, extractUniqueID);
    }).toThrow();

    expect(function() {
      OrderedMap.fromArray(hasNullKey, extractUniqueID);
    }).toThrow();

    expect(function() {
      OrderedMap.fromArray(hasUndefinedKey, extractUniqueID);
    }).toThrow();
  });


  it('should throw when fromArray is passed crazy args', function() {
    // Test passing another OrderedMap (when it expects a plain object.)
    // This is probably not what you meant to do! We should error.
    const validOM = OrderedMap.fromArray(hasAllValidKeys, extractUniqueID);
    expect(function() {
      OrderedMap.fromArray({uniqueID: 'asdf'}, extractUniqueID);
    }).toThrow();
    expect(function() {
      OrderedMap.fromArray(validOM, extractUniqueID);
    }).toThrow();
  });

  it('should throw when fromArray is passed crazy things', function() {
    expect(function() {
      OrderedMap.fromArray(null, extractUniqueID);
    }).toThrow();
    expect(function() {
      OrderedMap.fromArray('stringgg', extractUniqueID);
    }).toThrow();
    expect(function() {
      OrderedMap.fromArray(undefined, extractUniqueID);
    }).toThrow();
    expect(function() {
      OrderedMap.fromArray(new Date(), extractUniqueID);
    }).toThrow();
    expect(function() {
      OrderedMap.fromArray({}, extractUniqueID);
    }).toThrow();

    // Test failure without extractor
    expect(function() {
      OrderedMap.fromArray(idEntities);
    }).toThrow();
    expect(function() {
      OrderedMap.fromArray(idEntities, extractUniqueID);
    }).not.toThrow();
  });

  // Testing methods that accept other `OrderedMap`s.
  it('should throw when from/merge is passed an non-OrderedMap.', function() {
    // Test passing an array to construction.
    expect(function() {
      OrderedMap.from(idEntities, extractUniqueID);
    }).toThrow();

    // Test passing an array to merge.
    expect(function() {
      OrderedMap.fromArray(idEntities, extractUniqueID)
        .merge(idEntities, extractUniqueID);
    }).toThrow();


    // Test passing a plain object to merge.
    expect(function() {
      OrderedMap.fromArray(
        idEntities,
        extractUniqueID
      ).merge({blah: 'willFail'});
    }).toThrow();
  });

  it('should throw when accessing key before/after of non-key', function() {
    const om = OrderedMap.fromArray(
      [
        {uniqueID: 'first'},
        {uniqueID: 'two'},
      ], extractUniqueID
    );
    expect(function() {
      om.keyBefore('dog');
    }).toThrow();
    expect(function() {
      om.keyAfter('cat');
    }).toThrow();
    expect(function() {
      om.keyAfter(null);
    }).toThrow();
    expect(function() {
      om.keyAfter(undefined);
    }).toThrow();
  });

  it('should throw passing invalid/not-present-keys to before/after',
    function() {
      const om = OrderedMap.fromArray([
        {uniqueID: 'one', val: 'first'},
        {uniqueID: 'two', val: 'second'},
        {uniqueID: 'three', val: 'third'},
        {uniqueID: 'four', val: 'fourth'},
      ], extractUniqueID);

      expect(function() {
        om.keyBefore('');
      }).toThrow();
      expect(function() {
        om.keyBefore(null);
      }).toThrow();
      expect(function() {
        om.keyBefore(undefined);
      }).toThrow();
      expect(function() {
        om.keyBefore('notInTheOrderedMap!');
      }).toThrow();

      expect(function() {
        om.keyAfter('');
      }).toThrow();
      expect(function() {
        om.keyAfter(null);
      }).toThrow();
      expect(function() {
        om.keyAfter(undefined);
      }).toThrow();
      expect(function() {
        om.keyAfter('notInTheOrderedMap!');
      }).toThrow();

      expect(function() {
        om.nthKeyAfter('', 1);
      }).toThrow();
      expect(function() {
        om.nthKeyAfter(null, 1);
      }).toThrow();
      expect(function() {
        om.nthKeyAfter(undefined, 1);
      }).toThrow();
      expect(function() {
        om.nthKeyAfter('notInTheOrderedMap!', 1);
      }).toThrow();

      expect(function() {
        om.nthKeyBefore('', 1);
      }).toThrow();
      expect(function() {
        om.nthKeyBefore(null, 1);
      }).toThrow();
      expect(function() {
        om.nthKeyBefore(undefined, 1);
      }).toThrow();
      expect(function() {
        om.nthKeyBefore('notInTheOrderedMap!', 1);
      }).toThrow();
    });

  it('should correctly determine the nth key after before', function() {
    const om = OrderedMap.fromArray([
      {uniqueID: 'one', val: 'first'},
      {uniqueID: 'two', val: 'second'},
      {uniqueID: 'three', val: 'third'},
      {uniqueID: 'four', val: 'fourth'},
    ], extractUniqueID);
    expect(om.keyBefore('one')).toBe(undefined); // first key
    expect(om.keyBefore('two')).toBe('one');
    expect(om.keyBefore('three')).toBe('two');
    expect(om.keyBefore('four')).toBe('three');

    expect(om.keyAfter('one')).toBe('two'); // first key
    expect(om.keyAfter('two')).toBe('three');
    expect(om.keyAfter('three')).toBe('four');
    expect(om.keyAfter('four')).toBe(undefined);

    expect(om.nthKeyBefore('one', 0)).toBe('one'); // first key
    expect(om.nthKeyBefore('one', 1)).toBe(undefined);
    expect(om.nthKeyBefore('one', 2)).toBe(undefined);
    expect(om.nthKeyBefore('two', 0)).toBe('two');
    expect(om.nthKeyBefore('two', 1)).toBe('one');
    expect(om.nthKeyBefore('four', 0)).toBe('four');
    expect(om.nthKeyBefore('four', 1)).toBe('three');

    expect(om.nthKeyAfter('one', 0)).toBe('one');
    expect(om.nthKeyAfter('one', 1)).toBe('two');
    expect(om.nthKeyAfter('one', 2)).toBe('three');
    expect(om.nthKeyAfter('two', 0)).toBe('two');
    expect(om.nthKeyAfter('two', 1)).toBe('three');
    expect(om.nthKeyAfter('four', 0)).toBe('four');
    expect(om.nthKeyAfter('four', 1)).toBe(undefined);
  });

  it('should compute key indices correctly', function() {
    const om = OrderedMap.fromArray([
      {uniqueID: 'one', val: 'first'},
      {uniqueID: 'two', val: 'second'},
    ], extractUniqueID);
    expect(om.keyAtIndex(0)).toBe('one');
    expect(om.keyAtIndex(1)).toBe('two');
    expect(om.keyAtIndex(2)).toBe(undefined);
    expect(om.indexOfKey('one')).toBe(0);
    expect(om.indexOfKey('two')).toBe(1);
    expect(om.indexOfKey('nope')).toBe(undefined);
    expect(function() {
      om.indexOfKey(null);
    }).toThrow();
    expect(function() {
      om.indexOfKey(undefined);
    }).toThrow();
    expect(function() {
      om.indexOfKey(''); // Empty key is not allowed
    }).toThrow();
  });

  it('should compute indices on array that extracted numeric ids', function() {
    const som = OrderedMap.fromArray(hasZeroStringKey, extractUniqueID);
    expect(som.keyAtIndex(0)).toBe('greg');
    expect(som.keyAtIndex(1)).toBe('0');
    expect(som.keyAtIndex(2)).toBe('tom');
    expect(som.indexOfKey('greg')).toBe(0);
    expect(som.indexOfKey('0')).toBe(1);
    expect(som.indexOfKey('tom')).toBe(2);


    const verifyNumericKeys = function(nom) {
      expect(nom.keyAtIndex(0)).toBe('0');
      expect(nom.keyAtIndex(1)).toBe('2');
      expect(nom.keyAtIndex(2)).toBe('1');
      expect(nom.indexOfKey('0')).toBe(0);
      expect(nom.indexOfKey('2')).toBe(1); // Prove these are not ordered by
      expect(nom.indexOfKey('1')).toBe(2); // their keys
    };
    const omStringNumberKeys =
      OrderedMap.fromArray(hasAllNumericStringKeys, extractUniqueID);
    verifyNumericKeys(omStringNumberKeys);
    const omNumericKeys =
      OrderedMap.fromArray(hasAllNumericKeys, extractUniqueID);
    verifyNumericKeys(omNumericKeys);
  });

  it('should compute indices on mutually exclusive merge', function() {
    const om = OrderedMap.fromArray([
      {uniqueID: 'one', val: 'first'},
      {uniqueID: 'two', val: 'second'},
    ], extractUniqueID);
    const om2 = OrderedMap.fromArray([
      {uniqueID: 'three', val: 'third'},
    ], extractUniqueID);
    const res = om.merge(om2);

    expect(res.length).toBe(3);

    expect(res.keyAtIndex(0)).toBe('one');
    expect(res.keyAtIndex(1)).toBe('two');
    expect(res.keyAtIndex(2)).toBe('three');
    expect(res.keyAtIndex(3)).toBe(undefined);

    expect(res.indexOfKey('one')).toBe(0);
    expect(res.indexOfKey('two')).toBe(1);
    expect(res.indexOfKey('three')).toBe(2);
    expect(res.indexOfKey('dog')).toBe(undefined);

    expect(res.has('one')).toBe(true);
    expect(res.has('two')).toBe(true);
    expect(res.has('three')).toBe(true);
    expect(res.has('dog')).toBe(false);

    expect(res.get('one').val).toBe('first');
    expect(res.get('two').val).toBe('second');
    expect(res.get('three').val).toBe('third');
    expect(res.get('dog')).toBe(undefined);
  });

  it('should compute indices on intersected merge', function() {
    const oneTwo = OrderedMap.fromArray([
      {uniqueID: 'one', val: 'first'},
      {uniqueID: 'two', val: 'secondOM1'},
    ], extractUniqueID);

    const testOneTwoMergedWithTwoThree = function(res) {
      expect(res.length).toBe(3);
      expect(res.keyAtIndex(0)).toBe('one');
      expect(res.keyAtIndex(1)).toBe('two');
      expect(res.keyAtIndex(2)).toBe('three');
      expect(res.keyAtIndex(3)).toBe(undefined);
      expect(res.indexOfKey('one')).toBe(0);
      expect(res.indexOfKey('two')).toBe(1);
      expect(res.indexOfKey('three')).toBe(2);
      expect(res.indexOfKey('dog')).toBe(undefined);
      expect(res.has('one')).toBe(true);
      expect(res.has('two')).toBe(true);
      expect(res.has('three')).toBe(true);
      expect(res.has('dog')).toBe(false);
      expect(res.get('one').val).toBe('first');
      expect(res.get('two').val).toBe('secondOM2');
      expect(res.get('three').val).toBe('third');
      expect(res.get('dog')).toBe(undefined);
    };

    let result =
      oneTwo.merge(OrderedMap.fromArray([
        {uniqueID: 'two', val: 'secondOM2'},
        {uniqueID: 'three', val: 'third'},
      ], extractUniqueID));
    testOneTwoMergedWithTwoThree(result);

    // Everything should be exactly as before, since the ordering of `two` was
    // already determined by `om`.
    result = oneTwo.merge(
      OrderedMap.fromArray([
        {uniqueID: 'three', val: 'third'},
        {uniqueID: 'two', val:'secondOM2'},
      ], extractUniqueID)
    );
    testOneTwoMergedWithTwoThree(result);


    const testTwoThreeMergedWithOneTwo = function(res) {
      expect(res.length).toBe(3);
      expect(res.keyAtIndex(0)).toBe('two');
      expect(res.keyAtIndex(1)).toBe('three');
      expect(res.keyAtIndex(2)).toBe('one');
      expect(res.keyAtIndex(3)).toBe(undefined);
      expect(res.indexOfKey('two')).toBe(0);
      expect(res.indexOfKey('three')).toBe(1);
      expect(res.indexOfKey('one')).toBe(2);
      expect(res.indexOfKey('cat')).toBe(undefined);
      expect(res.has('two')).toBe(true);
      expect(res.has('three')).toBe(true);
      expect(res.has('one')).toBe(true);
      expect(res.has('dog')).toBe(false);
      expect(res.get('one').val).toBe('first');
      expect(res.get('two').val).toBe('secondOM1');
      expect(res.get('three').val).toBe('third');
      expect(res.get('dog')).toBe(undefined);
    };
    result = OrderedMap.fromArray([
      {uniqueID: 'two', val: 'secondOM2'},
      {uniqueID: 'three', val: 'third'},
    ], extractUniqueID).merge(oneTwo);
    testTwoThreeMergedWithOneTwo(result);

  });

  it('should merge mutually exclusive keys to the end.', function() {
    const om = OrderedMap.fromArray([
      {uniqueID: 'one', val: 'first'},
      {uniqueID: 'two', val: 'second'},
    ], extractUniqueID);
    const om2 = OrderedMap.fromArray([
      {uniqueID: 'three', val: 'first'},
      {uniqueID: 'four', val: 'second'},
    ], extractUniqueID);
    const res = om.merge(om2);
    expect(res.length).toBe(4);

  });

  it('should map correctly', function() {
    const om = OrderedMap.fromArray([
      {uniqueID: 'x', val: 'xx'},
      {uniqueID: 'y', val: 'yy'},
      {uniqueID: 'z', val: 'zz'},
    ], extractUniqueID);
    const scope = {justToTestScope: 'justTestingScope'};
    const verifyResult = function(omResult) {
      expect(omResult.length).toBe(3);
      expect(omResult.keyAtIndex(0)).toBe('x');
      expect(omResult.keyAtIndex(1)).toBe('y');
      expect(omResult.keyAtIndex(2)).toBe('z');
      expect(omResult.get('x').val).toBe('xxx0justTestingScope');
      expect(omResult.get('y').val).toBe('yyy1justTestingScope');
      expect(omResult.get('z').val).toBe('zzz2justTestingScope');
    };
    let resultOM = om.map(function(itm, key, count) {
      return {
        uniqueID: itm.uniqueID,
        val: itm.val + key + count + this.justToTestScope,
      };
    }, scope);
    verifyResult(resultOM);

    const resArray = [];
    om.forEach(function(itm, key, count) {
      resArray.push({
        uniqueID: itm.uniqueID,
        val: itm.val + key + count + this.justToTestScope,
      });
    }, scope);
    resultOM = OrderedMap.fromArray(resArray, extractUniqueID);
    verifyResult(resultOM);
  });

  it('should filter correctly', function() {
    const om = OrderedMap.fromArray([
      {uniqueID: 'x', val: 'xx'},
      {uniqueID: 'y', val: 'yy'},
      {uniqueID: 'z', val: 'zz'},
    ], extractUniqueID);
    const scope = {justToTestScope: 'justTestingScope'};

    const filteringCallback = function(item, key, indexInOriginal) {
      expect(this).toBe(scope);
      expect(key === 'x' || key === 'y' || key === 'z').toBe(true);
      if (key === 'x') {
        expect(item.val).toBe('xx');
        expect(indexInOriginal).toBe(0);
        return false;
      } else if (key === 'y') {
        expect(item.val).toBe('yy');
        expect(indexInOriginal).toBe(1);
        return true;
      } else {
        expect(item.val).toBe('zz');
        expect(indexInOriginal).toBe(2);
        return true;
      }
    };

    const verifyResult = function(omResult) {
      expect(omResult.length).toBe(2);
      expect(omResult.keyAtIndex(0)).toBe('y');
      expect(omResult.keyAtIndex(1)).toBe('z');
      expect(omResult.has('x')).toBe(false);
      expect(omResult.has('z')).toBe(true);
      expect(omResult.get('z').val).toBe('zz');
      expect(omResult.has('y')).toBe(true);
      expect(omResult.get('y').val).toBe('yy');
    };

    const resultOM = om.filter(filteringCallback, scope);
    verifyResult(resultOM);
  });

  it('should throw when providing invalid ranges to ranging', function() {
    const om = OrderedMap.fromArray([
      {uniqueID: 'x', val: 'xx'},
      {uniqueID: 'y', val: 'yy'},
      {uniqueID: 'z', val: 'zz'},
    ], extractUniqueID);
    const scope = {justToTestScope: 'justTestingScope'};

    expect(function() {
      om.mapRange(duplicate, 0, 3, scope);
    }).not.toThrow();
    expect(function() {
      om.filterRange(duplicate, 0, 3, scope);
    }).not.toThrow();
    expect(function() {
      om.forEachRange(duplicate, 0, 3, scope);
    }).not.toThrow();
    expect(function() {
      om.mapKeyRange(duplicate, 'x', 3, scope);
    }).toThrow(
      'mapKeyRange must be given keys that are present.'
    );
    expect(function() {
      om.forEachKeyRange(duplicate, 'x', 3, scope);
    }).toThrow(
      'forEachKeyRange must be given keys that are present.'
    );

    expect(function() {
      om.mapRange(duplicate, 0, 4, scope);
    }).toThrow();
    expect(function() {
      om.filterRange(duplicate, 0, 4, scope);
    }).toThrow();
    expect(function() {
      om.forEachRange(duplicate, 0, 4, scope);
    }).toThrow();
    expect(function() {
      om.mapKeyRange(duplicate, 'x', null, scope);
    }).toThrow();
    expect(function() {
      om.forEachKeyRange(duplicate, 'x', null, scope);
    }).toThrow();

    expect(function() {
      om.mapRange(duplicate, -1, 1, scope);
    }).toThrow();
    expect(function() {
      om.filterRange(duplicate, -1, 1, scope);
    }).toThrow();
    expect(function() {
      om.forEachRange(duplicate, -1, 1, scope);
    }).toThrow();
    expect(function() {
      om.mapKeyRange(duplicate, null, 'y', scope);
    }).toThrow();
    expect(function() {
      om.forEachKeyRange(duplicate, null, 'y', scope);
    }).toThrow();

    expect(function() {
      om.mapRange(duplicate, 0, 0, scope);
    }).not.toThrow();
    expect(function() {
      om.filterRange(duplicate, 0, 0, scope);
    }).not.toThrow();
    expect(function() {
      om.forEachRange(duplicate, 0, 0, scope);
    }).not.toThrow();
    expect(function() {
      om.mapKeyRange(duplicate, 'x', 'x', scope);
    }).not.toThrow();
    expect(function() {
      om.forEachKeyRange(duplicate, 'x', 'x', scope);
    }).not.toThrow();

    expect(function() {
      om.mapRange(duplicate, 0, -1, scope);
    }).toThrow();
    expect(function() {
      om.filterRange(duplicate, 0, -1, scope);
    }).toThrow();
    expect(function() {
      om.forEachRange(duplicate, 0, -1, scope);
    }).toThrow();
    expect(function() {
      om.mapKeyRange(duplicate, 'x', null, scope);
    }).toThrow();
    expect(function() {
      om.forEachKeyRange(duplicate, 'x', null, scope);
    }).toThrow();

    expect(function() {
      om.mapRange(duplicate, 2, 1, scope);
    }).not.toThrow();
    expect(function() {
      om.filterRange(duplicate, 2, 1, scope);
    }).not.toThrow();
    expect(function() {
      om.forEachRange(duplicate, 2, 1, scope);
    }).not.toThrow();
    expect(function() {
      om.mapKeyRange(duplicate, 'z', 'z', scope);
    }).not.toThrow();
    expect(function() {
      om.forEachKeyRange(duplicate, 'z', 'z', scope);
    }).not.toThrow();

    expect(function() {
      om.mapRange(duplicate, 2, 2, scope);
    }).toThrow();
    expect(function() {
      om.filterRange(duplicate, 2, 2, scope);
    }).toThrow();
    expect(function() {
      om.forEachRange(duplicate, 2, 2, scope);
    }).toThrow();
    expect(function() {
      om.mapKeyRange(duplicate, 'z', null, scope);
    }).toThrow();
    expect(function() {
      om.forEachKeyRange(duplicate, 'z', null, scope);
    }).toThrow();

    // Provide keys in reverse order - should throw.
    expect(function() {
      om.mapKeyRange(duplicate, 'y', 'x', scope);
    }).toThrow();
    expect(function() {
      om.forEachKeyRange(duplicate, 'y', 'x', scope);
    }).toThrow();
  });

  // TEST length zero map, or keyrange start===end

  it('should map range correctly', function() {
    const om = OrderedMap.fromArray([
      {uniqueID: 'x', val: 'xx'},
      {uniqueID: 'y', val: 'yy'},
      {uniqueID: 'z', val: 'zz'},
    ], extractUniqueID);
    const scope = {justToTestScope: 'justTestingScope'};
    const verifyThreeItems = function(omResult) {
      expect(omResult.length).toBe(3);
      expect(omResult.keyAtIndex(0)).toBe('x');
      expect(omResult.keyAtIndex(1)).toBe('y');
      expect(omResult.keyAtIndex(2)).toBe('z');
      expect(omResult.get('x').val).toBe('xxx0justTestingScope');
      expect(omResult.get('y').val).toBe('yyy1justTestingScope');
      expect(omResult.get('z').val).toBe('zzz2justTestingScope');
    };
    const verifyFirstTwoItems = function(omResult) {
      expect(omResult.length).toBe(2);
      expect(omResult.keyAtIndex(0)).toBe('x');
      expect(omResult.keyAtIndex(1)).toBe('y');
      expect(omResult.get('x').val).toBe('xxx0justTestingScope');
      expect(omResult.get('y').val).toBe('yyy1justTestingScope');
    };

    const verifyLastTwoItems = function(omResult) {
      expect(omResult.length).toBe(2);
      expect(omResult.keyAtIndex(0)).toBe('y');
      expect(omResult.keyAtIndex(1)).toBe('z');
      expect(omResult.get('y').val).toBe('yyy1justTestingScope');
      expect(omResult.get('z').val).toBe('zzz2justTestingScope');
    };

    const verifyMiddleItem = function(omResult) {
      expect(omResult.length).toBe(1);
      expect(omResult.keyAtIndex(0)).toBe('y');
      expect(omResult.get('y').val).toBe('yyy1justTestingScope');
    };

    const verifyEmpty = function(omResult) {
      expect(omResult.length).toBe(0);
    };

    let omResultThree = om.mapRange(duplicate, 0, 3, scope);
    verifyThreeItems(omResultThree);
    let resArray = [];
    const pushToResArray = function(itm, key, count) {
      resArray.push({
        uniqueID: itm.uniqueID,
        val: itm.val + key + count + this.justToTestScope,
      });
    };

    om.forEachRange(pushToResArray, 0, 3, scope);
    omResultThree = OrderedMap.fromArray(resArray, extractUniqueID);
    verifyThreeItems(omResultThree);

    let omResultFirstTwo = om.mapRange(duplicate, 0, 2, scope);
    verifyFirstTwoItems(omResultFirstTwo);
    resArray = [];
    om.forEachRange(pushToResArray, 0, 2, scope);
    omResultFirstTwo = OrderedMap.fromArray(resArray, extractUniqueID);
    verifyFirstTwoItems(omResultFirstTwo);

    let omResultLastTwo = om.mapRange(duplicate, 1, 2, scope);
    verifyLastTwoItems(omResultLastTwo);
    resArray = [];
    om.forEachRange(pushToResArray, 1, 2, scope);
    omResultLastTwo = OrderedMap.fromArray(resArray, extractUniqueID);
    verifyLastTwoItems(omResultLastTwo);

    let omResultMiddle = om.mapRange(duplicate, 1, 1, scope);
    verifyMiddleItem(omResultMiddle);
    resArray = [];
    om.forEachRange(pushToResArray, 1, 1, scope);
    omResultMiddle = OrderedMap.fromArray(resArray, extractUniqueID);
    verifyMiddleItem(omResultMiddle);

    const omResultNone = om.mapRange(duplicate, 1, 0, scope);
    verifyEmpty(omResultNone);
  });

  it('should extract the original array correctly', function() {
    const sourceArray = [
      {uniqueID: 'x', val: 'xx'},
      {uniqueID: 'y', val: 'yy'},
      {uniqueID: 'z', val: 'zz'},
    ];
    const om = OrderedMap.fromArray(sourceArray, extractUniqueID);
    expect(om.toArray()).toEqual(sourceArray);
  });
});
