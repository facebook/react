// Closure property accesses on nullable objects should not be eagerly
// evaluated as cache keys. The compiler must not hoist `user.name` out
// of the closure when `user` could be null at render time.
const MyComponent = ({user}) => {
  const handleClick = () => {
    console.log(user.name);
  };

  if (!user) return null;

  return <button onClick={handleClick}>Click</button>;
};
