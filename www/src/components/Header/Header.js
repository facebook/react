import {colors, fonts} from 'theme';

const Header = ({children}) => (
  <h1
    css={{
      color: colors.dark,
      marginRight: '5%',
      ...fonts.header,
    }}>
    {children}
  </h1>
);

export default Header;
