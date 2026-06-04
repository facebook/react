// @flow strict-local

/**
 * Regression test: JSX tags prefixed with `_` must be treated as
 * user-defined components, not as host (builtin) elements.
 *
 * By JSX convention, a tag is a host element only if its first character is a
 * lowercase ASCII letter [a-z]. A tag starting with `_` (or `$`, a digit, or
 * any non-lowercase character other than a member-expression) is a component
 * and must be loaded from scope and tracked as a dependency.
 */
function Foo({_Bar}) {
    return <_Bar>{() => <div />}</_Bar>;
}
