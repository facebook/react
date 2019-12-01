import dev from './esm/react-flight-dom-webpack.development.mjs';
import prod from './esm/react-flight-dom-webpack.production.min.mjs';

const isProduction = process.env.NODE_ENV === 'production';

export default isProduction ? prod : dev;
