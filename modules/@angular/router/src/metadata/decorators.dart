library angular.alt_router.decorators;

import 'metadata.dart';
export 'metadata.dart';

/**
 * Defines routes for a given component.
 *
 * It takes an array of {@link RouteMetadata}s.
 */
class Routes extends RoutesMetadata {
  const Routes(List<RouteMetadata> routes): super(routes);
}