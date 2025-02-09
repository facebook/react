declare module 'eslint-plugin-react-hooks' {
    import type { ESLint } from 'eslint';
    const plugin: Omit<ESLint.Plugin, 'configs'> & {
      // eslint-plugin-react-hooks does not use FlatConfig yet
      configs: Record<string, ESLint.ConfigData>;
    };
    export default plugin;
  }