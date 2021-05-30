import FeedPage from './FeedPage';
import ProfilePage from './ProfilePage';

const AppRoutes =  {
  '/': props => <FeedPage {...props} key="home" />,
  '/profile/:userId/*': props => (
    <ProfilePage {...props} key={`profile-${props.userId}`} />
  ),
};

export default AppRoutes;
