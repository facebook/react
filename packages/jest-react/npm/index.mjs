import * as dev from './esm/jest-react.development.mjs';
import * as prod from './esm/jest-react.production.min.mjs';

const isProduction = process.env.NODE_ENV === 'production';
function select(key) {
  return isProduction ? prod[key] : dev[key]
}

export const unstable_toMatchRenderedOutput = select('unstable_toMatchRenderedOutput');
