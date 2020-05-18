import {useRouter} from 'next/router';
import App from '../src/App';

export default function Root() {
  const router = useRouter();
  // We're gonna do our own routing.
  return <App segments={router.query.all || []} />;
}
