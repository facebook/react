///
//  Generated code. Do not modify.
///
library angular2.src.transform.common.model.proto_parameter_model;

import 'package:protobuf/protobuf.dart';

class ParameterModel extends GeneratedMessage {
  static final BuilderInfo _i = new BuilderInfo('ParameterModel')
    ..a(1, 'typeName', PbFieldType.OS)
    ..a(2, 'typeArgs', PbFieldType.OS)
    ..p(3, 'metadata', PbFieldType.PS)
    ..a(4, 'paramName', PbFieldType.OS)
    ..hasRequiredFields = false
  ;

  ParameterModel() : super();
  ParameterModel.fromBuffer(List<int> i, [ExtensionRegistry r = ExtensionRegistry.EMPTY]) : super.fromBuffer(i, r);
  ParameterModel.fromJson(String i, [ExtensionRegistry r = ExtensionRegistry.EMPTY]) : super.fromJson(i, r);
  ParameterModel clone() => new ParameterModel()..mergeFromMessage(this);
  BuilderInfo get info_ => _i;
  static ParameterModel create() => new ParameterModel();
  static PbList<ParameterModel> createRepeated() => new PbList<ParameterModel>();
  static ParameterModel getDefault() {
    if (_defaultInstance == null) _defaultInstance = new _ReadonlyParameterModel();
    return _defaultInstance;
  }
  static ParameterModel _defaultInstance;
  static void $checkItem(ParameterModel v) {
    if (v is !ParameterModel) checkItemFailed(v, 'ParameterModel');
  }

  String get typeName => $_get(0, 1, '');
  void set typeName(String v) { $_setString(0, 1, v); }
  bool hasTypeName() => $_has(0, 1);
  void clearTypeName() => clearField(1);

  String get typeArgs => $_get(1, 2, '');
  void set typeArgs(String v) { $_setString(1, 2, v); }
  bool hasTypeArgs() => $_has(1, 2);
  void clearTypeArgs() => clearField(2);

  List<String> get metadata => $_get(2, 3, null);

  String get paramName => $_get(3, 4, '');
  void set paramName(String v) { $_setString(3, 4, v); }
  bool hasParamName() => $_has(3, 4);
  void clearParamName() => clearField(4);
}

class _ReadonlyParameterModel extends ParameterModel with ReadonlyMessageMixin {}

const ParameterModel$json = const {
  '1': 'ParameterModel',
  '2': const [
    const {'1': 'type_name', '3': 1, '4': 1, '5': 9},
    const {'1': 'type_args', '3': 2, '4': 1, '5': 9},
    const {'1': 'metadata', '3': 3, '4': 3, '5': 9},
    const {'1': 'param_name', '3': 4, '4': 1, '5': 9},
  ],
};

/**
 * Generated with:
 * parameter_model.proto (2a97dcb9a65b199f50fba67120a85590bceb083a)
 * libprotoc 3.0.0
 * dart-protoc-plugin (af5fc2bf1de367a434c3b1847ab260510878ffc0)
 */
