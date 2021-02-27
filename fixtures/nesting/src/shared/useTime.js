import {useState, useEffect} from 'react';

export default function useTimer() {
  const [value, setValue] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => {
      setValue(new Date());
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return value.toLocaleTimeString();
}
