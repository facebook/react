///
//  Generated code. Do not modify.
///
library angular2.src.transform.common.model.proto_import_export_model;

import 'package:protobuf/protobuf.dart';

class ImportModel extends GeneratedMessage {
  static final BuilderInfo _i = new BuilderInfo('ImportModel')
    ..a(1, 'uri', PbFieldType.QS)
    ..p(2, 'showCombinators', PbFieldType.PS)
    ..p(3, 'hideCombinators', PbFieldType.PS)
    ..a(4, 'prefix', PbFieldType.OS)
    ..a(5, 'isDeferred', PbFieldType.OB)
  ;

  ImportModel() : super();
  ImportModel.fromBuffer(List<int> i, [ExtensionRegistry r = ExtensionRegistry.EMPTY]) : super.fromBuffer(i, r);
  ImportModel.fromJson(String i, [ExtensionRegistry r = ExtensionRegistry.EMPTY]) : super.fromJson(i, r);
  ImportModel clone() => new ImportModel()..mergeFromMessage(this);
  BuilderInfo get info_ => _i;
  static ImportModel create() => new ImportModel();
  static PbList<ImportModel> createRepeated() => new PbList<ImportModel>();
  static ImportModel getDefault() {
    if (_defaultInstance == null) _defaultInstance = new _ReadonlyImportModel();
    return _defaultInstance;
  }
  static ImportModel _defaultInstance;
  static void $checkItem(ImportModel v) {
    if (v is !ImportModel) checkItemFailed(v, 'ImportModel');
  }

  String get uri => $_get(0, 1, '');
  void set uri(String v) { $_setString(0, 1, v); }
  bool hasUri() => $_has(0, 1);
  void clearUri() => clearField(1);

  List<String> get showCombinators => $_get(1, 2, null);

  List<String> get hideCombinators => $_get(2, 3, null);

  String get prefix => $_get(3, 4, '');
  void set prefix(String v) { $_setString(3, 4, v); }
  bool hasPrefix() => $_has(3, 4);
  void clearPrefix() => clearField(4);

  bool get isDeferred => $_get(4, 5, false);
  void set isDeferred(bool v) { $_setBool(4, 5, v); }
  bool hasIsDeferred() => $_has(4, 5);
  void clearIsDeferred() => clearField(5);
}

class _ReadonlyImportModel extends ImportModel with ReadonlyMessageMixin {}

class ExportModel extends GeneratedMessage {
  static final BuilderInfo _i = new BuilderInfo('ExportModel')
    ..a(1, 'uri', PbFieldType.QS)
    ..p(2, 'showCombinators', PbFieldType.PS)
    ..p(3, 'hideCombinators', PbFieldType.PS)
  ;

  ExportModel() : super();
  ExportModel.fromBuffer(List<int> i, [ExtensionRegistry r = ExtensionRegistry.EMPTY]) : super.fromBuffer(i, r);
  ExportModel.fromJson(String i, [ExtensionRegistry r = ExtensionRegistry.EMPTY]) : super.fromJson(i, r);
  ExportModel clone() => new ExportModel()..mergeFromMessage(this);
  BuilderInfo get info_ => _i;
  static ExportModel create() => new ExportModel();
  static PbList<ExportModel> createRepeated() => new PbList<ExportModel>();
  static ExportModel getDefault() {
    if (_defaultInstance == null) _defaultInstance = new _ReadonlyExportModel();
    return _defaultInstance;
  }
  static ExportModel _defaultInstance;
  static void $checkItem(ExportModel v) {
    if (v is !ExportModel) checkItemFailed(v, 'ExportModel');
  }

  String get uri => $_get(0, 1, '');
  void set uri(String v) { $_setString(0, 1, v); }
  bool hasUri() => $_has(0, 1);
  void clearUri() => clearField(1);

  List<String> get showCombinators => $_get(1, 2, null);

  List<String> get hideCombinators => $_get(2, 3, null);
}

class _ReadonlyExportModel extends ExportModel with ReadonlyMessageMixin {}

const ImportModel$json = const {
  '1': 'ImportModel',
  '2': const [
    const {'1': 'uri', '3': 1, '4': 2, '5': 9},
    const {'1': 'show_combinators', '3': 2, '4': 3, '5': 9},
    const {'1': 'hide_combinators', '3': 3, '4': 3, '5': 9},
    const {'1': 'prefix', '3': 4, '4': 1, '5': 9},
    const {'1': 'is_deferred', '3': 5, '4': 1, '5': 8},
  ],
};

const ExportModel$json = const {
  '1': 'ExportModel',
  '2': const [
    const {'1': 'uri', '3': 1, '4': 2, '5': 9},
    const {'1': 'show_combinators', '3': 2, '4': 3, '5': 9},
    const {'1': 'hide_combinators', '3': 3, '4': 3, '5': 9},
  ],
};

/**
 * Generated with:
 * import_export_model.proto (36a3a72d0884b84b451b7188ffa1fc93b44e7b62)
 * libprotoc 3.0.0
 * dart-protoc-plugin (af5fc2bf1de367a434c3b1847ab260510878ffc0)
 */
