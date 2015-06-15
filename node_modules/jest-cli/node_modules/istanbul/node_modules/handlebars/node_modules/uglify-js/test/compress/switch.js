constant_switch_1: {
    options = { dead_code: true, evaluate: true };
    input: {
        switch (1+1) {
          case 1: foo(); break;
          case 1+1: bar(); break;
          case 1+1+1: baz(); break;
        }
    }
    expect: {
        bar();
    }
}

constant_switch_2: {
    options = { dead_code: true, evaluate: true };
    input: {
        switch (1) {
          case 1: foo();
          case 1+1: bar(); break;
          case 1+1+1: baz();
        }
    }
    expect: {
        foo();
        bar();
    }
}

constant_switch_3: {
    options = { dead_code: true, evaluate: true };
    input: {
        switch (10) {
          case 1: foo();
          case 1+1: bar(); break;
          case 1+1+1: baz();
          default:
            def();
        }
    }
    expect: {
        def();
    }
}

constant_switch_4: {
    options = { dead_code: true, evaluate: true };
    input: {
        switch (2) {
          case 1:
            x();
            if (foo) break;
            y();
            break;
          case 1+1:
            bar();
          default:
            def();
        }
    }
    expect: {
        bar();
        def();
    }
}

constant_switch_5: {
    options = { dead_code: true, evaluate: true };
    input: {
        switch (1) {
          case 1:
            x();
            if (foo) break;
            y();
            break;
          case 1+1:
            bar();
          default:
            def();
        }
    }
    expect: {
        // the break inside the if ruins our job
        // we can still get rid of irrelevant cases.
        switch (1) {
          case 1:
            x();
            if (foo) break;
            y();
        }
        // XXX: we could optimize this better by inventing an outer
        // labeled block, but that's kinda tricky.
    }
}

constant_switch_6: {
    options = { dead_code: true, evaluate: true };
    input: {
        OUT: {
            foo();
            switch (1) {
              case 1:
                x();
                if (foo) break OUT;
                y();
              case 1+1:
                bar();
                break;
              default:
                def();
            }
        }
    }
    expect: {
        OUT: {
            foo();
            x();
            if (foo) break OUT;
            y();
            bar();
        }
    }
}

constant_switch_7: {
    options = { dead_code: true, evaluate: true };
    input: {
        OUT: {
            foo();
            switch (1) {
              case 1:
                x();
                if (foo) break OUT;
                for (var x = 0; x < 10; x++) {
                    if (x > 5) break; // this break refers to the for, not to the switch; thus it
                                      // shouldn't ruin our optimization
                    console.log(x);
                }
                y();
              case 1+1:
                bar();
                break;
              default:
                def();
            }
        }
    }
    expect: {
        OUT: {
            foo();
            x();
            if (foo) break OUT;
            for (var x = 0; x < 10; x++) {
                if (x > 5) break;
                console.log(x);
            }
            y();
            bar();
        }
    }
}

constant_switch_8: {
    options = { dead_code: true, evaluate: true };
    input: {
        OUT: switch (1) {
          case 1:
            x();
            for (;;) break OUT;
            y();
            break;
          case 1+1:
            bar();
          default:
            def();
        }
    }
    expect: {
        OUT: {
            x();
            for (;;) break OUT;
            y();
        }
    }
}

constant_switch_9: {
    options = { dead_code: true, evaluate: true };
    input: {
        OUT: switch (1) {
          case 1:
            x();
            for (;;) if (foo) break OUT;
            y();
          case 1+1:
            bar();
          default:
            def();
        }
    }
    expect: {
        OUT: {
            x();
            for (;;) if (foo) break OUT;
            y();
            bar();
            def();
        }
    }
}

drop_default_1: {
    options = { dead_code: true };
    input: {
        switch (foo) {
          case 'bar': baz();
          default:
        }
    }
    expect: {
        switch (foo) {
          case 'bar': baz();
        }
    }
}

drop_default_2: {
    options = { dead_code: true };
    input: {
        switch (foo) {
          case 'bar': baz(); break;
          default:
            break;
        }
    }
    expect: {
        switch (foo) {
          case 'bar': baz();
        }
    }
}

keep_default: {
    options = { dead_code: true };
    input: {
        switch (foo) {
          case 'bar': baz();
          default:
            something();
            break;
        }
    }
    expect: {
        switch (foo) {
          case 'bar': baz();
          default:
            something();
        }
    }
}
