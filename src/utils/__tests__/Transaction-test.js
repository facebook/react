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

var Transaction;
var mixInto;

var INIT_ERRORED = 'initErrored';     // Just a dummy value to check for.
describe('Transaction', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();
    Transaction = require('Transaction');
    mixInto = require('mixInto');
  });

  /**
   * We should not invoke closers for inits that failed. We should pass init
   * return values to closers when those inits are successful. We should not
   * invoke the actual method when any of the initializers fail.
   */
  it('should invoke closers with/only-with init returns', function() {
    var throwInInit = function() {
      throw new Error('close[0] should receive Transaction.OBSERVED_ERROR');
    };

    var performSideEffect;
    var dontPerformThis = function() {
      performSideEffect = 'This should never be set to this';
    };

    /**
     * New test Transaction subclass.
     */
    var TestTransaction = function() {
      this.reinitializeTransaction();
      this.firstCloseParam = INIT_ERRORED;   // WON'T be set to something else
      this.secondCloseParam = INIT_ERRORED;  // WILL be set to something else
      this.lastCloseParam = INIT_ERRORED;    // WON'T be set to something else
    };
    mixInto(TestTransaction, Transaction.Mixin);
    TestTransaction.prototype.getTransactionWrappers = function() {
      return [
        {
          initialize: throwInInit,
          close: function(initResult) {
            this.firstCloseParam = initResult;
          }
        },
        {
          initialize: function() { return 'asdf'; },
          close: function(initResult) {
            this.secondCloseParam = initResult;
          }
        },
        {
          initialize: throwInInit,
          close: function(initResult) {
            this.lastCloseParam = initResult;
          }
        }
      ];
    };

    var transaction = new TestTransaction();

    expect(function() {
      transaction.perform(dontPerformThis);
    }).toThrow();

    expect(performSideEffect).toBe(undefined);
    expect(transaction.firstCloseParam).toBe(INIT_ERRORED);
    expect(transaction.secondCloseParam).toBe('asdf');
    expect(transaction.lastCloseParam).toBe(INIT_ERRORED);
    expect(transaction.isInTransaction()).toBe(false);
  });

  it('should invoke closers and wrapped method when inits success', function() {

    var performSideEffect;
    /**
     * New test Transaction subclass.
     */
    var TestTransaction = function() {
      this.reinitializeTransaction();
      this.firstCloseParam = INIT_ERRORED;   // WON'T be set to something else
      this.secondCloseParam = INIT_ERRORED;  // WILL be set to something else
      this.lastCloseParam = INIT_ERRORED;    // WON'T be set to something else
    };
    mixInto(TestTransaction, Transaction.Mixin);
    TestTransaction.prototype.getTransactionWrappers = function() {
      return [
        {
          initialize: function() {
            return 'firstResult';
          },
          close: function(initResult) {
            this.firstCloseParam = initResult;
          }
        },
        {
          initialize: function() {
            return 'secondResult';
          },
          close: function(initResult) {
            this.secondCloseParam = initResult;
          }
        },
        {
          initialize: function() {
            return 'thirdResult';
          },
          close: function(initResult) {
            this.lastCloseParam = initResult;
          }
        }
      ];
    };

    var transaction = new TestTransaction();

    transaction.perform(function() {
      performSideEffect = 'SIDE_EFFECT';
    });

    expect(performSideEffect).toBe('SIDE_EFFECT');
    expect(transaction.firstCloseParam).toBe('firstResult');
    expect(transaction.secondCloseParam).toBe('secondResult');
    expect(transaction.lastCloseParam).toBe('thirdResult');
    expect(transaction.isInTransaction()).toBe(false);
  });

  /**
   * When the operation throws, the transaction should throw, but all of the
   * error-free closers should execute gracefully without issue. If a closer
   * throws an error, the transaction should prefer to throw the error
   * encountered earlier in the operation.
   */
  it('should throw when wrapped operation throws', function() {

    var performSideEffect;
    /**
     * New test Transaction subclass.
     */
    var TestTransaction = function() {
      this.reinitializeTransaction();
      this.firstCloseParam = INIT_ERRORED;   // WON'T be set to something else
      this.secondCloseParam = INIT_ERRORED;  // WILL be set to something else
      this.lastCloseParam = INIT_ERRORED;    // WON'T be set to something else
    };
    mixInto(TestTransaction, Transaction.Mixin);
    // Now, none of the close/inits throw, but the operation we wrap will throw.
    TestTransaction.prototype.getTransactionWrappers = function() {
      return [
        {
          initialize: function() {
            return 'firstResult';
          },
          close: function(initResult) {
            this.firstCloseParam = initResult;
          }
        },
        {
          initialize: function() {
            return 'secondResult';
          },
          close: function(initResult) {
            this.secondCloseParam = initResult;
          }
        },
        {
          initialize: function() {
            return 'thirdResult';
          },
          close: function(initResult) {
            this.lastCloseParam = initResult;
          }
        },
        {
          initialize: function() {
            return 'fourthResult';
          },
          close: function(initResult) {
            throw new Error('The transaction should throw a TypeError.');
          }
        }
      ];
    };

    var transaction = new TestTransaction();

    expect(function() {
      var isTypeError = false;
      try {
        transaction.perform(function() {
          throw new TypeError("Thrown in main wrapped operation");
        });
      } catch (err) {
        isTypeError = (err instanceof TypeError);
      }
      return isTypeError;
    }()).toBe(true);

    expect(performSideEffect).toBe(undefined);
    expect(transaction.firstCloseParam).toBe('firstResult');
    expect(transaction.secondCloseParam).toBe('secondResult');
    expect(transaction.lastCloseParam).toBe('thirdResult');
    expect(transaction.isInTransaction()).toBe(false);
  });

  it('should throw errors in transaction close', function() {
    var TestTransaction = function() {
      this.reinitializeTransaction();
    };
    mixInto(TestTransaction, Transaction.Mixin);
    var exceptionMsg = 'This exception should throw.';
    TestTransaction.prototype.getTransactionWrappers = function() {
      return [
        {
          close: function(initResult) {
            throw new Error(exceptionMsg);
          }
        }
      ];
    };

    var transaction = new TestTransaction();
    expect(function() {
      transaction.perform(function() {});
    }).toThrow(exceptionMsg);
  });

  it('should allow nesting of transactions', function() {
    var performSideEffect;
    var nestedPerformSideEffect;
    /**
     * New test Transaction subclass.
     */
    var TestTransaction = function() {
      this.reinitializeTransaction();
      this.firstCloseParam = INIT_ERRORED;   // WON'T be set to something else
      this.secondCloseParam = INIT_ERRORED;  // WILL be set to something else
      this.lastCloseParam = INIT_ERRORED;    // WON'T be set to something else
    };
    mixInto(TestTransaction, Transaction.Mixin);
    TestTransaction.prototype.getTransactionWrappers = function() {
      return [
        {
          initialize: function() {
            return 'firstResult';
          },
          close: function(initResult) {
            this.firstCloseParam = initResult;
          }
        },
        {
          initialize: function() {
            this.nestedTransaction = new NestedTransaction();
          },
          close: function() {
            // Test performing a transaction in another transaction's close()
            this.nestedTransaction.perform(function() {
              nestedPerformSideEffect = 'NESTED_SIDE_EFFECT';
            });
          }
        }
      ];
    };

    var NestedTransaction = function() {
      this.reinitializeTransaction();
    };
    mixInto(NestedTransaction, Transaction.Mixin);
    NestedTransaction.prototype.getTransactionWrappers = function() {
      return [{
        initialize: function() {
          this.hasInitializedNested = true;
        },
        close: function() {
          this.hasClosedNested = true;
        }
      }];
    };

    var transaction = new TestTransaction();

    transaction.perform(function() {
      performSideEffect = 'SIDE_EFFECT';
    });

    expect(performSideEffect).toBe('SIDE_EFFECT');
    expect(nestedPerformSideEffect).toBe('NESTED_SIDE_EFFECT');
    expect(transaction.firstCloseParam).toBe('firstResult');
    expect(transaction.isInTransaction()).toBe(false);
    expect(transaction.nestedTransaction.hasClosedNested).toBe(true);
    expect(transaction.nestedTransaction.hasInitializedNested).toBe(true);
    expect(transaction.nestedTransaction.isInTransaction()).toBe(false);
  });
});
