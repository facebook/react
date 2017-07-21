import {media} from 'theme';

/**
 * This component wraps page content sections (eg header, footer, main).
 * It provides consistent margin and max width behavior.
 */
const Container = ({children}) => (
  <div
    css={{
      paddingLeft: 20,
      paddingRight: 20,
      marginLeft: 'auto',
      marginRight: 'auto',

      [media.mediumUp]: {
        width: '90%',
      },

      [media.xxlarge]: {
        maxWidth: 1260,
      },
    }}>
    {children}
  </div>
);

export default Container;
