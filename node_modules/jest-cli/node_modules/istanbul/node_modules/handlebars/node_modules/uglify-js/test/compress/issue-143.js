/**
 * There was an incorrect sort behaviour documented in issue #143:
 * (x = f(…)) <= x → x >= (x = f(…))
 *
 * For example, let the equation be:
 * (a = parseInt('100')) <= a
 *
 * If a was an integer and has the value of 99,
 * (a = parseInt('100')) <= a → 100 <= 100 → true
 *
 * When transformed incorrectly:
 * a >= (a = parseInt('100')) → 99 >= 100 → false
 */

tranformation_sort_order_equal: {
    options = {
        comparisons: true,
    };

    input: { (a = parseInt('100')) == a }
    expect: { (a = parseInt('100')) == a }
}

tranformation_sort_order_unequal: {
    options = {
        comparisons: true,
    };

    input: { (a = parseInt('100')) != a }
    expect: { (a = parseInt('100')) != a }
}

tranformation_sort_order_lesser_or_equal: {
    options = {
        comparisons: true,
    };

    input: { (a = parseInt('100')) <= a }
    expect: { (a = parseInt('100')) <= a }
}
tranformation_sort_order_greater_or_equal: {
    options = {
        comparisons: true,
    };

    input: { (a = parseInt('100')) >= a }
    expect: { (a = parseInt('100')) >= a }
}