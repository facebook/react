import {Provider} from './index';
import {ANY_STATE as ANY_STATE_, DEFAULT_STATE as DEFAULT_STATE_, EMPTY_STATE as EMPTY_STATE_, FILL_STYLE_FLAG as FILL_STYLE_FLAG_} from './src/animation/animation_constants';
import {AnimationDriver as AnimationDriver_, NoOpAnimationDriver as NoOpAnimationDriver_} from './src/animation/animation_driver';
import {AnimationGroupPlayer as AnimationGroupPlayer_} from './src/animation/animation_group_player';
import {AnimationKeyframe as AnimationKeyframe_} from './src/animation/animation_keyframe';
import {AnimationPlayer as AnimationPlayer_, NoOpAnimationPlayer as NoOpAnimationPlayer_} from './src/animation/animation_player';
import {AnimationSequencePlayer as AnimationSequencePlayer_} from './src/animation/animation_sequence_player';
import * as animationUtils from './src/animation/animation_style_util';
import {AnimationStyles as AnimationStyles_} from './src/animation/animation_styles';
import * as change_detection_util from './src/change_detection/change_detection_util';
import * as constants from './src/change_detection/constants';
import * as console from './src/console';
import * as debug from './src/debug/debug_renderer';
import * as provider_util from './src/di/provider_util';
import * as reflective_provider from './src/di/reflective_provider';
import * as component_resolver from './src/linker/component_resolver';
import * as debug_context from './src/linker/debug_context';
import * as element from './src/linker/element';
import * as template_ref from './src/linker/template_ref';
import * as view from './src/linker/view';
import * as view_type from './src/linker/view_type';
import * as view_utils from './src/linker/view_utils';
import * as lifecycle_hooks from './src/metadata/lifecycle_hooks';
import * as metadata_view from './src/metadata/view';
import * as wtf_init from './src/profile/wtf_init';
import * as reflection from './src/reflection/reflection';
// We need to import this name separately from the above wildcard, because this symbol is exposed.
import {Reflector} from './src/reflection/reflection'; // tslint:disable-line
import * as reflection_capabilities from './src/reflection/reflection_capabilities';
import * as reflector_reader from './src/reflection/reflector_reader';
import * as api from './src/render/api';
import * as security from './src/security';
import * as decorators from './src/util/decorators';

export declare namespace __core_private_types__ {
  export var isDefaultChangeDetectionStrategy: typeof constants.isDefaultChangeDetectionStrategy;
  export type ChangeDetectorState = constants.ChangeDetectorState;
  export var ChangeDetectorState: typeof constants.ChangeDetectorState;
  export var CHANGE_DETECTION_STRATEGY_VALUES: typeof constants.CHANGE_DETECTION_STRATEGY_VALUES;
  export var constructDependencies: typeof reflective_provider.constructDependencies;
  export type LifecycleHooks = lifecycle_hooks.LifecycleHooks;
  export var LifecycleHooks: typeof lifecycle_hooks.LifecycleHooks;
  export var LIFECYCLE_HOOKS_VALUES: typeof lifecycle_hooks.LIFECYCLE_HOOKS_VALUES;
  export type ReflectorReader = reflector_reader.ReflectorReader;
  export var ReflectorReader: typeof reflector_reader.ReflectorReader;
  export var ReflectorComponentResolver: typeof component_resolver.ReflectorComponentResolver;
  export type AppElement = element.AppElement;
  export var AppElement: typeof element.AppElement;
  export var AppView: typeof view.AppView;
  export type DebugAppView<T> = view.DebugAppView<T>;
  export var DebugAppView: typeof view.DebugAppView;
  export type ViewType = view_type.ViewType;
  export var ViewType: typeof view_type.ViewType;
  export var MAX_INTERPOLATION_VALUES: typeof view_utils.MAX_INTERPOLATION_VALUES;
  export var checkBinding: typeof view_utils.checkBinding;
  export var flattenNestedViewRenderNodes: typeof view_utils.flattenNestedViewRenderNodes;
  export var interpolate: typeof view_utils.interpolate;
  export var ViewUtils: typeof view_utils.ViewUtils;
  export var VIEW_ENCAPSULATION_VALUES: typeof metadata_view.VIEW_ENCAPSULATION_VALUES;
  export var DebugContext: typeof debug_context.DebugContext;
  export var StaticNodeDebugInfo: typeof debug_context.StaticNodeDebugInfo;
  export var devModeEqual: typeof change_detection_util.devModeEqual;
  export var uninitialized: typeof change_detection_util.uninitialized;
  export var ValueUnwrapper: typeof change_detection_util.ValueUnwrapper;
  export type RenderDebugInfo = api.RenderDebugInfo;
  export var RenderDebugInfo: typeof api.RenderDebugInfo;
  export var SecurityContext: typeof security.SecurityContext;
  export type SecurityContext = security.SecurityContext;
  export var SanitizationService: typeof security.SanitizationService;
  export type SanitizationService = security.SanitizationService;
  export type TemplateRef_<C> = template_ref.TemplateRef_<C>;
  export var TemplateRef_: typeof template_ref.TemplateRef_;
  export var wtfInit: typeof wtf_init.wtfInit;
  export type ReflectionCapabilities = reflection_capabilities.ReflectionCapabilities;
  export var ReflectionCapabilities: typeof reflection_capabilities.ReflectionCapabilities;
  export var makeDecorator: typeof decorators.makeDecorator;
  export type DebugDomRootRenderer = debug.DebugDomRootRenderer;
  export var DebugDomRootRenderer: typeof debug.DebugDomRootRenderer;
  export var createProvider: typeof provider_util.createProvider;
  export var isProviderLiteral: typeof provider_util.isProviderLiteral;
  export var EMPTY_ARRAY: typeof view_utils.EMPTY_ARRAY;
  export var EMPTY_MAP: typeof view_utils.EMPTY_MAP;
  export var pureProxy1: typeof view_utils.pureProxy1;
  export var pureProxy2: typeof view_utils.pureProxy2;
  export var pureProxy3: typeof view_utils.pureProxy3;
  export var pureProxy4: typeof view_utils.pureProxy4;
  export var pureProxy5: typeof view_utils.pureProxy5;
  export var pureProxy6: typeof view_utils.pureProxy6;
  export var pureProxy7: typeof view_utils.pureProxy7;
  export var pureProxy8: typeof view_utils.pureProxy8;
  export var pureProxy9: typeof view_utils.pureProxy9;
  export var pureProxy10: typeof view_utils.pureProxy10;
  export var castByValue: typeof view_utils.castByValue;
  export type Console = console.Console;
  export var Console: typeof console.Console;
  export var reflector: typeof reflection.reflector;
  export type Reflector = reflection.Reflector;
  export var Reflector: typeof reflection.Reflector;
  export type NoOpAnimationPlayer = NoOpAnimationPlayer_;
  export var NoOpAnimationPlayer: typeof NoOpAnimationPlayer_;
  export type AnimationPlayer = AnimationPlayer_;
  export var AnimationPlayer: typeof AnimationPlayer_;
  export type NoOpAnimationDriver = NoOpAnimationDriver_;
  export var NoOpAnimationDriver: typeof NoOpAnimationDriver_;
  export type AnimationDriver = AnimationDriver_;
  export var AnimationDriver: typeof AnimationDriver_;
  export type AnimationSequencePlayer = AnimationSequencePlayer_;
  export var AnimationSequencePlayer: typeof AnimationSequencePlayer_;
  export type AnimationGroupPlayer = AnimationGroupPlayer_;
  export var AnimationGroupPlayer: typeof AnimationGroupPlayer_;
  export type AnimationKeyframe = AnimationKeyframe_;
  export var AnimationKeyframe: typeof AnimationKeyframe_;
  export var prepareFinalAnimationStyles: typeof animationUtils.prepareFinalAnimationStyles;
  export var balanceAnimationKeyframes: typeof animationUtils.balanceAnimationKeyframes;
  export var flattenStyles: typeof animationUtils.flattenStyles;
  export var clearStyles: typeof animationUtils.clearStyles;
  export var renderStyles: typeof animationUtils.renderStyles;
  export var collectAndResolveStyles: typeof animationUtils.collectAndResolveStyles;
  export type AnimationStyles = AnimationStyles_;
  export var AnimationStyles: typeof AnimationStyles_;
  export var ANY_STATE: typeof ANY_STATE_;
  export var DEFAULT_STATE: typeof DEFAULT_STATE_;
  export var EMPTY_STATE: typeof EMPTY_STATE_;
  export var FILL_STYLE_FLAG: typeof FILL_STYLE_FLAG_;
}

export var __core_private__ = {
  isDefaultChangeDetectionStrategy: constants.isDefaultChangeDetectionStrategy,
  ChangeDetectorState: constants.ChangeDetectorState,
  CHANGE_DETECTION_STRATEGY_VALUES: constants.CHANGE_DETECTION_STRATEGY_VALUES,
  constructDependencies: reflective_provider.constructDependencies,
  LifecycleHooks: lifecycle_hooks.LifecycleHooks,
  LIFECYCLE_HOOKS_VALUES: lifecycle_hooks.LIFECYCLE_HOOKS_VALUES,
  ReflectorReader: reflector_reader.ReflectorReader,
  ReflectorComponentResolver: component_resolver.ReflectorComponentResolver,
  AppElement: element.AppElement,
  AppView: view.AppView,
  DebugAppView: view.DebugAppView,
  ViewType: view_type.ViewType,
  MAX_INTERPOLATION_VALUES: view_utils.MAX_INTERPOLATION_VALUES,
  checkBinding: view_utils.checkBinding,
  flattenNestedViewRenderNodes: view_utils.flattenNestedViewRenderNodes,
  interpolate: view_utils.interpolate,
  ViewUtils: view_utils.ViewUtils,
  VIEW_ENCAPSULATION_VALUES: metadata_view.VIEW_ENCAPSULATION_VALUES,
  DebugContext: debug_context.DebugContext,
  StaticNodeDebugInfo: debug_context.StaticNodeDebugInfo,
  devModeEqual: change_detection_util.devModeEqual,
  uninitialized: change_detection_util.uninitialized,
  ValueUnwrapper: change_detection_util.ValueUnwrapper,
  RenderDebugInfo: api.RenderDebugInfo,
  SecurityContext: security.SecurityContext,
  SanitizationService: security.SanitizationService,
  TemplateRef_: template_ref.TemplateRef_,
  wtfInit: wtf_init.wtfInit,
  ReflectionCapabilities: reflection_capabilities.ReflectionCapabilities,
  makeDecorator: decorators.makeDecorator,
  DebugDomRootRenderer: debug.DebugDomRootRenderer,
  createProvider: provider_util.createProvider,
  isProviderLiteral: provider_util.isProviderLiteral,
  EMPTY_ARRAY: view_utils.EMPTY_ARRAY,
  EMPTY_MAP: view_utils.EMPTY_MAP,
  pureProxy1: view_utils.pureProxy1,
  pureProxy2: view_utils.pureProxy2,
  pureProxy3: view_utils.pureProxy3,
  pureProxy4: view_utils.pureProxy4,
  pureProxy5: view_utils.pureProxy5,
  pureProxy6: view_utils.pureProxy6,
  pureProxy7: view_utils.pureProxy7,
  pureProxy8: view_utils.pureProxy8,
  pureProxy9: view_utils.pureProxy9,
  pureProxy10: view_utils.pureProxy10,
  castByValue: view_utils.castByValue,
  Console: console.Console,
  reflector: reflection.reflector,
  Reflector: reflection.Reflector,
  NoOpAnimationPlayer: NoOpAnimationPlayer_,
  AnimationPlayer: AnimationPlayer_,
  NoOpAnimationDriver: NoOpAnimationDriver_,
  AnimationDriver: AnimationDriver_,
  AnimationSequencePlayer: AnimationSequencePlayer_,
  AnimationGroupPlayer: AnimationGroupPlayer_,
  AnimationKeyframe: AnimationKeyframe_,
  prepareFinalAnimationStyles: animationUtils.prepareFinalAnimationStyles,
  balanceAnimationKeyframes: animationUtils.balanceAnimationKeyframes,
  flattenStyles: animationUtils.flattenStyles,
  clearStyles: animationUtils.clearStyles,
  renderStyles: animationUtils.renderStyles,
  collectAndResolveStyles: animationUtils.collectAndResolveStyles,
  AnimationStyles: AnimationStyles_,
  ANY_STATE: ANY_STATE_,
  DEFAULT_STATE: DEFAULT_STATE_,
  EMPTY_STATE: EMPTY_STATE_,
  FILL_STYLE_FLAG: FILL_STYLE_FLAG_
};
