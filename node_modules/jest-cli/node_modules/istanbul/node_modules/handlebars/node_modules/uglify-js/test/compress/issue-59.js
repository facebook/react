keep_continue: {
    options = {
        dead_code: true,
        evaluate: true
    };
    input: {
        while (a) {
            if (b) {
                switch (true) {
                  case c():
                    d();
                }
                continue;
            }
            f();
        }
    }
    expect: {
        while (a) {
            if (b) {
                switch (true) {
                  case c():
                    d();
                }
                continue;
            }
            f();
        }
    }
}
