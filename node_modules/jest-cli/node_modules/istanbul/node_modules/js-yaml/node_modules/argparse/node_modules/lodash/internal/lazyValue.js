var baseWrapperValue = require('./baseWrapperValue'),
    getView = require('./getView'),
    isArray = require('../lang/isArray');

/** Used to indicate the type of lazy iteratees. */
var LAZY_DROP_WHILE_FLAG = 0,
    LAZY_FILTER_FLAG = 1,
    LAZY_MAP_FLAG = 2;

/* Native method references for those with the same name as other `lodash` methods. */
var nativeMin = Math.min;

/**
 * Extracts the unwrapped value from its lazy wrapper.
 *
 * @private
 * @name value
 * @memberOf LazyWrapper
 * @returns {*} Returns the unwrapped value.
 */
function lazyValue() {
  var array = this.__wrapped__.value();
  if (!isArray(array)) {
    return baseWrapperValue(array, this.__actions__);
  }
  var dir = this.__dir__,
      isRight = dir < 0,
      view = getView(0, array.length, this.__views__),
      start = view.start,
      end = view.end,
      length = end - start,
      index = isRight ? end : (start - 1),
      takeCount = nativeMin(length, this.__takeCount__),
      iteratees = this.__iteratees__,
      iterLength = iteratees ? iteratees.length : 0,
      resIndex = 0,
      result = [];

  outer:
  while (length-- && resIndex < takeCount) {
    index += dir;

    var iterIndex = -1,
        value = array[index];

    while (++iterIndex < iterLength) {
      var data = iteratees[iterIndex],
          iteratee = data.iteratee,
          type = data.type;

      if (type == LAZY_DROP_WHILE_FLAG) {
        if (data.done && (isRight ? (index > data.index) : (index < data.index))) {
          data.count = 0;
          data.done = false;
        }
        data.index = index;
        if (!data.done) {
          var limit = data.limit;
          if (!(data.done = limit > -1 ? (data.count++ >= limit) : !iteratee(value))) {
            continue outer;
          }
        }
      } else {
        var computed = iteratee(value);
        if (type == LAZY_MAP_FLAG) {
          value = computed;
        } else if (!computed) {
          if (type == LAZY_FILTER_FLAG) {
            continue outer;
          } else {
            break outer;
          }
        }
      }
    }
    result[resIndex++] = value;
  }
  return result;
}

module.exports = lazyValue;
