import {useState} from 'react';

function Component() {
  const [value, setValue] = useState(null);
  const createValue = () => {
    setValue({value: 42});
  };
  const logValue = () => {
    console.log(value!.value);
  };
  return (
    <>
      <button onClick={createValue} />
      <button disabled={value == null} onClick={logValue} />
    </>
  );
}
