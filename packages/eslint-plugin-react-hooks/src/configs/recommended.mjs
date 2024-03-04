import { configs } from '../index';
import reactHooks from '../../index';

export default {
  plugins: {
    'react-hooks': reactHooks,
  },
  rules: configs.recommended.rules,
}
