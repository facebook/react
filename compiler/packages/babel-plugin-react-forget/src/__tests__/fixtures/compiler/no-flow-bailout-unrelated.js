// @enableFlowSuppressions

function Foo(props) {
    // $FlowFixMe[incompatible-type]
    useX();
    const x = new Foo(...props.foo, null, ...[props.bar]);
    return x;
}
