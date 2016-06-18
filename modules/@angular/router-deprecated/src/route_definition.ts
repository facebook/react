import {Type} from '../src/facade/lang';
import {RegexSerializer} from './rules/route_paths/regex_route_path';

/**
 * `RouteDefinition` defines a route within a {@link RouteConfig} decorator.
 *
 * Supported keys:
 * - `path` or `aux` (requires exactly one of these)
 * - `component`, `loader`,  `redirectTo` (requires exactly one of these)
 * - `name` (optional)
 * - `data` (optional)
 *
 * See also {@link Route}, {@link AsyncRoute}, {@link AuxRoute}, and {@link Redirect}.
 */
export interface RouteDefinition {
  path?: string;
  aux?: string;
  regex?: string;
  regex_group_names?: string[];
  serializer?: RegexSerializer;
  component?: Type|ComponentDefinition;
  loader?: () => Promise<Type>;
  redirectTo?: any[];
  name?: string;
  data?: any;
  useAsDefault?: boolean;
}

/**
 * Represents either a component type (`type` is `component`) or a loader function
 * (`type` is `loader`).
 *
 * See also {@link RouteDefinition}.
 */
export interface ComponentDefinition {
  type: string;
  loader?: () => Promise<Type>;
  component?: Type;
}
