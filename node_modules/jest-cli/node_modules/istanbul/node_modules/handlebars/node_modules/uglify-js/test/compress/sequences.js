make_sequences_1: {
    options = {
        sequences: true
    };
    input: {
        foo();
        bar();
        baz();
    }
    expect: {
        foo(),bar(),baz();
    }
}

make_sequences_2: {
    options = {
        sequences: true
    };
    input: {
        if (boo) {
            foo();
            bar();
            baz();
        } else {
            x();
            y();
            z();
        }
    }
    expect: {
        if (boo) foo(),bar(),baz();
        else x(),y(),z();
    }
}

make_sequences_3: {
    options = {
        sequences: true
    };
    input: {
        function f() {
            foo();
            bar();
            return baz();
        }
        function g() {
            foo();
            bar();
            throw new Error();
        }
    }
    expect: {
        function f() {
            return foo(), bar(), baz();
        }
        function g() {
            throw foo(), bar(), new Error();
        }
    }
}

make_sequences_4: {
    options = {
        sequences: true
    };
    input: {
        x = 5;
        if (y) z();

        x = 5;
        for (i = 0; i < 5; i++) console.log(i);

        x = 5;
        for (; i < 5; i++) console.log(i);

        x = 5;
        switch (y) {}

        x = 5;
        with (obj) {}
    }
    expect: {
        if (x = 5, y) z();
        for (x = 5, i = 0; i < 5; i++) console.log(i);
        for (x = 5; i < 5; i++) console.log(i);
        switch (x = 5, y) {}
        with (x = 5, obj);
    }
}

lift_sequences_1: {
    options = { sequences: true };
    input: {
        foo = !(x(), y(), bar());
    }
    expect: {
        x(), y(), foo = !bar();
    }
}

lift_sequences_2: {
    options = { sequences: true, evaluate: true };
    input: {
        q = 1 + (foo(), bar(), 5) + 7 * (5 / (3 - (a(), (QW=ER), c(), 2))) - (x(), y(), 5);
    }
    expect: {
        foo(), bar(), a(), QW = ER, c(), x(), y(), q = 36
    }
}

lift_sequences_3: {
    options = { sequences: true, conditionals: true };
    input: {
        x = (foo(), bar(), baz()) ? 10 : 20;
    }
    expect: {
        foo(), bar(), x = baz() ? 10 : 20;
    }
}

lift_sequences_4: {
    options = { side_effects: true };
    input: {
        x = (foo, bar, baz);
    }
    expect: {
        x = baz;
    }
}

for_sequences: {
    options = { sequences: true };
    input: {
        // 1
        foo();
        bar();
        for (; false;);
        // 2
        foo();
        bar();
        for (x = 5; false;);
        // 3
        x = (foo in bar);
        for (; false;);
        // 4
        x = (foo in bar);
        for (y = 5; false;);
    }
    expect: {
        // 1
        for (foo(), bar(); false;);
        // 2
        for (foo(), bar(), x = 5; false;);
        // 3
        x = (foo in bar);
        for (; false;);
        // 4
        x = (foo in bar);
        for (y = 5; false;);
    }
}
