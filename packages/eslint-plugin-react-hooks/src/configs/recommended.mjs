import { configs } from '../index.js';
import reactHooks from '../../index.mjs'

export default {
  plugins: {
    'react-hooks': reactHooks,
  },
  rules: configs.recommended.rules,
}
