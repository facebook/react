import './provider.dart' show Provider;

bool isProviderLiteral(dynamic obj) {
  if (obj is Map) {
    Map map = obj as Map;
    return map.containsKey('provide');
  } else {
    return false;
  }
}

Provider createProvider(dynamic obj) {
  Map map = obj as Map;
  return new Provider(map['provide'], useClass: map['useClass'],
    useValue: map['useValue'],
    useExisting: map['useExisting'],
    useFactory: map['useFactory'],
    deps: map['deps'],
    multi: map['multi']);
}
