import dev from './esm/react-noop-renderer.development.mjs';
import prod from './esm/react-noop-renderer.production.min.mjs';

const isProduction = process.env.NODE_ENV === 'production';

export default isProduction ? prod : dev;
