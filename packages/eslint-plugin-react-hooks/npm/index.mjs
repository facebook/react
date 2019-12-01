import dev from './esm/eslint-plugin-react-hooks.development.mjs';
import prod from './esm/eslint-plugin-react-hooks.production.min.mjs';

const isProduction = process.env.NODE_ENV === 'production';

const defaultValue = isProduction ? prod : dev;
export default defaultValue;

