import {useMemo} from 'react';

export default function useFoo(text) {
  return useMemo(() => {
    try {
      let formattedText = '';
      try {
        formattedText = format(text);
      } catch {
        console.log('error');
      }
      return formattedText || '';
    } catch (e) {}
  }, [text]);
}
