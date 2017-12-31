import { Plugin } from 'webpack';

interface WebpackPluginOptions {
  filename?: string;
}

export interface WebpackPlugin {
  new (options?: WebpackPluginOptions): Plugin;
}
