typeof_eq_undefined: {
    options = {
        comparisons: true
    };
    input: { a = typeof b.c != "undefined" }
    expect: { a = "undefined" != typeof b.c }
}

typeof_eq_undefined_unsafe: {
    options = {
        comparisons: true,
        unsafe: true
    };
    input: { a = typeof b.c != "undefined" }
    expect: { a = void 0 !== b.c }
}

typeof_eq_undefined_unsafe2: {
    options = {
        comparisons: true,
        unsafe: true
    };
    input: { a = "undefined" != typeof b.c }
    expect: { a = void 0 !== b.c }
}
