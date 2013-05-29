/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @emails react-core
 */

"use strict";

require('mock-modules')
    .dontMock('mergeHelpers')
    .dontMock('merge')
    .dontMock('mergeDeep')
    .dontMock('mergeInto')
    .dontMock('mergeDeepInto');

var mergeHelpers;
var merge;
var mergeInto;
var mergeDeep;
var mergeDeepInto;

var isTerminal;
var MAX_MERGE_DEPTH;

/**
 * Simple helper to traverse an object, calling the callback (cb) on every
 * nonTerminal node it finds. It stops once it reaches the maximum depth,
 * because we know that the merge functions shouldn't merge past that depth
 * anyways. If you don't "stop" once reaching the MAX_MERGE_DEPTH, there won't
 * be a practical way to traverse circular structures.
 */
var traverseUntilLeaves = function(obj, cb, depth) {
  if ((depth || 0) >= MAX_MERGE_DEPTH) {
    return;
  }
  var key;
  if (!isTerminal(obj) && !Array.isArray(obj)) {
    cb(obj);
    for (key in obj) {
      if (!obj.hasOwnProperty(key)) {
        continue;
      }
      traverseUntilLeaves(obj[key], cb, (depth || 0) + 1);
    }
  }
};

/*
 * Checks that the structure of two merged objects are identical.  Checks
 * MAX_LEVEL because we don't want to block other unit tests if I have an
 * infinite loop.
 */
var MAX_LEVEL = 50;
var structureEquals = function(one, two, levelParam) {
  var level = levelParam || 0;
  var oneKey;
  var twoKey;
  if (level > MAX_LEVEL) {
    throw new Error('structure equals computation explored too many levels');
  }
  if (isTerminal(one) && isTerminal(two)) {
    return one === two;
  } else if (!isTerminal(one) && !isTerminal(two)) {
    var allInOneAreInTwo = true;
    for (oneKey in one) {
      if (!one.hasOwnProperty(oneKey)) {
        continue;
      }
      if (!structureEquals(one[oneKey], two[oneKey], level + 1)) {
        allInOneAreInTwo = false;
      }
    }
    var allInTwoAreInOne = true;
    for (twoKey in two) {
      if (!two.hasOwnProperty(twoKey)) {
        continue;
      }
      if (!structureEquals(two[twoKey], one[twoKey], level + 1)) {
        allInTwoAreInOne = false;
      }
    }
    // Sure, the computations overlap a bit.
    return allInOneAreInTwo && allInTwoAreInOne;
  } else {
    return false;
  }
};


var makeCircular = function() {
  var obj = {};
  obj.self = obj;
  return obj;
};



/**
 * Not a symmetric function. Checks if there are any node references
 * (nonTerminal [non-string, non-null, etc]) that exist in inThis. See
 * sharesOnlyTerminalMemory.
 */
var hasNoNodeReferencesIn = function(obj, inThis) {
  traverseUntilLeaves(obj, function(nonTerm) {
    traverseUntilLeaves(inThis, function(inThisNonTerm) {
      if (inThisNonTerm === nonTerm) {
        return false;
      }
    });
  });
  return true;
};

/**
 * Checks that two objects share no memory references with each other (except
 * possibly at the terminal nodes (such as strings etc)). This is used to test
 * isolation of memory. When certain merge operations occur we need to ensure
 * that we did not leak references across objects.
 */
var sharesOnlyTerminalMemory = function(a, b) {
  return hasNoNodeReferencesIn(a, b) && hasNoNodeReferencesIn(b, a);
};

/**
 * Tests all of the merging functions. You provide it data that describes what
 * a deep merge looks like and what a shallow merge looks like. It will make
 * sure that various input/output contracts are adhered to, in addition to
 * ensuring that various guarantees about side-effects are upheld.
 * The test data must provide functions createOne/createTwo as a means to
 * create test data for objects one/two respsectively - each time these
 * functions must return pristine copies so that we can test for side effects
 * correctly.
 */
var testAllMerges = function(testData) {
  var createOne = testData.createOne;
  var createTwo = testData.createTwo;
  var one;
  var two;

  /*
   * Test merge()
   */
  one = createOne();
  two = createTwo();
  if (testData.mergeShouldThrow) {
    expect(function() {
      merge(one, two);
    }).toThrow();
  } else {
    var mergeRes = merge(one, two);
    if (testData.shallowResultShouldBe) {
      expect(structureEquals(
        mergeRes,
        testData.shallowResultShouldBe)
      ).toBe(true);
    }
    // Ensure the result is not the exact same object memory reference.
    expect(mergeRes === one).toBe(false);
  }

  /*
   * Test mergeInto()
   */
  one = createOne();
  two = createTwo();
  if (testData.mergeIntoShouldThrow) {
    expect(function() {
      mergeInto(one, two);
    }).toThrow();
  } else {
    var mergeIntoRes = mergeInto(one, two);
    if (testData.shallowResultShouldBe) {
      expect(structureEquals(
        one,
        testData.shallowResultShouldBe)
      ).toBe(true);
    }
    /*
     * Ensure it's the exact same object reference
     * TODO: We should ensure that for every object path p in one points to
     * the original object reference in one before the mutation.
     */
    expect(mergeIntoRes === undefined).toBe(true);
  }

  /*
   * Test mergeDeep()
   */
  one = createOne();
  two = createTwo();
  if (testData.mergeDeepShouldThrow) {
    expect(function() {
      mergeDeep(one, two, testData.arrayStrategy);
    }).toThrow();
  } else {
    var mergeDeepRes = mergeDeep(one, two, testData.arrayStrategy);
    if (testData.deepResultShouldBe) {
      expect(structureEquals(
        mergeDeepRes,
        testData.deepResultShouldBe)
      ).toBe(true);
    }
    expect(sharesOnlyTerminalMemory(mergeDeepRes, one)).toBe(true);
    expect(sharesOnlyTerminalMemory(mergeDeepRes, two)).toBe(true);
  }

  /*
   * Test mergeDeepInto()
   */
  one = createOne();
  two = createTwo();
  if (testData.mergeDeepIntoShouldThrow) {
    expect(function() {
      mergeDeepInto(one, two, testData.arrayStrategy);
    }).toThrow();
  } else {
    var mergeDeepIntoRes = mergeDeepInto(one, two, testData.arrayStrategy);
    expect(mergeDeepIntoRes).toBe(undefined);
    if (testData.deepResultShouldBe) {
      expect(structureEquals(
        one,
        testData.deepResultShouldBe)
      ).toBe(true);
    }
    expect(mergeDeepIntoRes === undefined).toBe(true);
    expect(sharesOnlyTerminalMemory(one, two)).toBe(true);
  }

};

/**
 * ReactTextWithEntities is not a React component, but rather a helper function
 * that returns an array. You can use that array as a helper function when
 * constructing a structure.
 */
describe('mergeFuncs', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();
    mergeHelpers = require('mergeHelpers');
    merge = require('merge');
    mergeInto = require('mergeInto');
    mergeDeep = require('mergeDeep');
    mergeDeepInto = require('mergeDeepInto');
    isTerminal = mergeHelpers.isTerminal;
    MAX_MERGE_DEPTH = mergeHelpers.MAX_MERGE_DEPTH;
  });

  var twoLevelsDeep = function() {
    return {
      shallowObject: {
        deepObject: {
          a: 'a',
          b: 'b'
        },
        deepObject2: {
          one: 'one',
          two: 'two'
        }
      }
    };
  };

  it('should not throw if first argument is circular', function() {
    testAllMerges({
      createOne: makeCircular,
      createTwo: function() { return {thisOneIsNotCircular: true}; },
      mergeShouldThrow: false,
      mergeIntoShouldThrow: false,
      mergeDeepShouldThrow: true,
      mergeDeepIntoShouldThrow: false
    });
  });

  it('should throw if second argument is circular', function() {
    testAllMerges({
      createOne: function() { return {thisOneIsNotCircular: true}; },
      createTwo: makeCircular,
      mergeShouldThrow: false,
      mergeIntoShouldThrow: false,
      mergeDeepShouldThrow: true,
      mergeDeepIntoShouldThrow: true
    });
  });

  it('should throw if something deep is circular in second param', function() {
    testAllMerges({
      createOne: function() { return {thisOneIsNotCircular: true}; },
      createTwo: function() {
        return {
          deeper: {
            deeper: makeCircular()
          }
        };
      },
      mergeShouldThrow: false,
      mergeIntoShouldThrow: false,
      mergeDeepShouldThrow: true,
      mergeDeepIntoShouldThrow: true
    });
  });

  it('should throw if something deep is circular in first param', function() {
    testAllMerges({
      createOne: function() {
        return {
          deeper: {
            deeper: makeCircular()
          }
        };
      },
      createTwo: function() { return {thisOneIsNotCircular: true}; },
      mergeShouldThrow: false,
      mergeIntoShouldThrow: false,
      mergeDeepShouldThrow: true,
      mergeDeepIntoShouldThrow: false
    });
  });


  it('should throw exceptions on invalid data/params', function() {
    testAllMerges({
      createOne: function() { return []; },
      createTwo: function() { return {}; },
      mergeShouldThrow: true,
      mergeIntoShouldThrow: true,
      mergeDeepShouldThrow: true,
      mergeDeepIntoShouldThrow: true
    });
    testAllMerges({
      createOne: function() { return {}; },
      createTwo: function() { return []; },
      mergeShouldThrow: true,
      mergeIntoShouldThrow: true,
      mergeDeepShouldThrow: true,
      mergeDeepIntoShouldThrow: true
    });
    testAllMerges({
      createOne: function() { return []; },
      createTwo: function() { return {hasDeepStructure: 'yes'}; },
      mergeShouldThrow: true,
      mergeIntoShouldThrow: true,
      mergeDeepShouldThrow: true,
      mergeDeepIntoShouldThrow: true
    });
    testAllMerges({
      createOne: function() { return {hasDeepStructure: 'yes'}; },
      createTwo: function() { return []; },
      mergeShouldThrow: true,
      mergeIntoShouldThrow: true,
      mergeDeepShouldThrow: true,
      mergeDeepIntoShouldThrow: true
    });
    testAllMerges({
      createOne: function() { return {hasDeepStructure: 'yes'}; },
      createTwo: function() { return []; },
      mergeShouldThrow: true,
      mergeIntoShouldThrow: true,
      mergeDeepShouldThrow: true,
      mergeDeepIntoShouldThrow: true
    });
    /*
     * mergeInto functions do not accept an empty first parameter. There would
     * be nothing to mutate!
     */
    testAllMerges({
      createOne: function() { return null; },
      createTwo: function() { return {field: 'yes'}; },
      mergeIntoShouldThrow: true,
      mergeDeepIntoShouldThrow: true,
      shallowResultShouldBe: {field: 'yes'},
      deepResultShouldBe: {field: 'yes'}
    });
    testAllMerges({
      createOne: function() { return undefined; },
      createTwo: function() { return {field: 'yes'}; },
      mergeIntoShouldThrow: true,
      mergeDeepIntoShouldThrow: true,
      shallowResultShouldBe: {field: 'yes'},
      deepResultShouldBe: {field: 'yes'}
    });
    // Every merge function accepts an empty second parameter.
    testAllMerges({
      createOne: function() { return {field: 'yes'}; },
      createTwo: function() { return null; },
      shallowResultShouldBe: {field: 'yes'},
      deepResultShouldBe: {field: 'yes'}
    });
    testAllMerges({
      createOne: function() { return null; },
      createTwo: function() { return null; },
      deepResultShouldBe: {},
      shallowResultShouldBe: {},
      mergeIntoShouldThrow: true,
      mergeDeepIntoShouldThrow: true
    });
    testAllMerges({
      createOne: function() { return {field: 'yes'}; },
      createTwo: function() { return undefined; },
      shallowResultShouldBe: {field: 'yes'},
      deepResultShouldBe: {field: 'yes'}
    });
    testAllMerges({
      createOne: function() { return 0; },
      createTwo: function() { return {field: 'yes'}; },
      mergeShouldThrow: true,
      mergeIntoShouldThrow: true,
      mergeDeepShouldThrow: true,
      mergeDeepIntoShouldThrow: true
    });
    /*
     * The fact that the second param is empty shouldn't change that we still
     * error on arrays.
     */
    testAllMerges({
      createOne: function() { return []; },
      createTwo: function() { return undefined; },
      mergeShouldThrow: true,
      mergeIntoShouldThrow: true,
      mergeDeepShouldThrow: true,
      mergeDeepIntoShouldThrow: true
    });
    testAllMerges({
      createOne: function() { return {field: 'yes'}; },
      createTwo: function() { return null; },
      shallowResultShouldBe: {field: 'yes'},
      deepResultShouldBe: {field: 'yes'}
    });
  });


  it('should merge very deep objects correctly.',
    function() {
      testAllMerges({
        createOne: function() {
          return {
            shouldBeClobberedByNull: {
              color: 'blue'
            },
            shouldGetTwoFieldsWhenDeepMerge: {
              firstField: { color: 'red' }
            },
            shouldRemainUndefined: undefined,
            shouldRemainFour: 4,
            shouldRemainZero: 0,
            shouldBeClobberedByObj: 0
          };
        },
        createTwo: function() {
          return {
            shouldBeClobberedByNull: null,
            shouldGetTwoFieldsWhenDeepMerge: {
              secondField: { color: 'black' }
            },
            shouldBeClobberedByObj: { thisObj: true }
          };
        },
        shallowResultShouldBe: {
          shouldBeClobberedByNull: null,
          // only gets one field when merged shallowly
          shouldGetTwoFieldsWhenDeepMerge: {
            secondField: { color: 'black' }
          },
          shouldRemainUndefined: undefined,
          shouldRemainFour: 4,
          shouldRemainZero: 0,
          shouldBeClobberedByObj: { thisObj: true }
        },
        deepResultShouldBe: {
          shouldRemainUndefined: undefined,
          shouldRemainFour: 4,
          shouldRemainZero: 0,
          shouldBeClobberedByNull: null,
          shouldGetTwoFieldsWhenDeepMerge: {
            firstField: { color: 'red' },
            secondField: { color: 'black' }
          },
          shouldBeClobberedByObj: { thisObj: true }
        }
      });
    }
  );

  it(
    'should not throw with one non-colliding arrays with no arrayStrategy',
    function() {
      testAllMerges({
        createOne: function() { return { hasDeepStructure: 'yes' }; },
        createTwo: function() { return { hasArrayDeeper: [] }; },
        mergeShouldThrow: false,
        mergeIntoShouldThrow: false,
        mergeDeepShouldThrow: false,
        mergeDeepIntoShouldThrow: false,
        shallowResultShouldBe: {
          hasDeepStructure: 'yes',
          hasArrayDeeper: []
        },
        deepResultShouldBe: {
          hasDeepStructure: 'yes',
          hasArrayDeeper: []
        }
      });
    }
  );

  it(
    'should not throw with two non-colliding arrays with no arrayStrategy',
    function() {
      testAllMerges({
        createOne: function() {
          return {
            arrayOne: [1]
          };
        },
        createTwo: function() {
          return {
            arrayTwo: [2]
          };
        },
        arrayStrategy: mergeHelpers.ArrayStrategies.Clobber,
        mergeShouldThrow: false,
        mergeIntoShouldThrow: false,
        mergeDeepShouldThrow: false,
        mergeDeepIntoShouldThrow: false
      });
    }
  ),

  it('should throw if no arrayStrategy supplied on Array merges', function() {
    testAllMerges({
      createOne: function() {
        return {
          arrayOne: [1]
        };
      },
      createTwo: function() {
        return {
          arrayOne: [9]
        };
      },
      shallowResultShouldBe: {
        arrayOne: [9]
      },
      // Doesn't throw on the shallow versions.
      mergeShouldThrow: false,
      mergeIntoShouldThrow: false,
      mergeDeepShouldThrow: true,
      mergeDeepIntoShouldThrow: true
    });
  }),

  it('should not throw if never forced to merge two Arrays', function() {
    testAllMerges({
      createOne: function() {
        return {
          arrayOne: [1]
        };
      },
      createTwo: function() {
        return {
          arrayTwo: [9]    // <-- See, never forced to merge with arrayOne
        };
      },
      shallowResultShouldBe: {
        arrayOne: [1],
        arrayTwo: [9]
      },
      // Doesn't throw on the shallow versions.
      mergeShouldThrow: false,
      mergeIntoShouldThrow: false,
      mergeDeepShouldThrow: false,
      mergeDeepIntoShouldThrow: false
    });
  }),

  it(
    'should correctly deep merge Arrays with arrayStrategy clobber',
    function() {
      testAllMerges({
        createOne: function() {
          return {
            deep: {
              array: [1],
              nonArray: {
                hi: 'hi'
              }
            }
          };
        },
        createTwo: function() {
          return {
            deep: {
              array: [10,11, {deepFieldInArray: 'yes'}],
              nonArray: {
                bye: 'bye'
              }
            }
          };
        },
        shallowResultShouldBe: {
          deep: {
            array: [10,11, {deepFieldInArray: 'yes'}],
            nonArray: {
              bye: 'bye'
            }
          }
        },
        deepResultShouldBe: {
          deep: {
            array: [10,11, {deepFieldInArray: 'yes'}],
            nonArray: {
              hi: 'hi',
              bye: 'bye'
            }
          }
        },
        arrayStrategy: mergeHelpers.ArrayStrategies.Clobber,
        mergeShouldThrow: false,
        mergeIntoShouldThrow: false,
        mergeDeepShouldThrow: false,
        mergeDeepIntoShouldThrow: false
      });
    }
  ),


  it(
    'should correctly deep merge Arrays with arrayStrategy indexByIndex',
    function() {
      testAllMerges({
        createOne: function() {
          return {
            deep: {
              array: [{
                atIndexZero: {
                  indexZeroGreeting: 'You Are At Index Zero',
                  indexZeroStatus: false
                }
              }]
            }
          };
        },
        createTwo: function() {
          return {
            deep: {
              array: [{
                atIndexZero: {
                  indexZeroStatus: true,
                  newFieldAtIndexZero: 'newField'
                }
              },
              {
                atIndexOne: {
                  nothingOriginallyAtThisIndex: true
                }
              }]
            }
          };
        },
        shallowResultShouldBe: {
          deep: {
            array: [{
              atIndexZero: {
                indexZeroStatus: true,
                newFieldAtIndexZero: 'newField'
              }
            },
            {
              atIndexOne: {
                nothingOriginallyAtThisIndex: true
              }
            }]
          }
        },
        deepResultShouldBe: {
          deep: {
            array: [{
              atIndexZero: {
                indexZeroGreeting: 'You Are At Index Zero',  // <-- See!?
                indexZeroStatus: true,
                newFieldAtIndexZero: 'newField'
              }
            },
            {
              atIndexOne: {
                nothingOriginallyAtThisIndex: true
              }
            }]
          }
        },
        arrayStrategy: mergeHelpers.ArrayStrategies.IndexByIndex,
        mergeShouldThrow: false,
        mergeIntoShouldThrow: false,
        mergeDeepShouldThrow: false,
        mergeDeepIntoShouldThrow: false
      }
    );
  }),

  it('should merge deep data correctly', function() {
    var mergeData = {
      shallowObject: {
        deepObject: {
          c: 'c',
          d: 'd'
        },
        deepObject2: {
          three: 'three',
          four: 'four'
        }
      }
    };
    var deepResult = {
      shallowObject: {
        deepObject: {
          a: 'a',
          b: 'b',
          c: 'c',
          d: 'd'
        },
        deepObject2: {
          one: 'one',
          two: 'two',
          three: 'three',
          four: 'four'
        }
      }
    };
    var shallowResult = mergeData; // The same

    testAllMerges({
      createOne: function() { return twoLevelsDeep(); },
      createTwo: function() { return mergeData; },
      mergeShouldThrow: false,
      mergeIntoShouldThrow: false,
      mergeDeepShouldThrow: false,
      mergeDeepIntoShouldThrow: false,
      deepResultShouldBe: deepResult,
      shallowResultShouldBe: shallowResult
    });
  });

  it('should fill in complementing regions of data trees', function() {
    var mergeData = {
      shallowObject: {
        newDepth: {
          hello: 'goodbye'
        }
      }
    };
    var deepResult = {
      shallowObject: {
        deepObject: {
          a: 'a',
          b: 'b'
        },
        deepObject2: {
          one: 'one',
          two: 'two'
        },
        // This is added!
        newDepth: {
          hello: 'goodbye'
        }
      }
    };
    var shallowResult = mergeData; // The same

    testAllMerges({
      createOne: function() { return twoLevelsDeep(); },
      createTwo: function() { return mergeData; },
      // The deep merge of the two
      deepResultShouldBe: deepResult,
      shallowResultShouldBe: shallowResult
    });
  });

  /**
   * Arrays and Objects wipe out terminals (and vice versa).
   */
  it('should clobber terminals with objects/arrays vice versa', function() {
    var makeOne = function() {
      return {
        thisFieldDoesNothing: {},
        deep: {
          // Objects
          thisShouldSwitchFromObjectToTerminal: {hello: 'goodbye'},
          thisShouldSwitchFromTerminalToObject: 'yes',

          // Arrays
          thisShouldSwitchFromArrayToTerminal: ['goodbye'],
          thisShouldSwitchFromTerminalToArray: 'yes'
        }
      };
    };
    var makeTwo = function() {
      return {
        deep: {
          // Objects
          thisShouldSwitchFromObjectToTerminal: 'terminal',
          thisShouldSwitchFromTerminalToObject: {nowItsAnObject: 'yay'},

          // Arrays
          thisShouldSwitchFromArrayToTerminal: 'terminal',
          thisShouldSwitchFromTerminalToArray: ['yay']
        }
      };
    };
    var deepResult = {
      thisFieldDoesNothing: {

      },
      deep: {
        // Objects
        thisShouldSwitchFromObjectToTerminal: 'terminal',
        thisShouldSwitchFromTerminalToObject: {nowItsAnObject: 'yay'},

        // Arrays
        thisShouldSwitchFromArrayToTerminal: 'terminal',
        thisShouldSwitchFromTerminalToArray: ['yay']
      }
    };

    testAllMerges({
      createOne: makeOne,
      createTwo: makeTwo,
      deepResultShouldBe: deepResult,       // The deep merge of the two
      shallowResultShouldBe: deepResult     // The same this time.
    });
  });

  /**
   * Arrays wipe out Objects and Objects wipe out Arrays.
   */
  it('should clobber terminals with objects/arrays vice versa', function() {
    var makeOne = function() {
      return {
        thisFieldDoesNothing: {},
        deep: {
          thisShouldSwitchFromObjectToArray: {hello: 'goodbye'},
          thisShouldSwitchFromArrayToObject: [1,2,3]
        }
      };
    };
    var makeTwo = function() {
      return {
        deep: {
          thisShouldSwitchFromObjectToArray: [7,8,9],
          thisShouldSwitchFromArrayToObject: {iUsedToBeAnArray:true}
        }
      };
    };
    var deepResult = {
      thisFieldDoesNothing: {},
      deep: {
        thisShouldSwitchFromObjectToArray: [7,8,9],
        thisShouldSwitchFromArrayToObject: {iUsedToBeAnArray:true}
      }
    };

    testAllMerges({
      createOne: makeOne,
      createTwo: makeTwo,
      deepResultShouldBe: deepResult,       // The deep merge of the two
      shallowResultShouldBe: deepResult     // The same this time.
    });
  });

  it(
    'should not clobber terminals/objects/arrays that are not over-written',
    function() {
      testAllMerges({
        createOne: function() {
          return {
            deep: {
              terminal: 'I am a terminal',
              object: {iAmAnObject: true},
              array: [1,2,3]
            }
          };
        },
        createTwo: function() {
          return {
            deep: {
              completelyDifferentField: 'no collision here!'
            }
          };
        },
        shallowResultShouldBe: {
          deep: {
            completelyDifferentField: 'no collision here!'
          }
        },
        deepResultShouldBe: {
          deep: {
            completelyDifferentField: 'no collision here!',
            terminal: 'I am a terminal',
            object: {iAmAnObject: true},
            array: [1,2,3]
          }
        },
        mergeShouldThrow: false,
        mergeIntoShouldThrow: false,
        mergeDeepShouldThrow: false,
        mergeDeepIntoShouldThrow: false
      }
    );
  }),

  it('should correctly clobber terminals with cloned arrays', function() {
    testAllMerges({
      createOne: function() {
        return {
          deep: {
            changesFromTermToArray: 'I am a terminal'
          }
        };
      },
      createTwo: function() {
        return {
          deep: {
            changesFromTermToArray: ['I', 'am', 'an', 'array']
          }
        };
      },
      shallowResultShouldBe: {
        deep: {
          changesFromTermToArray: ['I', 'am', 'an', 'array']
        }
      },
      deepResultShouldBe: {
        deep: {
          changesFromTermToArray: ['I', 'am', 'an', 'array']
        }
      },
      mergeShouldThrow: false,
      mergeIntoShouldThrow: false,
      mergeDeepShouldThrow: false,
      mergeDeepIntoShouldThrow: false
    });
  }),

  it('should detect terminals correctly in merge* functions', function() {
    var boolResFalse = isTerminal(false);
    expect(boolResFalse).toBe(true);

    var boolResTrue = isTerminal(true);
    expect(boolResTrue).toBe(true);

    var numRes = isTerminal(123);
    expect(numRes).toBe(true);

    var zeroRes = isTerminal(0);
    expect(zeroRes).toBe(true);

    var stringRes = isTerminal('i am a string');
    expect(stringRes).toBe(true);

    var objLiteralRes = isTerminal({somethingHere: true});
    expect(objLiteralRes).toBe(false);

    var undefRes = isTerminal(undefined);
    expect(undefRes).toBe(true);

    var nullRes = isTerminal(null);
    expect(nullRes).toBe(true);

    var arrRes = isTerminal([]);
    expect(arrRes).toBe(false);
  });
});

