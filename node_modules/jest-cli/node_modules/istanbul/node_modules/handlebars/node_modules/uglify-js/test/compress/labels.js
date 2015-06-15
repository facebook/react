labels_1: {
    options = { if_return: true, conditionals: true, dead_code: true };
    input: {
        out: {
            if (foo) break out;
            console.log("bar");
        }
    };
    expect: {
        foo || console.log("bar");
    }
}

labels_2: {
    options = { if_return: true, conditionals: true, dead_code: true };
    input: {
        out: {
            if (foo) print("stuff");
            else break out;
            console.log("here");
        }
    };
    expect: {
        if (foo) {
            print("stuff");
            console.log("here");
        }
    }
}

labels_3: {
    options = { if_return: true, conditionals: true, dead_code: true };
    input: {
        for (var i = 0; i < 5; ++i) {
            if (i < 3) continue;
            console.log(i);
        }
    };
    expect: {
        for (var i = 0; i < 5; ++i)
            i < 3 || console.log(i);
    }
}

labels_4: {
    options = { if_return: true, conditionals: true, dead_code: true };
    input: {
        out: for (var i = 0; i < 5; ++i) {
            if (i < 3) continue out;
            console.log(i);
        }
    };
    expect: {
        for (var i = 0; i < 5; ++i)
            i < 3 || console.log(i);
    }
}

labels_5: {
    options = { if_return: true, conditionals: true, dead_code: true };
    // should keep the break-s in the following
    input: {
        while (foo) {
            if (bar) break;
            console.log("foo");
        }
        out: while (foo) {
            if (bar) break out;
            console.log("foo");
        }
    };
    expect: {
        while (foo) {
            if (bar) break;
            console.log("foo");
        }
        out: while (foo) {
            if (bar) break out;
            console.log("foo");
        }
    }
}

labels_6: {
    input: {
        out: break out;
    };
    expect: {}
}

labels_7: {
    options = { if_return: true, conditionals: true, dead_code: true };
    input: {
        while (foo) {
            x();
            y();
            continue;
        }
    };
    expect: {
        while (foo) {
            x();
            y();
        }
    }
}

labels_8: {
    options = { if_return: true, conditionals: true, dead_code: true };
    input: {
        while (foo) {
            x();
            y();
            break;
        }
    };
    expect: {
        while (foo) {
            x();
            y();
            break;
        }
    }
}

labels_9: {
    options = { if_return: true, conditionals: true, dead_code: true };
    input: {
        out: while (foo) {
            x();
            y();
            continue out;
            z();
            k();
        }
    };
    expect: {
        while (foo) {
            x();
            y();
        }
    }
}

labels_10: {
    options = { if_return: true, conditionals: true, dead_code: true };
    input: {
        out: while (foo) {
            x();
            y();
            break out;
            z();
            k();
        }
    };
    expect: {
        out: while (foo) {
            x();
            y();
            break out;
        }
    }
}
