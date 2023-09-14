// @flow
function Component({items}) {
    // Per the spec, <Foo value=<>{...}</> /> is valid.
    // But many tools don't allow fragments as jsx attribute values,
    // so we ensure not to emit them wrapped in an expression container
    return items.length > 0
        ? (
            <Foo value={
                <>{items.map(item => <Bar key={item.id} item={item} />)}</>
            }></Foo>
        )
        : null;
}

function Foo({item}) {
    return <div>{item.name}</div>;
}

export const FIXTURE_ENTRYPOINT = {
    fn: Component,
    params: [{items: [{id: 1, name: 'One!'}]}],
};