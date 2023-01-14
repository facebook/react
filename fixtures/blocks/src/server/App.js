
import {matchRoute} from './ServerRouter';
import FeedPage from './FeedPage';
import ProfilePage from './ProfilePage';

// TODO: Replace with asset reference.
import Shell from '../client/Shell';

// TODO: Router component?
const AppRoutes = {
  '/': props => <FeedPage {...props} key="home" />,
  '/profile/:userId/*': props => (
    <ProfilePage {...props} key={`profile-${props.userId}`} />
  ),
};

export default function App(props) {
  const match = matchRoute(props, AppRoutes);
  return <Shell>{match}</Shell>;
}
