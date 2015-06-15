return_with_no_value_in_if_body: {
    options = { conditionals: true };
    input: {
        function foo(bar) {
            if (bar) {
                return;
            } else {
                return 1;
            }
        }
    }
    expect: {
        function foo (bar) {
            return bar ? void 0 : 1;
        }
    }
}
