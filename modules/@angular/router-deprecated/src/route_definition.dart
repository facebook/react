library angular2.src.router.route_definition;

abstract class RouteDefinition {
  final String path;
  final String name;
  final bool useAsDefault;
  final String regex;
  final List<String> regex_group_names;
  final Function serializer;
  const RouteDefinition({this.path, this.name, this.useAsDefault : false, this.regex, this.regex_group_names, this.serializer});
}
