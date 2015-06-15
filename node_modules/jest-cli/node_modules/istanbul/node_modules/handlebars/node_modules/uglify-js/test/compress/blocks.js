remove_blocks: {
    input: {
        {;}
        foo();
        {};
        {
            {};
        };
        bar();
        {}
    }
    expect: {
        foo();
        bar();
    }
}

keep_some_blocks: {
    input: {
        // 1.
        if (foo) {
            {{{}}}
            if (bar) { baz(); }
            {{}}
        } else {
            stuff();
        }

        // 2.
        if (foo) {
            for (var i = 0; i < 5; ++i)
                if (bar) baz();
        } else {
            stuff();
        }
    }
    expect: {
        // 1.
        if (foo) {
            if (bar) baz();
        } else stuff();

        // 2.
        if (foo) {
            for (var i = 0; i < 5; ++i)
                if (bar) baz();
        } else stuff();
    }
}
