import {useRouter} from 'next/router';
import App from '../src/App';

export default function Root() {
  const router = useRouter();
  if (router.asPath === '/[[...all]]') {
    return null;
  }
  // We're gonna do our own routing.
  return <App url={router.asPath} />;
}
