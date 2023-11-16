function Component(props) {
  const wat = () => {
    const pathname = "wat";
    pathname;
  };

  const pathname = props.wat;
  const deeplinkItemId = pathname ? itemID : null;

  return <button onClick={() => wat()}>{deeplinkItemId}</button>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ wat: "/dev/null", itemID: 42 }],
};
