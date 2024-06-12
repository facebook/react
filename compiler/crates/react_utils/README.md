# react_utils

This is a catch-all crate for utilities and helper code that doesn't have an obvious home elsewhere.
It is expected that this crate will be depended on by lots of other crates in the project. However,
this crate should generally *not* depend on other workspace crates — that's an indication that the
utility you're adding belongs with the crate that uses the utility.