import {readFile, writeFile} from 'fs/promises';

export default async function FileReader() {
  // This debug string is below the threshold for debug string length, so its
  // value is sent to the client as the awaited value of the read.
  await writeFile(`/tmp/react-flight-fixture-below.txt`, 'o'.repeat(1000000));
  await readFile(`/tmp/react-flight-fixture-below.txt`, 'utf-8');

  // This debug string is above the threshold for debug string length, so the
  // client receives a placeholder as the awaited value instead of the actual
  // string.
  await writeFile(`/tmp/react-flight-fixture-above.txt`, 'x'.repeat(1000001));
  await readFile(`/tmp/react-flight-fixture-above.txt`, 'utf-8');

  return <p>FileReader</p>;
}
