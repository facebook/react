<a name="2.0.0-rc.2"></a>
# 2.0.0-rc.2 (2016-06-15)


### Bug Fixes

* **Animation:** Problem with decimals using commas as decimal separation ([5f3d02b](https://github.com/angular/angular/commit/5f3d02b)), closes [#6335](https://github.com/angular/angular/issues/6335) [#6338](https://github.com/angular/angular/issues/6338)
* **animations:** Ensure AUTO styles are cleared at the end of the state-change animation ([55860e1](https://github.com/angular/angular/commit/55860e1)), closes [#9014](https://github.com/angular/angular/issues/9014) [#9015](https://github.com/angular/angular/issues/9015)
* **animations:** Ensure the web-animations driver converts style props to camel-case ([4d51158](https://github.com/angular/angular/commit/4d51158)), closes [#9111](https://github.com/angular/angular/issues/9111) [#9112](https://github.com/angular/angular/issues/9112)
* **bootstrap:** Swap coreBootstrap() and coreLoadAndBootstrap() arguments ([f95a604](https://github.com/angular/angular/commit/f95a604))
* **browser:** Platform code cleanup ([75e6dfb](https://github.com/angular/angular/commit/75e6dfb))
* **build:** Change publish-build-artifacts.sh to work with new packaging system ([d414734](https://github.com/angular/angular/commit/d414734))
* **build:** Declare the secure GITHUB_TOKEN_ANGULAR for package publishing from Travis ([ff40072](https://github.com/angular/angular/commit/ff40072))
* **build:** Fix an error in package publishing step where the script errors when a UMD bundl ([bac1a6e](https://github.com/angular/angular/commit/bac1a6e))
* **build:** Fix broken e2e test Travis task by running the right variation of sed on Travis ([267d864](https://github.com/angular/angular/commit/267d864))
* **build:** Force a compatible baseURL for systemjs-builder ([e0c83f6](https://github.com/angular/angular/commit/e0c83f6)), closes [#7167](https://github.com/angular/angular/issues/7167) [#7360](https://github.com/angular/angular/issues/7360)
* **build:** Hook up publish-build-artifacts to Travis ([97a1084](https://github.com/angular/angular/commit/97a1084))
* **build:** Release compiler_cli packages along with rest of @angular packages and use ANGUL ([9a05ca9](https://github.com/angular/angular/commit/9a05ca9))
* **build:** update API spec to include the return value. ([b60eecf](https://github.com/angular/angular/commit/b60eecf))
* **ci:** extra API in public_api_spec ([f154e2c](https://github.com/angular/angular/commit/f154e2c))
* **ci:** incorrect import ([cb980d3](https://github.com/angular/angular/commit/cb980d3))
* **ci:** make ci fail when compiler integration test fails ([5941c92](https://github.com/angular/angular/commit/5941c92a31aee3b7e0300f5ab91acb3c68b95171))
* **codegen:** codegen all files in the program, not just roots ([0d71345](https://github.com/angular/angular/commit/0d71345)), closes [#8475](https://github.com/angular/angular/issues/8475)
* **compiler:** Support for comment finishing with multiple dashes ([60a2ba8](https://github.com/angular/angular/commit/60a2ba8)), closes [#7119](https://github.com/angular/angular/issues/7119)
* **compiler:** Added support for '* as m' style imports. (#9077) ([e178ee4](https://github.com/angular/angular/commit/e178ee4))
* **compiler:** Added unit test to ReflectorHost and fixed issues (#9052) ([0658eb4](https://github.com/angular/angular/commit/0658eb4)), closes [(#9052](https://github.com/(/issues/9052)
* **compiler:** allow --noImplicitAny ([817ddfa](https://github.com/angular/angular/commit/817ddfa))
* **compiler:** allow decorators defined in the same file ([c1154b3](https://github.com/angular/angular/commit/c1154b3))
* **compiler:** emit correct types for literal arrays and maps. ([a81923b](https://github.com/angular/angular/commit/a81923b))
* **compiler:** have CSS parser support nested parentheses inside functions ([ceac045](https://github.com/angular/angular/commit/ceac045)), closes [#7580](https://github.com/angular/angular/issues/7580)
* **compiler:** Improved error reporting of the static reflector. ([cf3548a](https://github.com/angular/angular/commit/cf3548a)), closes [#8978](https://github.com/angular/angular/issues/8978) [#9011](https://github.com/angular/angular/issues/9011)
* **compiler:** properly report missing DI tokens (#9065) ([3aca5ff](https://github.com/angular/angular/commit/3aca5ff)), closes [#8245](https://github.com/angular/angular/issues/8245)
* **compiler:** Reflector generates imports for '..' relative modules. ([35ea02f](https://github.com/angular/angular/commit/35ea02f)), closes [#9003](https://github.com/angular/angular/issues/9003) [#9004](https://github.com/angular/angular/issues/9004)
* **compiler:** report errors for queries without selectors (#9018) ([057abef](https://github.com/angular/angular/commit/057abef)), closes [#4489](https://github.com/angular/angular/issues/4489)
* **compiler:** support lifecycle hooks in compiler_cli ([7150ace](https://github.com/angular/angular/commit/7150ace))
* **compiler:** support string tokens with `.` inside. ([67c80fb](https://github.com/angular/angular/commit/67c80fb)), closes [#8178](https://github.com/angular/angular/issues/8178)
* **compiler:** throw an error if variable with the same name is already defined. (#7209) ([9036f78](https://github.com/angular/angular/commit/9036f78))
* **compiler_cli:** allow to use builtin directives like `NgIf`, … ([edec158](https://github.com/angular/angular/commit/edec158)), closes [#8454](https://github.com/angular/angular/issues/8454)
* **compiler_cli:** normalize used directives ([ff36b03](https://github.com/angular/angular/commit/ff36b03)), closes [#8677](https://github.com/angular/angular/issues/8677)
* **Control:** Support select multiple with Control class (#8069) ([84f859d](https://github.com/angular/angular/commit/84f859d))
* **core:** accurate dev mode message for dart (#8403) ([19e6538](https://github.com/angular/angular/commit/19e6538))
* **core:** don’t detach nested view containers when destroying a view ([e2b1e15](https://github.com/angular/angular/commit/e2b1e15)), closes [#8458](https://github.com/angular/angular/issues/8458) [#8471](https://github.com/angular/angular/issues/8471)
* **core:** fix build ([3ff20cd](https://github.com/angular/angular/commit/3ff20cd))
* **core:** fix type of `DebugNode.properties` (#8964) ([ddd2ac4](https://github.com/angular/angular/commit/ddd2ac4)), closes [(#8964](https://github.com/(/issues/8964)
* **core:** Keep core exports separate from core/testing exports. ([f4f6b87](https://github.com/angular/angular/commit/f4f6b87))
* **core:** Keep core exports separate from core/testing exports. (#8930) ([21fc1bb](https://github.com/angular/angular/commit/21fc1bb))
* **core:** remove @internal annotation from PLATFORM_CORE_PROVIDERS ([2ab1085](https://github.com/angular/angular/commit/2ab1085)), closes [#8819](https://github.com/angular/angular/issues/8819)
* **core:** QueryList documentation (#8976) ([b160ada](https://github.com/angular/angular/commit/b160ada))
* **di:** type error in InvalidProviderError ([c43636f](https://github.com/angular/angular/commit/c43636f)), closes [#7729](https://github.com/angular/angular/issues/7729)
* **doc:** Add missing comma in example (#8769) ([00475f2](https://github.com/angular/angular/commit/00475f2))
* **docs:** Fix a missing opening bracket (#8331) ([d75f928](https://github.com/angular/angular/commit/d75f928)), closes [(#8331](https://github.com/(/issues/8331)
* **DomRegistry:** fix svg support ([307d105](https://github.com/angular/angular/commit/307d105))
* **facade:** change EventEmitter to be sync by default (#8761) ([e5904f4](https://github.com/angular/angular/commit/e5904f4))
* **forms:** radio buttons with different names should not share state ([6dc88f5](https://github.com/angular/angular/commit/6dc88f5)), closes [#7051](https://github.com/angular/angular/issues/7051)
* **forms:** rename old forms folder to forms-deprecated ([515a8e0](https://github.com/angular/angular/commit/515a8e0))
* **forms:** update accessor value when native select value changes ([7a2ce7f](https://github.com/angular/angular/commit/7a2ce7f)), closes [#8710](https://github.com/angular/angular/issues/8710)
* **forms:** update value and validity when controls are added ([50acb96](https://github.com/angular/angular/commit/50acb96)), closes [#8826](https://github.com/angular/angular/issues/8826)
* **forms:** separate ngModelGroup from formGroupName ([5c0cfde](https://github.com/angular/angular/commit/5c0cfdee48ba5aa48528a1c20ffd99318ee716ae))
* **HTMLParser:** properly report errors for not properly closed tags (#8999) ([6f281ab](https://github.com/angular/angular/commit/6f281ab)), closes [(#8999](https://github.com/(/issues/8999) [#7849](https://github.com/angular/angular/issues/7849)
* **http:** remove peerDep on @angular/common ([29c2dcf](https://github.com/angular/angular/commit/29c2dcf))
* **http:** respect custom Content-Type header in XHRConnection (#9131) ([537e99b](https://github.com/angular/angular/commit/537e99b)), closes [#9130](https://github.com/angular/angular/issues/9130)
* **http:** Set response.ok ([9234035](https://github.com/angular/angular/commit/9234035)), closes [#6390](https://github.com/angular/angular/issues/6390) [#6503](https://github.com/angular/angular/issues/6503)
* **Location:** make Location#platformStrategy:LocationStrategy property private ([e93b3d2](https://github.com/angular/angular/commit/e93b3d2))
* **metadata:** Allow spacing in multiple selectors (#7418) ([b2e804c](https://github.com/angular/angular/commit/b2e804c))
* **ngc:** depend on correct tsc-wrapped package ([16ef21d](https://github.com/angular/angular/commit/16ef21d))
* **ngSwitch:** use switchCase instead of switchWhen (#9076) ([e1fcab7](https://github.com/angular/angular/commit/e1fcab7))
* **ngUpgrade:** prevent digest already in progress (#9054) ([7cefec7](https://github.com/angular/angular/commit/7cefec7))
* **pipes:** handle undefined value in slice ([83c19a1](https://github.com/angular/angular/commit/83c19a1)), closes [#7152](https://github.com/angular/angular/issues/7152)
* **platform-browser:** fix rollup config ([f4b9728](https://github.com/angular/angular/commit/f4b9728))
* **platform-browser:** split dynamic bits in platform-browser into platform-browser-dynamic ([6fc267f](https://github.com/angular/angular/commit/6fc267f22ccb392f2df9808d0415bc690b77a82f))
* **platform-server:** should declare it's dependency on parse5 via package.json ([9485f5a](https://github.com/angular/angular/commit/9485f5a))
* **platform-server:** correctly import private DOMTestComponentRenderer ([7afee97](https://github.com/angular/angular/commit/7afee97d1b837cdc808b0a5e5206c306f5700263))
* **playground:** fix WebWorker single_thread example ([29c77df](https://github.com/angular/angular/commit/29c77df))
* **query:** set fixed `@ViewChild` / `@ContentChild` right after the view is created ([c3d2459](https://github.com/angular/angular/commit/c3d2459)), closes [#9040](https://github.com/angular/angular/issues/9040)
* **renderer:** remove unecessary setElementStyles method ([e504d4e](https://github.com/angular/angular/commit/e504d4e)), closes [#9000](https://github.com/angular/angular/issues/9000) [#9009](https://github.com/angular/angular/issues/9009)
* **Renderer:** update signatures to make RenderDebugInfo optional ([b7b5678](https://github.com/angular/angular/commit/b7b5678)), closes [#8466](https://github.com/angular/angular/issues/8466) [#8859](https://github.com/angular/angular/issues/8859)
* **Request:** Change Request.text's return type to string ([b2e0946](https://github.com/angular/angular/commit/b2e0946)), closes [#8138](https://github.com/angular/angular/issues/8138)
* **router:** Added pushState fallback for IE 9 browser. ([bab6023](https://github.com/angular/angular/commit/bab6023)), closes [#6506](https://github.com/angular/angular/issues/6506) [#7929](https://github.com/angular/angular/issues/7929)
* **router:** browser back and forward buttons not working correctly. ([595bcdd](https://github.com/angular/angular/commit/595bcdd)), closes [#8524](https://github.com/angular/angular/issues/8524) [#8532](https://github.com/angular/angular/issues/8532)
* **router:** don't mark the RouterOutletMap as internal ([45de65b](https://github.com/angular/angular/commit/45de65b))
* **router:** ensuring MatchedUrl pass query params ([7d853dd](https://github.com/angular/angular/commit/7d853dd))
* **router:** openning links in new tab ([fa2ce81](https://github.com/angular/angular/commit/fa2ce81)), closes [#5908](https://github.com/angular/angular/issues/5908) [#6806](https://github.com/angular/angular/issues/6806) [#7749](https://github.com/angular/angular/issues/7749) [#8806](https://github.com/angular/angular/issues/8806) [#8821](https://github.com/angular/angular/issues/8821)
* **router:** provide a top-level route segment for injection ([b8136cc](https://github.com/angular/angular/commit/b8136cc))
* **router:** replace state when path is equal to current path (#8766) ([b2a7fd0](https://github.com/angular/angular/commit/b2a7fd0))
* **Router:** do not kill event-emitter on navigation failure ([cbeeff2](https://github.com/angular/angular/commit/cbeeff2)), closes [#7692](https://github.com/angular/angular/issues/7692) [#7532](https://github.com/angular/angular/issues/7532) [#7692](https://github.com/angular/angular/issues/7692)
* **Router:** replace state when normalized path is equal to current normalized path ([2bf21e1](https://github.com/angular/angular/commit/2bf21e1)), closes [#7829](https://github.com/angular/angular/issues/7829) [#7897](https://github.com/angular/angular/issues/7897)
* **scripts:** fix: correct failing to push into builds repo on rerun  ([17f317d](https://github.com/angular/angular/commit/17f317d31efbd68bc6bec73f56c8ce039825d23b))
* **security:** support XSSI prefixes with and without commas. ([729dc3b](https://github.com/angular/angular/commit/729dc3b))
* **test-runner:** make karma internal reporter compatible with 0.13.20 (#8977) ([fe8a7b0](https://github.com/angular/angular/commit/fe8a7b0))
* **testing:**  add discardPeriodicTasks to be used with fakeAsync (#8629) ([0cb93a4](https://github.com/angular/angular/commit/0cb93a4)), closes [#8616](https://github.com/angular/angular/issues/8616)
* **tests:** Execute the security specs only once ([9634e8d](https://github.com/angular/angular/commit/9634e8d))
* **travis:** pin the version of tsickle for offline_compiler_test ([7aa1790](https://github.com/angular/angular/commit/7aa1790))
* **tsickle:** put the tsickle support code at EOF ([3cfe281](https://github.com/angular/angular/commit/3cfe281))
* **typings:** remove rxjs workaround ([798bfac](https://github.com/angular/angular/commit/798bfac)), closes [#7198](https://github.com/angular/angular/issues/7198)
* **upgrade:** allow deeper nesting of ng2 components/directives (#8949) ([48bf349](https://github.com/angular/angular/commit/48bf349))
* **upgrade:** allow functions for template and templateUrl (#9022) ([a19c4e8](https://github.com/angular/angular/commit/a19c4e8))
* **upgrade:** Ensure upgrade adapter works on angular.js 1.2 (#8647) ([cbc8d0a](https://github.com/angular/angular/commit/cbc8d0a))
* **upgrade:** fallback to root ng2 injector when element is compiled outside the document (#86 ([db82906](https://github.com/angular/angular/commit/db82906))
* **upgrade:** make bindings available on $scope in controller & link function (#8645) ([6cdc53c](https://github.com/angular/angular/commit/6cdc53c))

### Features

* **animations:** provide support for offline compilation ([fa0718b](https://github.com/angular/angular/commit/fa0718b))
* **animations:** support styling of the default animation state ([36d25f2](https://github.com/angular/angular/commit/36d25f2)), closes [#9013](https://github.com/angular/angular/issues/9013)
* **build:** Added a version stamp in .metadata.json files. ([2d8f776](https://github.com/angular/angular/commit/2d8f776)), closes [#8974](https://github.com/angular/angular/issues/8974) [#8981](https://github.com/angular/angular/issues/8981)
* **ChangeDetectorRef:** make detectChanges() correct ([6028368](https://github.com/angular/angular/commit/6028368)), closes [#8599](https://github.com/angular/angular/issues/8599)
* **common:** DatePipe supports ISO string ([abc266f](https://github.com/angular/angular/commit/abc266f)), closes [#7794](https://github.com/angular/angular/issues/7794)
* **common/datePipe:** change date formatter to use correct pattern closes #7008 (#8154) ([324f014](https://github.com/angular/angular/commit/324f014)), closes [#7008](https://github.com/angular/angular/issues/7008) [(#8154](https://github.com/(/issues/8154)
* **compiler:** Add support for limited function calls in metadata ([5504ca1](https://github.com/angular/angular/commit/5504ca1e389f7bfd74604b8573ddaab3e9f07b0d))
* **compiler:** Add support for `<ng-container>` ([0dbff55](https://github.com/angular/angular/commit/0dbff55bc6750653c5f8decc06d07e7269e3d6a5))
* **ComponentResolver:** Add a SystemJS resolver for compiled apps (#9145) ([a6e5ddc](https://github.com/angular/angular/commit/a6e5ddc))
* **core:** add a component resolver that can load components lazily using system.js ([1a0aea6](https://github.com/angular/angular/commit/1a0aea6))
* **core:** introduce support for animations ([5e0f8cf](https://github.com/angular/angular/commit/5e0f8cf)), closes [#8734](https://github.com/angular/angular/issues/8734)
* **core/linker:** add SimpleChanges type to lifecycle_hooks to simplify OnChanges signature ([0a872ff](https://github.com/angular/angular/commit/0a872ff)), closes [#8557](https://github.com/angular/angular/issues/8557)
* **debug:** collect styles and classes for the DebugElement ([155b882](https://github.com/angular/angular/commit/155b882))
* **enableDebugTools:** return ComponentRef ([4086b49](https://github.com/angular/angular/commit/4086b49))
* **forms:** add new forms folder ([4c39eac](https://github.com/angular/angular/commit/4c39eac))
* **forms:** add the submitted flag to NgForm and NgFormModel directives ([420e83a](https://github.com/angular/angular/commit/420e83a)), closes [#2960](https://github.com/angular/angular/issues/2960) [#7449](https://github.com/angular/angular/issues/7449)
* **forms:** allow ngModel to register with parent form ([4ed6cf7](https://github.com/angular/angular/commit/4ed6cf7))
* **forms:** compose validator fns automatically if arrays ([61960c5](https://github.com/angular/angular/commit/61960c51a3b21d1cfba523f53016f6284182d4e3))
* **forms:** support setting control name in ngModelOptions ([a191e96](https://github.com/angular/angular/commit/a191e9697c32062eda06cd1f1cfd856d89c16026))
* **forms:** add easy way to switch between forms modules ([22916bb](https://github.com/angular/angular/commit/22916bb5d1abf2818d7d8d99d39605af251f42e4))
* **HtmlLexer:** add support for alphabetic cases ([43148d8](https://github.com/angular/angular/commit/43148d8))
* **http:** added withCredentials support ([95af14b](https://github.com/angular/angular/commit/95af14b)), closes [#7281](https://github.com/angular/angular/issues/7281) [#7281](https://github.com/angular/angular/issues/7281)
* **http:** automatically set request Content-Type header based on body type ([0f0a8ad](https://github.com/angular/angular/commit/0f0a8ad)), closes [#7310](https://github.com/angular/angular/issues/7310)
* **http:** implement Response.prototype.toString() to make for a nicer error message ([89f6108](https://github.com/angular/angular/commit/89f6108)), closes [#7511](https://github.com/angular/angular/issues/7511)
* **http:** set the statusText property from the XMLHttpRequest instance ([3019140](https://github.com/angular/angular/commit/3019140)), closes [#4162](https://github.com/angular/angular/issues/4162)
* **i18n:** extract messages ([ac11567](https://github.com/angular/angular/commit/ac11567))
* **i18n:** support implicit tags/attributes ([3e5716e](https://github.com/angular/angular/commit/3e5716e))
* **i18n:** generate error on unknown cases ([5267115](https://github.com/angular/angular/commit/5267115)), closes [#9094](https://github.com/angular/angular/issues/9094)
* **i18n:** Add file paths to error messages ([fe01e2e](https://github.com/angular/angular/commit/fe01e2efb7e21ed0331e403a7508ac7fca946108))
* **metadata:** emit all methods ([29700aa](https://github.com/angular/angular/commit/29700aa))
* **NgTemplateOutlet:** add context to NgTemplateOutlet ([164a091](https://github.com/angular/angular/commit/164a091)), closes [#9042](https://github.com/angular/angular/issues/9042)
* **NgZone:** isStable ([587c119](https://github.com/angular/angular/commit/587c119)), closes [#8108](https://github.com/angular/angular/issues/8108)
* **platform-browser-dynamic:** re-add a deprecated platform-browser-dynamic ([172a566](https://github.com/angular/angular/commit/172a566))
* **platform-browser-dynamic:** fix public exports for web-worker related symbols ([6e62217](https://github.com/angular/angular/commit/6e62217))
* **regex_url_paths:** add `regex_group_names` to handle consistency with serializers ([ce013a3](https://github.com/angular/angular/commit/ce013a3)), closes [#7554](https://github.com/angular/angular/issues/7554) [#7694](https://github.com/angular/angular/issues/7694)
* **renderer:** add a `setElementStyles` method ([1ac38bd](https://github.com/angular/angular/commit/1ac38bd))
* **router:** export RouterLink and RouterOutlet (#8912) ([1c92903](https://github.com/angular/angular/commit/1c92903))
* **router:** update router to support lazy loading ([0f1465b](https://github.com/angular/angular/commit/0f1465b))
* **SchemaRegistry:** add Node.textContent ([3b80ab5](https://github.com/angular/angular/commit/3b80ab5)), closes [#8413](https://github.com/angular/angular/issues/8413)
* **security:** add an HTML sanitizer. ([f86edae](https://github.com/angular/angular/commit/f86edae))
* **security:** add tests for style sanitisation. ([7b6c4d5](https://github.com/angular/angular/commit/7b6c4d5))
* **security:** add tests for URL sanitization. ([7a524e3](https://github.com/angular/angular/commit/7a524e3))
* **security:** allow data: URLs for images and videos. ([dd50124](https://github.com/angular/angular/commit/dd50124))
* **security:** allow url(...) style values. ([15ae710](https://github.com/angular/angular/commit/15ae710)), closes [#8514](https://github.com/angular/angular/issues/8514)
* **security:** Automatic XSRF handling. ([4d793c4](https://github.com/angular/angular/commit/4d793c4))
* **security:** complete DOM security schema. ([040b101](https://github.com/angular/angular/commit/040b101))
* **security:** document iframe src to be TRUSTED_URL. ([3463047](https://github.com/angular/angular/commit/3463047))
* add minified bundles ([9175a04](https://github.com/angular/angular/commit/9175a04))
* **security:** expose the safe value types. ([50c9bed](https://github.com/angular/angular/commit/50c9bed)), closes [#8568](https://github.com/angular/angular/issues/8568)
* **security:** fill in missing security contexts. ([67ed2e2](https://github.com/angular/angular/commit/67ed2e2))
* **security:** strip XSSI prefix from XHR responses. ([df1b1f6](https://github.com/angular/angular/commit/df1b1f6))
* **security:** support transform CSS functions for sanitization. ([8b1b427](https://github.com/angular/angular/commit/8b1b427)), closes [#8514](https://github.com/angular/angular/issues/8514)
* **security:** warn users when sanitizing in dev mode. ([3e68b7e](https://github.com/angular/angular/commit/3e68b7e)), closes [#8522](https://github.com/angular/angular/issues/8522)
* **shadow_css:** add encapsulation support for CSS @supports at-rule ([cb84cbf](https://github.com/angular/angular/commit/cb84cbf)), closes [#7944](https://github.com/angular/angular/issues/7944)
* **ViewEncapsulation:** default ViewEncapsulation to configurable ([f93512b](https://github.com/angular/angular/commit/f93512b)), closes [#7883](https://github.com/angular/angular/issues/7883)


### BREAKING CHANGES
* Location#platformStrategy property was previously accidentally exported as public
If any application requires access to the current location strategy, it should be accessed via DI instead
by injecting the LocationStrategy token.
The likelihood of anyone actually depending on this property is very low.

* DirectiveNormalizer takes new constructor arguments, `config:CompilerConfig`.

* `Parser` constructor required new parameter `config: CompilerConfig` as second argument.

* Bundles are now in the bundles/ subdirectory within each package

* HTML, style values, and URLs are now automatically sanitized. Values that do not match are escaped
  or ignored. When binding a URL or style property that would get ignored, bind to a value
  explicitly marked as safe instead by injection the DOM sanitization service:
  
  ```
  class MyComponent {
    constructor(sanitizer: DomSanitizationService) {
      // ONLY DO THIS FOR VALUES YOU KNOW TO BE SAFE! NEVER ALLOW USER DATA IN THIS!
      this.safeStyleValue = sanitizer.bypassSecurityTrustStyle('rotate(90deg)');
      // then bind to `safeStyleValue` in your template.
    }
  }
  ```

* `PLATFORM_PIPES` and `PLATFORM_DIRECTIVES` now are fields on `CompilerConfig`. 
  Instead of providing a binding to these tokens, provide a binding for `CompilerConfig` instead.

* `CompilerConfig` used to take positional arguments and now takes named arguments.

### Deprecation

* `Parse5DomAdapter` will no longer be exported from `@angular/platform-server` as a public API as of RC.3.
  A new function called `serverBootstrap()` will be provided, which will automatically set the correct
  `document` during platform initialization.

### Reverts

* Revert fix(compiler): support string tokens with `.` inside. ([cc86fee](https://github.com/angular/angular/commit/cc86fee))

<a name="2.0.0-rc.1"></a>
# 2.0.0-rc.1 (2016-05-03)

### Known Issues

*** SECURITY WARNING ***
Contextual escaping is not yet implemented in Angular 2. This will be fixed in the upcoming RC.
In the meantime make sure to correctly escape all values that go into the DOM.
*** SECURITY WARNING ***

- source maps for umd bundles are missing
- `Ruler` service is not being reexported via `@angular/platform-browser`


### Bug Fixes

* **compiler:** calculate the right moduleUrl ([3a40cb1](https://github.com/angular/angular/commit/3a40cb1))
* **compiler:** don’t emit metadata for generated files ([43e0fa5](https://github.com/angular/angular/commit/43e0fa5))
* **compiler:** fix where pipes live ([dd6e0cf](https://github.com/angular/angular/commit/dd6e0cf)), closes [#8408](https://github.com/angular/angular/issues/8408)
* **compiler:** use absolute paths for comparing module urls ([52a6ba7](https://github.com/angular/angular/commit/52a6ba7))
* **compiler:** use rootDirs compilerOption to affect genDir layout. ([a033f83](https://github.com/angular/angular/commit/a033f83))
* **docs:** upgrade deprecated ngFor-Syntax ([27a7b51](https://github.com/angular/angular/commit/27a7b51))
* **router:** add support for ../ ([89704e0](https://github.com/angular/angular/commit/89704e0))
* **testing:** Check for pending macrotasks in ComponentFixture.whenStable() and ComponentFixtu ([509f4ec](https://github.com/angular/angular/commit/509f4ec)), closes [#8389](https://github.com/angular/angular/issues/8389)
* **router-deprecated:** inheriting from RouterOutlet works now

### Features

* **router:** make RouterLink accept single values ([b625f24](https://github.com/angular/angular/commit/b625f24))



<a name="2.0.0-rc.0"></a>
# 2.0.0-rc.0 (2016-05-02)

This is the first release candidate that contains repackaging of Angular into individual packages one per each feature area.

All of the packages are now distributed under the @angular npm scope. This changes how Angular is installed via npm and how you import the code.

To install Angular for a browser application please use:

```
npm install --save @angular/core @angular/compiler @angular/common @angular/platform-browser @angular/platform-browser-dynamic rxjs@5.0.0-beta.6 zone.js@0.6.12
```

To import various symbols please adjust the paths in the following way:

- `angular2/core` -> `@angular/core`
- `angular2/compiler` -> `@angular/compiler`
- `angular2/common` -> `@angular/common`
- `angular2/platform/browser` -> `@angular/platform-browser` (applications with precompiled templates) + `@angular/platform-browser-dynamic` (applications that compile templates on the fly)
- `angular2/platform/server` -> `@angular/platform-server`
- `angular2/testing` -> `@angular/core/testing` (it/describe/..) + `@angular/compiler/testing` (TestComponentBuilder) + `@angular/platform-browser/testing`
- `angular2/upgrade` -> `@angular/upgrade`
- `angular2/http` -> `@angular/http`
- `angular2/router` -> `@angular/router-deprecated` (snapshot of the component router from beta.17 for backwards compatibility)
- new package: `@angular/router` - component router with several [breaking changes](https://docs.google.com/document/d/1WLSNV3V1AKdwLwRiLuN7JqbPBKQ_S5quRlcT5LPIldw/edit#heading=h.blfh5ya9sf5r)



### Features

* **core:** introduce template context ([cacdead](https://github.com/angular/angular/commit/cacdead)), closes [#8321](https://github.com/angular/angular/issues/8321)
* **core:** support the decorator data that tsickle produces ([b6fd811](https://github.com/angular/angular/commit/b6fd811))
* **di:** support map literals as providers ([46cd868](https://github.com/angular/angular/commit/46cd868))
* **offline compiler:** a replacement for tsc that compiles templates ([78946fe](https://github.com/angular/angular/commit/78946fe))
* **offline compiler:** add metadata emit ([072446a](https://github.com/angular/angular/commit/072446a))
* **router:** add CanDeactivate ([deba804](https://github.com/angular/angular/commit/deba804))
* **router:** add link that support only absolute urls ([fa5bfe4](https://github.com/angular/angular/commit/fa5bfe4))
* **router:** add Router and RouterOutlet to support aux routes ([6e1fed4](https://github.com/angular/angular/commit/6e1fed4))
* **router:** add RouterLink ([de56dd5](https://github.com/angular/angular/commit/de56dd5))
* **router:** add RouterUrlSerializer ([79830f1](https://github.com/angular/angular/commit/79830f1))
* **router:** add RouteTree and UrlTree as aliases to Tree<RouteSegment> and Tree<UrlSegment> ([277b1fc](https://github.com/angular/angular/commit/277b1fc))
* **router:** add support for wildcards ([8836219](https://github.com/angular/angular/commit/8836219))
* **router:** adds an example app using the new router ([602641d](https://github.com/angular/angular/commit/602641d))
* **router:** change location when navigating ([560cc14](https://github.com/angular/angular/commit/560cc14))
* **router:** implement relative navigation ([e5b87e5](https://github.com/angular/angular/commit/e5b87e5))
* **router:** implements support for router-link-active ([ec4ca0e](https://github.com/angular/angular/commit/ec4ca0e))
* **router:** listen to location changes ([62a0809](https://github.com/angular/angular/commit/62a0809)), closes [#8362](https://github.com/angular/angular/issues/8362)
* **router:** set router-link-active when RouterLink is active ([4fe0f1f](https://github.com/angular/angular/commit/4fe0f1f)), closes [#8376](https://github.com/angular/angular/issues/8376)
* **router:** update recognize to handle matrix parameters ([446657b](https://github.com/angular/angular/commit/446657b))
* **router:** update recognize to support aux routes ([d35c109](https://github.com/angular/angular/commit/d35c109))
* **router:** update url parser to handle aux routes ([fad3b64](https://github.com/angular/angular/commit/fad3b64))
* **testing:** Use NgZone in TestComponentBuilder. ([769835e](https://github.com/angular/angular/commit/769835e)), closes [#8301](https://github.com/angular/angular/issues/8301)
* **tests:** add ROUTER_FAKE_PROVIDERS to angular2/alt_router/router_testing_providers ([0f1b370](https://github.com/angular/angular/commit/0f1b370))

### Bug Fixes

* **metadata:** Preserve Provider expressions ([7c0d497](https://github.com/angular/angular/commit/7c0d497))
* **codegen:** event handler has boolean return type ([ca40ef5](https://github.com/angular/angular/commit/ca40ef5))
* **compiler:** fix cross view references and providers with `useValue`. ([f114d6c](https://github.com/angular/angular/commit/f114d6c)), closes [#8366](https://github.com/angular/angular/issues/8366)
* **compiler:** project using the right directive as component. ([0f774df](https://github.com/angular/angular/commit/0f774df)), closes [#8344](https://github.com/angular/angular/issues/8344)
* **compiler:** support css stylesheets in offline compiler ([00d3b60](https://github.com/angular/angular/commit/00d3b60))
* **compiler:** support empty array and map literals. ([11955f9](https://github.com/angular/angular/commit/11955f9)), closes [#8336](https://github.com/angular/angular/issues/8336)
* **compiler_cli:** make sure the generated code gets compiled via tic ([163d80a](https://github.com/angular/angular/commit/163d80a))
* **core:** check components if an event handler inside of an embedded view fires. ([4d691b6](https://github.com/angular/angular/commit/4d691b6)), closes [#8242](https://github.com/angular/angular/issues/8242)
* **core:** return the ChangeDetectorRef of the component also for embedded views. ([351f24e](https://github.com/angular/angular/commit/351f24e))
* **metadata:** expose Providers in metadata ([8bf6ef6](https://github.com/angular/angular/commit/8bf6ef6))
* **perf:** don’t use `try/catch` in production mode ([b1a9e44](https://github.com/angular/angular/commit/b1a9e44)), closes [#8338](https://github.com/angular/angular/issues/8338)
* **router:** canDeactivate should not change the url when returns false ([76d6f5f](https://github.com/angular/angular/commit/76d6f5f)), closes [#8360](https://github.com/angular/angular/issues/8360)
* **router:** create a route tree when creating the router service ([ca13f1c](https://github.com/angular/angular/commit/ca13f1c)), closes [#8365](https://github.com/angular/angular/issues/8365)
* **typescript:** strip abstract keyword from properties in .d.ts ([a84c2d7](https://github.com/angular/angular/commit/a84c2d7)), closes [#8339](https://github.com/angular/angular/issues/8339)



### OTHER BREAKING CHANGES


* - ViewRef.changeDetectorRef was removed as using ChangeDetectorRefs
  for EmbeddedViewRefs does not make sense. Use ComponentRef.changeDetectorRef
  or inject ChangeDetectorRef instead.

* - Before, a `EmbeddedViewRef` used to have methods for
  setting variables. Now, a user has to pass in a context
  object that represents all variables when an `EmbeddedViewRef`
  should be created.
- `ViewContainerRef.createEmbeddedViewRef` now takes
   a context object as 2nd argument.
- `EmbeddedViewRef.setLocal` and `getLocal` have been removed.
  Use `EmbeddedViewRef.context` to access the context.
- `DebugNode.locals` has been removed. Use the new methods `DebugElement.references`
  to get the references that are present on this element,
  or `DebugElement.context` to get the context of the `EmbeddedViewRef` or the component to which the element belongs.
* - Depending on if you are using precompiled templates or you are compiling templates on the fly, the setup for the base test providers has changed:

Before:
```js
// Somewhere in test setup
import {setBaseTestProviders} from 'angular2/testing';
import {
  TEST_BROWSER_PLATFORM_PROVIDERS,
  TEST_BROWSER_APPLICATION_PROVIDERS
} from 'angular2/platform/testing/browser';
setBaseTestProviders(TEST_BROWSER_PLATFORM_PROVIDERS,
                     TEST_BROWSER_APPLICATION_PROVIDERS);
```
After (applications that compile templates on the fly):
```js
// Somewhere in the test setup
import {setBaseTestProviders} from '@angular/core/testing';
import {
  TEST_BROWSER_DYNAMIC_PLATFORM_PROVIDERS,
  TEST_BROWSER_DYNAMIC_APPLICATION_PROVIDERS
} from '@angular/platform-browser-dynamic/testing';
setBaseTestProviders(TEST_BROWSER_DYNAMIC_PLATFORM_PROVIDERS,
                     TEST_BROWSER_DYNAMIC_APPLICATION_PROVIDERS);
```

After (applications with precompiled templates):
```js
// Somewhere in the test setup
import {setBaseTestProviders} from '@angular/core/testing';
import {
  TEST_BROWSER_STATIC_PLATFORM_PROVIDERS,
  TEST_BROWSER_STATIC_APPLICATION_PROVIDERS
} from '@angular/platform-browser/testing';
setBaseTestProviders(TEST_BROWSER_STATIC_PLATFORM_PROVIDERS,
                     TEST_BROWSER_STATIC_APPLICATION_PROVIDERS);
```


<a name="2.0.0-beta.17"></a>
# 2.0.0-beta.17 (2016-04-28)


### Bug Fixes

* **changelog:** fix changelog script. ([c209836](https://github.com/angular/angular/commit/c209836))
* **compiler:** Allow templates to access variables that are declared afterwards. ([1e8864c](https://github.com/angular/angular/commit/1e8864c)), closes [#8261](https://github.com/angular/angular/issues/8261)
* **core:** properly evaluate expressions with conditional and boolean operators ([1ad2a02](https://github.com/angular/angular/commit/1ad2a02)), closes [#8235](https://github.com/angular/angular/issues/8235) [#8244](https://github.com/angular/angular/issues/8244) [#8282](https://github.com/angular/angular/issues/8282)
* **metadata:** Do not attach module names to metadata. ([d964888](https://github.com/angular/angular/commit/d964888)), closes [#8225](https://github.com/angular/angular/issues/8225) [#8082](https://github.com/angular/angular/issues/8082) [#8256](https://github.com/angular/angular/issues/8256)
* **testing:** allow test component builder to override directives from lists ([ff2ae7a](https://github.com/angular/angular/commit/ff2ae7a)), closes [#7397](https://github.com/angular/angular/issues/7397) [#8217](https://github.com/angular/angular/issues/8217)

### Features

* **compiler:** ElementSchema now has explicit DOM schema information ([d327ac4](https://github.com/angular/angular/commit/d327ac4)), closes [#8179](https://github.com/angular/angular/issues/8179)
* **core:** separate refs from vars. ([d2efac1](https://github.com/angular/angular/commit/d2efac1)), closes [#7158](https://github.com/angular/angular/issues/7158) [#8264](https://github.com/angular/angular/issues/8264)


### BREAKING CHANGES

The reference `#...` now always means `ref-`.

**Before:**
- Outside of `ngFor`, a `#...` meant a reference.
- Inside of `ngFor`, it meant a local variable.

This pattern was confusing.

**After:**

- `<template #abc>` now defines a reference to a TemplateRef, instead of an input variable used inside of the template.
- Inside of structural directives that declare local variables, such as `*ngFor`, usage of `#...` is deprecated. Use `let` instead.
  - `<div *ngFor="#item of items">` now becomes `<div *ngFor="let item of items">`
- `var-...` is deprecated.
  - use `#` or a `ref-` outside of `*ngFor`
  - for `ngFor`, use the syntax:  `<template ngFor let-... [ngForOf]="...">`


<a name="2.0.0-beta.16"></a>
# 2.0.0-beta.16 (2016-04-26)


### Bug Fixes

* **angular_1_router:** Removed arrow function from module template ([d094a85](https://github.com/angular/angular/commit/d094a85)), closes [#8076](https://github.com/angular/angular/issues/8076)
* **build:** ignore Dart warnings for external code. ([4140405](https://github.com/angular/angular/commit/4140405))
* **codegen:** add explicit any to class fields ([c8d00dc](https://github.com/angular/angular/commit/c8d00dc)), closes [#8204](https://github.com/angular/angular/issues/8204) [#8205](https://github.com/angular/angular/issues/8205)
* **compiler:** only call pure pipes if their input changed. ([8db6215](https://github.com/angular/angular/commit/8db6215))
* **compiler:** properly implement pure pipes and change pipe syntax ([152a117](https://github.com/angular/angular/commit/152a117))
* **compiler:** support string tokens with `.` inside. ([cc86fee](https://github.com/angular/angular/commit/cc86fee))
* **compiler:** use DI order for change detection order. ([67d05eb](https://github.com/angular/angular/commit/67d05eb)), closes [#8198](https://github.com/angular/angular/issues/8198)
* **core:** various minor compiler fixes ([2f70457](https://github.com/angular/angular/commit/2f70457)), closes [#8162](https://github.com/angular/angular/issues/8162)
* **forms:** ensure select model updates in firefox and ie ([c3daccd](https://github.com/angular/angular/commit/c3daccd)), closes [#6573](https://github.com/angular/angular/issues/6573) [#8148](https://github.com/angular/angular/issues/8148)
* **forms:** improve error message when ngFormModel is missing a form ([12837e1](https://github.com/angular/angular/commit/12837e1)), closes [#8136](https://github.com/angular/angular/issues/8136) [#8143](https://github.com/angular/angular/issues/8143)
* **forms:** number input should report null when blank ([e69cb40](https://github.com/angular/angular/commit/e69cb40)), closes [#6932](https://github.com/angular/angular/issues/6932) [#8141](https://github.com/angular/angular/issues/8141)
* **metadata:** emit metadata rooted at 'angular2' ([9889c21](https://github.com/angular/angular/commit/9889c21)), closes [#8144](https://github.com/angular/angular/issues/8144) [#8147](https://github.com/angular/angular/issues/8147)
* **release:** Fix the package.json zone.js requirement to 0.6.12 ([6103aa0](https://github.com/angular/angular/commit/6103aa0))
* **tests:** remove payload size check ([22c05b0](https://github.com/angular/angular/commit/22c05b0))
* **transformers:** support `query.read` ([386cc5d](https://github.com/angular/angular/commit/386cc5d)), closes [#8172](https://github.com/angular/angular/issues/8172)
* **upgrade:** clean up scope when element is destroyed ([0fc9ec2](https://github.com/angular/angular/commit/0fc9ec2)), closes [#8102](https://github.com/angular/angular/issues/8102)

### Features

* **codegen:** produce `.ngfactory.dart/ts` files instead of `.template.dart/ts` files. ([c06b0a2](https://github.com/angular/angular/commit/c06b0a2))
* **core:** add `Query.read` and remove `DynamicComponentLoader.loadIntoLocation`. ([efbd446](https://github.com/angular/angular/commit/efbd446))
* **core:** introduce ComponentFactory. ([0c600cf](https://github.com/angular/angular/commit/0c600cf))
* **core:** separate reflective injector from Injector interface ([0a7d10b](https://github.com/angular/angular/commit/0a7d10b))
* **core:** support importUri in StaticReflector ([3e11422](https://github.com/angular/angular/commit/3e11422)), closes [#8195](https://github.com/angular/angular/issues/8195)
* **core:** support non reflective bootstrap. ([9092ac7](https://github.com/angular/angular/commit/9092ac7))
* **html_lexer:** support special forms used by i18n { exp, plural, =0 {} } ([7f29766](https://github.com/angular/angular/commit/7f29766))
* **html_parser:** support special forms used by i18n { exp, plural, =0 {} } ([7c9717b](https://github.com/angular/angular/commit/7c9717b))
* **i18n:** add custom placeholder names ([bb9fb21](https://github.com/angular/angular/commit/bb9fb21)), closes [#7799](https://github.com/angular/angular/issues/7799) [#8057](https://github.com/angular/angular/issues/8057)
* **i18n:** add support for nested expansion forms ([c6244d1](https://github.com/angular/angular/commit/c6244d1)), closes [#7977](https://github.com/angular/angular/issues/7977)
* **i18n:** support plural and gender special forms ([88b0a23](https://github.com/angular/angular/commit/88b0a23))
* **Location:** out of router and into platform/common ([b602bd8](https://github.com/angular/angular/commit/b602bd8)), closes [#7962](https://github.com/angular/angular/issues/7962)
* **NgTemplateOutlet:** add NgTemplateOutlet directive ([f4e6994](https://github.com/angular/angular/commit/f4e6994)), closes [#7615](https://github.com/angular/angular/issues/7615) [#8021](https://github.com/angular/angular/issues/8021)
* **router:** add Router and RouterOutlet ([5a897cf](https://github.com/angular/angular/commit/5a897cf)), closes [#8173](https://github.com/angular/angular/issues/8173)
* **router:** add router metadata ([ef67a0c](https://github.com/angular/angular/commit/ef67a0c))
* **router:** add UrlSegment, RouteSegment, and Tree ([90a1f7d](https://github.com/angular/angular/commit/90a1f7d))
* **router:** implement recognizer ([ef6163e](https://github.com/angular/angular/commit/ef6163e))
* **router:** implement RouterUrlParser ([f698567](https://github.com/angular/angular/commit/f698567))
* **test:** Implement fakeAsync using the FakeAsyncTestZoneSpec from zone.js. ([bab81a9](https://github.com/angular/angular/commit/bab81a9)), closes [#8142](https://github.com/angular/angular/issues/8142)
* **tests:** manage asynchronous tests using zones ([8490921](https://github.com/angular/angular/commit/8490921)), closes [#7735](https://github.com/angular/angular/issues/7735)
* **view_compiler:** codegen DI and Queries ([2b34c88](https://github.com/angular/angular/commit/2b34c88)), closes [#6301](https://github.com/angular/angular/issues/6301) [#6567](https://github.com/angular/angular/issues/6567)


### BREAKING CHANGES

* - pipes now take a variable number of arguments, and not an array that contains all arguments.

* inject can no longer wrap fakeAsync while fakeAsync can wrap inject. So the order in existing tests with inject and fakeAsync has to be switched as follows:
Before:
```
inject([...], fakeAsync((...) => {...}))
```
After:
```
fakeAsync(inject([...], (...) => {...}))
```
You will also need to add the dependency
`'node_modules/zone.js/dist/fake-async-test.js'`
as a served file in your Karma or other test configuration.

* - Injector was renamed into `ReflectiveInjector`,
  as `Injector` is only an abstract class with one method on it
- `Injector.getOptional()` was changed into `Injector.get(token, notFoundValue)`
  to make implementing injectors simpler
- `ViewContainerRef.createComponent` now takes an `Injector`
  instead of `ResolvedProviders`. If a reflective injector
  should be used, create one before calling this method.
  (e.g. via `ReflectiveInjector.resolveAndCreate(…)`.

* - `DynamicComponentLoader.loadIntoLocation` has been removed. Use `@ViewChild(‘myVar’, {read: ViewContainerRef})` to get hold of a `ViewContainerRef` at an element with variable `myVar`. Then call `DynamicComponentLoader.loadNextToLocation`.
- `DynamicComponentLoader.loadNextToLocation` now takes a `ViewContainerRef` instead of an `ElementRef`.
- `AppViewManager` is renamed into `ViewUtils` and is a mere private utility service.

* - `Compiler` is renamed to `ComponentResolver`,
  `Compiler.compileInHost` has been renamed to `ComponentResolver.resolveComponent`.
- `ComponentRef.dispose` is renamed to `ComponentRef.destroy`
- `ViewContainerRef.createHostView` is renamed to `ViewContainerRef.createComponent`
- `ComponentFixture_` has been removed, the class `ComponentFixture`
  can now be created directly as it is no more using private APIs.

* `Location` and other related providers have been moved out of `router` and into `platform/common`. `BrowserPlatformLocation` is not meant to be used directly however advanced configurations may use it via the following import change.
Before:
```
import {
  PlatformLocation,
  Location,
  LocationStrategy,
  HashLocationStrategy,
  PathLocationStrategy,
  APP_BASE_HREF}
from 'angular2/router';
import {BrowserPlatformLocation} from 'angular2/src/router/location/browser_platform_location';
```
After:
```
import {
  PlatformLocation,
  Location,
  LocationStrategy,
  HashLocationStrategy,
  PathLocationStrategy,
  APP_BASE_HREF}
from 'angular2/platform/common';
import {BrowserPlatformLocation} from 'angular2/src/platform/browser/location/browser_platform_location';
```

* `injectAsync` is now deprecated. Instead, use the `async` function
to wrap any asynchronous tests.

You will also need to add the dependency
`'node_modules/zone.js/dist/async-test.js'`
as a served file in your Karma or other test configuration.

Before:
```
it('should wait for returned promises', injectAsync([FancyService], (service) => {
  return service.getAsyncValue().then((value) => { expect(value).toEqual('async value'); });
}));
it('should wait for returned promises', injectAsync([], () => {
  return somePromise.then(() => { expect(true).toEqual(true); });
}));
```
After:
```
it('should wait for returned promises', async(inject([FancyService], (service) => {
  service.getAsyncValue().then((value) => { expect(value).toEqual('async value'); });
})));
// Note that if there is no injection, we no longer need `inject` OR `injectAsync`.
it('should wait for returned promises', async(() => {
  somePromise.then(() => { expect(true).toEqual(true); });
}));
```

* - Renderer:
  * renderComponent method is removed form `Renderer`, only present on `RootRenderer`
  * Renderer.setDebugInfo is removed. Renderer.createElement / createText / createTemplateAnchor
    now take the DebugInfo directly.
- Query semantics:
  * Queries don't work with dynamically loaded components.
  * e.g. for router-outlet: loaded components can't be queries via @ViewQuery,
    but router-outlet emits an event `activate` now that emits the activated component
- Exception classes and the context inside changed (renamed fields)
- DebugElement.attributes is an Object and not a Map in JS any more
- ChangeDetectorGenConfig was renamed into CompilerConfig
- AppViewManager.createEmbeddedViewInContainer / AppViewManager.createHostViewInContainer
  are removed, use the methods in ViewContainerRef instead
- Change detection order changed:
  * 1. dirty check component inputs
  * 2. dirty check content children
  * 3. update render nodes



<a name="2.0.0-beta.15"></a>
# 2.0.0-beta.15 (2016-04-13)


### Bug Fixes

* **7837:** MetadataCollector takes no parameters for the constructor. ([c17dc1c](https://github.com/angular/angular/commit/c17dc1c)), closes [#7838](https://github.com/angular/angular/issues/7838)
* **7987:** Incremental build works with new trees ([08b2956](https://github.com/angular/angular/commit/08b2956)), closes [#7989](https://github.com/angular/angular/issues/7989)
* **build:** ignore dart warnings `The name … is shown, but not used` ([01e6b8c](https://github.com/angular/angular/commit/01e6b8c)), closes [#8045](https://github.com/angular/angular/issues/8045)
* **payload:** increase payload size limit temporarily ([28e657d](https://github.com/angular/angular/commit/28e657d))
* **RouterLink:** ignore optional parameters when checking for active routes ([5e2bc5c](https://github.com/angular/angular/commit/5e2bc5c)), closes [#6459](https://github.com/angular/angular/issues/6459) [#7834](https://github.com/angular/angular/issues/7834)
* **select:** set value individually from ngModel ([e1e44a9](https://github.com/angular/angular/commit/e1e44a9)), closes [#7975](https://github.com/angular/angular/issues/7975) [#7978](https://github.com/angular/angular/issues/7978)
* **upgrade:** make upgradeAdapter upgrade angular 1 components correctly ([247964a](https://github.com/angular/angular/commit/247964a)), closes [#7951](https://github.com/angular/angular/issues/7951)

### Features

* **compiler:** Add an implementation for XHR that uses a template cache to load template files. ([a596b88](https://github.com/angular/angular/commit/a596b88)), closes [#7940](https://github.com/angular/angular/issues/7940)
* **gestures:** allow override of Hammer default configuration ([6cbf990](https://github.com/angular/angular/commit/6cbf990)), closes [#7924](https://github.com/angular/angular/issues/7924)
* **ngFor:** Support convenience  view local in ngFor ([ccff175](https://github.com/angular/angular/commit/ccff175)), closes [#8013](https://github.com/angular/angular/issues/8013)
* **parser:** TemplateParser.tryParse() returns both the AST and errors ([226e662](https://github.com/angular/angular/commit/226e662)), closes [#7858](https://github.com/angular/angular/issues/7858)
* **transformers:** changes transformers to collect information about providers and resolve identifi ([3b60503](https://github.com/angular/angular/commit/3b60503))
* **transformers:** special case Profiler ([83b8f59](https://github.com/angular/angular/commit/83b8f59))
* **typescript:** update to 1.9 nightly. ([3412aba](https://github.com/angular/angular/commit/3412aba)), closes [#8003](https://github.com/angular/angular/issues/8003)

### BREAKING CHANGES

* In Dart files, `import 'package:angular2/bootstrap.dart'` no longer works.
  Instead, use `import 'package:angular2/platform/browser.dart'`.

### Reverts

* Revert "chore(format): update to latest formatter" ([60727c4](https://github.com/angular/angular/commit/60727c4))



<a name="2.0.0-beta.14"></a>
# 2.0.0-beta.14 (2016-04-07)


### Bug Fixes

* **forms:** support both value and ng-value ([8db97b0](https://github.com/angular/angular/commit/8db97b0))
* **router:** allow forward slashes in query parameters ([4902244](https://github.com/angular/angular/commit/4902244)), closes [#7824](https://github.com/angular/angular/issues/7824)
* **select:** support objects as select values ([74e2bd7](https://github.com/angular/angular/commit/74e2bd7)), closes [#4843](https://github.com/angular/angular/issues/4843) [#7842](https://github.com/angular/angular/issues/7842)
* **select:** update name from ng-value to ngValue ([3ca6df8](https://github.com/angular/angular/commit/3ca6df8)), closes [#7939](https://github.com/angular/angular/issues/7939)
* **upgrade:** leak when angular1 destroys element ([9be04f8](https://github.com/angular/angular/commit/9be04f8)), closes [#6401](https://github.com/angular/angular/issues/6401) [#7935](https://github.com/angular/angular/issues/7935)

### Features

* **dart/transform:** Avoid `print` in transformer code. ([e310bee](https://github.com/angular/angular/commit/e310bee)), closes [#7855](https://github.com/angular/angular/issues/7855)
* **static-reflector:** Added StaticReflector ([0dbf959](https://github.com/angular/angular/commit/0dbf959))





<a name="2.0.0-beta.13"></a>
# 2.0.0-beta.13 (2016-03-31)


### Bug Fixes

* **build:** MetadataCollector correctly collects property metadata ([111afcd](https://github.com/angular/angular/commit/111afcd)), closes [#7772](https://github.com/angular/angular/issues/7772) [#7773](https://github.com/angular/angular/issues/7773)
* **codegen:** stringify using an opaque ID when toString contains parens. ([90c87fa](https://github.com/angular/angular/commit/90c87fa)), closes [#7825](https://github.com/angular/angular/issues/7825)
* **ngFor:** give more instructive error when binding to non-iterable ([49527ab](https://github.com/angular/angular/commit/49527ab))
* **Router:** handling of special chars in dynamic segments ([0bcfcde](https://github.com/angular/angular/commit/0bcfcde)), closes [#7804](https://github.com/angular/angular/issues/7804)
* **upgrade:** make ngUpgrade work with testability API ([430f367](https://github.com/angular/angular/commit/430f367)), closes [#7603](https://github.com/angular/angular/issues/7603)

### Features

* **build:** Persisting decorator metadata ([ae876d1](https://github.com/angular/angular/commit/ae876d1))
* **compiler:** assert that Component.style is an array ([6de68e2](https://github.com/angular/angular/commit/6de68e2)), closes [#7559](https://github.com/angular/angular/issues/7559)
* **compiler:** Resolvers now use DI to create reflector ([506f4ce](https://github.com/angular/angular/commit/506f4ce)), closes [#7762](https://github.com/angular/angular/issues/7762)
* **Compiler:** Allow overriding the projection selector ([aa966f5](https://github.com/angular/angular/commit/aa966f5)), closes [#6303](https://github.com/angular/angular/issues/6303) [#7742](https://github.com/angular/angular/issues/7742)
* **dart:** Add a dev-mode check for undeclared lifecycle interfaces ([1c20a62](https://github.com/angular/angular/commit/1c20a62)), closes [#6849](https://github.com/angular/angular/issues/6849)
* **facade:** add ListWrapper.flatten ([a1880c3](https://github.com/angular/angular/commit/a1880c3))
* **facade:** add RegExpWrapper.replaceAll to replace all matches using the provided function ([91999e0](https://github.com/angular/angular/commit/91999e0))
* **html_parser:** change HtmlElementAst to store both the start and the end positions ([17c8ec8](https://github.com/angular/angular/commit/17c8ec8))
* **i18n:** implement an i18n-aware html parser ([d272f96](https://github.com/angular/angular/commit/d272f96)), closes [#7738](https://github.com/angular/angular/issues/7738)
* **i18n:** implement xmb deserialization ([d7e1175](https://github.com/angular/angular/commit/d7e1175))
* **i18n:** reexport I18nHtmlParser through the i18n barrel ([d2ca7d8](https://github.com/angular/angular/commit/d2ca7d8))
* **i18n:** update I18nHtmlParser to accept parsed messages ([756121a](https://github.com/angular/angular/commit/756121a))
* **i18n:** update transformers to read a xmb file when provided and use I18nHtmlParser in t ([8430927](https://github.com/angular/angular/commit/8430927)), closes [#7790](https://github.com/angular/angular/issues/7790)


### BREAKING CHANGES

* For static content projection, elements with *-directives are now matched against the element itself vs the template before.

`<p *ngIf="condition" foo></p>`

Before:
```html
    // Use the implicit template for projection
    <ng-content select="template"></ng-content>
```

After:
```html
    // Use the actual element for projection
    <ng-content select="p[foo]"></ng-content>
```

<a name="2.0.0-beta.12"></a>
# 2.0.0-beta.12 (2016-03-23)


### Bug Fixes

* **angular_1_router:** ng-link is generating wrong hrefs ([69c1405](https://github.com/angular/angular/commit/69c1405)), closes [#7423](https://github.com/angular/angular/issues/7423)
* **angular1_router:** support link generation with custom hashPrefixes ([0f8efce](https://github.com/angular/angular/commit/0f8efce))
* **package.json:** remove es6-promise from the peerDependency list ([8b67b07](https://github.com/angular/angular/commit/8b67b07))

### Features

* **dart/transform:** Use angular2/platform/browser as bootstrap lib ([b6507e3](https://github.com/angular/angular/commit/b6507e3)), closes [#7647](https://github.com/angular/angular/issues/7647)


<a name="2.0.0-beta.11"></a>
# 2.0.0-beta.11 (2016-03-18)


### Bug Fixes

* make sure that Zone does not show up in angular2.d.ts ([d4e9b55](https://github.com/angular/angular/commit/d4e9b55fb69d87f948d02905d34fc78221adb11a))
* **common:** remove @internal annotation on SwitchView ([967ae3e](https://github.com/angular/angular/commit/967ae3e)), closes [#7657](https://github.com/angular/angular/issues/7657)
* **router:** RouterOutlet loads component twice in a race condition ([2f581ff](https://github.com/angular/angular/commit/2f581ff)), closes [#7497](https://github.com/angular/angular/issues/7497) [#7545](https://github.com/angular/angular/issues/7545)

### Features

* **i18n:** add a simple dart script extracting all i18n messages from a package ([8326ab3](https://github.com/angular/angular/commit/8326ab3)), closes [#7620](https://github.com/angular/angular/issues/7620)
* **i18n:** create i18n barrel ([a7fe983](https://github.com/angular/angular/commit/a7fe983))
* **i18n:** implement xmb serializer ([e1f8e54](https://github.com/angular/angular/commit/e1f8e54))

### BREAKING CHANGES

`@View()` annotation (previously deprecated) has been removed. Apps should use the `@Component()` decorator instead.


<a name="2.0.0-beta.10"></a>
# 2.0.0-beta.10 (2016-03-17)


### Bug Fixes

* **change_detection:** fix a memory leak ([128acbb](https://github.com/angular/angular/commit/128acbb))
* **closure:** don't throw from top-level ([5824866](https://github.com/angular/angular/commit/5824866))
* **router:** handle URL that does not match a route ([8e3e450](https://github.com/angular/angular/commit/8e3e450)), closes [#7349](https://github.com/angular/angular/issues/7349) [#7203](https://github.com/angular/angular/issues/7203)
* **router/instruction:** ensure toLinkUrl includes extra params ([0d58b13](https://github.com/angular/angular/commit/0d58b13)), closes [#7367](https://github.com/angular/angular/issues/7367)

### Features

* **compiler:** change html parser to preserve comments ([70d18b5](https://github.com/angular/angular/commit/70d18b5))
* **core:** introduce a CSS lexer/parser ([b72bab4](https://github.com/angular/angular/commit/b72bab4))
* **core:** introduce a CSS lexer/parser ([293fa55](https://github.com/angular/angular/commit/293fa55))
* **facade:** add .values to StringMapWrapper ([f1796d6](https://github.com/angular/angular/commit/f1796d6))
* **i18n:** add ngPlural directive ([df1f78e](https://github.com/angular/angular/commit/df1f78e))
* **i18n:** implement a simple version of message extractor ([095db67](https://github.com/angular/angular/commit/095db67)), closes [#7454](https://github.com/angular/angular/issues/7454)
* **shadow_css:** support `/deep/` and `>>>` ([cb38d72](https://github.com/angular/angular/commit/cb38d72)), closes [#7562](https://github.com/angular/angular/issues/7562) [#7563](https://github.com/angular/angular/issues/7563)
* **TAG_DEFINITIONS:** include <meta> and <base> ([2c7c3e3](https://github.com/angular/angular/commit/2c7c3e3)), closes [#7455](https://github.com/angular/angular/issues/7455)

### BREAKING CHANGES

Removed deprecated API from NgZone
- `NgZone.overrideOnTurnStart`
- `NgZone.overrideOnTurnDone`
- `NgZone.overrideOnEventDone`
- `NgZone.overrideOnErrorHandler`

Rename NgZone API
- `NgZone.onTurnStart` => `NgZone.onUnstable`
- `NgZone.onTurnDone` => `NgZone.onMicrotaskEmpty`
- `NgZone.onEventDone` => `NgZone.onStable`


<a name="2.0.0-beta.9"></a>
# 2.0.0-beta.9 (2016-03-09)


### Bug Fixes

* **angular_1_router:** Renamed require statements after TypeScript files are transpiled ([ae49085](https://github.com/angular/angular/commit/ae49085)), closes [#7049](https://github.com/angular/angular/issues/7049)
* **angular1_router:** rename `router` component binding to `$router` ([2548ce8](https://github.com/angular/angular/commit/2548ce8))
* **angular1_router:** rename `router` component binding to `$router` ([1174473](https://github.com/angular/angular/commit/1174473))
* **angular1_router:** support templateUrl components ([5586c29](https://github.com/angular/angular/commit/5586c29))
* **build:** Use fixed version of Chromium Canary that will be updated manually instead of au ([1d49b3e](https://github.com/angular/angular/commit/1d49b3e))
* **router:** support outlets within dynamic components ([7d44b82](https://github.com/angular/angular/commit/7d44b82))

### Features

* **angular1_router:** Add ng-link-active class to active ng-link ([11e8aa2](https://github.com/angular/angular/commit/11e8aa2)), closes [#6882](https://github.com/angular/angular/issues/6882)
* **compiler:** Added spans to HTML parser errors ([19a08f3](https://github.com/angular/angular/commit/19a08f3))
* **dart:** Add a dev-mode check for undeclared lifecycle interfaces ([a3d7629](https://github.com/angular/angular/commit/a3d7629)), closes [#6849](https://github.com/angular/angular/issues/6849)
* **dart/transform:** Create standalone transformers for phases ([15e1614](https://github.com/angular/angular/commit/15e1614))
* **iterable_differ:** support immutable lists ([a10c02c](https://github.com/angular/angular/commit/a10c02c)), closes [#7127](https://github.com/angular/angular/issues/7127)
* **router:** add regex matchers ([75343eb](https://github.com/angular/angular/commit/75343eb)), closes [#7325](https://github.com/angular/angular/issues/7325) [#7126](https://github.com/angular/angular/issues/7126)
* **router:** Added method to get current instruction ([6dce4f4](https://github.com/angular/angular/commit/6dce4f4))
* **transformers:** change 'Missing Identifier' to be an error ([45fd6f0](https://github.com/angular/angular/commit/45fd6f0)), closes [#7403](https://github.com/angular/angular/issues/7403)
* **transformers:** collect provider information ([81beb1c](https://github.com/angular/angular/commit/81beb1c))


### BREAKING CHANGES

* The recently added binding of the current router to the current component
has been renamed from `router` to `$router`.
So now the recommended set up for your bindings in your routed component
is:
```js
{
  ...
  bindings: {
    $router: '<'
  }
}
```




<a name="2.0.0-beta.8"></a>
# 2.0.0-beta.8 (2016-03-02)


### Bug Fixes

* **angular1_router:** rename `$route` service to `$rootRouter` ([a1c3be2](https://github.com/angular/angular/commit/a1c3be2))
* **angular1_router:** rename `router` component binding to `$router` ([edad8e3](https://github.com/angular/angular/commit/edad8e3))
* **angular1_router:** support templateUrl components ([d4a4d81](https://github.com/angular/angular/commit/d4a4d81))
* **change_detection:** allow to destroy `OnPush` components inside of a host event. ([280b86e](https://github.com/angular/angular/commit/280b86e))
* **change_detection:** allow to destroy `OnPush` components inside of a host event. ([ebd438f](https://github.com/angular/angular/commit/ebd438f)), closes [#7192](https://github.com/angular/angular/issues/7192)
* **core:** support `ngFor` that has an `ngIf` as last node ([1779caf](https://github.com/angular/angular/commit/1779caf)), closes [#6304](https://github.com/angular/angular/issues/6304) [#6878](https://github.com/angular/angular/issues/6878)
* **dart/payload:** Fix runtime error in hello_world payload app ([eeb594c](https://github.com/angular/angular/commit/eeb594c)), closes [#7358](https://github.com/angular/angular/issues/7358)
* **differ:** clean up stale identity change refs ([ab36ea0](https://github.com/angular/angular/commit/ab36ea0)), closes [#7193](https://github.com/angular/angular/issues/7193)
* **DomRenderer:** correctly handle namespaced attributes ([c6afea6](https://github.com/angular/angular/commit/c6afea6))
* **Router:** Query strings are copied for HashLocationStrategy ([b47f80e](https://github.com/angular/angular/commit/b47f80e)), closes [#7298](https://github.com/angular/angular/issues/7298)
* **test:** fix a broken test ([9aedef2](https://github.com/angular/angular/commit/9aedef2))
* **transformers:** record reflection info about abstract classes ([05c185a](https://github.com/angular/angular/commit/05c185a)), closes [#7347](https://github.com/angular/angular/issues/7347)
* **transformers:** replace an error with a warning when cannot resolve a symbol ([ee3c580](https://github.com/angular/angular/commit/ee3c580))
* **transformers:** special case types some built-in types, so they can be resolved ([331b9c1](https://github.com/angular/angular/commit/331b9c1))
* **web_worker:** wait for bindings in kitchen sink spec ([4a93f58](https://github.com/angular/angular/commit/4a93f58))
* **web_workers:** make waitForElementText function more stable ([f6a8d04](https://github.com/angular/angular/commit/f6a8d04))
* **WebWorker:** Fix PostMessageBusSink and Source undefined error. ([01fe7f5](https://github.com/angular/angular/commit/01fe7f5)), closes [#7156](https://github.com/angular/angular/issues/7156)
* **WebWorker:** Make MessageBus EventEmitter synchronous ([69c1694](https://github.com/angular/angular/commit/69c1694))

### Features

* **core:** Add `QueryList.forEach` to public api. ([e7470d5](https://github.com/angular/angular/commit/e7470d5))
* **core:** Add `QueryList#forEach` ([b634a25](https://github.com/angular/angular/commit/b634a25))
* **core:** add more debug APIs to inspect the application form a browser ([b5e6319](https://github.com/angular/angular/commit/b5e6319)), closes [#7045](https://github.com/angular/angular/issues/7045) [#7161](https://github.com/angular/angular/issues/7161)
* **core:** drop `ChangeDetectionStrategy.OnPushObserve` ([f60fa14](https://github.com/angular/angular/commit/f60fa14))
* **di:** drop support for injecting types with generics in Dart ([c9a3df9](https://github.com/angular/angular/commit/c9a3df9)), closes [#7262](https://github.com/angular/angular/issues/7262)
* **forms/validators:** pattern validator ([38cb526](https://github.com/angular/angular/commit/38cb526)), closes [#5561](https://github.com/angular/angular/issues/5561)
* **i18n:** added i18nPlural and i18nSelect pipes ([59629a0](https://github.com/angular/angular/commit/59629a0)), closes [#7268](https://github.com/angular/angular/issues/7268)
* **pipes:** add ReplacePipe for string manipulation ([6ef2121](https://github.com/angular/angular/commit/6ef2121))
* **test:** add withProviders for per test providers ([c1a0af5](https://github.com/angular/angular/commit/c1a0af5)), closes [#5128](https://github.com/angular/angular/issues/5128)
* **transformers:** collect data needed for the template compiler ([ebe531b](https://github.com/angular/angular/commit/ebe531b)), closes [#7299](https://github.com/angular/angular/issues/7299)
* **transformers:** collect information for CompileDiDependencyMetadata ([39b6e0e](https://github.com/angular/angular/commit/39b6e0e))
* **transformers:** makes the map of resolved identifiers configurable ([0bb10d6](https://github.com/angular/angular/commit/0bb10d6)), closes [#7359](https://github.com/angular/angular/issues/7359)


### BREAKING CHANGES

* `OnPushObserve` was an experimental
feature for Dart and had
conceptual performance problems,
as setting up observables is slow.
Use `OnPush` instead.

* In Dart we used to support injecting types with generics. As this feature is hard to implement with the upcoming codegen we are dropping it.
Merge cl/115454020 in G3 with this change.

* The `$router` injectable service has been renamed to `$rootRouter`

* The recently added binding of the current router to the current component
has been renamed from `router` to `$router`.
So now the recommended set up for your bindings in your routed component
is:
```js
{
  ...
  bindings: {
    $router: '<'
  }
}
```

<a name="2.0.0-beta.7"></a>
# 2.0.0-beta.7 (2016-02-18)


### Bug Fixes

* **angular_1_router:** Added DI string tokens ([3478d5d](https://github.com/angular/angular/commit/3478d5d)), closes [#4269](https://github.com/angular/angular/issues/4269) [#7031](https://github.com/angular/angular/issues/7031)
* **typing:** Remove re-export of the Promise built-in type. ([265703b](https://github.com/angular/angular/commit/265703b)), closes [#6468](https://github.com/angular/angular/issues/6468)

<a name="2.0.0-beta.6"></a>
# 2.0.0-beta.6 (2016-02-11)


### Bug Fixes

* **angular1-router:** add missing wrapper methods ([55122cd](https://github.com/angular/angular/commit/55122cd)), closes [#6763](https://github.com/angular/angular/issues/6763) [#6861](https://github.com/angular/angular/issues/6861) [#6861](https://github.com/angular/angular/issues/6861)
* **angular1-router:** add support for using the component helper ([d86be24](https://github.com/angular/angular/commit/d86be24)), closes [angular/angular.js#13860](https://github.com/angular/angular.js/issues/13860) [#6076](https://github.com/angular/angular/issues/6076) [#5278](https://github.com/angular/angular/issues/5278)
* **async:** handle synchronous initial value in async pipe ([26e60d6](https://github.com/angular/angular/commit/26e60d6)), closes [#5996](https://github.com/angular/angular/issues/5996)
* **build:** don't try to copy .d.ts files into the npm distro ([16b5217](https://github.com/angular/angular/commit/16b5217)), closes [#6921](https://github.com/angular/angular/issues/6921)
* **compiler:** fix interpolation regexp ([9b0e10e](https://github.com/angular/angular/commit/9b0e10e)), closes [#6056](https://github.com/angular/angular/issues/6056)
* **compiler:** use event names for matching directives ([231773e](https://github.com/angular/angular/commit/231773e)), closes [#6870](https://github.com/angular/angular/issues/6870)
* **core:** add detail to dehydrated detector exception ([e7ad03c](https://github.com/angular/angular/commit/e7ad03c)), closes [#6939](https://github.com/angular/angular/issues/6939)
* **core:** mute mode printing in console in prod mode ([74be3d3](https://github.com/angular/angular/commit/74be3d3)), closes [#6873](https://github.com/angular/angular/issues/6873)
* **di:** throw if a token uses more than 20 dependencies. ([de77700](https://github.com/angular/angular/commit/de77700)), closes [#6690](https://github.com/angular/angular/issues/6690) [#6869](https://github.com/angular/angular/issues/6869)
* **forms:** add RadioButtonValueAccessor to the list of default value accessors ([8f47aa3](https://github.com/angular/angular/commit/8f47aa3))
* **forms:** add support for radio buttons ([e725542](https://github.com/angular/angular/commit/e725542)), closes [#6877](https://github.com/angular/angular/issues/6877)
* **forms:** use strict runtimeType checks instead of instanceof ([50548fb](https://github.com/angular/angular/commit/50548fb)), closes [#6981](https://github.com/angular/angular/issues/6981)
* **Headers:** serializable toJSON ([b55f176](https://github.com/angular/angular/commit/b55f176)), closes [#6073](https://github.com/angular/angular/issues/6073) [#6714](https://github.com/angular/angular/issues/6714)
* **ngFor:** update view locals if identity changes ([0f10624](https://github.com/angular/angular/commit/0f10624)), closes [#6923](https://github.com/angular/angular/issues/6923)
* **router:** Added route data to normalized async route ([df7885c](https://github.com/angular/angular/commit/df7885c)), closes [#6802](https://github.com/angular/angular/issues/6802)
* **router:** don't prepend `/` unnecessarily to Location paths ([c603643](https://github.com/angular/angular/commit/c603643)), closes [#6729](https://github.com/angular/angular/issues/6729) [#5502](https://github.com/angular/angular/issues/5502)
* **router:** fix incorrect url param value coercion of 1 to true ([995a9e0](https://github.com/angular/angular/commit/995a9e0)), closes [#5346](https://github.com/angular/angular/issues/5346) [#6286](https://github.com/angular/angular/issues/6286)
* **router:** fix url path for star segment in path recognizer ([6f1ef33](https://github.com/angular/angular/commit/6f1ef33)), closes [#6976](https://github.com/angular/angular/issues/6976)
* **router:** fixed the location wrapper for angular1 ([e73fee7](https://github.com/angular/angular/commit/e73fee7)), closes [#6943](https://github.com/angular/angular/issues/6943)
* **typings:** Don't expose typing dependencies to users. ([2a70f4e](https://github.com/angular/angular/commit/2a70f4e)), closes [#5973](https://github.com/angular/angular/issues/5973) [#5807](https://github.com/angular/angular/issues/5807) [#6266](https://github.com/angular/angular/issues/6266) [#5242](https://github.com/angular/angular/issues/5242) [#6817](https://github.com/angular/angular/issues/6817) [#6267](https://github.com/angular/angular/issues/6267)
* **upgrade:** fix infinite $rootScope.$digest() ([7e0f02f](https://github.com/angular/angular/commit/7e0f02f)), closes [#6385](https://github.com/angular/angular/issues/6385) [#6386](https://github.com/angular/angular/issues/6386)
* **Validators:** fix Validators.required marking number zero as invalid ([c2ceb7f](https://github.com/angular/angular/commit/c2ceb7f)), closes [#6617](https://github.com/angular/angular/issues/6617)
* **WebWorkers:** Fix flaky WebWorker test ([da1fcfd](https://github.com/angular/angular/commit/da1fcfd)), closes [#6851](https://github.com/angular/angular/issues/6851)

### Features

* **angular1_router:** allow component to bind to router ([0f22dce](https://github.com/angular/angular/commit/0f22dce))
* **typings:** install es6-shim typings to a location users can reference. ([f1f5b45](https://github.com/angular/angular/commit/f1f5b45))

### BREAKING CHANGES

Transitive typings are no longer included in the distribution.

If you use `--target=es5`, you will need to add a line somewhere in your
application (for example, at the top of the `.ts` file where you call `bootstrap`):
```
///<reference path="node_modules/angular2/typings/browser.d.ts"/>
```
(Note that if your file is not in the same directory as `node_modules`, you'll
need to add one or more `../` to the start of that path.)

If you have unit tests, you need to install typings in your project using
http://github.com/typings/typings
And install typings such as `jasmine`, `angular-protractor`, or `selenium-webdriver`
to satisfy the type-checker.

If you rely on es6 APIs other than Promises and Collections, you will need to
install the es6-shim typing instead of using the <reference> tag above.
Angular previously exposed typings for the entire ES6 API.

<a name="2.0.0-beta.5"></a>
# 2.0.0-beta.5 (2016-02-10)

This release was incorrect; replaced with beta.6.

<a name="2.0.0-beta.4"></a>
# 2.0.0-beta.4 (2016-02-10)

This release was incorrect; replaced with beta.6.

<a name="2.0.0-beta.3"></a>
# 2.0.0-beta.3 (2016-02-03)


### Bug Fixes

* **bundle:** add angular2/platform/testing/browser to SystemJS testing bundle ([ae7d2ab](https://github.com/angular/angular/commit/ae7d2ab))
* **circle:** pre-dependencies `npm install npm` ([36a0e04](https://github.com/angular/angular/commit/36a0e04)), closes [#6777](https://github.com/angular/angular/issues/6777)
* **dart/transform:** Handle edge cases in ReflectionRemover ([3e9b532](https://github.com/angular/angular/commit/3e9b532)), closes [#6749](https://github.com/angular/angular/issues/6749)
* **docs:** `rxjs/add/operators/map` -> `rxjs/add/operator/map` (no 's'). ([2a302aa](https://github.com/angular/angular/commit/2a302aa))
* **karma:** fix running karma via gulp ([27daeaf](https://github.com/angular/angular/commit/27daeaf))
* **query:** don’t cross component boundaries ([c6adbf6](https://github.com/angular/angular/commit/c6adbf6)), closes [#6759](https://github.com/angular/angular/issues/6759)
* **query:** update view queries that query directives in embedded views ([1f7a41c](https://github.com/angular/angular/commit/1f7a41c)), closes [#6747](https://github.com/angular/angular/issues/6747)
* **WebWorkers:** Add support for transitionend events. ([c2a38c0](https://github.com/angular/angular/commit/c2a38c0)), closes [#6649](https://github.com/angular/angular/issues/6649)
* **zone:** correct incorrect calls to zone ([3211938](https://github.com/angular/angular/commit/3211938))

### Features

* **change_detection:** allow all legal programs in the dev mode ([42231f5](https://github.com/angular/angular/commit/42231f5))
* **dart/transform:** Generate all code into <file>.template.dart ([8c36aa8](https://github.com/angular/angular/commit/8c36aa8))
* **debug:** replace DebugElement with new Debug DOM ([e1bf3d3](https://github.com/angular/angular/commit/e1bf3d3))
* **ngFor:** add custom trackBy function support ([cee2318](https://github.com/angular/angular/commit/cee2318)), closes [#6779](https://github.com/angular/angular/issues/6779)
* **upgrade:** support bindToController with binding definitions ([99e6500](https://github.com/angular/angular/commit/99e6500)), closes [#4784](https://github.com/angular/angular/issues/4784)
* **WebWorker:** Add Router Support for WebWorker Apps ([8bea667](https://github.com/angular/angular/commit/8bea667)), closes [#3563](https://github.com/angular/angular/issues/3563)

### Performance Improvements

* **dart/transform:** Only process deferred libs when necessary ([f56df65](https://github.com/angular/angular/commit/f56df65)), closes [#6745](https://github.com/angular/angular/issues/6745)

### BREAKING CHANGES

This is a breaking change for unit tests. The API for the DebugElement
has changed. Now, there is a DebugElement or DebugNode for every node
in the DOM, not only nodes with an ElementRef. `componentViewChildren` is
removed, and `childNodes` is a list of ElementNodes corresponding to every
child in the DOM. `query` no longer takes a scope parameter, since
the entire rendered DOM is included in the `childNodes`.

Before:

```
componentFixture.debugElement.componentViewChildren[0];
```

After
```
// Depending on the DOM structure of your component, the
// index may have changed or the first component child
// may be a sub-child.
componentFixture.debugElement.children[0];
```

Before:

```
debugElement.query(By.css('div'), Scope.all());
```

After:

```
debugElement.query(By.css('div'));
```

Before:

```
componentFixture.debugElement.elementRef;
```

After:

```
componentFixture.elementRef;
```

<a name="2.0.0-beta.2"></a>
# 2.0.0-beta.2 (2016-01-28)


### Bug Fixes

* **bundles:** testing bundle should include browser platform ([4a41442](https://github.com/angular/angular/commit/4a41442)), closes [#6626](https://github.com/angular/angular/issues/6626)
* **ChangeDetection:** chain expressions evaluate to the last expression (codegen) ([933a911](https://github.com/angular/angular/commit/933a911)), closes [#4782](https://github.com/angular/angular/issues/4782) [#5892](https://github.com/angular/angular/issues/5892)
* **core:** always remove DOM listeners and stream subscriptions ([0ae7775](https://github.com/angular/angular/commit/0ae7775))
* **Dart:** make some playground samples run with Dart Dev Compiler ([3e65d14](https://github.com/angular/angular/commit/3e65d14)), closes [#6441](https://github.com/angular/angular/issues/6441)
* **dart/transform:** Ensure template codegen is completed sync ([5f0baaa](https://github.com/angular/angular/commit/5f0baaa)), closes [#6603](https://github.com/angular/angular/issues/6603)
* **ddc:** router, compiler, web worker fixes for DDC ([db87bae](https://github.com/angular/angular/commit/db87bae)), closes [#6693](https://github.com/angular/angular/issues/6693)
* **ddc:** type fixes necessary to bring DDC severe count to 0 ([4282297](https://github.com/angular/angular/commit/4282297))
* **ddc:** use dynamic types in reflection typedefs ([c785a1e](https://github.com/angular/angular/commit/c785a1e)), closes [#6437](https://github.com/angular/angular/issues/6437)
* **directive:** throw if output the same event more than once ([8c37b7e](https://github.com/angular/angular/commit/8c37b7e))
* **HtmlLexer:** fix for unicode chars ([a24ee6a](https://github.com/angular/angular/commit/a24ee6a)), closes [#6036](https://github.com/angular/angular/issues/6036) [#6061](https://github.com/angular/angular/issues/6061)
* **perf:** faster looseIdentical implementation ([761c6d0](https://github.com/angular/angular/commit/761c6d0)), closes [#6364](https://github.com/angular/angular/issues/6364)
* **template_compiler:** Fix erroneous cycle detection ([eda4c3e](https://github.com/angular/angular/commit/eda4c3e)), closes [#6404](https://github.com/angular/angular/issues/6404) [#6474](https://github.com/angular/angular/issues/6474)
* **testing:** remove test zone for now and rely on returned promises ([c72ed99](https://github.com/angular/angular/commit/c72ed99)), closes [#6359](https://github.com/angular/angular/issues/6359) [#6601](https://github.com/angular/angular/issues/6601)
* **transformer:** record HostBinding annotations applied to getters ([a593ffa](https://github.com/angular/angular/commit/a593ffa)), closes [#6283](https://github.com/angular/angular/issues/6283)
* **web_workers:** support @AngularEntrypoint in web workers ([ac85cbb](https://github.com/angular/angular/commit/ac85cbb)), closes [#6013](https://github.com/angular/angular/issues/6013)

### Features

* **core/application_ref:** Allow asyncronous app initializers. ([df3074f](https://github.com/angular/angular/commit/df3074f)), closes [#5929](https://github.com/angular/angular/issues/5929) [#6063](https://github.com/angular/angular/issues/6063)
* **dart/transform:** DirectiveProcessor: do not process generated files ([78bfdf7](https://github.com/angular/angular/commit/78bfdf7)), closes [#6517](https://github.com/angular/angular/issues/6517)
* **dart/transform:** Promote missing Directive warning to error ([47a3b4d](https://github.com/angular/angular/commit/47a3b4d)), closes [#6519](https://github.com/angular/angular/issues/6519) [#6568](https://github.com/angular/angular/issues/6568)
* **test:** allow tests to specify the platform and application providers used ([b0cebdb](https://github.com/angular/angular/commit/b0cebdb)), closes [#5351](https://github.com/angular/angular/issues/5351) [#5585](https://github.com/angular/angular/issues/5585) [#5975](https://github.com/angular/angular/issues/5975)
* **testability:** Expose function frameworkStabilizers ([69ae363](https://github.com/angular/angular/commit/69ae363)), closes [#5485](https://github.com/angular/angular/issues/5485)

### BREAKING CHANGES

* `Renderer.listen` now has to return a function that
  removes the event listener.

* TemplateRef.elementRef is now read-only.

* Tests are now required to use `setBaseTestProviders`
to set up. Assuming your tests are run on a browser, setup would change
as follows.
Before:
```js
// Somewhere in test setup
import {BrowserDomAdapter} from 'angular2/src/platform/browser/browser_adapter';
BrowserDomAdapter.makeCurrent
```
After:
```js
// Somewhere in the test setup
import {setBaseTestProviders} from 'angular2/testing';
import {
  TEST_BROWSER_PLATFORM_PROVIDERS,
  TEST_BROWSER_APPLICATION_PROVIDERS
} from 'angular2/platform/testing/browser';
setBaseTestProviders(TEST_BROWSER_PLATFORM_PROVIDERS,
                     TEST_BROWSER_APPLICATION_PROVIDERS);
```


<a name="2.0.0-beta.1"></a>
# 2.0.0-beta.1 catamorphic-involution (2016-01-08)


### Bug Fixes

* **benchpress:** fix flake ([9d28147](https://github.com/angular/angular/commit/9d28147)), closes [#6161](https://github.com/angular/angular/issues/6161)
* **CHANGELOG:** typo ([d116861](https://github.com/angular/angular/commit/d116861)), closes [#6075](https://github.com/angular/angular/issues/6075) [#6078](https://github.com/angular/angular/issues/6078)
* **code size:** revert previous devMode change to restore size targets ([c47d85b](https://github.com/angular/angular/commit/c47d85b))
* **core:** IE only supports parentNode ([630d931](https://github.com/angular/angular/commit/630d931)), closes [#5994](https://github.com/angular/angular/issues/5994)
* **docs:** fix an import in TOOLS_DART.md ([3524946](https://github.com/angular/angular/commit/3524946)), closes [#5923](https://github.com/angular/angular/issues/5923)
* **forms:** fix SelectControlValueAccessor not to call onChange twice ([b44d36c](https://github.com/angular/angular/commit/b44d36c)), closes [#5969](https://github.com/angular/angular/issues/5969)
* **router:** correctly sort route matches with children by specificity ([b2bc50d](https://github.com/angular/angular/commit/b2bc50d)), closes [#5848](https://github.com/angular/angular/issues/5848) [#6011](https://github.com/angular/angular/issues/6011)
* **router:** preserve specificity for redirects ([a038bb9](https://github.com/angular/angular/commit/a038bb9)), closes [#5933](https://github.com/angular/angular/issues/5933)
* **TemplateParser:** do not match on attrs that are bindings ([9a70f1a](https://github.com/angular/angular/commit/9a70f1a)), closes [#5914](https://github.com/angular/angular/issues/5914)

### Features

* **core:** improve NoAnnotationError message ([197cf09](https://github.com/angular/angular/commit/197cf09)), closes [#4866](https://github.com/angular/angular/issues/4866) [#5927](https://github.com/angular/angular/issues/5927)
* **core:** improve stringify for dart to handle closures ([e67ebb7](https://github.com/angular/angular/commit/e67ebb7))
* **core:** speed up view creation via code gen for view factories. ([7ae23ad](https://github.com/angular/angular/commit/7ae23ad)), closes [#5993](https://github.com/angular/angular/issues/5993)
* **router:** support links with just auxiliary routes ([2a2f9a9](https://github.com/angular/angular/commit/2a2f9a9)), closes [#5930](https://github.com/angular/angular/issues/5930)

### Performance Improvements

* **dart/transform:** Avoid unnecessary reads for files with no view ([89f32f8](https://github.com/angular/angular/commit/89f32f8)), closes [#6183](https://github.com/angular/angular/issues/6183)


### BREAKING CHANGES

* Platform pipes can only contain types and arrays of types,
  but no bindings any more.
* When using transformers, platform pipes need to be specified explicitly
  in the pubspec.yaml via the new config option
  `platform_pipes`.
* `Compiler.compileInHost` now returns a `HostViewFactoryRef`
* Component view is not yet created when component constructor is called.
  -> use `ngOnInit` lifecycle callback to access the view of a component
* `ViewRef#setLocal` has been moved to new type `EmbeddedViewRef`
* `internalView` is gone, use `EmbeddedViewRef.rootNodes` to access
  the root nodes of an embedded view
* `renderer.setElementProperty`, `..setElementStyle`, `..setElementAttribute` now
  take a native element instead of an ElementRef
* `Renderer` interface now operates on plain native nodes,
  instead of `RenderElementRef`s or `RenderViewRef`s

<a name="2.0.0-beta.0"></a>
# 2.0.0-beta.0 somnambulant-inauguration (2015-12-15)

**Enjoy!**


<a name="2.0.0-alpha.55"></a>
# 2.0.0-alpha.55 (2015-12-15)


### Bug Fixes

* **router:** export ROUTER_LINK_DSL_PROVIDER and hide MockPopStateEvent ([fc75220](https://github.com/angular/angular/commit/fc75220))

### Features

* **core:** enable dev mode by default ([3dca9d5](https://github.com/angular/angular/commit/3dca9d5))


### BREAKING CHANGES

* Previously, Angular would run in dev prod mode by default, and you could enable the dev mode by calling enableDevMode. Now, Angular runs in the dev mode by default, and you can enable the prod mode by calling enableProdMode.



<a name="2.0.0-alpha.54"></a>
# 2.0.0-alpha.54 (2015-12-15)


### Bug Fixes

* **bundles:** don't include RxJS in System.register bundles ([77b7cae](https://github.com/angular/angular/commit/77b7cae))
* **bundles:** remove ngUpgrade from the angular2.js bundle ([283962f](https://github.com/angular/angular/commit/283962f)), closes [#5739](https://github.com/angular/angular/issues/5739) [#5854](https://github.com/angular/angular/issues/5854)
* **bundles:** remove polyfills from angular2.js bundle ([2983558](https://github.com/angular/angular/commit/2983558)), closes [#5881](https://github.com/angular/angular/issues/5881)
* **bundles:** rename the testing.js bundle to testing.dev.js ([d55655f](https://github.com/angular/angular/commit/d55655f)), closes [#5899](https://github.com/angular/angular/issues/5899) [#5776](https://github.com/angular/angular/issues/5776)
* **bundles:** rename UMD bundles ([61b9468](https://github.com/angular/angular/commit/61b9468)), closes [#5898](https://github.com/angular/angular/issues/5898)


### BREAKING CHANGES

* System.register testing bundle was renamed:
`testing.js` -> `testing.dev.js`

* UMD bundles were renamed:
  * `angular2.umd.js` -> `angular2-all.umd.js`
  * `angular2-testing.umd.js` -> `angular2-all-testing.umd.js`

* RxJS used to be bundled with Angular 2 code and this is not the case
any more. RxJS needs to be loaded explicitly.

* Previously `angular2.js`, `angular2.min.js` and `angular2.dev.js` bundles
would have zone.js and reflect-metadata pre-appended. New bundles don't
contain zone.js nor reflect-metadata - those external dependencies can
be easily loaded into a browser using `angular2-polyfills.js`

* `ngUpgrade` related symbols are no longer part of the `angular2.js`
bundle. `ngUpgrade` has a dedicated `upgrade.js` bundle now.




<a name="2.0.0-alpha.53"></a>
# 2.0.0-alpha.53 (2015-12-13)


### Bug Fixes

* **angular2:** don't export compiler bits as public API ([20c6eeb](https://github.com/angular/angular/commit/20c6eeb)), closes [#5815](https://github.com/angular/angular/issues/5815) [#5797](https://github.com/angular/angular/issues/5797)
* **angular2:** remove `angular2.ts` module ([200dc00](https://github.com/angular/angular/commit/200dc00)), closes [#5815](https://github.com/angular/angular/issues/5815) [#5844](https://github.com/angular/angular/issues/5844)
* **animate:** ensure transition properties are removed once the animation is over ([b8e69a2](https://github.com/angular/angular/commit/b8e69a2))
* **async:** improve Rx support in ObservableWrapper ([4a17e69](https://github.com/angular/angular/commit/4a17e69))
* **async:** support BehaviorSubjects in async pipe ([398f024](https://github.com/angular/angular/commit/398f024))
* **bundles:** don't use angular2/angular2 in config of System.register bundles ([8c69497](https://github.com/angular/angular/commit/8c69497))
* **changelog:** fix ngFor on template ([3190c59](https://github.com/angular/angular/commit/3190c59)), closes [#5785](https://github.com/angular/angular/issues/5785)
* **compiler:** remove AppRootUrl ([ed2c25e](https://github.com/angular/angular/commit/ed2c25e))
* **core:** workaround for typescript@1.7.3 breakage #5784 ([30e25ac](https://github.com/angular/angular/commit/30e25ac)), closes [#5784](https://github.com/angular/angular/issues/5784)
* **dom_renderer:** moveNodeAfterSiblings should not detach the reference node ([edcb34d](https://github.com/angular/angular/commit/edcb34d)), closes [#5077](https://github.com/angular/angular/issues/5077) [#5759](https://github.com/angular/angular/issues/5759)
* **HtmlParser:** allow ng-content elements regardless the namespace ([080469f](https://github.com/angular/angular/commit/080469f)), closes [#5745](https://github.com/angular/angular/issues/5745)
* **parse5:** support comment nodes with getText and setText ([693d9dc](https://github.com/angular/angular/commit/693d9dc)), closes [#5805](https://github.com/angular/angular/issues/5805)
* **public_spec:** check exports of barrels instead of angular2/angular2 ([979162d](https://github.com/angular/angular/commit/979162d)), closes [#5841](https://github.com/angular/angular/issues/5841)
* **styles:** Escape \r characters in compiled text ([92ddc62](https://github.com/angular/angular/commit/92ddc62)), closes [#5772](https://github.com/angular/angular/issues/5772) [#5835](https://github.com/angular/angular/issues/5835)
* **TemplateParser:** match element and attributes regardless the namespace ([7c13372](https://github.com/angular/angular/commit/7c13372))
* **upgrade:** allow directives with empty template ([2ca5e38](https://github.com/angular/angular/commit/2ca5e38))
* **web_workers:** remove unnecessary setup module and AppRootUrl ([a885f37](https://github.com/angular/angular/commit/a885f37)), closes [#5820](https://github.com/angular/angular/issues/5820)

### Features

* **benchpress:** add receivedData + requestCount to PerflogMetric ([fe1dd77](https://github.com/angular/angular/commit/fe1dd77)), closes [#5750](https://github.com/angular/angular/issues/5750)
* **dom_renderer:** add setBindingDebugInfo method ([79399e1](https://github.com/angular/angular/commit/79399e1)), closes [#5227](https://github.com/angular/angular/issues/5227)
* **facade:** do not reexport Observable from angular2/core ([43f42d9](https://github.com/angular/angular/commit/43f42d9))
* **Headers:** implement `toJSON` ([0cb32c2](https://github.com/angular/angular/commit/0cb32c2))
* **renderer:** use a comment instead of an element when stamping out template>` elements ([194dc7d](https://github.com/angular/angular/commit/194dc7d)), closes [#4805](https://github.com/angular/angular/issues/4805)


### BREAKING CHANGES

* `Observable` are no more re-exported from `angular2/core`

    Before
    ```
    import {Observable} from 'angular2/core'
    ```
    After
    ```
    import {Observable} from 'rxjs/Observable';
    ```

* The setupWebWorker function exported from
angular2/platform/worker_app  no longer returns a promise of providers,
but instead synchronously returns providers.
Related to #5815

* `angular2/angular2` was removed. Use the correct import from one of the barrels. E.g. `angular2/core`, `angular2/platform/browser`,  `angular2/common`, …
Note: This only applies to JavaScript, Dart is not changed.

* The following symbols are not exported from angular2/angular2 any more:
`UrlResolver`, `AppRootUrl`, `getUrlScheme`, `DEFAULT_PACKAGE_URL_PROVIDER`.
Use imports from `angular2/compiler` instead.



<a name="2.0.0-alpha.52"></a>
# 2.0.0-alpha.52 (2015-12-10)


### Features

* **core:** case-sensitive camelCase templates (kebab-case removal) ([da9b46a](https://github.com/angular/angular/commit/da9b46a))


### BREAKING CHANGES

* Angular templates are now case-sensitive and use camelCase instead of kebab-case (dash-case).

  Before:

  ```
      <p *ng-if="cond">
      <my-cmp [my-prop]="exp">
      <my-cmp (my-event)="action()">
      <my-cmp [(my-prop)]="prop">
      <input #my-input>
      <template ng-for #my-item [ng-for-of]=items #my-index="index">
  ```

  After:

  ```
      <p *ngIf="cond">
      <my-cmp [myProp]="exp">
      <my-cmp (myEvent)="action()">
      <my-cmp [(myProp)]="prop">
      <input #myInput>`,
      <template ngFor "#myItem" [ngForOf]=items #myIndex="index">
  ```

  The full migration instruction can be found at [angular2/docs/migration/kebab-case.md](https://github.com/angular/angular/blob/master/modules/angular2/docs/migration/kebab-case.md).



<a name="2.0.0-alpha.51"></a>
# 2.0.0-alpha.51 (2015-12-10)


### Features

* **bundles:** add angular2-testing UMD bundle ([d6d759d](https://github.com/angular/angular/commit/d6d759d)), closes [#5581](https://github.com/angular/angular/issues/5581) [#5734](https://github.com/angular/angular/issues/5734)
* **core:** provide support for relative assets for components ([28860d3](https://github.com/angular/angular/commit/28860d3)), closes [#5634](https://github.com/angular/angular/issues/5634)
* **core:** typescript 1.7.3 compatibility ([#5758](https://github.com/angular/angular/pull/5758))



<a name="2.0.0-alpha.50"></a>
# 2.0.0-alpha.50 (2015-12-09)


### Bug Fixes

* **http:** fix syntax error in package.json ([869a392](https://github.com/angular/angular/commit/869a3923574de9ed34b953e84e1744cc007ca629)), closes [#5636](https://github.com/angular/angular/issues/5636) [#5726](https://github.com/angular/angular/issues/5726)
* **http:** use `any` for res.json() return ([cbf7888](https://github.com/angular/angular/commit/cbf7888)), closes [#5636](https://github.com/angular/angular/issues/5636) [#5646](https://github.com/angular/angular/issues/5646)
* **testing:** remove Symbol dummy shim ([c1ae49d](https://github.com/angular/angular/commit/c1ae49d)), closes [#5067](https://github.com/angular/angular/issues/5067) [#5719](https://github.com/angular/angular/issues/5719)
* **package:** update RxJS to alpha.14 ([4432cf5](https://github.com/angular/angular/commit/4432cf5438b8c615d297e8965f0ad69f0188169e)), closes [#5722](https://github.com/angular/angular/issues/5722)

### Features

* **testing:** package angular2_testing to prepare it for publishing ([cc8f1f9](https://github.com/angular/angular/commit/cc8f1f9)), closes [#5682](https://github.com/angular/angular/issues/5682)

<a name="2.0.0-alpha.49"></a>
# 2.0.0-alpha.49 (2015-12-09)


### Bug Fixes

* **bootstrap:** fix the configuration of ExceptionHandler ([0d9a1de](https://github.com/angular/angular/commit/0d9a1de))
* **build:** lock down version of package:code_transformers ([85d89ba](https://github.com/angular/angular/commit/85d89ba))
* **bundles:** clean-up and re-organize UMD bundles ([fb4f1e8](https://github.com/angular/angular/commit/fb4f1e8)), closes [#5593](https://github.com/angular/angular/issues/5593) [#5697](https://github.com/angular/angular/issues/5697)
* **bundles:** remove SFX bundle ([a4ba46c](https://github.com/angular/angular/commit/a4ba46c)), closes [#5665](https://github.com/angular/angular/issues/5665) [#5712](https://github.com/angular/angular/issues/5712)
* **bundles:** rename external-dependencies to angular-polyfills ([b3c91b1](https://github.com/angular/angular/commit/b3c91b1)), closes [#5714](https://github.com/angular/angular/issues/5714) [#5716](https://github.com/angular/angular/issues/5716)
* **changelog:** add RxJS imports breaking change ([ad48169](https://github.com/angular/angular/commit/ad48169)), closes [#5678](https://github.com/angular/angular/issues/5678)
* **changelog:** correct import path ([86c74cf](https://github.com/angular/angular/commit/86c74cf)), closes [#5681](https://github.com/angular/angular/issues/5681)
* **compiler:** support properties on SVG elements ([daaa8ee](https://github.com/angular/angular/commit/daaa8ee)), closes [#5653](https://github.com/angular/angular/issues/5653)
* **dynamic_component_loader:** leave the view tree in a consistent state when hydration fails ([0df8bc4](https://github.com/angular/angular/commit/0df8bc4)), closes [#5718](https://github.com/angular/angular/issues/5718)
* **form:** Form directives are exportedAs 'ngForm' (was 'form') ([8657ca4](https://github.com/angular/angular/commit/8657ca4)), closes [#5658](https://github.com/angular/angular/issues/5658) [#5709](https://github.com/angular/angular/issues/5709)
* **HtmlLexer:** handle CR in input stream per HTML spec ([9850e68](https://github.com/angular/angular/commit/9850e68)), closes [#5618](https://github.com/angular/angular/issues/5618) [#5629](https://github.com/angular/angular/issues/5629)
* **HtmlLexer:** tag name must follow "<" without space ([47f1d12](https://github.com/angular/angular/commit/47f1d12))
* **HtmlParser:** Do not add parent element for template children ([3a43861](https://github.com/angular/angular/commit/3a43861)), closes [#5638](https://github.com/angular/angular/issues/5638)
* **HtmlParser:** ignore LF immediately following pre, textarea & listing ([eb0ea93](https://github.com/angular/angular/commit/eb0ea93)), closes [#5630](https://github.com/angular/angular/issues/5630) [#5688](https://github.com/angular/angular/issues/5688)
* **HtmlParser:** mark <source> elements as void ([50490b5](https://github.com/angular/angular/commit/50490b5)), closes [#5663](https://github.com/angular/angular/issues/5663) [#5668](https://github.com/angular/angular/issues/5668)
* **npm:** move es6-shim from devDependencies to dependencies ([21542ed](https://github.com/angular/angular/commit/21542ed))
* **package:** relock RxJS to alpha.11 ([4b1618c](https://github.com/angular/angular/commit/4b1618c)), closes [#5643](https://github.com/angular/angular/issues/5643) [#5644](https://github.com/angular/angular/issues/5644)
* **router:** set correct redirect/default URL from hashchange ([aa85856](https://github.com/angular/angular/commit/aa85856)), closes [#5590](https://github.com/angular/angular/issues/5590) [#5683](https://github.com/angular/angular/issues/5683)

### Features

* **HtmlLexer:** allow "<" in text tokens ([aecf681](https://github.com/angular/angular/commit/aecf681)), closes [#5550](https://github.com/angular/angular/issues/5550)
* **TemplateParser:** allow template elements regardless the namespace  ([1f35048](https://github.com/angular/angular/commit/1f35048)), closes [#5703](https://github.com/angular/angular/issues/5703)


### BREAKING CHANGES

* The existing sfx bundle (angular2.sfx.dev.js) is replaced by UMD bundles:
angular2.umd.js and angular2.umd.dev.js. The new UMD bundles dont have
polyfills (zone.js, reflect-metadata) pre-appended. Those polyfills
can be easily loaded by including the angular-polyfills.js bundle.

* The `external-dependencies.js` bundle was removed.
Use `angular-polyfills.js` instead.

* Number and content of UMD bundles have changed:
- we only publish one bundle that contains: core, common, platform/browser, http, router, instrumentation and upgrade
- exported names have changed and now:
  - core is exported as `ng.core`
  - common is exported as `ng.common`
  - platform/browser is exported as `ng.platform.browser`
  - http is exported as `ng.http`
  - router is exported as `ng.router`
  - instrumentation is exported as `ng.instrumentation`
  - upgrade is exported as `ng.upgrade`

* Form directives are exportedAs 'ngForm' (was 'form')

    Before:
      ```html
        <form #f="form">
      ```

    After:
      ```html
        <form #f="ngForm">
      ```
* rxjs, reflect-metadata, zone.js and es6-shims now must be specified as
  explicit dependencies of each angular app that uses npm for package management.

  To migrate, please add the following into the "dependencies" section of your package.json:

  ```
  "dependencies": {
      ...

      "es6-promise": "^3.0.2",
      "es6-shim": "^0.33.3",
      "reflect-metadata": "0.1.2",
      "rxjs": "5.0.0-alpha.11",
      "zone.js": "0.5.8"

      ...
  }
  ```

  or [check angular2's package.json](https://github.com/angular/angular/blob/master/package.json) for the latest `dependencies`


<a name="2.0.0-alpha.48"></a>
# 2.0.0-alpha.48 (2015-12-05)


### Bug Fixes

* **build:** change npm publish script not to remove angular folder when building benchpress ([47d0942](https://github.com/angular/angular/commit/47d0942))
* **build:** include benchpress into browser_tree ([87ac36f](https://github.com/angular/angular/commit/87ac36f))
* **core/forms:**  input[type=text] .valueChanges fires unexpectedly ([680f7e0](https://github.com/angular/angular/commit/680f7e0)), closes [#4768](https://github.com/angular/angular/issues/4768) [#5284](https://github.com/angular/angular/issues/5284) [#5401](https://github.com/angular/angular/issues/5401)
* **dart/reflection:** Fix `NoReflectionCapabilities` interface ([0a3a17f](https://github.com/angular/angular/commit/0a3a17f)), closes [#5559](https://github.com/angular/angular/issues/5559) [#5578](https://github.com/angular/angular/issues/5578)
* **HtmlParser:** close void elements on all node types ([9c6b929](https://github.com/angular/angular/commit/9c6b929)), closes [#5528](https://github.com/angular/angular/issues/5528)
* **HtmlParser:** do not add a tbody parent for tr inside thead & tfoot ([c58e7e0](https://github.com/angular/angular/commit/c58e7e0)), closes [#5403](https://github.com/angular/angular/issues/5403)
* **HtmlParser:** ng-content is not a void element ([e67e195](https://github.com/angular/angular/commit/e67e195)), closes [#5563](https://github.com/angular/angular/issues/5563) [#5586](https://github.com/angular/angular/issues/5586)
* **WebWorker:** Add @AngularEntrypoint to worker_app bundle ([5e50859](https://github.com/angular/angular/commit/5e50859)), closes [#5588](https://github.com/angular/angular/issues/5588)

### Features

* **core:** remove typings from package.json to disallow 'import * as n from 'angular2''' ([9a65ea7](https://github.com/angular/angular/commit/9a65ea7))
* **dart/transform:** Add quick_transformer ([f77ca7b](https://github.com/angular/angular/commit/f77ca7b)), closes [#5484](https://github.com/angular/angular/issues/5484)
* **dart/transform:** Introduce @AngularEntrypoint() ([6b2ef25](https://github.com/angular/angular/commit/6b2ef25))
* **HtmlParser:** add most common named character references ([d90a226](https://github.com/angular/angular/commit/d90a226)), closes [#5546](https://github.com/angular/angular/issues/5546) [#5579](https://github.com/angular/angular/issues/5579)
* **HtmlParser:** better error message when a void tag has content ([62c2ed7](https://github.com/angular/angular/commit/62c2ed7))
* **HtmlParser:** enforce no end tag for void elements ([5660446](https://github.com/angular/angular/commit/5660446))
* **HtmlParser:** enforce only void & foreign elts can be self closed ([d388c0a](https://github.com/angular/angular/commit/d388c0a)), closes [#5591](https://github.com/angular/angular/issues/5591)
* **mocks:** Mark mock objects @Injectable() ([35e32bb](https://github.com/angular/angular/commit/35e32bb)), closes [#5576](https://github.com/angular/angular/issues/5576)
* **router:** implement router link DSL ([4ea5b6e](https://github.com/angular/angular/commit/4ea5b6e)), closes [#5557](https://github.com/angular/angular/issues/5557) [#5562](https://github.com/angular/angular/issues/5562)
* **sourcemaps:** use inline source maps and inline sources in node_tree ([7e18d4c](https://github.com/angular/angular/commit/7e18d4c)), closes [#5617](https://github.com/angular/angular/issues/5617)
* **test:** add angular2_testing dart library ([93a1ec2](https://github.com/angular/angular/commit/93a1ec2)), closes [#3289](https://github.com/angular/angular/issues/3289)
* **testing:** export useful properties from componentFixture ([e9f873a](https://github.com/angular/angular/commit/e9f873a))
* **typings:** import global-es6.d.ts in core ([22e9590](https://github.com/angular/angular/commit/22e9590))


### BREAKING CHANGES

* `<whatever />` used to be expanded to `<whatever></whatever>`.
The parser now follows the HTML5 spec more closely.
Only void and foreign elements can be self closed.

* End tags used to be tolerated for void elements with no content.
They are no more allowed so that we more closely follow the HTML5 spec.

* Before
import * as ng from 'angular2';
After
import * as core from 'angular2/core';

* Http's MockBackend is no longer exported from the `angular2/http` module. It's now available at `angular2/http/testing`

* Operators and Observables from RxJS (e.g. .map(), .toArray(), .toPromise(), etc ) now need to be explicitly imported (once per operator in your app)
  ```
  import {Observable} from 'rxjs/Observable';
  import 'rxjs/add/operator/map';
  import 'rxjs/add/observable/interval';

  Observable.interval(1000).subscribe(...);

  http.get('foos.json').map(res => res.json()).subscribe(...);
  ```

<a name="2.0.0-alpha.47"></a>
# 2.0.0-alpha.47 (2015-12-01)


### Bug Fixes

* **build:** do not reexport compiler from angular2/angular2 ([30d35b5](https://github.com/angular/angular/commit/30d35b5)), closes [#5422](https://github.com/angular/angular/issues/5422)
* **build:** fix npm install not to depend on minimist ([6d70cd7](https://github.com/angular/angular/commit/6d70cd7)), closes [#5282](https://github.com/angular/angular/issues/5282)
* **build:** fix source maps ([87d56ac](https://github.com/angular/angular/commit/87d56ac)), closes [#5444](https://github.com/angular/angular/issues/5444)
* **build:** increase memory limit ([2cd0f07](https://github.com/angular/angular/commit/2cd0f07))
* **compiler:** dedup directives in template compiler ([87ddc8f](https://github.com/angular/angular/commit/87ddc8f)), closes [#5311](https://github.com/angular/angular/issues/5311) [#5464](https://github.com/angular/angular/issues/5464)
* **core:** Export dev mode API in Dart. ([a3e6406](https://github.com/angular/angular/commit/a3e6406)), closes [#5233](https://github.com/angular/angular/issues/5233)
* **core:** reexport PLATFORM_DIRECTIVES and PLATFORM_PIPES in dart ([01ebff4](https://github.com/angular/angular/commit/01ebff4))
* **core:** Run component disposal before destroyRootHostView() to avoid crash if change det ([b22eddf](https://github.com/angular/angular/commit/b22eddf)), closes [#5226](https://github.com/angular/angular/issues/5226)
* **core:** various dart-specific fixes for core and facades ([4a43230](https://github.com/angular/angular/commit/4a43230))
* **dart:** fix the static_browser platform not to include compiler ([ad6fb06](https://github.com/angular/angular/commit/ad6fb06)), closes [#5321](https://github.com/angular/angular/issues/5321)
* **dart/transform:** Consider of line numbers in inliner_for_test ([a31e2f5](https://github.com/angular/angular/commit/a31e2f5)), closes [#5281](https://github.com/angular/angular/issues/5281) [#5285](https://github.com/angular/angular/issues/5285)
* **dart/transform:** Omit bootstrap.dart in ng_deps ([0db0252](https://github.com/angular/angular/commit/0db0252)), closes [#5315](https://github.com/angular/angular/issues/5315) [#5348](https://github.com/angular/angular/issues/5348)
* **EventEmitter:** resolve onError and onComplete asynchronously ([019cb41](https://github.com/angular/angular/commit/019cb41)), closes [#4443](https://github.com/angular/angular/issues/4443)
* **examples:** Don't generate Dart code for TS examples in nested directories. ([b571baa](https://github.com/angular/angular/commit/b571baa))
* **forms:** scope value accessors, validators, and async validators to self ([ba64b5e](https://github.com/angular/angular/commit/ba64b5e)), closes [#5440](https://github.com/angular/angular/issues/5440)
* **http:** error on non-200 status codes ([201f189](https://github.com/angular/angular/commit/201f189)), closes [#5130](https://github.com/angular/angular/issues/5130)
* **http:** Fix all requests defaulting to Get ([e1d7bdc](https://github.com/angular/angular/commit/e1d7bdc)), closes [#5309](https://github.com/angular/angular/issues/5309) [#5397](https://github.com/angular/angular/issues/5397)
* **http:** refactor 'require' statements to 'import' declarations for Rx ([bcd926a](https://github.com/angular/angular/commit/bcd926a)), closes [#5287](https://github.com/angular/angular/issues/5287)
* **http:** return Response headers ([4332ccf](https://github.com/angular/angular/commit/4332ccf)), closes [#5237](https://github.com/angular/angular/issues/5237)
* **http:** return URL in Response ([46fc153](https://github.com/angular/angular/commit/46fc153)), closes [#5165](https://github.com/angular/angular/issues/5165)
* **parser:** do not crash on untokenizable quote prefixes ([b90de66](https://github.com/angular/angular/commit/b90de66)), closes [#5486](https://github.com/angular/angular/issues/5486)
* **publish:** syntax fix ([9985968](https://github.com/angular/angular/commit/9985968))
* **renderer:** apply host element encapsulation also if the parent component is not encapsulate ([344776f](https://github.com/angular/angular/commit/344776f)), closes [#5240](https://github.com/angular/angular/issues/5240)
* **router:** apply APP_BASE_HREF when using PathLocationStrategy ([ac38812](https://github.com/angular/angular/commit/ac38812)), closes [#5028](https://github.com/angular/angular/issues/5028)
* **router:** fix a typing issue ([4215afc](https://github.com/angular/angular/commit/4215afc)), closes [#5518](https://github.com/angular/angular/issues/5518)
* **transformers:** Fix @Input/@Output annotations with setters/getters ([d9f362a](https://github.com/angular/angular/commit/d9f362a)), closes [#5251](https://github.com/angular/angular/issues/5251) [#5259](https://github.com/angular/angular/issues/5259)
* **transformers:** use BarbackMode instead of assertionEnabled to enable debug info generation ([7f3223b](https://github.com/angular/angular/commit/7f3223b)), closes [#5245](https://github.com/angular/angular/issues/5245) [#5466](https://github.com/angular/angular/issues/5466)
* **typings:** two errors not reported by our build: ([7f6289c](https://github.com/angular/angular/commit/7f6289c))
* **web worker:** remove usages of deprecated zone API ([d59c20c](https://github.com/angular/angular/commit/d59c20c)), closes [#5425](https://github.com/angular/angular/issues/5425)

### Features

* **bootstrap:** add platform and app initializers ([3c43a8c](https://github.com/angular/angular/commit/3c43a8c)), closes [#5355](https://github.com/angular/angular/issues/5355)
* **build:** add an option to disable type checks when running tests ([4e585bc](https://github.com/angular/angular/commit/4e585bc)), closes [#5299](https://github.com/angular/angular/issues/5299)
* **bundles:** publish UMD bundles ([fa725b4](https://github.com/angular/angular/commit/fa725b4)), closes [#5223](https://github.com/angular/angular/issues/5223)
* **Compiler:** case sensitive html parser ([86aeb8b](https://github.com/angular/angular/commit/86aeb8b))
* **Compiler:** case sensitive html parser ([a8edc1e](https://github.com/angular/angular/commit/a8edc1e)), closes [#4417](https://github.com/angular/angular/issues/4417) [#5264](https://github.com/angular/angular/issues/5264)
* **Compiler:** case sensitive html parser ([36a423f](https://github.com/angular/angular/commit/36a423f)), closes [#4417](https://github.com/angular/angular/issues/4417) [#5264](https://github.com/angular/angular/issues/5264)
* **Compiler:** case sensitive html parser ([adb8756](https://github.com/angular/angular/commit/adb8756))
* **core:** extract platforms out of core ([3f4628c](https://github.com/angular/angular/commit/3f4628c)), closes [#5219](https://github.com/angular/angular/issues/5219)
* **core:** extract platforms out of core ([0eab4fc](https://github.com/angular/angular/commit/0eab4fc)), closes [#5219](https://github.com/angular/angular/issues/5219) [#5280](https://github.com/angular/angular/issues/5280)
* **dart/transform:** Bail early for files with no deferred libraries ([f80321f](https://github.com/angular/angular/commit/f80321f))
* **dart/transform:** Do not re-process generated files ([8f91ff8](https://github.com/angular/angular/commit/8f91ff8))
* **parser:** allows users install custom AST transformers ([a43ed79](https://github.com/angular/angular/commit/a43ed79)), closes [#5382](https://github.com/angular/angular/issues/5382)
* **router:** add support for APP_BASE_HREF to HashLocationStrategy ([1bec4f6](https://github.com/angular/angular/commit/1bec4f6)), closes [#4935](https://github.com/angular/angular/issues/4935) [#5368](https://github.com/angular/angular/issues/5368) [#5451](https://github.com/angular/angular/issues/5451)
* **router:** allow linking to auxiliary routes ([0b1ff2d](https://github.com/angular/angular/commit/0b1ff2d)), closes [#4694](https://github.com/angular/angular/issues/4694)
* **templates:** introduce quoted expressions to support 3rd-party expression languages ([b6ec238](https://github.com/angular/angular/commit/b6ec238))
* **testing:** use zones to avoid the need for injectAsync ([0c9596a](https://github.com/angular/angular/commit/0c9596a))


### BREAKING CHANGES

* Previously http would only error on network errors to match the fetch
specification. Now status codes less than 200 and greater than 299 will
cause Http's Observable to error.

* A few private helpers (e.g., platformCommon or applicationCommon) were removed or replaced with other helpers. Look at PLATFORM_COMMON_PROVIDERS, APPLICATION_COMMON_PROVIDERS, BROWSER_PROVIDERS, BROWSER_APP_PROVIDERS to see if they export the providers you need.

* Previously, components that would implement lifecycle interfaces would include methods
like "onChanges" or "afterViewInit." Given that components were at risk of using such
names without realizing that Angular would call the methods at different points of
the component lifecycle. This change adds an "ng" prefix to all lifecycle hook methods,
far reducing the risk of an accidental name collision.

  To fix, just rename these methods:
  * onInit
  * onDestroy
  * doCheck
  * onChanges
  * afterContentInit
  * afterContentChecked
  * afterViewInit
  * afterViewChecked
  * _Router Hooks_
  * onActivate
  * onReuse
  * onDeactivate
  * canReuse
  * canDeactivate

  To:
  * ngOnInit,
  * ngOnDestroy,
  * ngDoCheck,
  * ngOnChanges,
  * ngAfterContentInit,
  * ngAfterContentChecked,
  * ngAfterViewInit,
  * ngAfterViewChecked
  * _Router Hooks_
  * routerOnActivate
  * routerOnReuse
  * routerOnDeactivate
  * routerCanReuse
  * routerCanDeactivate

  The names of lifecycle interfaces and enums have not changed, though interfaces
  have been updated to reflect the new method names.

<a name="2.0.0-alpha.46"></a>
# 2.0.0-alpha.46 (2015-11-11)


### Bug Fixes

* **core:** Export dev mode API in Dart. ([a3e6406](https://github.com/angular/angular/commit/a3e6406)), closes [#5233](https://github.com/angular/angular/issues/5233)
* **core:** reexport PLATFORM_DIRECTIVES and PLATFORM_PIPES in dart ([01ebff4](https://github.com/angular/angular/commit/01ebff4))
* **core:** various dart-specific fixes for core and facades ([4a43230](https://github.com/angular/angular/commit/4a43230))
* **renderer:** apply host element encapsulation also if the parent component is not encapsulate ([344776f](https://github.com/angular/angular/commit/344776f)), closes [#5240](https://github.com/angular/angular/issues/5240)
* **analyzer:** fix dart analyzer errors ([56e7364](https://github.com/angular/angular/commit/56e7364)), closes [#4992](https://github.com/angular/angular/issues/4992)
* **benchmarks:** fix tracing categories to work with Dartium ([64bd963](https://github.com/angular/angular/commit/64bd963)), closes [#5209](https://github.com/angular/angular/issues/5209)
* **build:** EMFILE error on Windows when executing JS unit tests ([1dc8a0a](https://github.com/angular/angular/commit/1dc8a0a)), closes [#4525](https://github.com/angular/angular/issues/4525) [#4796](https://github.com/angular/angular/issues/4796)
* **build:** reorder bundling step ([5fecb3b](https://github.com/angular/angular/commit/5fecb3b)), closes [#5208](https://github.com/angular/angular/issues/5208)
* **compiler:** don’t lowercase attributes to support svg ([6133f2c](https://github.com/angular/angular/commit/6133f2c)), closes [#5166](https://github.com/angular/angular/issues/5166)
* **compiler:** remove style when [style.foo]='exp' evaluates to null ([f1989e7](https://github.com/angular/angular/commit/f1989e7)), closes [#5110](https://github.com/angular/angular/issues/5110) [#5114](https://github.com/angular/angular/issues/5114)
* **core:** Add an error state for ChangeDetectors that is set when bindings or lifecycle ev ([d1b54d6](https://github.com/angular/angular/commit/d1b54d6)), closes [#4323](https://github.com/angular/angular/issues/4323) [#4953](https://github.com/angular/angular/issues/4953)
* **core:** Provide setDevMode() to enable/disable development mode in Javascript. ([4bb9c46](https://github.com/angular/angular/commit/4bb9c46))
* **core:** Unload components when individually disposed. ([1ff1792](https://github.com/angular/angular/commit/1ff1792))
* **dart/transform:** Gracefully handle empty .ng_meta.json files ([a87c5d9](https://github.com/angular/angular/commit/a87c5d9))
* **forms:** Export the NG_VALUE_ACCESSOR binding token. ([fee5dea](https://github.com/angular/angular/commit/fee5dea))
* **forms:** update compose to handle null validators ([9d58f46](https://github.com/angular/angular/commit/9d58f46))
* **http:** use Observable<Response> on Http methods ([a9b1270](https://github.com/angular/angular/commit/a9b1270)), closes [#5017](https://github.com/angular/angular/issues/5017)
* **http:** use Response for JSONP errors ([31687ef](https://github.com/angular/angular/commit/31687ef))
* **JsonPipe:** marks json pipe as not pure Marked json pipe as not pure so that it runs all the ([fc016b5](https://github.com/angular/angular/commit/fc016b5)), closes [#4821](https://github.com/angular/angular/issues/4821)
* **material:** Disable md-grid-list tests until #5132 is fixed. ([0b11051](https://github.com/angular/angular/commit/0b11051))
* **ng-content:** wildcard ng-content has to go last. ([39626a9](https://github.com/angular/angular/commit/39626a9)), closes [#5016](https://github.com/angular/angular/issues/5016)
* **NgFor:** allow default templates with ng-for-template ([2d0c8f1](https://github.com/angular/angular/commit/2d0c8f1)), closes [#5161](https://github.com/angular/angular/issues/5161)
* **Pipe:** pure is an optional argument ([7ba426c](https://github.com/angular/angular/commit/7ba426c))
* **Pipes:** mark date & slice as non-pure ([2f1f83a](https://github.com/angular/angular/commit/2f1f83a))
* **playground:** fix the inbox example ([6240245](https://github.com/angular/angular/commit/6240245))
* remove deprecated zone API usage in testability ([3593d85](https://github.com/angular/angular/commit/3593d85)), closes [#5084](https://github.com/angular/angular/issues/5084)
* **router:** properly serialize aux routes ([23784a2](https://github.com/angular/angular/commit/23784a2))
* remove internal usages of deprecated overrideOnTurnDone ([c814dfb](https://github.com/angular/angular/commit/c814dfb)), closes [#5079](https://github.com/angular/angular/issues/5079)
* **router:** respond to hashchange events ([53bddec](https://github.com/angular/angular/commit/53bddec)), closes [#5013](https://github.com/angular/angular/issues/5013)
* **RouterLink:** do not prevent default behavior if target set on anchor element ([a69e7fe](https://github.com/angular/angular/commit/a69e7fe)), closes [#4233](https://github.com/angular/angular/issues/4233) [#5082](https://github.com/angular/angular/issues/5082)
* **setup:** set tsconfig so that it works in editors ([fb8b815](https://github.com/angular/angular/commit/fb8b815))
* **shadow_css:** strip comments and fix logic for parsing rules. ([d8775e0](https://github.com/angular/angular/commit/d8775e0)), closes [#5037](https://github.com/angular/angular/issues/5037) [#5011](https://github.com/angular/angular/issues/5011)
* **test:** "integration tests svg should support svg elements" fails in non-Chrome browsers ([c4964e7](https://github.com/angular/angular/commit/c4964e7)), closes [#4987](https://github.com/angular/angular/issues/4987) [#5000](https://github.com/angular/angular/issues/5000)
* **test:** Android browser does not support calc() a CSS unit value ([e37799a](https://github.com/angular/angular/commit/e37799a)), closes [#5001](https://github.com/angular/angular/issues/5001)
* **WebWorker:** Don't send messages when the buffer is empty ([8485ef9](https://github.com/angular/angular/commit/8485ef9)), closes [#4138](https://github.com/angular/angular/issues/4138)
* **WebWorker:** Fix bug causing multi browser demo to crash ([eba7073](https://github.com/angular/angular/commit/eba7073)), closes [#4839](https://github.com/angular/angular/issues/4839)

### Features

* **change_detect:** Guard `checkNoChanges` behind `assertionsEnabled` ([63e853d](https://github.com/angular/angular/commit/63e853d)), closes [#4560](https://github.com/angular/angular/issues/4560)
* **ChangeDetector:** Add support for short-circuiting ([7e92d2e](https://github.com/angular/angular/commit/7e92d2e))
* **core:** add support for ambient directives ([5948aba](https://github.com/angular/angular/commit/5948aba))
* **core:** add support for ambient directives to dart transformers ([4909fed](https://github.com/angular/angular/commit/4909fed)), closes [#5129](https://github.com/angular/angular/issues/5129)
* **core:** make transformers handle @Input/@Output/@HostBinding/@HostListener ([16bc238](https://github.com/angular/angular/commit/16bc238)), closes [#5080](https://github.com/angular/angular/issues/5080)
* **core:** renam AMBIENT_DIRECTIVES and AMBIENT_PIPES into PLATFORM_DIRECTIVES and PLATFORM ([e27665c](https://github.com/angular/angular/commit/e27665c)), closes [#5201](https://github.com/angular/angular/issues/5201)
* **dart:** Support forcing dev mode via enableDevMode in Dart. ([a8d9dbf](https://github.com/angular/angular/commit/a8d9dbf)), closes [#5193](https://github.com/angular/angular/issues/5193)
* **dart/transform:** Simplify dependency imports ([9d0b61b](https://github.com/angular/angular/commit/9d0b61b))
* **facade:** add a way to convert observables into promises ([2c201d3](https://github.com/angular/angular/commit/2c201d3))
* **facade:** add a way to detect if an object is a Promise ([fc50829](https://github.com/angular/angular/commit/fc50829))
* **facade:** add ObservableWrapper.fromPromise ([53bd6e1](https://github.com/angular/angular/commit/53bd6e1))
* **facade:** add support for async validators returning observables ([4439106](https://github.com/angular/angular/commit/4439106)), closes [#5032](https://github.com/angular/angular/issues/5032)
* **forms:** add support for adding async validators via template ([31c12af](https://github.com/angular/angular/commit/31c12af))
* **forms:** add support for async validations ([bb2b961](https://github.com/angular/angular/commit/bb2b961))
* **forms:** implements a combinator for composing async validators ([cf449dd](https://github.com/angular/angular/commit/cf449dd))
* **forms:** remove controlsErrors ([7343ef0](https://github.com/angular/angular/commit/7343ef0)), closes [#5102](https://github.com/angular/angular/issues/5102)
* **forms:** update FormBuilder to support async validations ([1c322f1](https://github.com/angular/angular/commit/1c322f1)), closes [#5020](https://github.com/angular/angular/issues/5020)
* **forms:** Use the DefaultValueAccessor for controls with an ng-default-control attribute. ([f21e782](https://github.com/angular/angular/commit/f21e782)), closes [#5076](https://github.com/angular/angular/issues/5076)
* **router:** provide RouteConfig object for AuxRoute ([0ebe283](https://github.com/angular/angular/commit/0ebe283)), closes [#4319](https://github.com/angular/angular/issues/4319)

### Performance Improvements

* **dart/transform:** Restrict visibility/mutability of codegen ([45b33c5](https://github.com/angular/angular/commit/45b33c5)), closes [#5009](https://github.com/angular/angular/issues/5009)


### BREAKING CHANGES

* AMBIENT_DIRECTIVES -> PLATFORM_DIRECTIVES
* AMBIENT_PIPES -> PLATFORM_PIPES

* Previously, the controlsErrors getter of ControlGroup and ControlArray returned the errors of their direct children. This was confusing because the result did not include the errors of nested children (ControlGroup -> ControlGroup -> Control). Making controlsErrors to include such errors would require inventing some custom serialization format, which applications would have to understand.
Since controlsErrors was just a convenience method, and it was causing confusing, we are removing it. If you want to get the errors of the whole form serialized into a single object, you can manually traverse the form and accumulate the errors. This way you have more control over how the errors are serialized.

<a name="2.0.0-alpha.45"></a>
# 2.0.0-alpha.45 (2015-10-29)


### Bug Fixes

* **benchmarks:** update react and polymer benchmarks and get tree update numbers for all of the b ([bc10dc3](https://github.com/angular/angular/commit/bc10dc3)), closes [#4709](https://github.com/angular/angular/issues/4709)
* **benchpress:** increase sampling frequency ([127d6b6](https://github.com/angular/angular/commit/127d6b6)), closes [#4985](https://github.com/angular/angular/issues/4985)
* **ChangeDetector:** support for NaN ([1316c3e](https://github.com/angular/angular/commit/1316c3e)), closes [#4853](https://github.com/angular/angular/issues/4853)
* **compiler:** create literal property bindings for empty *… directives. ([b2dc5c2](https://github.com/angular/angular/commit/b2dc5c2)), closes [#4916](https://github.com/angular/angular/issues/4916)
* **compiler:** do not match directives to variable names ([711dbf4](https://github.com/angular/angular/commit/711dbf4))
* **compiler:** load style urls in runtime mode correctly ([27dbd2d](https://github.com/angular/angular/commit/27dbd2d)), closes [#4952](https://github.com/angular/angular/issues/4952)
* **compiler:** support events on a template element that are consumed via a direct expression ([3118d5c](https://github.com/angular/angular/commit/3118d5c)), closes [#4883](https://github.com/angular/angular/issues/4883)
* **core:** Fix typo ([485c85b](https://github.com/angular/angular/commit/485c85b)), closes [#4803](https://github.com/angular/angular/issues/4803)
* **dart/transform:** Fix issue with deferred in .ng_deps ([6be95ae](https://github.com/angular/angular/commit/6be95ae))
* **debug_element:** don’t descend into merged embedded views on `componentChildren`. ([60bedb4](https://github.com/angular/angular/commit/60bedb4)), closes [#4920](https://github.com/angular/angular/issues/4920)
* **default_value_accessor:** support custom input elements that fire custom change events. ([56a9b02](https://github.com/angular/angular/commit/56a9b02)), closes [#4878](https://github.com/angular/angular/issues/4878)
* **di:** allow dependencies as flat array ([6514b8c](https://github.com/angular/angular/commit/6514b8c))
* **facades:** reduce node count by 1 in assertionsEnabled ([edfa35b](https://github.com/angular/angular/commit/edfa35b))
* **forms:** handle control change in NgFormControl ([d29a9a9](https://github.com/angular/angular/commit/d29a9a9))
* **lang:** avoid infinite loop when calling assert() ([5c48236](https://github.com/angular/angular/commit/5c48236)), closes [#4981](https://github.com/angular/angular/issues/4981) [#4983](https://github.com/angular/angular/issues/4983)
* **lint:** enforce that module-private members have @internal. ([098201d](https://github.com/angular/angular/commit/098201d)), closes [#4645](https://github.com/angular/angular/issues/4645) [#4989](https://github.com/angular/angular/issues/4989)
* **ng_class:** support sets correctly ([2957b0b](https://github.com/angular/angular/commit/2957b0b)), closes [#4910](https://github.com/angular/angular/issues/4910)
* **render:** create svg elements with the right namespace ([ac52bfd](https://github.com/angular/angular/commit/ac52bfd)), closes [#4506](https://github.com/angular/angular/issues/4506) [#4949](https://github.com/angular/angular/issues/4949)
* **renderer:** support `xlink:href` attribute in svg ([540b8c2](https://github.com/angular/angular/commit/540b8c2)), closes [#4956](https://github.com/angular/angular/issues/4956)
* **router:** fix error message text ([280cd33](https://github.com/angular/angular/commit/280cd33))
* **router:** respect LocationStrategy when constructing hrefs in links ([2a3e11d](https://github.com/angular/angular/commit/2a3e11d)), closes [#4333](https://github.com/angular/angular/issues/4333)
* **style_url_resolver:** include `asset:` urls into precompiled stylesheets. ([d8b3601](https://github.com/angular/angular/commit/d8b3601)), closes [#4926](https://github.com/angular/angular/issues/4926)
* **typings:** don't expose RootTestComponent_ ([05d29a9](https://github.com/angular/angular/commit/05d29a9)), closes [#4776](https://github.com/angular/angular/issues/4776) [#4777](https://github.com/angular/angular/issues/4777)
* **url_resolver:** always replace `package:` in Dart, even if it came from `baseUrl`. ([fd9b675](https://github.com/angular/angular/commit/fd9b675)), closes [#4775](https://github.com/angular/angular/issues/4775)
* **WebWorker:** Serialize scroll events ([84d1f93](https://github.com/angular/angular/commit/84d1f93)), closes [#4836](https://github.com/angular/angular/issues/4836) [#4840](https://github.com/angular/angular/issues/4840)

### Features

* **change detection:** remove support for "if" ([0a94021](https://github.com/angular/angular/commit/0a94021)), closes [#4616](https://github.com/angular/angular/issues/4616)
* **core:** PlatformRef and ApplicationRef support registration of disposal functions. ([8dd3082](https://github.com/angular/angular/commit/8dd3082))
* **dart/transform:** Add getters, setters, methods to NgDepsModel ([d68955a](https://github.com/angular/angular/commit/d68955a))
* **dart/transform:** Avoid overwriting assets ([ca5e31b](https://github.com/angular/angular/commit/ca5e31b))
* **dart/transform:** Do not declare outputs ([27ead8c](https://github.com/angular/angular/commit/27ead8c))
* **dart/transform:** Match runtime semantics for template values ([bdd031a](https://github.com/angular/angular/commit/bdd031a))
* **dart/transform:** Parse `directives` dependencies from the Dart ast ([2604402](https://github.com/angular/angular/commit/2604402))
* **forms:** add support for Validator ([547e011](https://github.com/angular/angular/commit/547e011))
* **forms:** Export NumberValueAccessor ([25ddd87](https://github.com/angular/angular/commit/25ddd87))
* **forms:** Implement a way to manually set errors on a control ([ed4826b](https://github.com/angular/angular/commit/ed4826b)), closes [#4917](https://github.com/angular/angular/issues/4917)
* **forms:** support adding validators to ControlGroup via template ([7580628](https://github.com/angular/angular/commit/7580628)), closes [#4954](https://github.com/angular/angular/issues/4954)
* **ngUpgrade:** simple example ([9d0d33f](https://github.com/angular/angular/commit/9d0d33f))
* move NgZone to Stream/Observable-based callback API ([491e1fd](https://github.com/angular/angular/commit/491e1fd))
* upgrade clang-format to 1.0.32. ([4a1b873](https://github.com/angular/angular/commit/4a1b873))
* **Parser:** associate pipes right to left ([4639f44](https://github.com/angular/angular/commit/4639f44)), closes [#4605](https://github.com/angular/angular/issues/4605) [#4716](https://github.com/angular/angular/issues/4716)
* **router:** add support for route links with no leading slash ([07cdc2f](https://github.com/angular/angular/commit/07cdc2f)), closes [#4623](https://github.com/angular/angular/issues/4623)
* **router:** Make RootRouter disposable to allow cleanup of Location subscription. ROUTER_PRO ([2e059dc](https://github.com/angular/angular/commit/2e059dc)), closes [#4915](https://github.com/angular/angular/issues/4915)
* **router:** Support unsubscription from Location by returning the subscription. ([2674eac](https://github.com/angular/angular/commit/2674eac))
* **validators:** Add a pending state to AbstractControl ([c9fba3f](https://github.com/angular/angular/commit/c9fba3f))
* **validators:** Allow errors at both the group/array level or their children ([28d88c5](https://github.com/angular/angular/commit/28d88c5))


### BREAKING CHANGES

#### ControlGroup.errors and ControlArray.errors have changed

* Before: ControlGroup.errors and ControlArray.errors returned a reduced value of their children controls' errors.
* After: ControlGroup.errors and ControlArray.errors return the errors of the group and array, and ControlGroup.controlsErrors and ControlArray.controlsErrors return the reduce value of their children controls' errors.

#### Errors format has changed from validators

Now errors from a control or an array's children are prefixed with 'controls' while errors from the object itself are left at the root level.

**Example:**
Given a Control group as follows:
```
var group = new ControlGroup({
  login: new Control("", required),
  password: new Control("", required),
  passwordConfirm: new Control("", required)
});
```

*Before:*
```
group.errors
{
  login: {required: true},
  password: {required: true},
  passwordConfirm: {required: true},
}
```

*After:*
```
group.errors
{
  controls: {
    login: {required: true},
    password: {required: true},
    passwordConfirm: {required: true},
  }
}
```

#### Pipes are now associated right to left

* Before: `1 + 1 | pipe:a | pipe:b` was parsed as `(1 + 1) | pipe:(a | pipe:b)`
* After: `1 + 1 | pipe:a | pipe:b` is parsed as `((1 + 1) | pipe:a) | pipe:b`

#### NgZone Moved to Stream/Observable-based callback API

* deprecates these methods in NgZone: overrideOnTurnStart, overrideOnTurnDone, overrideOnEventDone, overrideOnErrorHandler
* introduces new API in NgZone that may shadow other API used by existing applications.

#### Directives no longer match to variable names

You can no longer use a #foo or a var-foo to apply directive [foo], although it didn't work properly anyway.
This commit is fixing breakage caused by the switch to pre-compiler (exact SHA unknown).

#### Actions no longer support if statements

<a name="2.0.0-alpha.44"></a>
# 2.0.0-alpha.44 (2015-10-15)


### Bug Fixes

* **compiler:** attribute case in IE9 ([b89c5bc](https://github.com/angular/angular/commit/b89c5bc)), closes [#4743](https://github.com/angular/angular/issues/4743)
* **compiler:** explicitly support event bindings also on `<template>` elements ([cec8b58](https://github.com/angular/angular/commit/cec8b58)), closes [#4712](https://github.com/angular/angular/issues/4712)
* **dart/transform:** Handle empty .ng_deps.dart files ([5a50597](https://github.com/angular/angular/commit/5a50597))
* **dart/transform:** Parse directives agnostic of annotation order ([efddc90](https://github.com/angular/angular/commit/efddc90))
* **forms:** emit value changes after errors and status are set ([b716d23](https://github.com/angular/angular/commit/b716d23)), closes [#4714](https://github.com/angular/angular/issues/4714)
* **style_compiler:** don’t resolve absolute urls that start with a `/` during compilation ([a941fb0](https://github.com/angular/angular/commit/a941fb0)), closes [#4763](https://github.com/angular/angular/issues/4763)
* **style_compiler:** don’t touch urls in stylesheets and keep stylesheets with absolute urls in templ ([7dde18b](https://github.com/angular/angular/commit/7dde18b)), closes [#4740](https://github.com/angular/angular/issues/4740)
* **testing:** let DOM adapter dictate XHR implementation for tests ([d7ab5d4](https://github.com/angular/angular/commit/d7ab5d4))
* **transformers:** show nice error message when an invalid uri is found ([6436f96](https://github.com/angular/angular/commit/6436f96)), closes [#4731](https://github.com/angular/angular/issues/4731)

### Features

* **forms:** add input[type=number] value accessor ([65c737f](https://github.com/angular/angular/commit/65c737f)), closes [#4014](https://github.com/angular/angular/issues/4014) [#4761](https://github.com/angular/angular/issues/4761)
* **ngUpgrade:** add support for upgrade/downgrade of injectables ([d896e43](https://github.com/angular/angular/commit/d896e43)), closes [#4766](https://github.com/angular/angular/issues/4766)
* **ngUpgrade:** faster ng2->ng1 adapter by only compiling ng1 once ([053b7a5](https://github.com/angular/angular/commit/053b7a5))
* **query:** add filter and reduce to QueryList ([bfbf18d](https://github.com/angular/angular/commit/bfbf18d)), closes [#4710](https://github.com/angular/angular/issues/4710)

<a name="2.0.0-alpha.42"></a>
# 2.0.0-alpha.42 (2015-10-13)

This is a quick follow-up release to 41 to fix the d.ts distribution with our
npm package. See [#4706](https://github.com/angular/angular/issues/4706) for more info.

### Bug Fixes

* **build:** Fix serve.js.dev to build bundles ([3b03660](https://github.com/angular/angular/commit/3b03660)), closes [#4700](https://github.com/angular/angular/issues/4700)
* **docs:** minor @link fixes. ([3a801c1](https://github.com/angular/angular/commit/3a801c1)), closes [#4696](https://github.com/angular/angular/issues/4696)
* **publish:** emit type declarations with CJS build ([57649d1](https://github.com/angular/angular/commit/57649d1)), closes [#4706](https://github.com/angular/angular/issues/4706) [#4708](https://github.com/angular/angular/issues/4708)
* **test:** command compiler attr merge test in IE ([e15e242](https://github.com/angular/angular/commit/e15e242))

### Features

* **build:** add tasks to watch and recompile js and dart ([50e922f](https://github.com/angular/angular/commit/50e922f))
* **forms:** add minlength and maxlength validators ([e82a35d](https://github.com/angular/angular/commit/e82a35d)), closes [#4705](https://github.com/angular/angular/issues/4705)

### BREAKING CHANGES

- TypeScript typings are now included in the distribution. If you have installed external typings
  (eg. using tsd to fetch files from DefinitelyTyped), you need to remove them. TypeScript will give
  a `Duplicate identifier` error if the same type definition appears twice.

<a name="2.0.0-alpha.41"></a>
# 2.0.0-alpha.41 (2015-10-13)


### Bug Fixes

* **compiler:** merge `class` and `style` attributes from the element with the host attributes ([eacc8e3](https://github.com/angular/angular/commit/eacc8e3)), closes [#4583](https://github.com/angular/angular/issues/4583) [#4680](https://github.com/angular/angular/issues/4680)
* **compiler:** shadow CSS @import test in some browsers ([0def28e](https://github.com/angular/angular/commit/0def28e)), closes [#4629](https://github.com/angular/angular/issues/4629)
* **docs:** Updated docs for default router location strategy ([075011f](https://github.com/angular/angular/commit/075011f)), closes [#4517](https://github.com/angular/angular/issues/4517)
* **router:** properly read and serialize query params ([8bc40d3](https://github.com/angular/angular/commit/8bc40d3)), closes [#3957](https://github.com/angular/angular/issues/3957) [#4225](https://github.com/angular/angular/issues/4225) [#3784](https://github.com/angular/angular/issues/3784)
* **test_lib:** don't mock out XHR via MockXHR by default in tests ([6abed8d](https://github.com/angular/angular/commit/6abed8d)), closes [#4539](https://github.com/angular/angular/issues/4539) [#4682](https://github.com/angular/angular/issues/4682)
* **typings:** add more missing typings. ([aab0c57](https://github.com/angular/angular/commit/aab0c57)), closes [#4636](https://github.com/angular/angular/issues/4636)
* **typings:** fix typings which were previously unchecked ([c178ad4](https://github.com/angular/angular/commit/c178ad4)), closes [#4625](https://github.com/angular/angular/issues/4625)
* **typings:** missing types in ListWrapper typings ([597f79e](https://github.com/angular/angular/commit/597f79e))

### Features

* **typings**: `*.d.ts` files are now bundled with npm package, `tsd link` or `tsd install` no longer needed ([95f9846](https://github.com/angular/angular/commit/95f9846))
* **core:** desugar [()] to [prop] and (prop-change) ([7c6130c](https://github.com/angular/angular/commit/7c6130c)), closes [#4658](https://github.com/angular/angular/issues/4658)
* **di:** change the params of Provider and provide to start with "use" ([1aeafd3](https://github.com/angular/angular/commit/1aeafd3)), closes [#4684](https://github.com/angular/angular/issues/4684)
* **di:** rename Binding into Provider ([1eb0162](https://github.com/angular/angular/commit/1eb0162)), closes [#4416](https://github.com/angular/angular/issues/4416) [#4654](https://github.com/angular/angular/issues/4654)
* **ngFor:** support a custom template ([6207b1a](https://github.com/angular/angular/commit/6207b1a)), closes [#4637](https://github.com/angular/angular/issues/4637)
* **ngUpgrade:** support for content project from ng1->ng2 ([cd90e6e](https://github.com/angular/angular/commit/cd90e6e))
* **ngUpgrade:** transclude content from ng2->ng1 ([19c1bd7](https://github.com/angular/angular/commit/19c1bd7)), closes [#4640](https://github.com/angular/angular/issues/4640)


### BREAKING CHANGES

- `angular2/test_lib` is now called `angular2/testing`
  - `test_lib.js` -> `testing.js`
  - `import {...} from 'angular2/test_lib'` -> `import {...} from 'angular2/testing'`
- [()] desugaring changed:

  Before:
  ```
  <cmp [(prop)]="field"> was desugared to <cmp [prop]="field" (prop)="field=$event">
  ```
  After:
  ```
  <cmp [(prop)]="field"> is desugared to <cmp [prop]="field" (prop-change)="field=$event">
  ```

### API DEPRECATION

- "DI Binding" terminology has changed to "DI Providers" to avoid conflicts/confusion with data-binding. All commonly used apis that use "bind" or "binding" in the name still work but are deprecated and will be removed in future alpha releases. Please update your code:
  - `bind` -> `provide`
  - `@Component(bindings: ...)` -> `@Component(providers: ...)`
  - `@Component(viewBindings: ...)` -> `@Component(viewProviders: ...)`
  - `HTTP_BINDINGS` -> `HTTP_PROVIDERS`
  - `JSONP_BINDINGS` -> `JSONP_PROVIDERS`
  - `ROUTER_BINDINGS` -> `ROUTER_PROVIDERS`
  - `FORM_BINDINGS` -> `FORM_PROVIDERS`
  - `ELEMENT_PROBE_BINDINGS` -> `ELEMENT_PROBE_PROVIDERS`
  - `NoBindingError` -> `NoProviderError`
  - `AbstractBindingError` -> `AbstractProviderError`
  - `InvalidBindingError` -> `InvalidProviderError`
  - `beforeEachBindings` -> `beforeEachProviders`
  - `Binding` -> `Provider`



<a name="2.0.0-alpha.40"></a>
# 2.0.0-alpha.40 (2015-10-09)


### Bug Fixes

* **analyzer:** fix dart analyzer errors ([14fa007](https://github.com/angular/angular/commit/14fa007))
* **core:** make .toRx() return Subject ([4a36fd8](https://github.com/angular/angular/commit/4a36fd8)), closes [#4521](https://github.com/angular/angular/issues/4521) [#4540](https://github.com/angular/angular/issues/4540)
* **core:** remove NgZone_ and use NgZone instead ([bba0248](https://github.com/angular/angular/commit/bba0248))
* **css:** when compiling CSS, leave absolute imports alone ([04b3dee](https://github.com/angular/angular/commit/04b3dee)), closes [#4592](https://github.com/angular/angular/issues/4592)
* **dart/transform:** Run DeferredRewriter in the correct phase ([811d4c0](https://github.com/angular/angular/commit/811d4c0))
* **dart/transform:** Sanitize generated library names ([ba6e0e1](https://github.com/angular/angular/commit/ba6e0e1))
* **dart/transform:** Write correct ng_deps without deferred imports ([c94f239](https://github.com/angular/angular/commit/c94f239)), closes [#4587](https://github.com/angular/angular/issues/4587)
* **location:** improve the 'No base href set' error message ([15ab6f6](https://github.com/angular/angular/commit/15ab6f6))
* **render:** recurse into components/embedded templates not until all elements in a view have ([6d4bd5d](https://github.com/angular/angular/commit/6d4bd5d)), closes [#4551](https://github.com/angular/angular/issues/4551) [#4601](https://github.com/angular/angular/issues/4601)
* **tests:** fix tests ([8b725c7](https://github.com/angular/angular/commit/8b725c7))
* **tests:** fixes public api spec ([d60c7a9](https://github.com/angular/angular/commit/d60c7a9))
* **typings:** update test.typings for abstract superclasses ([5458036](https://github.com/angular/angular/commit/5458036))
* **web-workers:** fix bindings ([1100c9b](https://github.com/angular/angular/commit/1100c9b))
* **XhrBackend:** setRequestHeader takes a string arg ([6b00b60](https://github.com/angular/angular/commit/6b00b60)), closes [#4597](https://github.com/angular/angular/issues/4597)

### Features

* **core:** add syntax sugar to make @View optional ([bd31b01](https://github.com/angular/angular/commit/bd31b01))
* **dart/transform:** Track timing of transform tasks ([0757265](https://github.com/angular/angular/commit/0757265))
* **router:** allow async routes to be defined with "loader" ([ee32b1b](https://github.com/angular/angular/commit/ee32b1b))
* **transformers:** update transformers to handle components without @View ([a2e7ae5](https://github.com/angular/angular/commit/a2e7ae5))
* **upgrade:** support binding of Ng1 form Ng2 ([8e1d2fb](https://github.com/angular/angular/commit/8e1d2fb)), closes [#4542](https://github.com/angular/angular/issues/4542)

<a name="2.0.0-alpha.39"></a>
# 2.0.0-alpha.39 (2015-10-06)


### Bug Fixes

* **core:** keep styles for `ViewEncapsulation.Native` isolated per component ([0299d4a](https://github.com/angular/angular/commit/0299d4a)), closes [#4513](https://github.com/angular/angular/issues/4513) [#4524](https://github.com/angular/angular/issues/4524)
* **core:** set `ViewEncapsulation.Emulated` as the default again ([a9aef8e](https://github.com/angular/angular/commit/a9aef8e)), closes [#4494](https://github.com/angular/angular/issues/4494)
* **dart/transformer:** Correctly handle const object annotations ([decdbea](https://github.com/angular/angular/commit/decdbea)), closes [#4481](https://github.com/angular/angular/issues/4481)
* **gulp:** use the new karma.Server api ([758efba](https://github.com/angular/angular/commit/758efba)), closes [#4375](https://github.com/angular/angular/issues/4375)
* **http:** add missing semicolon ([150cc22](https://github.com/angular/angular/commit/150cc22))
* **karma:** socket.io 1.x transport is now called 'polling' instead of 'xhr-polling' ([39e9bb6](https://github.com/angular/angular/commit/39e9bb6))
* add test_lib.d.ts to type definitions in generated package.json ([4ebb1a9](https://github.com/angular/angular/commit/4ebb1a9))
* **karma-dart-evalcache:** make the code compatible with karma 0.13.x ([a649992](https://github.com/angular/angular/commit/a649992))
* **npm_publish:** update transitive typings provided in npm distribution ([2ebc74d](https://github.com/angular/angular/commit/2ebc74d))
* **render:** keep bindings of components in content and view in the right order ([6fe8b85](https://github.com/angular/angular/commit/6fe8b85)), closes [#4522](https://github.com/angular/angular/issues/4522) [#4523](https://github.com/angular/angular/issues/4523)
* **shims:** Don't rely on prefixed requestAnimationFrame ([9679fc9](https://github.com/angular/angular/commit/9679fc9)), closes [#4394](https://github.com/angular/angular/issues/4394)
* **tslint:** fix d.ts file paths for node_modules dependencies ([2628631](https://github.com/angular/angular/commit/2628631))
* **typings:** repair broken type-checking for StringMap ([208f3d4](https://github.com/angular/angular/commit/208f3d4)), closes [#4487](https://github.com/angular/angular/issues/4487)
* **typings:** repair broken typechecks ([6093e28](https://github.com/angular/angular/commit/6093e28)), closes [#4507](https://github.com/angular/angular/issues/4507) [#4508](https://github.com/angular/angular/issues/4508)

### Features

* **upgrade:** support binding of Ng2 form Ng1 ([09371a3](https://github.com/angular/angular/commit/09371a3)), closes [#4458](https://github.com/angular/angular/issues/4458)


### BREAKING CHANGES

* `Renderer.registerComponent` now takes an additional argument ([0299d4a](https://github.com/angular/angular/commit/0299d4a)).


<a name="2.0.0-alpha.38"></a>
# 2.0.0-alpha.38 (2015-10-03)


### Bug Fixes

* **annotation_matcher:** fix typo with Directive matchers ([841aa1a](https://github.com/angular/angular/commit/841aa1a))
* **api:** align dart/js APIs ([af2cd4d](https://github.com/angular/angular/commit/af2cd4d))
* **api:** remove animation from public API ([f7d46e7](https://github.com/angular/angular/commit/f7d46e7))
* **api:** remove DomRenderer from public API ([105db02](https://github.com/angular/angular/commit/105db02)), closes [#4187](https://github.com/angular/angular/issues/4187)
* **api:** remove RecordViewTuple / cleanup NgFor ([61b6a47](https://github.com/angular/angular/commit/61b6a47))
* **api:** remove UNDEFINED ([6db9f90](https://github.com/angular/angular/commit/6db9f90))
* **benchpress:** fix benchpress overreporting in chrome45 ([0653b82](https://github.com/angular/angular/commit/0653b82)), closes [#4011](https://github.com/angular/angular/issues/4011) [#4101](https://github.com/angular/angular/issues/4101)
* **benchpress:** make benchpress fit for chrome 45 ([67b9414](https://github.com/angular/angular/commit/67b9414)), closes [#3411](https://github.com/angular/angular/issues/3411) [#3982](https://github.com/angular/angular/issues/3982)
* **benchpress:** update build step, read and config ([6ae9686](https://github.com/angular/angular/commit/6ae9686)), closes [#4419](https://github.com/angular/angular/issues/4419)
* **browser:** make Firefox to work with es6-shim ([e166f6f](https://github.com/angular/angular/commit/e166f6f))
* **bug:** reflect Dart interfaces from superclass as well ([577ee37](https://github.com/angular/angular/commit/577ee37)), closes [#4221](https://github.com/angular/angular/issues/4221) [#4222](https://github.com/angular/angular/issues/4222)
* **build:** add config for outputting the missing test_lib.d.ts file ([f6108c5](https://github.com/angular/angular/commit/f6108c5))
* **build:** lazy-require es6-shim in the a1 router to prevent npm/gulp issues ([e4f94f0](https://github.com/angular/angular/commit/e4f94f0))
* **build:** lock dart dev version ([43cca2d](https://github.com/angular/angular/commit/43cca2d))
* **build:** switch to cjs output for es5. ([e9ad100](https://github.com/angular/angular/commit/e9ad100)), closes [#3974](https://github.com/angular/angular/issues/3974)
* **build:** temporarily test dart with dart2js instead of pub serve ([eb7839e](https://github.com/angular/angular/commit/eb7839e))
* **build:** Use Angular's testability API to wait for end of e2e tests ([33593cf](https://github.com/angular/angular/commit/33593cf)), closes [#3911](https://github.com/angular/angular/issues/3911)
* **bundles:** add explicit format: cjs for empty files. ([ef61b81](https://github.com/angular/angular/commit/ef61b81))
* **change_detection:** _throwError should not mask the original exception ([cec4b36](https://github.com/angular/angular/commit/cec4b36))
* **code size:** do not rely on Uri in BrowserDomAdapter ([9dc1d6a](https://github.com/angular/angular/commit/9dc1d6a)), closes [#4182](https://github.com/angular/angular/issues/4182)
* **compiler:** const is not supported in IE9 and IE10 ([b44c13b](https://github.com/angular/angular/commit/b44c13b)), closes [#4465](https://github.com/angular/angular/issues/4465)
* **compiler:** Implement Token#toString for Operator ([3b9c086](https://github.com/angular/angular/commit/3b9c086)), closes [#4049](https://github.com/angular/angular/issues/4049)
* **compiler:** minor cleanups and fixes ([0ed6fc4](https://github.com/angular/angular/commit/0ed6fc4))
* **compiler:** remove attributes when expression in [attr.foo]='exp' evaluates to null ([045cc82](https://github.com/angular/angular/commit/045cc82)), closes [#4150](https://github.com/angular/angular/issues/4150) [#4163](https://github.com/angular/angular/issues/4163)
* **core:** Document the new bootstrap APIs. Also rename rootBindings() to platformBindings( ([06f8330](https://github.com/angular/angular/commit/06f8330)), closes [#4218](https://github.com/angular/angular/issues/4218)
* **core:** export bootstrap from core exports for JS ([4fd9cc2](https://github.com/angular/angular/commit/4fd9cc2)), closes [#4097](https://github.com/angular/angular/issues/4097)
* **dart/transform:** Fix transformer output declaration ([1f2302e](https://github.com/angular/angular/commit/1f2302e))
* **dart/transform:** Handle export cycles ([e7d65ad](https://github.com/angular/angular/commit/e7d65ad)), closes [#4370](https://github.com/angular/angular/issues/4370)
* **debug:** make debug tools take ComponentRef ([70586b6](https://github.com/angular/angular/commit/70586b6)), closes [#4203](https://github.com/angular/angular/issues/4203)
* **DirectiveResolver:** Synced with latest changes ([86bda28](https://github.com/angular/angular/commit/86bda28)), closes [#3928](https://github.com/angular/angular/issues/3928)
* **dist:** don't distribute the HTML dart api docs ([be6d92c](https://github.com/angular/angular/commit/be6d92c)), closes [#4115](https://github.com/angular/angular/issues/4115) [#4211](https://github.com/angular/angular/issues/4211)
* **dts generation:** add support for type aliases ([d782616](https://github.com/angular/angular/commit/d782616)), closes [#3952](https://github.com/angular/angular/issues/3952)
* **dts generation:** rewrite the d.ts file code generator to fix bugs and apply type remap correctly ([ad3b9cf](https://github.com/angular/angular/commit/ad3b9cf))
* **exception_handler:** fix error messages of wrapped exceptions ([f6cc573](https://github.com/angular/angular/commit/f6cc573)), closes [#4117](https://github.com/angular/angular/issues/4117)
* **exceptions:** NoAnnotationError message is not displayed ([eaa20f6](https://github.com/angular/angular/commit/eaa20f6)), closes [#4215](https://github.com/angular/angular/issues/4215) [#4223](https://github.com/angular/angular/issues/4223)
* **facade:** workaround for lack of Symbol.iterator in es6-shim ([390aacd](https://github.com/angular/angular/commit/390aacd)), closes [#4219](https://github.com/angular/angular/issues/4219) [#4216](https://github.com/angular/angular/issues/4216)
* **fake_async:** remove unused variable ([ddde711](https://github.com/angular/angular/commit/ddde711))
* **forms:** Also update viewModel in NgFormControl ([70f6a46](https://github.com/angular/angular/commit/70f6a46))
* **forms:** avoid issues with nulls checking on validation status and other form states. ([7714d6a](https://github.com/angular/angular/commit/7714d6a)), closes [#4338](https://github.com/angular/angular/issues/4338)
* **forms:** Update NgModel's viewModel when model changes ([e36966b](https://github.com/angular/angular/commit/e36966b)), closes [#3627](https://github.com/angular/angular/issues/3627)
* **http:** change http interfaces to types ([3d6e3c2](https://github.com/angular/angular/commit/3d6e3c2)), closes [#4024](https://github.com/angular/angular/issues/4024)
* **http:** throw if url is not string or Request ([3525d8a](https://github.com/angular/angular/commit/3525d8a)), closes [#4245](https://github.com/angular/angular/issues/4245) [#4257](https://github.com/angular/angular/issues/4257)
* **ListWrapper:** make list slice in dart return empty list if start and end are inverted like JS ([bced3aa](https://github.com/angular/angular/commit/bced3aa))
* **NgClass:** ignore empty and blank class names ([73351ac](https://github.com/angular/angular/commit/73351ac)), closes [#4033](https://github.com/angular/angular/issues/4033) [#4173](https://github.com/angular/angular/issues/4173)
* **pipes:** add triple ticks around async_pipe code sample ([7b3161a](https://github.com/angular/angular/commit/7b3161a)), closes [#4110](https://github.com/angular/angular/issues/4110)
* **query:** clean-up queryref during dehydration ([01cdd31](https://github.com/angular/angular/commit/01cdd31)), closes [#3944](https://github.com/angular/angular/issues/3944) [#3948](https://github.com/angular/angular/issues/3948)
* **reflector:** merge prop metadata from getters and setters ([15164a8](https://github.com/angular/angular/commit/15164a8)), closes [#4006](https://github.com/angular/angular/issues/4006)
* **router:** do not reuse common children with different parents ([77e8304](https://github.com/angular/angular/commit/77e8304))
* **router:** load route config from async instructions ([5e49d7e](https://github.com/angular/angular/commit/5e49d7e)), closes [#4146](https://github.com/angular/angular/issues/4146)
* **router:** recognize child components with empty segments ([3099449](https://github.com/angular/angular/commit/3099449)), closes [#4178](https://github.com/angular/angular/issues/4178)
* **router:** throw when generating non-terminal link ([8aec215](https://github.com/angular/angular/commit/8aec215)), closes [#3979](https://github.com/angular/angular/issues/3979) [#4092](https://github.com/angular/angular/issues/4092)
* **router:** use StringWrapper.startsWith ([6e0ca7f](https://github.com/angular/angular/commit/6e0ca7f))
* **services:** export title service ([e2f5d87](https://github.com/angular/angular/commit/e2f5d87)), closes [#4271](https://github.com/angular/angular/issues/4271)
* **sfx:** Include ngHttp in SFX bundle ([283415b](https://github.com/angular/angular/commit/283415b)), closes [#3933](https://github.com/angular/angular/issues/3933)
* **shims:** add requestAnimationFrame shim for IE9 and Android ([4f56a01](https://github.com/angular/angular/commit/4f56a01)), closes [#4209](https://github.com/angular/angular/issues/4209)
* **shims:** function.name to return empty string when no name ([3a7b50f](https://github.com/angular/angular/commit/3a7b50f))
* **test:** Android browser does not support element.click() ([c83207f](https://github.com/angular/angular/commit/c83207f))
* **test:** AngularProfiler should check before using modern APIs ([abc4ef3](https://github.com/angular/angular/commit/abc4ef3))
* **test:** do not set ng.probe when ng is null or undefined ([df7f59b](https://github.com/angular/angular/commit/df7f59b))
* **test:** make `evalModule` faster by caching spawned modules in the browser ([67c79ba](https://github.com/angular/angular/commit/67c79ba))
* **test:** PostMessageBusSink tests failing in slow browsers ([55290b9](https://github.com/angular/angular/commit/55290b9))
* **test:** StyleCompiler tests failing in Android browsers ([d646463](https://github.com/angular/angular/commit/d646463))
* **test:** StyleCompiler tests failing in Android browsers ([9c97690](https://github.com/angular/angular/commit/9c97690)), closes [#4351](https://github.com/angular/angular/issues/4351)
* **test_lib:** add missing types ([34deda5](https://github.com/angular/angular/commit/34deda5))
* **test_lib:** reexport fake_async via angular/test ([687e7b5](https://github.com/angular/angular/commit/687e7b5))
* **Typings:** Output public constructors in .d.ts files ([1926335](https://github.com/angular/angular/commit/1926335)), closes [#3926](https://github.com/angular/angular/issues/3926) [#3963](https://github.com/angular/angular/issues/3963)
* **Typings & Test API:**
  - Remove public exports added in 1926335b85af6c1fe56f4e36d0b95dcc92bb5c42 ([787d1f9](https://github.com/angular/angular/commit/787d1f9))
  - closes [#4147](https://github.com/angular/angular/issues/4147)
  - BREAKING CHANGE: `RootTestComponent` is no longer `DebugElement`; to get to component instance use `testComp.debugElement.componentInstance`
* **upgrade:** assert correct interleaving of evaluation. ([a562230](https://github.com/angular/angular/commit/a562230)), closes [#4436](https://github.com/angular/angular/issues/4436)
* **WebWorker:** Add zone support to MessageBus ([f3da37c](https://github.com/angular/angular/commit/f3da37c)), closes [#4053](https://github.com/angular/angular/issues/4053)
* **WebWorker:** Fix Todo Server demo and add test to ensure the demo can bootstrap. ([696edde](https://github.com/angular/angular/commit/696edde)), closes [#3970](https://github.com/angular/angular/issues/3970)

### Features

* **angular_1_router:** add ngRouteShim module ([aed34e1](https://github.com/angular/angular/commit/aed34e1)), closes [#4266](https://github.com/angular/angular/issues/4266)
* **animate:** adds basic support for CSS animations on enter and leave ([39ce9d3](https://github.com/angular/angular/commit/39ce9d3)), closes [#3876](https://github.com/angular/angular/issues/3876)
* **animate:** cross-browser compatibility ([bffa2cb](https://github.com/angular/angular/commit/bffa2cb)), closes [#4243](https://github.com/angular/angular/issues/4243)
* **Binding:** improve errors ([0319417](https://github.com/angular/angular/commit/0319417)), closes [#4358](https://github.com/angular/angular/issues/4358) [#4360](https://github.com/angular/angular/issues/4360)
* **change detection:** export SimpleChange ([0a88e7b](https://github.com/angular/angular/commit/0a88e7b)), closes [#4337](https://github.com/angular/angular/issues/4337)
* **change_detection:** allow triggering CD form ChangeDetectorRef ([63e7859](https://github.com/angular/angular/commit/63e7859)), closes [#4144](https://github.com/angular/angular/issues/4144)
* **code size:** make assertionsEnabled() statically computable by dart2js ([241632a](https://github.com/angular/angular/commit/241632a)), closes [#4198](https://github.com/angular/angular/issues/4198)
* **compiler:** add change detector generation ([12dd44f](https://github.com/angular/angular/commit/12dd44f)), closes [#4057](https://github.com/angular/angular/issues/4057)
* **compiler:** add stylesheet compiler ([2384082](https://github.com/angular/angular/commit/2384082)), closes [#3891](https://github.com/angular/angular/issues/3891)
* **compiler:** add TemplateCompiler ([457b689](https://github.com/angular/angular/commit/457b689)), closes [#4220](https://github.com/angular/angular/issues/4220)
* **compiler:** allow to create ChangeDetectors from parsed templates ([2fea0c2](https://github.com/angular/angular/commit/2fea0c2)), closes [#3950](https://github.com/angular/angular/issues/3950)
* **compiler:** support creating template commands ([0246b2a](https://github.com/angular/angular/commit/0246b2a)), closes [#4142](https://github.com/angular/angular/issues/4142)
* **core:** Add a long-form syntax for Angular bootstrapping. ([97d1844](https://github.com/angular/angular/commit/97d1844)), closes [#3852](https://github.com/angular/angular/issues/3852)
* **core:** add sugar to use ContentChildren and ViewChildren as prop decorators ([2e9de0b](https://github.com/angular/angular/commit/2e9de0b)), closes [#4237](https://github.com/angular/angular/issues/4237)
* **core:** add support for @ContentChild and @ViewChild ([c2a60f1](https://github.com/angular/angular/commit/c2a60f1)), closes [#4251](https://github.com/angular/angular/issues/4251)
* **core:** add support for @HostBinding and @HostListener ([df8e15c](https://github.com/angular/angular/commit/df8e15c)), closes [#3996](https://github.com/angular/angular/issues/3996)
* **core:** add support for @Property and @Event decorators ([896add7](https://github.com/angular/angular/commit/896add7)), closes [#3992](https://github.com/angular/angular/issues/3992)
* **core:** add support for ContentChildren and ViewChildren ([5dbe292](https://github.com/angular/angular/commit/5dbe292))
* **core:** renames Property into Input and Event into Output ([adbfd29](https://github.com/angular/angular/commit/adbfd29))
* **core:** Support multiple ChangeDetectors in a single LifeCycle. ([4f57990](https://github.com/angular/angular/commit/4f57990))
* **core:** support properties and events in addition to inputs and outputs to make transiti ([c9901c5](https://github.com/angular/angular/commit/c9901c5)), closes [#4482](https://github.com/angular/angular/issues/4482)
* **CORE_DIRECTIVES:** add NgStyle to CORE_DIRECTIVES ([5f15363](https://github.com/angular/angular/commit/5f15363)), closes [#4096](https://github.com/angular/angular/issues/4096) [#4161](https://github.com/angular/angular/issues/4161)
* **dart/transform:** Declare transformer outputs ([2acc1ad](https://github.com/angular/angular/commit/2acc1ad))
* **dart/transform:** Record property metadata ([64e8f93](https://github.com/angular/angular/commit/64e8f93)), closes [#1800](https://github.com/angular/angular/issues/1800) [#3267](https://github.com/angular/angular/issues/3267) [#4003](https://github.com/angular/angular/issues/4003)
* **di:** add support for multi bindings ([7736964](https://github.com/angular/angular/commit/7736964))
* **docs:** document change detection profiler ([4ec4dca](https://github.com/angular/angular/commit/4ec4dca))
* **forms:** make NgControl -> NgValueAccessor dependency unidirectional ([00a4b2e](https://github.com/angular/angular/commit/00a4b2e)), closes [#4421](https://github.com/angular/angular/issues/4421)
* **http:** Add support for strings as http method names ([34518f0](https://github.com/angular/angular/commit/34518f0)), closes [#4331](https://github.com/angular/angular/issues/4331)
* **ng_for:** Add Even and Odd variables to ng_for ([a15b679](https://github.com/angular/angular/commit/a15b679)), closes [#4181](https://github.com/angular/angular/issues/4181)
* **NgFor:** $last property support ([be95411](https://github.com/angular/angular/commit/be95411)), closes [#3991](https://github.com/angular/angular/issues/3991)
* **perf:** change detection profiler ([8dd6c46](https://github.com/angular/angular/commit/8dd6c46)), closes [#4000](https://github.com/angular/angular/issues/4000)
* **pipes:** add slice pipe that supports start and end indexes ([c2043ec](https://github.com/angular/angular/commit/c2043ec))
* **pipes:** add support for pure pipes ([a8bdb69](https://github.com/angular/angular/commit/a8bdb69)), closes [#3966](https://github.com/angular/angular/issues/3966)
* **query:** implement query update mechanism based on views. ([5ebeaf7](https://github.com/angular/angular/commit/5ebeaf7)), closes [#3973](https://github.com/angular/angular/issues/3973)
* **query:** make QueryList notify on changes via an observable ([3aa2047](https://github.com/angular/angular/commit/3aa2047)), closes [#4395](https://github.com/angular/angular/issues/4395)
* **query:** remove the 3-query-per-element limit ([4efc4a5](https://github.com/angular/angular/commit/4efc4a5)), closes [#4336](https://github.com/angular/angular/issues/4336)
* **render:** add generic view factory based on the template commands ([1cf4575](https://github.com/angular/angular/commit/1cf4575)), closes [#4367](https://github.com/angular/angular/issues/4367)
* **router:** enforce convention of CamelCase names in route aliases ([5298eb0](https://github.com/angular/angular/commit/5298eb0)), closes [#4083](https://github.com/angular/angular/issues/4083)
* **router:** introduce new navigate method ([d9036c6](https://github.com/angular/angular/commit/d9036c6)), closes [#4040](https://github.com/angular/angular/issues/4040) [#4074](https://github.com/angular/angular/issues/4074)
* **StringWrapper:** add support for JS slice method to string ([0808eea](https://github.com/angular/angular/commit/0808eea))
* **TestComponentBuilder:** add #overrideBindings and #overrideViewBindings ([f91c087](https://github.com/angular/angular/commit/f91c087)), closes [#4052](https://github.com/angular/angular/issues/4052)
* **tests:** add helper to eval a module ([2a126f7](https://github.com/angular/angular/commit/2a126f7))
* **transformers:** record setters for query fields ([589ce31](https://github.com/angular/angular/commit/589ce31)), closes [#4344](https://github.com/angular/angular/issues/4344)
* **upgrade:** Allow including ng2/1 components in ng1/2 ([8427863](https://github.com/angular/angular/commit/8427863)), closes [#3539](https://github.com/angular/angular/issues/3539)


### BREAKING CHANGES

#### Query

[make QueryList notify on changes via an observable](https://github.com/angular/angular/commit/3aa2047)

* Before: query.onChange(() => ...);
* After: query.changes.subscribe((iterable) => {});

#### Router

[introduce new navigate method](https://github.com/angular/angular/commit/d9036c6)

Previously, `router.navigate` took a string representing the URL.
Now, it accepts an array that mirrors the link DSL.
The old `navigate` method has been renamed to `router.navigateByUrl`.
Either change your navigation calls to use the DSL (preferred) or
call `router.navigateByUrl` instead.

* Before:
router.navigate

* After:
router.navigateUrl


#### Pipes

[add support for pure pipes](https://github.com/angular/angular/commit/a8bdb69)
By default, pipes are pure. This means that an instance of a pipe will be reused and the pipe will be called only when its arguments change.

Before:

@Pipe({name: 'date'}) class DatePipe {} defines an impure pipe.

After:

@Pipe({name: 'date'}) class DatePipe {} defines a pure pipe.
@Pipe({name: 'date', pure: false}) class DatePipe {} defines an impure pipe.

* Before:
@Pipe({name: 'date'}) class DatePipe {} defines an impure pipe.
* After:
@Pipe({name: 'date'}) class DatePipe {} defines a pure pipe.
@Pipe({name: 'date', pure: false}) class DatePipe {} defines an impure pipe.

#### ViewQuery

[Implement query update mechanism based on views.](https://github.com/angular/angular/commit/5ebeaf7c9bdab8de6d11c7b4c4d0954553196903)

* ViewQuery no longer supports the descendants flag. It queries the whole
component view by default.

Instead of working with finer grained element injectors, queries now
iterate through the views as static units of modification of the
application structure. Views already contain element injectors in the
correct depth-first preorder.

This allows us to remove children linked lists on element injectors and a
lot of book keeping that is already present at the view level.

Queries are recalculated using the afterContentChecked and
afterViewChecked hooks, only during init and after a view container has
changed.

* Before:
@ViewQuery(SomeDirective, {descendants: true})) someDirective
* After:
@ViewQuery(SomeDirective) someDirective

#### DI

[add support for multi bindings](https://github.com/angular/angular/commit/7736964a37d17cf0f1e5381c9a95a33ee863f02f)
Previously a content binding of a component was visible to the directives in its view with the host constraint.
This is not the case any more. To access that binding, remove the constraint.

#### Core
[remove the (^ syntax and make all DOM events bubbling)](https://github.com/angular/angular/commit/60ce8846710338228bc7db3d3c808c166e15e931)

* Before
```html
<div (^click)="onEventHandler()">
  <button></button>
</div>
```
* After
```html
<div (click)="onEventHandler()">
  <button></button>
</div>
```

#### Properties/Events (Inputs/Outputs)

[Rename Property into Input and Event into Output](https://github.com/angular/angular/commit/adbfd29fd761135d51985564edcb4db7f8b6a26a)

* Before:
@Directive({properties: ['one'], events: ['two']})
* After:
@Directive({inputs: ['one'], outputs: ['two']})

* Before:
@Component({properties: ['one'], events: ['two']})
* After:
@Componet({inputs: ['one'], outputs: ['two']})

* Before:
class A {@Property() one; @Event() two;}
* After:
class A {@Input() one; @Output() two;}

#### Compiler

With a [new compiler](https://github.com/angular/angular/commit/76247b70973e3266e504e05381fbd7d85d4de5c6) `NgNonBindable`
 is not a directive but rather a special attribute (`ng-non-bindable`) recognized by the compiler. This means that you
can't import / use the `NgNonBindable` as a directive. You should remove all the imports for the the `NgNonBindable`
directive and all the references to it in the `directives` section of the `@View` decorator.



<a name="2.0.0-alpha.37"></a>
# 2.0.0-alpha.37 (2015-09-09)


### Bug Fixes

* **build:** delete unreferenced typings on npm install ([42e1b07](https://github.com/angular/angular/commit/42e1b07)), closes [#1636](https://github.com/angular/angular/issues/1636) [#3940](https://github.com/angular/angular/issues/3940)
* **bundle:** don't include System.config in dev bundle ([a94f051](https://github.com/angular/angular/commit/a94f051)), closes [#3826](https://github.com/angular/angular/issues/3826) [#3862](https://github.com/angular/angular/issues/3862)
* **ComponentUrlMapper:** support relative template URLs in Dartium ([7c7888d](https://github.com/angular/angular/commit/7c7888d)), closes [#2771](https://github.com/angular/angular/issues/2771) [#3743](https://github.com/angular/angular/issues/3743)
* **core:** Fix type error ([6c3c606](https://github.com/angular/angular/commit/6c3c606))
* **http:** change type declarations to interfaces and export EventEmitter ([10437ab](https://github.com/angular/angular/commit/10437ab))
* **router:** re-export of Type ([b8be4bf](https://github.com/angular/angular/commit/b8be4bf)), closes [#3632](https://github.com/angular/angular/issues/3632) [#3704](https://github.com/angular/angular/issues/3704)
* **RouteRegistry:** initialize RouteParams.params ([3791c4a](https://github.com/angular/angular/commit/3791c4a)), closes [#3755](https://github.com/angular/angular/issues/3755)
* **test:** error in karma when systemjs imports fail ([7820086](https://github.com/angular/angular/commit/7820086)), closes [#3846](https://github.com/angular/angular/issues/3846)
* **typings:** emit spread parameters ([a34d4c6](https://github.com/angular/angular/commit/a34d4c6)), closes [#3875](https://github.com/angular/angular/issues/3875)
* **WebWorker:** Return boolean from `dispatchRenderEvent` ([457eb5d](https://github.com/angular/angular/commit/457eb5d))
* **WebWorker:** WebWorkerRenderer removes views after they're destroyed ([9619636](https://github.com/angular/angular/commit/9619636)), closes [#3240](https://github.com/angular/angular/issues/3240) [#3894](https://github.com/angular/angular/issues/3894)

### Features

* **compile:** add HtmlParser, TemplateParser, ComponentMetadataLoader ([9f576b0](https://github.com/angular/angular/commit/9f576b0)), closes [#3839](https://github.com/angular/angular/issues/3839)
* **compiler:** add full directive metadata and validation logic ([f93cd9c](https://github.com/angular/angular/commit/f93cd9c)), closes [#3880](https://github.com/angular/angular/issues/3880)
* **core:** added afterContentInit, afterViewInit, and afterViewChecked hooks ([d49bc43](https://github.com/angular/angular/commit/d49bc43)), closes [#3897](https://github.com/angular/angular/issues/3897)
* **core:** remove the (^ syntax and make all DOM events bubbling ([60ce884](https://github.com/angular/angular/commit/60ce884)), closes [#3864](https://github.com/angular/angular/issues/3864)
* **docs:** document code size management tools for Dart ([6532171](https://github.com/angular/angular/commit/6532171))
* **docs:** document unused reflection info tracking ([46f751b](https://github.com/angular/angular/commit/46f751b))
* **exception_handler:** changed ExceptionHandler to use console.error instead of console.log ([3bb27de](https://github.com/angular/angular/commit/3bb27de)), closes [#3812](https://github.com/angular/angular/issues/3812)
* **router:** hash-cons ComponentInstructions ([e1a7e03](https://github.com/angular/angular/commit/e1a7e03))
* **router:** implement Router.isRouteActive ([de37729](https://github.com/angular/angular/commit/de37729))
* **router:** router-link-active CSS class support ([36eb9d3](https://github.com/angular/angular/commit/36eb9d3)), closes [#3209](https://github.com/angular/angular/issues/3209)
* **WebWorker:** Expose MessageBroker API ([358908e](https://github.com/angular/angular/commit/358908e)), closes [#3942](https://github.com/angular/angular/issues/3942)
* **WebWorkers:** Add WebSocket MessageBuses for debugging apps ([4ba4427](https://github.com/angular/angular/commit/4ba4427)), closes [#3858](https://github.com/angular/angular/issues/3858)


### BREAKING CHANGES

#### Events

* Before

```html
<div (^click)="onEventHandler()">
  <button></button>
</div>
```

* After

```html
<div (click)="onEventHandler()">
  <button></button>
</div>
```

#### Lifecycle

* Before (ES5)

```js
var HelloCmp = ng.
  Component({
    selector: 'hello-cmp',
    lifecycle: [LifecycleEvent.onInit]
  })
  .View({
    template: `<h1>hello, there!</h1>`
  })
  .Class({
    onInit: function() {
      console.log('hello-cmp init');
    }
  });
```

* Before (ES6)

```js
import {Component, View, LifecycleEvent} from 'angular2/angular2';

@Component({
  selector: 'hello-cmp',
  lifecycle: [LifecycleEvent.onInit]
})
@View({
  template: `<h1>hello, there!</h1>`
})
class HelloCmp {
  onInit() {
    console.log('hello-cmp init');
  }
}
```

* After (ES5)

```js
var HelloCmp = ng.
  Component({
    selector: 'hello-cmp'
  })
  .View({
    template: `<h1>hello, there!</h1>`
  })
  .Class({
    onInit: function() {
      console.log('hello-cmp init');
    }
  });
```

* After (ES6)

```js
import {Component, View, OnInit} from 'angular2/angular2';

@Component({
  selector: 'hello-cmp'
})
@View({
  template: `<h1>hello, there!</h1>`
})
class HelloCmp implements OnInit {
  onInit() {
    console.log('hello-cmp init');
  }
}
```


<a name="2.0.0-alpha.36"></a>
# 2.0.0-alpha.36 (2015-08-31)


### Bug Fixes

* **.d.ts:** show unknown fields as ‘any’ not ‘void’. ([a0b2408](https://github.com/angular/angular/commit/a0b2408)), closes [#3637](https://github.com/angular/angular/issues/3637)
* **build:** do not run build/pubbuild.dart twice ([e72305e](https://github.com/angular/angular/commit/e72305e)), closes [#3831](https://github.com/angular/angular/issues/3831)
* **build:** error when running `npm test` locally ([bf4b75e](https://github.com/angular/angular/commit/bf4b75e)), closes [#3806](https://github.com/angular/angular/issues/3806)
* **build:** make e2e tests faster ([c2279dd](https://github.com/angular/angular/commit/c2279dd)), closes [#3822](https://github.com/angular/angular/issues/3822)
* **change_detection:** fixed reflect properties as attributes ([a9ce454](https://github.com/angular/angular/commit/a9ce454)), closes [#3761](https://github.com/angular/angular/issues/3761)
* **change_detection:** update the right change detector when using ON_PUSH mode ([195c5c2](https://github.com/angular/angular/commit/195c5c2))
* **compiler:** detect and report error for views with empty templateUrl ([215c4aa](https://github.com/angular/angular/commit/215c4aa)), closes [#3762](https://github.com/angular/angular/issues/3762) [#3768](https://github.com/angular/angular/issues/3768)
* **dart:** bad export in core.dart ([984e7b8](https://github.com/angular/angular/commit/984e7b8))
* **examples:** Modifies web worker examples to be compatible with systemjs 0.18.10. ([675cb87](https://github.com/angular/angular/commit/675cb87)), closes [#3630](https://github.com/angular/angular/issues/3630)
* **http:** allow using JSONP_INJECTABLES and HTTP_INJECTABLES in same injector ([5725f71](https://github.com/angular/angular/commit/5725f71)), closes [#3365](https://github.com/angular/angular/issues/3365) [#3390](https://github.com/angular/angular/issues/3390)
* **http/http:** allow for commonjs as ngHttp ([16eb8ce](https://github.com/angular/angular/commit/16eb8ce)), closes [#3633](https://github.com/angular/angular/issues/3633)
* **injector:** support getRootInjectors on dehydrated injectors. ([92da543](https://github.com/angular/angular/commit/92da543)), closes [#3760](https://github.com/angular/angular/issues/3760)
* **injectors:** reset the construction counter in dynamic strategy. ([272ad61](https://github.com/angular/angular/commit/272ad61)), closes [#3635](https://github.com/angular/angular/issues/3635)
* <template> tag for browsers that do not suppor them ([ddcfd46](https://github.com/angular/angular/commit/ddcfd46)), closes [#3636](https://github.com/angular/angular/issues/3636)
* **karma:** corrected race condition with RX loading ([8dc509f](https://github.com/angular/angular/commit/8dc509f))
* **parser:** detect and report interpolation in expressions ([b039ec3](https://github.com/angular/angular/commit/b039ec3)), closes [#3645](https://github.com/angular/angular/issues/3645) [#3750](https://github.com/angular/angular/issues/3750)
* **router:** allow router-link to link to redirects ([72e0b8f](https://github.com/angular/angular/commit/72e0b8f)), closes [#3335](https://github.com/angular/angular/issues/3335) [#3624](https://github.com/angular/angular/issues/3624)
* **router:** subscribe should return subscription ([5c95b37](https://github.com/angular/angular/commit/5c95b37)), closes [#3491](https://github.com/angular/angular/issues/3491) [#3695](https://github.com/angular/angular/issues/3695)
* **typings:** include static members ([894af28](https://github.com/angular/angular/commit/894af28)), closes [#3175](https://github.com/angular/angular/issues/3175) [#3780](https://github.com/angular/angular/issues/3780)
* **ViewLoader:** provide componentId in missing template / templateUrl errors ([3871f89](https://github.com/angular/angular/commit/3871f89))
* **wtf:** fix NgZone.run instrumentation ([5f0a0fd](https://github.com/angular/angular/commit/5f0a0fd)), closes [#3788](https://github.com/angular/angular/issues/3788)
* wtf paramater passing on scope ([9afcb00](https://github.com/angular/angular/commit/9afcb00)), closes [#3726](https://github.com/angular/angular/issues/3726)

### Features

* track unused reflection data ([8336881](https://github.com/angular/angular/commit/8336881))
* **browser:** support Edge ([3b49652](https://github.com/angular/angular/commit/3b49652)), closes [#3667](https://github.com/angular/angular/issues/3667)
* **build:** added a temporary fix to make test.unit.dart work ([85ec34d](https://github.com/angular/angular/commit/85ec34d))
* **change_detection:** added support for observable components and directives ([e8e430e](https://github.com/angular/angular/commit/e8e430e))
* **change_detection:** do not reparse AST when using generated detectors ([d2d0715](https://github.com/angular/angular/commit/d2d0715))
* **docs:** export type info for var and const exports ([9262727](https://github.com/angular/angular/commit/9262727)), closes [#3700](https://github.com/angular/angular/issues/3700)
* **facade:** add maximum method for ListWrapper ([b5c4d8b](https://github.com/angular/angular/commit/b5c4d8b))
* **http:** xhr error listener invokes throw on EventEmitter ([f2d3bdb](https://github.com/angular/angular/commit/f2d3bdb)), closes [#2667](https://github.com/angular/angular/issues/2667)
* **router:** add angular 1.x router ([fde026a](https://github.com/angular/angular/commit/fde026a))
* **router:** add reuse support for angular 1.x router ([ddb62fe](https://github.com/angular/angular/commit/ddb62fe)), closes [#3698](https://github.com/angular/angular/issues/3698)
* **url_resolver:** Allow a developer to customize their package prefix ([9cc1cd2](https://github.com/angular/angular/commit/9cc1cd2)), closes [#3794](https://github.com/angular/angular/issues/3794)



<a name="2.0.0-alpha.35"></a>
# 2.0.0-alpha.35 (2015-08-19)


### Bug Fixes

* **benchmarks:** remove reference to String.prototype.contains() ([b6ee208](https://github.com/angular/angular/commit/b6ee208)), closes [#3570](https://github.com/angular/angular/issues/3570)
* **browser_adapter.ts:** baseElement.getAttribute ([235dec2](https://github.com/angular/angular/commit/235dec2)), closes [#3214](https://github.com/angular/angular/issues/3214)
* **compiler:** strip script tag from templates ([748c2d6](https://github.com/angular/angular/commit/748c2d6)), closes [#2766](https://github.com/angular/angular/issues/2766) [#3486](https://github.com/angular/angular/issues/3486)
* **CSSClass:** change selector to ng-class ([ff1b110](https://github.com/angular/angular/commit/ff1b110)), closes [#3498](https://github.com/angular/angular/issues/3498)
* **dart:** @proxy is a value, not a factory ([b4a0629](https://github.com/angular/angular/commit/b4a0629)), closes [#3494](https://github.com/angular/angular/issues/3494)
* **docs:** export bootstrap in core.ts but not in core.dart ([5f7d4fa](https://github.com/angular/angular/commit/5f7d4fa))
* **docs:** ng-non-bindable ([f2f4b90](https://github.com/angular/angular/commit/f2f4b90)), closes [#3607](https://github.com/angular/angular/issues/3607)
* **exception_handler:** log errors that are thrown by the compiler ([07b9be7](https://github.com/angular/angular/commit/07b9be7))
* **NgClass:** take initial classes into account during cleanup ([ed25a29](https://github.com/angular/angular/commit/ed25a29)), closes [#3557](https://github.com/angular/angular/issues/3557)
* **presubmit:** uses proper branch instead of hard coded ([96e34c1](https://github.com/angular/angular/commit/96e34c1)), closes [#3552](https://github.com/angular/angular/issues/3552)
* **query:** do not visit dehydrated injectors. ([6c9e712](https://github.com/angular/angular/commit/6c9e712))
* **router:** fix regression with generating links to async routes ([26d2ea8](https://github.com/angular/angular/commit/26d2ea8)), closes [#3650](https://github.com/angular/angular/issues/3650)
* **router:** throw when component in route config is not defined ([903a0f0](https://github.com/angular/angular/commit/903a0f0)), closes [#3265](https://github.com/angular/angular/issues/3265) [#3569](https://github.com/angular/angular/issues/3569)
* **test_lib:** run unit tests in default Documnent ([a37de36](https://github.com/angular/angular/commit/a37de36)), closes [#3501](https://github.com/angular/angular/issues/3501) [#3475](https://github.com/angular/angular/issues/3475)
* **testability:** properly throw when no testability available ([841206c](https://github.com/angular/angular/commit/841206c))
* **testability:** throw if no testability available ([08dbe87](https://github.com/angular/angular/commit/08dbe87))
* **Testability:** fix type error in getAllAngularTestability (dart) ([574bbea](https://github.com/angular/angular/commit/574bbea))
* **transformers:** be more specific in the imports to rewrite ([86eb46a](https://github.com/angular/angular/commit/86eb46a)), closes [#3473](https://github.com/angular/angular/issues/3473) [#3523](https://github.com/angular/angular/issues/3523)
* improper use package name in facade ([64ebf27](https://github.com/angular/angular/commit/64ebf27)), closes [#3613](https://github.com/angular/angular/issues/3613)
* **typescript:** update to typescript with fixed system emit ([ac31191](https://github.com/angular/angular/commit/ac31191)), closes [#3594](https://github.com/angular/angular/issues/3594)
* **UrlResolver:** encode URLs before resolving ([4f5e405](https://github.com/angular/angular/commit/4f5e405)), closes [#3543](https://github.com/angular/angular/issues/3543) [#3545](https://github.com/angular/angular/issues/3545)
* **WebWorkers:** Run XHR requests on the UI ([2968517](https://github.com/angular/angular/commit/2968517)), closes [#3652](https://github.com/angular/angular/issues/3652)

### Features

* **change_detection:** added an example demonstrating how to use observable models ([52da220](https://github.com/angular/angular/commit/52da220)), closes [#3684](https://github.com/angular/angular/issues/3684)
* **change_detection:** added an experimental support for observables ([cbfc9cb](https://github.com/angular/angular/commit/cbfc9cb))
* **change_detection:** request a change detection check when  an event happens ([5e6317f](https://github.com/angular/angular/commit/5e6317f)), closes [#3679](https://github.com/angular/angular/issues/3679)
* **compiler:** allow binding to className using class alias ([a7a1851](https://github.com/angular/angular/commit/a7a1851)), closes [#2364](https://github.com/angular/angular/issues/2364)
* **coreDirectives:** add NgClass to coreDirectives ([6bd95c1](https://github.com/angular/angular/commit/6bd95c1)), closes [#3534](https://github.com/angular/angular/issues/3534)
* **dart/transform:** Support `part` directives ([aa480fe](https://github.com/angular/angular/commit/aa480fe)), closes [#1817](https://github.com/angular/angular/issues/1817)
* **di:** added resolveAndInstantiate and instantiateResolved to Injector ([06da60f](https://github.com/angular/angular/commit/06da60f))
* **http:** serialize search parameters from request options ([77d3668](https://github.com/angular/angular/commit/77d3668)), closes [#2417](https://github.com/angular/angular/issues/2417) [#3020](https://github.com/angular/angular/issues/3020)
* **npm:** add typescript block to package.json ([b5fb05b](https://github.com/angular/angular/commit/b5fb05b)), closes [#3590](https://github.com/angular/angular/issues/3590) [#3609](https://github.com/angular/angular/issues/3609)
* **npm:** publish bundles and their typings in npm distribution ([7b3cca2](https://github.com/angular/angular/commit/7b3cca2)), closes [#3555](https://github.com/angular/angular/issues/3555)
* **pipe:** added the Pipe decorator and the pipe property to View ([5b5d31f](https://github.com/angular/angular/commit/5b5d31f)), closes [#3572](https://github.com/angular/angular/issues/3572)
* **pipes:** changed PipeTransform to make onDestroy optional ([839edaa](https://github.com/angular/angular/commit/839edaa))
* **PropertyBindingParser:** support onbubble-event as an alternate syntax for (^event) ([1f54e64](https://github.com/angular/angular/commit/1f54e64)), closes [#3448](https://github.com/angular/angular/issues/3448) [#3616](https://github.com/angular/angular/issues/3616)
* **query:** allow to query for `TemplateRef` ([585ea5d](https://github.com/angular/angular/commit/585ea5d)), closes [#3202](https://github.com/angular/angular/issues/3202)
* **query:** view query is properly updated when dom changes. ([2150a8f](https://github.com/angular/angular/commit/2150a8f)), closes [#3033](https://github.com/angular/angular/issues/3033) [#3439](https://github.com/angular/angular/issues/3439)
* **query_list:** delegate `toString` to `_results` array ([35a83b4](https://github.com/angular/angular/commit/35a83b4)), closes [#3004](https://github.com/angular/angular/issues/3004)
* **refactor:** replaced ObservablePipe and PromisePipe with AsyncPipe ([106a28b](https://github.com/angular/angular/commit/106a28b))
* **router:** auxiliary routes ([ac6227e](https://github.com/angular/angular/commit/ac6227e)), closes [#2775](https://github.com/angular/angular/issues/2775)
* **router:** user metadata in route configs ([ed81cb9](https://github.com/angular/angular/commit/ed81cb9)), closes [#2777](https://github.com/angular/angular/issues/2777) [#3541](https://github.com/angular/angular/issues/3541)
* **test:** find testabilities across dart js applications ([1d65b38](https://github.com/angular/angular/commit/1d65b38)), closes [#3611](https://github.com/angular/angular/issues/3611)
* **testability:** option to disable tree walking ([8f5360c](https://github.com/angular/angular/commit/8f5360c))
* **typings:** allow declaration of reference paths ([1f692ae](https://github.com/angular/angular/commit/1f692ae)), closes [#3540](https://github.com/angular/angular/issues/3540)
* **typings:** allow defining custom namespace for bundle ([dfa5103](https://github.com/angular/angular/commit/dfa5103)), closes [#2948](https://github.com/angular/angular/issues/2948) [#3544](https://github.com/angular/angular/issues/3544)


### BREAKING CHANGES

* rename all constants to UPPER_CASE names

  - `appComponentTypeToken` => `APP_COMPONENT`
  - `coreDirectives` => `CORE_DIRECTIVES`
  - `formDirectives` => `FORM_DIRECTIVES`
  - `formInjectables` => `FORM_BINDINGS`
  - `httpInjectables` => `HTTP_BINDINGS`
  - `jsonpInjectables` => `JSONP_BINDINGS`
  - `PROTO_CHANGE_DETECTOR_KEY` => `PROTO_CHANGE_DETECTOR`
  - `appComponentRefPromiseToken` => `APP_COMPONENT_REF_PROMISE`
  - `appComponentTypeToken` => `APP_COMPONENT`
  - `undefinedValue` => `UNDEFINED`
  - `formDirectives` => `FORM_DIRECTIVES`
  - `DOCUMENT_TOKEN` => `DOCUMENT`
  - `APP_ID_TOKEN` => `APP_ID`
  - `MAX_IN_MEMORY_ELEMENTS_PER_TEMPLATE_TOKEN` => `MAX_IN_MEMORY_ELEMENTS_PER_TEMPLATE`
  - `appBaseHrefToken` => `APP_BASE_HREF`

* renamed DI visibility flags

  - `PRIVATE` => `Visibility.Private`
  - `PUBLIC` => `Visibility.Public`
  - `PUBLIC_AND_PRIVATE` => `Visibility.PublicAndPrivate`

* renamed all "annotation" references to "metadata"

  - *Annotations => *Metadata
  - renderer.DirectiveMetadata => renderer.RendererDirectiveMetadata
  - renderer.ElementBinder => renderer.RendererElementBinder
  - impl.Directive => impl.DirectiveMetadata
  - impl.Component => impl.ComponentMetadata
  - impl.View => impl.ViewMetadata


* `IS_DARTIUM` constant is no longer exported/supported

* The HTTP package is no longer supported in Dart (use standard library apis instead)

* Remove IRequestOptions / IResponseOptions / IQueryList interfaces

* Pipe factories have been removed and Pipe names to pipe implementations are 1-to-1  instead of 1-to-*

  Before:
  <code><pre>
   class DateFormatter {
       transform(date, args){}
   }

   class DateFormatterFactory {
     supporst(obj) { return true; }
     create(cdRef) { return new DateFormatter(); }
   }
   new Pipes({date: [new DateFormatterFactory()]})
  </pre></code>

  After:
  <code><pre>
  class DateFormatter {
    transform(date, args){}
  }
  new Pipes({date: DateFormatter})
  </pre></code>


* Previously Angular called onDestroy on all pipes. Now Angular calls onDestroy only on pipes that have the onDestroy method.

* Instead of configuring pipes via a Pipes object, now you can configure them by providing the pipes property to the View decorator.

  <code><pre>
    @Pipe({
      name: 'double'
    })
    class DoublePipe {
      transform(value, args) { return value * 2; }
    }
    @View({
      template: '{{ 10 | double}}'
      pipes: [DoublePipe]
    })
    class CustomComponent {}
  </pre></code>


* The router was previously exported as ng.router in the
    angular.sfx.dev.js bundle, but now it is exported as ngRouter.

* The selector for the CSSClass directive was changed
from [class] to [ng-class]. The directive itself was
renamed from CSSClass to NgClass



<a name="2.0.0-alpha.34"></a>
# 2.0.0-alpha.34 (2015-08-07)


### Bug Fixes

* **XHRConnection:** use xhr status code ([96eefdf](https://github.com/angular/angular/commit/96eefdf)), closes [#2841](https://github.com/angular/angular/issues/2841)
* **bootstrap:** fix expressions containing bootstrap (fixes #3309) ([2909576](https://github.com/angular/angular/commit/2909576)), closes [#3309](https://github.com/angular/angular/issues/3309)
* **browser_adapter:** fix clearNodes() in IE ([70bc485](https://github.com/angular/angular/commit/70bc485)), closes [#3295](https://github.com/angular/angular/issues/3295) [#3355](https://github.com/angular/angular/issues/3355)
* **collection:** MapIterator.next() is not supported (Safari) ([12e4c73](https://github.com/angular/angular/commit/12e4c73)), closes [#3015](https://github.com/angular/angular/issues/3015) [#3389](https://github.com/angular/angular/issues/3389)
* **compiler:** Allow components to use any style of selector. Fixes #1602 ([c20a5d6](https://github.com/angular/angular/commit/c20a5d6)), closes [#1602](https://github.com/angular/angular/issues/1602)
* **core:** export LifeCycle at top-level modules ([4e76cac](https://github.com/angular/angular/commit/4e76cac)), closes [#3395](https://github.com/angular/angular/issues/3395)
* **dart/transform:** Remove malfunctioning zone error handler ([68a581a](https://github.com/angular/angular/commit/68a581a)), closes [#3368](https://github.com/angular/angular/issues/3368)
* **decorators:** stop directives inheriting parent class decorators. ([f7d7789](https://github.com/angular/angular/commit/f7d7789)), closes [#2291](https://github.com/angular/angular/issues/2291)
* **docs:** add ViewDefinition, DirectiveMetadata to public API ([d4ded1a](https://github.com/angular/angular/commit/d4ded1a)), closes [#3346](https://github.com/angular/angular/issues/3346)
* remove unused imports ([39b0286](https://github.com/angular/angular/commit/39b0286))
* **parser:** detect empty expression in strings to interpolate ([4422819](https://github.com/angular/angular/commit/4422819)), closes [#3412](https://github.com/angular/angular/issues/3412) [#3451](https://github.com/angular/angular/issues/3451)
* **query:** view query should not be updated when subviews are attached. ([34acef5](https://github.com/angular/angular/commit/34acef5))
* **render:** allow to configure when templates are serialized to strings ([dd06a87](https://github.com/angular/angular/commit/dd06a87)), closes [#3418](https://github.com/angular/angular/issues/3418) [#3433](https://github.com/angular/angular/issues/3433)
* **router:** ensure navigation via back button works ([7bf7ec6](https://github.com/angular/angular/commit/7bf7ec6)), closes [#2201](https://github.com/angular/angular/issues/2201)
* **style_url_resolver:** fix data: url resolution ([73b7d99](https://github.com/angular/angular/commit/73b7d99))
* **testing:** Fixed race condition in WebWorker and Routing tests ([eee2146](https://github.com/angular/angular/commit/eee2146))

### Features

* **WebWorkers:** Add WebWorker Todo Example. Add support for more DOM events. ([d44827a](https://github.com/angular/angular/commit/d44827a))
* **WebWorkers:** Add WebWorker Todo Example. Add support for more DOM events. ([c5cb700](https://github.com/angular/angular/commit/c5cb700))
* implement web-tracing-framework support ([77875a2](https://github.com/angular/angular/commit/77875a2)), closes [#2610](https://github.com/angular/angular/issues/2610)
* **compiler:** introduce schema for elements ([d894aa9](https://github.com/angular/angular/commit/d894aa9)), closes [#3353](https://github.com/angular/angular/issues/3353)
* **core:** made directives shadow native element properties ([3437d56](https://github.com/angular/angular/commit/3437d56))
* **md-button:** enhance button focus appearance. ([6d280ea](https://github.com/angular/angular/commit/6d280ea))
* **pipes:** replaces iterable and key value diffing pipes with services ([392de4a](https://github.com/angular/angular/commit/392de4a))
* enable the decorators compiler option. ([0bb78b7](https://github.com/angular/angular/commit/0bb78b7))
* export a proper promise type. ([861be30](https://github.com/angular/angular/commit/861be30))
* upgrade ts2dart to 0.7.1. ([a62a6ba](https://github.com/angular/angular/commit/a62a6ba))
* **router:** add `back()` support to `MockLocationStrategy` ([60f38ea](https://github.com/angular/angular/commit/60f38ea))
* **testability:** Expose function getAllAngularTestabilities ([7b94bbf](https://github.com/angular/angular/commit/7b94bbf))
* **transformers:** add more information to factory debug reflection ([be79942](https://github.com/angular/angular/commit/be79942))

### Performance Improvements

* **change_detection:** do not check intermediate results ([c1ee943](https://github.com/angular/angular/commit/c1ee943))
* **change_detection:** do not generate onAllChangesDone when not needed ([adc2739](https://github.com/angular/angular/commit/adc2739))
* **change_detection:** removed the currentProto property ([71ea199](https://github.com/angular/angular/commit/71ea199))


### BREAKING CHANGES

*     Directives that previously injected Pipes to get iterableDiff or keyvalueDiff, now should inject IterableDiffers and KeyValueDiffers.

*     Previously, if an element had a property, Angular would update that property even if there was a directive placed on the same element with the same property. Now, the directive would have to explicitly update the native elmement by either using hostProperties or the renderer.



<a name"2.0.0-alpha.33"></a>
### 2.0.0-alpha.33 (2015-07-30)


#### Bug Fixes

* addresses a couple ddc type errors ([f1e42920](https://github.com/angular/angular/commit/f1e42920))
* **.d.ts:** Correct new Type interface return type ([78fdf9a1](https://github.com/angular/angular/commit/78fdf9a1), closes [#2399](https://github.com/angular/angular/issues/2399), [#3316](https://github.com/angular/angular/issues/3316))
* **build:** don't trigger travis on g3sync branch ([61b77034](https://github.com/angular/angular/commit/61b77034))
* **change_detection:** convert interpolated null values to empty strings ([345fa521](https://github.com/angular/angular/commit/345fa521), closes [#3007](https://github.com/angular/angular/issues/3007), [#3271](https://github.com/angular/angular/issues/3271))
* **class:**
  * allow class names with mixed case ([a8b57256](https://github.com/angular/angular/commit/a8b57256), closes [#3001](https://github.com/angular/angular/issues/3001), [#3264](https://github.com/angular/angular/issues/3264))
  * correctly clean up on destroy ([1438922f](https://github.com/angular/angular/commit/1438922f), closes [#3249](https://github.com/angular/angular/issues/3249), [#3256](https://github.com/angular/angular/issues/3256))
* **compiler:** prevent race conditions ([5ec67ee2](https://github.com/angular/angular/commit/5ec67ee2), closes [#3206](https://github.com/angular/angular/issues/3206), [#3211](https://github.com/angular/angular/issues/3211))
* **core:** fix type error in setElementProperty ([448264be](https://github.com/angular/angular/commit/448264be), closes [#3279](https://github.com/angular/angular/issues/3279))
* **element_injector:** do not throw when cannot find element when trying to report an error ([03c8e742](https://github.com/angular/angular/commit/03c8e742))
* **presubmit:** corrected user/email for git push ([e40ff368](https://github.com/angular/angular/commit/e40ff368))
* **projection:**
  * allow more bound render elements than app elements. ([46502e4d](https://github.com/angular/angular/commit/46502e4d), closes [#3236](https://github.com/angular/angular/issues/3236), [#3247](https://github.com/angular/angular/issues/3247))
  * allow to project to a non text node ([b44b06c2](https://github.com/angular/angular/commit/b44b06c2), closes [#3230](https://github.com/angular/angular/issues/3230), [#3241](https://github.com/angular/angular/issues/3241))
* **query:** the view should not be visible to @Query. ([1d450294](https://github.com/angular/angular/commit/1d450294))
* **transformer:**
  * Fix generation of `annotations` argument when registering functions. ([2faa8985](https://github.com/angular/angular/commit/2faa8985))
  * Don't throw on annotations that don't match a descriptor. ([f575ba60](https://github.com/angular/angular/commit/f575ba60), closes [#3280](https://github.com/angular/angular/issues/3280))
  * Loggers now are per zone and each transform runs in its own zone ([bd65b63c](https://github.com/angular/angular/commit/bd65b63c))
* **typings:** test our .d.ts with --noImplicitAny ([19d8b221](https://github.com/angular/angular/commit/19d8b221))
* **url_resolver:** in Dart make package urls relative to AppRootUrl ([469afda5](https://github.com/angular/angular/commit/469afda5))


#### Features

* **benchmark:** add static_tree benchmark ([854b5b7d](https://github.com/angular/angular/commit/854b5b7d), closes [#3196](https://github.com/angular/angular/issues/3196))
* **bootstrap:** remove the need for explicit reflection setup in bootstrap code ([3531bb71](https://github.com/angular/angular/commit/3531bb71))
* **build:** initial SauceLabs setup ([eebd736c](https://github.com/angular/angular/commit/eebd736c), closes [#2347](https://github.com/angular/angular/issues/2347))
* **change_detection:**
  * generate checkNoChanges only in dev mode ([71bb4b3e](https://github.com/angular/angular/commit/71bb4b3e))
  * provide error context for change detection errors ([c2bbda02](https://github.com/angular/angular/commit/c2bbda02))
* **core:** provide an error context when an exception happens in an error handler ([8543c347](https://github.com/angular/angular/commit/8543c347))
* **di:** added context to runtime DI errors ([5a86f859](https://github.com/angular/angular/commit/5a86f859))
* **exception_handler:**
  * print originalException and originalStack for all exceptions ([e744409c](https://github.com/angular/angular/commit/e744409c))
  * change ExceptionHandler to output context ([fdf226ab](https://github.com/angular/angular/commit/fdf226ab))
* **http:** call complete on request complete ([6fac9011](https://github.com/angular/angular/commit/6fac9011), closes [#2635](https://github.com/angular/angular/issues/2635))
* **http.ts:** export BrowserXHR ([8a91d716](https://github.com/angular/angular/commit/8a91d716), closes [#2641](https://github.com/angular/angular/issues/2641))
* **lang:** added "context" to BaseException ([8ecb632d](https://github.com/angular/angular/commit/8ecb632d))
* **router:** use querystring params for top-level routes ([fdffcaba](https://github.com/angular/angular/commit/fdffcaba), closes [#3017](https://github.com/angular/angular/issues/3017))
* **testability:** hook zone into whenstable api with async support ([a8b75c3d](https://github.com/angular/angular/commit/a8b75c3d))
* **transformers:** directive aliases in Dart transformers (fix #1747) ([fd46b49e](https://github.com/angular/angular/commit/fd46b49e))
* **url_resolver:** support package: urls () ([408618b8](https://github.com/angular/angular/commit/408618b8), closes [#2991](https://github.com/angular/angular/issues/2991))


#### Breaking Changes

* View renderer used to take normalized CSS class names (ex. fooBar for foo-bar).
With this change a rendered implementation gets a calss name as specified in a
template, without any transformations / normalization. This change only affects
custom view renderers that should be updated accordingly.

Closes #3264

 ([a8b57256](https://github.com/angular/angular/commit/a8b57256))

<a name="2.0.0-alpha.32"></a>
# 2.0.0-alpha.32 (2015-07-29)


### Bug Fixes

* **.d.ts:** Correct new Type interface return type ([78fdf9a](https://github.com/angular/angular/commit/78fdf9a)), closes [#2399](https://github.com/angular/angular/issues/2399) [#3316](https://github.com/angular/angular/issues/3316)
* **build:** don't trigger travis on g3sync branch ([61b7703](https://github.com/angular/angular/commit/61b7703))
* **change_detection:** convert interpolated null values to empty strings ([345fa52](https://github.com/angular/angular/commit/345fa52)), closes [#3007](https://github.com/angular/angular/issues/3007) [#3271](https://github.com/angular/angular/issues/3271)
* **class:** allow class names with mixed case ([a8b5725](https://github.com/angular/angular/commit/a8b5725)), closes [#3001](https://github.com/angular/angular/issues/3001) [#3264](https://github.com/angular/angular/issues/3264)
* **class:** correctly clean up on destroy ([1438922](https://github.com/angular/angular/commit/1438922)), closes [#3249](https://github.com/angular/angular/issues/3249) [#3256](https://github.com/angular/angular/issues/3256)
* **compiler:** prevent race conditions ([5ec67ee](https://github.com/angular/angular/commit/5ec67ee)), closes [#3206](https://github.com/angular/angular/issues/3206) [#3211](https://github.com/angular/angular/issues/3211)
* **core:** fix type error in setElementProperty ([448264b](https://github.com/angular/angular/commit/448264b)), closes [#3279](https://github.com/angular/angular/issues/3279)
* **dart/transform:** Handle mixed lifecycle specs ([23cd385](https://github.com/angular/angular/commit/23cd385)), closes [#3276](https://github.com/angular/angular/issues/3276)
* **element_injector:** do not throw when cannot find element when trying to report an error ([03c8e74](https://github.com/angular/angular/commit/03c8e74))
* **lowercase,uppercase:** make stateless pipes ([4dc6d74](https://github.com/angular/angular/commit/4dc6d74)), closes [#3173](https://github.com/angular/angular/issues/3173) [#3189](https://github.com/angular/angular/issues/3189)
* **presubmit:** corrected user/email for git push ([e40ff36](https://github.com/angular/angular/commit/e40ff36))
* **projection:** allow more bound render elements than app elements. ([46502e4](https://github.com/angular/angular/commit/46502e4)), closes [#3236](https://github.com/angular/angular/issues/3236) [#3247](https://github.com/angular/angular/issues/3247)
* **projection:** allow to project to a non text node ([b44b06c](https://github.com/angular/angular/commit/b44b06c)), closes [#3230](https://github.com/angular/angular/issues/3230) [#3241](https://github.com/angular/angular/issues/3241)
* **query:** the view should not be visible to @Query. ([1d45029](https://github.com/angular/angular/commit/1d45029))
* **style_url_resolver:** fix data: url resolution ([73b7d99](https://github.com/angular/angular/commit/73b7d99))
* **transformer:** Don't throw on annotations that don't match a descriptor. ([f575ba6](https://github.com/angular/angular/commit/f575ba6)), closes [#3280](https://github.com/angular/angular/issues/3280)
* **transformer:** Fix generation of `annotations` argument when registering functions. ([2faa898](https://github.com/angular/angular/commit/2faa898))
* **transformer:** Loggers now are per zone and each transform runs in its own zone ([bd65b63](https://github.com/angular/angular/commit/bd65b63))
* **typings:** test our .d.ts with --noImplicitAny ([19d8b22](https://github.com/angular/angular/commit/19d8b22))
* **url_resolver:** in Dart make package urls relative to AppRootUrl ([469afda](https://github.com/angular/angular/commit/469afda))
* addresses a couple ddc type errors ([f1e4292](https://github.com/angular/angular/commit/f1e4292))

### Features

* **benchmark:** add static_tree benchmark ([854b5b7](https://github.com/angular/angular/commit/854b5b7)), closes [#3196](https://github.com/angular/angular/issues/3196)
* **bootstrap:** remove the need for explicit reflection setup in bootstrap code ([3531bb7](https://github.com/angular/angular/commit/3531bb7))
* **build:** initial SauceLabs setup ([eebd736](https://github.com/angular/angular/commit/eebd736)), closes [#2347](https://github.com/angular/angular/issues/2347)
* **change_detection:** generate checkNoChanges only in dev mode ([71bb4b3](https://github.com/angular/angular/commit/71bb4b3))
* **change_detection:** provide error context for change detection errors ([c2bbda0](https://github.com/angular/angular/commit/c2bbda0))
* **compiler:** introduce schema for elements ([d894aa9](https://github.com/angular/angular/commit/d894aa9)), closes [#3353](https://github.com/angular/angular/issues/3353)
* **core:** provide an error context when an exception happens in an error handler ([8543c34](https://github.com/angular/angular/commit/8543c34))
* **dart/transform:** Populate `lifecycle` from lifecycle interfaces ([8ad4ad5](https://github.com/angular/angular/commit/8ad4ad5)), closes [#3181](https://github.com/angular/angular/issues/3181)
* **di:** added context to runtime DI errors ([5a86f85](https://github.com/angular/angular/commit/5a86f85))
* **exception_handler:** change ExceptionHandler to output context ([fdf226a](https://github.com/angular/angular/commit/fdf226a))
* **exception_handler:** print originalException and originalStack for all exceptions ([e744409](https://github.com/angular/angular/commit/e744409))
* **http:** call complete on request complete ([6fac901](https://github.com/angular/angular/commit/6fac901)), closes [#2635](https://github.com/angular/angular/issues/2635)
* **http.ts:** export BrowserXHR ([8a91d71](https://github.com/angular/angular/commit/8a91d71)), closes [#2641](https://github.com/angular/angular/issues/2641)
* **lang:** added "context" to BaseException ([8ecb632](https://github.com/angular/angular/commit/8ecb632))
* **router:** use querystring params for top-level routes ([fdffcab](https://github.com/angular/angular/commit/fdffcab)), closes [#3017](https://github.com/angular/angular/issues/3017)
* **testability:** hook zone into whenstable api with async support ([a8b75c3](https://github.com/angular/angular/commit/a8b75c3))
* **transformers:** directive aliases in Dart transformers (fix #1747) ([fd46b49](https://github.com/angular/angular/commit/fd46b49)), closes [#1747](https://github.com/angular/angular/issues/1747)
* **url_resolver:** support package: urls (fixes #2991) ([408618b](https://github.com/angular/angular/commit/408618b)), closes [#2991](https://github.com/angular/angular/issues/2991)

### Reverts

* style(ngFor): add whitespace to `Directive` annotation ([74b311a](https://github.com/angular/angular/commit/74b311a))


### BREAKING CHANGES

* View renderer used to take normalized CSS class names (ex. fooBar for foo-bar).
With this change a rendered implementation gets a calss name as specified in a
template, without any transformations / normalization. This change only affects
custom view renderers that should be updated accordingly.

* S:
Dart applications and TypeScript applications meant to transpile to Dart must now
import `package:angular2/bootstrap.dart` instead of `package:angular2/angular2.dart`
in their bootstrap code. `package:angular2/angular2.dart` no longer export the
bootstrap function. The transformer rewrites imports of `bootstrap.dart` and calls
to `bootstrap` to `bootstrap_static.dart` and `bootstrapStatic` respectively.



<a name="2.0.0-alpha.32"></a>
# 2.0.0-alpha.32 (2015-07-21)


### Bug Fixes

* **api_docs:** slightly more accurate description of Dart overrideOnEventDone ([a4915ad](https://github.com/angular/angular/commit/a4915ad))
* **api_docs:** slightly more accurate description of TS overrideOnEventDone ([fe3a559](https://github.com/angular/angular/commit/fe3a559))
* **build:** clang-format ([66ec4d1](https://github.com/angular/angular/commit/66ec4d1))
* **change_detect:** Handle '$' in change detector strings ([f1e8176](https://github.com/angular/angular/commit/f1e8176))
* **change_detect:** Sort `DirectiveMetadata` properties during processing ([b2a0be8](https://github.com/angular/angular/commit/b2a0be8))
* **content_projection:** allow to project text nodes to a place without bindings ([a472eac](https://github.com/angular/angular/commit/a472eac)), closes [#3163](https://github.com/angular/angular/issues/3163) [#3179](https://github.com/angular/angular/issues/3179)
* **di:** do not rely on the fact that types are canonicalized ([2147ce4](https://github.com/angular/angular/commit/2147ce4))
* **di:** fixed dynamic component loading of components created in child injector ([5749692](https://github.com/angular/angular/commit/5749692))
* **di:** fixed types ([2f08ed8](https://github.com/angular/angular/commit/2f08ed8))
* **di:** instatiate services lazily ([7531b48](https://github.com/angular/angular/commit/7531b48))
* **element_injector:** inject the containing change detector ref to directives ([7879761](https://github.com/angular/angular/commit/7879761))
* **examples:** add a couple entrypoints, adjust pubspec, fix change detector bug in Dart ([b03560b](https://github.com/angular/angular/commit/b03560b))
* **facade:** use base element to get base href ([8296dce](https://github.com/angular/angular/commit/8296dce))
* **forms:** default the initial value of Control to null ([5b597de](https://github.com/angular/angular/commit/5b597de))
* **forms:** do not reset the value of the input when it came from the view ([b123159](https://github.com/angular/angular/commit/b123159))
* **html_adapter:** Implement hasAttribute and getAttribute. ([e988f59](https://github.com/angular/angular/commit/e988f59))
* **ng_for:** fixed ng_for to pass a change detector ref to the pipe registry ([583c5ff](https://github.com/angular/angular/commit/583c5ff))
* **publish:** add force flag for pub publish script ([621604d](https://github.com/angular/angular/commit/621604d)), closes [#3077](https://github.com/angular/angular/issues/3077)
* **renderer:** handle empty fragments correctly ([61c7357](https://github.com/angular/angular/commit/61c7357)), closes [#3100](https://github.com/angular/angular/issues/3100)
* **router:** improve error for missing base href ([011fab3](https://github.com/angular/angular/commit/011fab3)), closes [#3096](https://github.com/angular/angular/issues/3096)
* **router:** improve error messages for routes with no config ([8bdca5c](https://github.com/angular/angular/commit/8bdca5c)), closes [#2323](https://github.com/angular/angular/issues/2323)
* **router:** throw when reserved characters used in route definition ([c6409cb](https://github.com/angular/angular/commit/c6409cb)), closes [#3021](https://github.com/angular/angular/issues/3021)
* **transformers:** fix sort order for reflective imports ([762a94f](https://github.com/angular/angular/commit/762a94f))
* **view_manager:** allow to create host views even if there is an embedded view at the same place. ([116b64d](https://github.com/angular/angular/commit/116b64d))

### Features

* FunctionWithParamTokens.execute now returns the value of the function ([3dd05ef](https://github.com/angular/angular/commit/3dd05ef))
* **compiler:** attach components and project light dom during compilation. ([b1df545](https://github.com/angular/angular/commit/b1df545)), closes [#2529](https://github.com/angular/angular/issues/2529)
* upgrade ts2dart to 0.6.9. ([3810e4b](https://github.com/angular/angular/commit/3810e4b))
* **build:** require parameter types ([de18da2](https://github.com/angular/angular/commit/de18da2)), closes [#2833](https://github.com/angular/angular/issues/2833)
* **change_detection:** added support for ObservableList from package:observe ([d449ea5](https://github.com/angular/angular/commit/d449ea5))
* **compiler:** Support $baseUrl in HTML attributes when loading a template. ([e942709](https://github.com/angular/angular/commit/e942709))
* **core:** add ability to reflect DOM properties as attributes ([903ff90](https://github.com/angular/angular/commit/903ff90)), closes [#2910](https://github.com/angular/angular/issues/2910)
* **facade:** add getTypeNameForDebugging function ([ccb4163](https://github.com/angular/angular/commit/ccb4163))
* **forms:** Export NgSelectOption directive ([f74d97e](https://github.com/angular/angular/commit/f74d97e))
* **http:** add support for JSONP requests ([81abc39](https://github.com/angular/angular/commit/81abc39)), closes [#2905](https://github.com/angular/angular/issues/2905) [#2818](https://github.com/angular/angular/issues/2818)
* **pipes:** changed .append to .extend ([4c8ea12](https://github.com/angular/angular/commit/4c8ea12))
* **router:** add interfaces for route definitions in RouteConfig ([4d28167](https://github.com/angular/angular/commit/4d28167)), closes [#2261](https://github.com/angular/angular/issues/2261)
* **transformers:** expose DI transformer for use by packages ([2bc1217](https://github.com/angular/angular/commit/2bc1217)), closes [#2814](https://github.com/angular/angular/issues/2814)
* **transformers:** implement initializing deferred libraries ([5cc84ed](https://github.com/angular/angular/commit/5cc84ed))

### Performance Improvements

* **dom:** Only send values for existing properties to js interior ([153660f](https://github.com/angular/angular/commit/153660f)), closes [#3149](https://github.com/angular/angular/issues/3149)


### BREAKING CHANGES

*     Pipes.append has been renamed into Pipes.extend.
    Pipes.extend prepends pipe factories instead of appending them.

* S:
- shadow dom emulation no longer
  supports the `<content>` tag. Use the new `<ng-content>` instead
  (works with all shadow dom strategies).
- removed `DomRenderer.setViewRootNodes` and `AppViewManager.getComponentView`
  -> use `DomRenderer.getNativeElementSync(elementRef)` and change shadow dom directly
- the `Renderer` interface has changed:
  * `createView` now also has to support sub views
  * the notion of a container has been removed. Instead, the renderer has
    to implement methods to attach views next to elements or other views.
  * a RenderView now contains multiple RenderFragments. Fragments
    are used to move DOM nodes around.
Internal changes / design changes:
- Introduce notion of view fragments on render side
- DomProtoViews and DomViews on render side are merged,
  AppProtoViews are not merged, AppViews are partially merged
  (they share arrays with the other merged AppViews but we keep
  individual AppView instances for now).
- DomProtoViews always have a `<template>` element as root
  * needed for storing subviews
  * we have less chunks of DOM to clone now
- remove fake ElementBinder / Bound element for root text bindings
  and model them explicitly. This removes a lot of special cases we had!
- AppView shares data with nested component views
- some methods in AppViewManager (create, hydrate, dehydrate) are iterative now
  * now possible as we have all child AppViews / ElementRefs already in an array!



<a name="2.0.0-alpha.31"></a>
# 2.0.0-alpha.31 (2015-07-14)


### Bug Fixes

* **build:** clang-format ([df877a7](https://github.com/angular/angular/commit/df877a7))
* **build:** reduce the deploy upload. ([4264bd3](https://github.com/angular/angular/commit/4264bd3))
* **build:** remove the travis deploy step, which is broken. ([206c9bd](https://github.com/angular/angular/commit/206c9bd))
* **compiler:** keep `DOM.hasProperty` in sync between browser and transformer. ([b3a763a](https://github.com/angular/angular/commit/b3a763a)), closes [#2984](https://github.com/angular/angular/issues/2984) [#2981](https://github.com/angular/angular/issues/2981)
* **css_shim:** fixes multiple uses of polyfill-unscoped-rule. ([749d043](https://github.com/angular/angular/commit/749d043))
* **di:** do not use exceptions to detect if reflection is enabled ([a621046](https://github.com/angular/angular/commit/a621046))
* **di:** hostInjector and viewInjector support nested arrays ([0ed5dd0](https://github.com/angular/angular/commit/0ed5dd0))
* **di:** removed default visibility ([04baa46](https://github.com/angular/angular/commit/04baa46))
* **example:** add missing todo ([1427d73](https://github.com/angular/angular/commit/1427d73))
* **package.json:** move some deps into dev deps. ([546a8f9](https://github.com/angular/angular/commit/546a8f9)), closes [#2448](https://github.com/angular/angular/issues/2448)
* **router:** ensure that page refresh with hash URLs works ([c177d88](https://github.com/angular/angular/commit/c177d88)), closes [#2920](https://github.com/angular/angular/issues/2920)
* **router:** export lifecycle hooks in bundle ([97ef1c2](https://github.com/angular/angular/commit/97ef1c2))
* **router:** fix broken `HashLocationStrategy` string issue for dart ([d6dadc6](https://github.com/angular/angular/commit/d6dadc6))
* **transform:** handle multiple interfaces in directive processor ([ac50ffc](https://github.com/angular/angular/commit/ac50ffc)), closes [#2941](https://github.com/angular/angular/issues/2941)
* **transformer:** Event getters now use property name not event name ([cf103de](https://github.com/angular/angular/commit/cf103de))
* **transformer:** fix 'pub build' in examples ([6258929](https://github.com/angular/angular/commit/6258929))
* **tsconfig:** target should be lower case ([0792f1a](https://github.com/angular/angular/commit/0792f1a)), closes [#2938](https://github.com/angular/angular/issues/2938)

### Features

* **build:** Allow building in windows without admin priviledges ([f1f5784](https://github.com/angular/angular/commit/f1f5784)), closes [#2873](https://github.com/angular/angular/issues/2873)
* **forms:** changed all form directives to have basic control attributes ([3f7ebde](https://github.com/angular/angular/commit/3f7ebde))
* **license:** include license files in dev and dev.sfx bundles ([1eab4f5](https://github.com/angular/angular/commit/1eab4f5))
* **pipes:** add date pipe ([b716046](https://github.com/angular/angular/commit/b716046)), closes [#2877](https://github.com/angular/angular/issues/2877)
* **pipes:** add number (decimal, percent, currency) pipes ([3143d18](https://github.com/angular/angular/commit/3143d18))
* **pipes:** add static append method to Pipes ([1eebcea](https://github.com/angular/angular/commit/1eebcea)), closes [#2901](https://github.com/angular/angular/issues/2901)
* upgrade clang-format to v1.0.28. ([45994a5](https://github.com/angular/angular/commit/45994a5))
* **query:** initial implementation of view query. ([7ee6963](https://github.com/angular/angular/commit/7ee6963)), closes [#1935](https://github.com/angular/angular/issues/1935)
* **router:** introduce matrix params ([5677bf7](https://github.com/angular/angular/commit/5677bf7)), closes [#2774](https://github.com/angular/angular/issues/2774) [#2989](https://github.com/angular/angular/issues/2989)
* **router:** lifecycle hooks ([a9a552c](https://github.com/angular/angular/commit/a9a552c)), closes [#2640](https://github.com/angular/angular/issues/2640)
* **test:** add test bundle ([71c65b4](https://github.com/angular/angular/commit/71c65b4))
* **zone:** add "on event done" zone hook ([0e28297](https://github.com/angular/angular/commit/0e28297))


### BREAKING CHANGES

*     Directives will use the Unbounded visibility by default, whereas before the change they used Self



<a name="2.0.0-alpha.30"></a>
# 2.0.0-alpha.30 (2015-07-08)


### Bug Fixes

* **.d.ts:** correct ComponentAnnotation inheritance ([12a427e](https://github.com/angular/angular/commit/12a427e)), closes [#2356](https://github.com/angular/angular/issues/2356)
* **Http:** add support for headers ([883b506](https://github.com/angular/angular/commit/883b506))
* **angular2.d.ts:** show typing for Component, etc ([b10d7a2](https://github.com/angular/angular/commit/b10d7a2))
* **change_detection:** do not coalesce records with different directive indices ([d277442](https://github.com/angular/angular/commit/d277442))
* **change_detection:** throw ChangeDetectionError in JIT mode ([c2efa23](https://github.com/angular/angular/commit/c2efa23))
* **compiler:** detect and strip data- prefix from bindings ([cd65fc2](https://github.com/angular/angular/commit/cd65fc2)), closes [#2687](https://github.com/angular/angular/issues/2687) [#2719](https://github.com/angular/angular/issues/2719)
* **di:** injecting null causes a cyclic dependency ([d1393b0](https://github.com/angular/angular/commit/d1393b0))
* handle errors w/o file information. ([e69af1a](https://github.com/angular/angular/commit/e69af1a))
* **forms:** Remove cyclic dependency ([e5405e4](https://github.com/angular/angular/commit/e5405e4)), closes [#2856](https://github.com/angular/angular/issues/2856)
* **router:** allow generating links with numeric params ([d828664](https://github.com/angular/angular/commit/d828664))
* **router:** child routers should delegate navigation to the root router ([1c94c32](https://github.com/angular/angular/commit/1c94c32))
* **transformer:** Fix string interpolation for bindings. ([311b477](https://github.com/angular/angular/commit/311b477))
* **transformer:** Put paramater data in the same order as the reflected version. ([2b45bd2](https://github.com/angular/angular/commit/2b45bd2))
* **transformer:** Support prefixed annotations in the transformer. ([9e1158d](https://github.com/angular/angular/commit/9e1158d))

### Features

* upgrade t2dart to 0.6.8. ([d381c5f](https://github.com/angular/angular/commit/d381c5f))
* **NgStyle:** Export NgStyle in angular2/directives ([edf5053](https://github.com/angular/angular/commit/edf5053)), closes [#2878](https://github.com/angular/angular/issues/2878)
* **router:** support deep-linking to siblings ([286a249](https://github.com/angular/angular/commit/286a249)), closes [#2807](https://github.com/angular/angular/issues/2807)
* **transformer:** Support @Injectable() on static functions ([7986e7c](https://github.com/angular/angular/commit/7986e7c))
* **typings:** mark void methods in angular2.d.ts ([a56d33d](https://github.com/angular/angular/commit/a56d33d))



<a name="2.0.0-alpha.29"></a>
# 2.0.0-alpha.29 (2015-07-01)


### Bug Fixes

* **Router:** mark Pipeline and RouteRegistry as Injectable ([eea989b](https://github.com/angular/angular/commit/eea989b)), closes [#2755](https://github.com/angular/angular/issues/2755)
* **build:** Reduce rx typings to what we actually require. ([8bab6dd](https://github.com/angular/angular/commit/8bab6dd))
* **build:** add missing return types now enforced by linter ([4489199](https://github.com/angular/angular/commit/4489199))
* **build:** fix paths in `test.typings` task ([1c8a589](https://github.com/angular/angular/commit/1c8a589))
* **bundle:** don’t bundle traceur/reflect into benchpress ([da4de21](https://github.com/angular/angular/commit/da4de21))
* **bundle:** don’t bundle traceur/reflect into benchpress - amended change ([d629ed7](https://github.com/angular/angular/commit/d629ed7))
* **change detectors:** Fix deduping of protos in transformed dart mode. ([73a939e](https://github.com/angular/angular/commit/73a939e))
* **compiler:** don't trigger duplicated directives ([0598226](https://github.com/angular/angular/commit/0598226)), closes [#2756](https://github.com/angular/angular/issues/2756) [#2568](https://github.com/angular/angular/issues/2568)
* export top-level pipe factories as const ([393f703](https://github.com/angular/angular/commit/393f703))
* **docs:** link to clang-format ([f1cf529](https://github.com/angular/angular/commit/f1cf529))
* **docs:** to run js test 'gulp docs' is needed ([3e65037](https://github.com/angular/angular/commit/3e65037)), closes [#2762](https://github.com/angular/angular/issues/2762)
* **dynamic_component_loader:** check whether the dynamically loaded component has already been destroyed ([d6cef88](https://github.com/angular/angular/commit/d6cef88)), closes [#2748](https://github.com/angular/angular/issues/2748) [#2767](https://github.com/angular/angular/issues/2767)
* **transformer:** Add getters for `events`. ([5a21dc5](https://github.com/angular/angular/commit/5a21dc5))
* **transformer:** Don't hang on bad urls and log better errors ([d037c08](https://github.com/angular/angular/commit/d037c08))
* **transformer:** Fix annotation_matcher for NgForm directive. ([9c76850](https://github.com/angular/angular/commit/9c76850))
* **typings:** Minor issues preventing angular2.d.ts from working in TS 1.4. ([7a4a3c8](https://github.com/angular/angular/commit/7a4a3c8))

### Features

* **NgStyle:** add new NgStyle directive ([b50edfd](https://github.com/angular/angular/commit/b50edfd)), closes [#2665](https://github.com/angular/angular/issues/2665)
* **async:** added PromiseWrapper.wrap ([b688dee](https://github.com/angular/angular/commit/b688dee))
* **benchpress:** initial support for firefox ([0949a4b](https://github.com/angular/angular/commit/0949a4b)), closes [#2419](https://github.com/angular/angular/issues/2419)
* **build:** add tslint to the build. ([bc585f2](https://github.com/angular/angular/commit/bc585f2))
* upgrade clang-format and gulp-clang-format. ([1f7296c](https://github.com/angular/angular/commit/1f7296c))
* **di:** changed InstantiationError to print the original stack ([eb0fd79](https://github.com/angular/angular/commit/eb0fd79))
* **di:** removed app injector ([f0e962c](https://github.com/angular/angular/commit/f0e962c))
* **facade:** add ListWrapper.toJSON method ([2335075](https://github.com/angular/angular/commit/2335075))
* **http:** refactor library to work in dart ([55bf0e5](https://github.com/angular/angular/commit/55bf0e5)), closes [#2415](https://github.com/angular/angular/issues/2415)
* **lang:** added originalException and originalStack to BaseException ([56245c6](https://github.com/angular/angular/commit/56245c6))
* **pipes:** add limitTo pipe ([0b50258](https://github.com/angular/angular/commit/0b50258))
* **pipes:** support arguments in transform function ([600d53c](https://github.com/angular/angular/commit/600d53c))
* **router:** support deep-linking to anywhere in the app ([f66ce09](https://github.com/angular/angular/commit/f66ce09)), closes [#2642](https://github.com/angular/angular/issues/2642)
* **transformers:** provide a flag to disable inlining views ([dcdd730](https://github.com/angular/angular/commit/dcdd730)), closes [#2658](https://github.com/angular/angular/issues/2658)

### Performance Improvements

* **Compiler:** do not resolve bindings for cached ProtoViews ([7a7b3a6](https://github.com/angular/angular/commit/7a7b3a6))


### BREAKING CHANGES

* THe appInjector property has been removed. Instead use viewInjector or hostInjector.



<a name="2.0.0-alpha.28"></a>
# 2.0.0-alpha.28 (2015-06-24)


### Bug Fixes

* **ShadowDomStrategy:** always inline import rules ([1c4d233](https://github.com/angular/angular/commit/1c4d233)), closes [#1694](https://github.com/angular/angular/issues/1694)
* **XHRImpl:** file:/// and IE9 bugs ([cd735c4](https://github.com/angular/angular/commit/cd735c4))
* **annotations:** swap DirectiveArgs & ComponentArgs ([dcc4bc2](https://github.com/angular/angular/commit/dcc4bc2))
* **benchmarks:** add waits for naive scrolling benchmark to ensure loading ([d8929c1](https://github.com/angular/angular/commit/d8929c1)), closes [#1706](https://github.com/angular/angular/issues/1706)
* **benchpress:** do not throw on unkown frame timestamp event ([ed3af5f](https://github.com/angular/angular/commit/ed3af5f)), closes [#2622](https://github.com/angular/angular/issues/2622)
* **change detection:** preserve memoized results from pure functions ([5beaf6d](https://github.com/angular/angular/commit/5beaf6d))
* **compiler:** make text interpolation more robust ([9d4111d](https://github.com/angular/angular/commit/9d4111d)), closes [#2591](https://github.com/angular/angular/issues/2591)
* **docs:** Fix docs for Directive.compileChildren ([9700e80](https://github.com/angular/angular/commit/9700e80))
* **injectors:** sync injector tree with dom element tree. ([d800d2f](https://github.com/angular/angular/commit/d800d2f))
* **parse5:** do not try to insert empty text node ([0a2f6dd](https://github.com/angular/angular/commit/0a2f6dd))
* **render:** fix failing tests in dynamic_component_loader.ts ([6149ce2](https://github.com/angular/angular/commit/6149ce2))
* **router:** return promise with error handler ([bc798b1](https://github.com/angular/angular/commit/bc798b1))
* **transformer:** Throw unimplemented errors in HtmlAdapter. ([f9d72bd](https://github.com/angular/angular/commit/f9d72bd)), closes [#2624](https://github.com/angular/angular/issues/2624) [#2627](https://github.com/angular/angular/issues/2627)
* **views:** remove dynamic component views, free host views, free embedded views ([5dee8e2](https://github.com/angular/angular/commit/5dee8e2)), closes [#2472](https://github.com/angular/angular/issues/2472) [#2339](https://github.com/angular/angular/issues/2339)

### Features

* **CSSClass:** add support for string and array expresions ([8c993dc](https://github.com/angular/angular/commit/8c993dc)), closes [#2025](https://github.com/angular/angular/issues/2025)
* **compiler:** detect dangling property bindings ([d7b9345](https://github.com/angular/angular/commit/d7b9345)), closes [#2598](https://github.com/angular/angular/issues/2598)
* **element_injector:** support multiple injectables with the same token ([c899b0a](https://github.com/angular/angular/commit/c899b0a))
* **host:** limits host properties to renames ([92ffc46](https://github.com/angular/angular/commit/92ffc46))
* **mock:** add mock module and bundle ([2932377](https://github.com/angular/angular/commit/2932377)), closes [#2325](https://github.com/angular/angular/issues/2325)
* **query:** added support for querying by var bindings ([b0e2ebd](https://github.com/angular/angular/commit/b0e2ebd))
* **render:** don’t use the reflector for setting properties ([0a51ccb](https://github.com/angular/angular/commit/0a51ccb)), closes [#2637](https://github.com/angular/angular/issues/2637)
* add constructors without type arguments. ([35e882e](https://github.com/angular/angular/commit/35e882e))
* remove MapWrapper.clear(). ([9413620](https://github.com/angular/angular/commit/9413620))
* remove MapWrapper.contains(). ([dfd3091](https://github.com/angular/angular/commit/dfd3091))
* remove MapWrapper.create()/get()/set(). ([be7ac9f](https://github.com/angular/angular/commit/be7ac9f))
* **router:** add support for hash-based location ([a67f231](https://github.com/angular/angular/commit/a67f231)), closes [#2555](https://github.com/angular/angular/issues/2555)
* update clang-format to 1.0.21. ([254e58c](https://github.com/angular/angular/commit/254e58c))
* upgrade ts2dart to 0.6.4. ([58b38c9](https://github.com/angular/angular/commit/58b38c9))
* **router:** enforce usage of ... syntax for parent to child component routes ([2d2ae9b](https://github.com/angular/angular/commit/2d2ae9b))
* **transformers:** inline styleUrls to view directive ([f2ef90b](https://github.com/angular/angular/commit/f2ef90b)), closes [#2566](https://github.com/angular/angular/issues/2566)
* **typings:** add typing specs ([24646e7](https://github.com/angular/angular/commit/24646e7))


### BREAKING CHANGES

* S:
- host actions don't take an expression as value any more but only a method name,
  and assumes to get an array via the EventEmitter with the method arguments.
- Renderer.setElementProperty does not take `style.`/... prefixes any more.
  Use the new methods `Renderer.setElementAttribute`, ... instead
Part of #2476

* compiler will throw on binding to non-existing properties.
Till now it was possible to have a binding to a non-existing property,
ex.: `<div [foo]="exp">`. From now on this is compilation error - any
property binding needs to have at least one associated property:
eaither on an HTML element or on any directive associated with a
given element (directives' properites need to be declared using the
`properties` field in the `@Directive` / `@Component` annotation).

* - `Compiler.compile` has been removed, the only way to compile
  components dynamically is via `Compiler.compileInHost`
- `DynamicComponentLoader.loadIntoExistingLocation` has changed:
  * renamed into `loadIntoLocation`
  * will always create the host element as well
  * requires an element with a variable inside of the host component view
    next to which it will load new component.
- `DynamicComponentLoader.loadNextToExistingLocation` was renamed into
  `DynamicComponentLoader.loadNextToLocation`
- `DynamicComponentLoader.loadIntoNewLocation` is removed
  * use `DynamicComponentLoader.loadNextToLocation` instead
    and then move the view nodes
    manually around via `DomRenderer.getRootNodes()`
- `AppViewManager.{create,destroy}Free{Host,Embedded}View` was removed
  * use `AppViewManager.createViewInContainer` and then move the view nodes
    manually around via `DomRenderer.getRootNodes()`
- `Renderer.detachFreeView` was removed. Use `DomRenderer.getRootNodes()`
  to get the root nodes of a view and detach them manually.



<a name="2.0.0-alpha.27"></a>
# 2.0.0-alpha.27 (2015-06-17)


### Bug Fixes

* **Compiler:** fix text nodes after content tags ([d599fd3](https://github.com/angular/angular/commit/d599fd3)), closes [#2095](https://github.com/angular/angular/issues/2095)
* **DirectiveMetadata:** add support for events, changeDetection ([b4e82b8](https://github.com/angular/angular/commit/b4e82b8))
* **JsonPipe:** always transform to json ([e77710a](https://github.com/angular/angular/commit/e77710a))
* **Parser:** Parse pipes in arguments ([f974532](https://github.com/angular/angular/commit/f974532)), closes [#1680](https://github.com/angular/angular/issues/1680)
* **ShadowDom:** fix emulation integration spec to test all 3 strategies ([6e38515](https://github.com/angular/angular/commit/6e38515)), closes [#2546](https://github.com/angular/angular/issues/2546)
* **analzyer:** removed unused imports ([902759e](https://github.com/angular/angular/commit/902759e))
* **benchmarks:** Do not apply the angular transformer to e2e tests ([cee2682](https://github.com/angular/angular/commit/cee2682)), closes [#2454](https://github.com/angular/angular/issues/2454)
* **bootstrap:** temporary disable jit change detection because of a bug in handling pure functio ([9908def](https://github.com/angular/angular/commit/9908def))
* **broccoli:** ensure that inputTrees are stable ([928ec1c](https://github.com/angular/angular/commit/928ec1c))
* **build:** Minify files for angular2.min.js bundle ([76797df](https://github.com/angular/angular/commit/76797df))
* **build:** ensure that asset files are copied over to example directories ([60b97b2](https://github.com/angular/angular/commit/60b97b2))
* **build:** only pass ts files to ts2dart transpilation. ([b5431e4](https://github.com/angular/angular/commit/b5431e4))
* **bundle:** makes interfaces.ts non-empty when transpiled. ([83e99fc](https://github.com/angular/angular/commit/83e99fc))
* **change detect:** Fix bug in JIT change detectors ([e0fbd4b](https://github.com/angular/angular/commit/e0fbd4b))
* **ci:** remove non-existent gulp task from test_e2e_dart ([1cf807c](https://github.com/angular/angular/commit/1cf807c)), closes [#2509](https://github.com/angular/angular/issues/2509)
* **dart/transform:** Don't set ReflectionCapabilities over an async gap ([d1b35f9](https://github.com/angular/angular/commit/d1b35f9))
* **dartfmt:** don't break win32 command line limit ([617d693](https://github.com/angular/angular/commit/617d693)), closes [#2420](https://github.com/angular/angular/issues/2420) [#1875](https://github.com/angular/angular/issues/1875)
* **diffing-broccoli-plugin:** wrapped trees are always stable ([7611f92](https://github.com/angular/angular/commit/7611f92))
* **docs:** Working generated angular2.d.ts ([7141c15](https://github.com/angular/angular/commit/7141c15))
* **docs:** ensure no duplicates in alias names of docs ([05d02fa](https://github.com/angular/angular/commit/05d02fa))
* **docs:** order class members in order of declaration ([ea27704](https://github.com/angular/angular/commit/ea27704)), closes [#2569](https://github.com/angular/angular/issues/2569)
* **docs:** update link paths in annotations ([dd23bab](https://github.com/angular/angular/commit/dd23bab)), closes [#2452](https://github.com/angular/angular/issues/2452) [#2475](https://github.com/angular/angular/issues/2475)
* **dynamic_component_loader:** Fix for ts2dart issue ([bbfb4e1](https://github.com/angular/angular/commit/bbfb4e1))
* **dynamic_component_loader:** implemented dispose for dynamically-loaded components ([21dcfc8](https://github.com/angular/angular/commit/21dcfc8))
* **element_injector:** changed visibility rules to expose hostInjector of the component to its shadow d ([c51aef9](https://github.com/angular/angular/commit/c51aef9))
* **forms:** fixed the handling of the select element ([f1541e6](https://github.com/angular/angular/commit/f1541e6))
* **forms:** fixed the selector of NgRequiredValidator ([35197ac](https://github.com/angular/angular/commit/35197ac))
* **forms:** getError does not work without path ([a858f6a](https://github.com/angular/angular/commit/a858f6a))
* **forms:** updated form examples to contain select elements ([c34cb01](https://github.com/angular/angular/commit/c34cb01))
* **life_cycle:** throw when recursively reentering LifeCycle.tick ([af35ab5](https://github.com/angular/angular/commit/af35ab5))
* **locals:** improved an error message ([4eb8c9b](https://github.com/angular/angular/commit/4eb8c9b))
* Class factory now adds annotations ([bc9e482](https://github.com/angular/angular/commit/bc9e482))
* Improve error message on missing dependency ([2ccc65d](https://github.com/angular/angular/commit/2ccc65d))
* add types for ts2dart's façade handling. ([f3d7418](https://github.com/angular/angular/commit/f3d7418))
* compare strings with StringWrapper.equals ([633cf63](https://github.com/angular/angular/commit/633cf63))
* corrected var/# parsing in template ([a418397](https://github.com/angular/angular/commit/a418397)), closes [#2084](https://github.com/angular/angular/issues/2084)
* declare var global. ([1346660](https://github.com/angular/angular/commit/1346660))
* improve type of TreeNode.children. ([c3c2ad1](https://github.com/angular/angular/commit/c3c2ad1))
* improve type safety by typing `refs`. ([4ae7df2](https://github.com/angular/angular/commit/4ae7df2))
* include error message in the stack trace ([8d081ea](https://github.com/angular/angular/commit/8d081ea))
* increase the stack frame size for tests ([ab8eb4f](https://github.com/angular/angular/commit/ab8eb4f))
* makes NgModel work in strict mode ([eb3586d](https://github.com/angular/angular/commit/eb3586d))
* **ng_zone:** updated zone not to run onTurnDown when invoking run synchronously from onTurnDo ([15dab7c](https://github.com/angular/angular/commit/15dab7c))
* **npm:** update scripts and readme for npm packages. ([8923103](https://github.com/angular/angular/commit/8923103)), closes [#2377](https://github.com/angular/angular/issues/2377)
* **router:** avoid two slash values between the baseHref and the path ([cdc7b03](https://github.com/angular/angular/commit/cdc7b03))
* rename FORWARD_REF to forwardRef in the Angular code base. ([c4ecbf0](https://github.com/angular/angular/commit/c4ecbf0))
* **router:** do not prepend the root URL with a starting slash ([e372cc7](https://github.com/angular/angular/commit/e372cc7))
* **router:** ensure that root URL redirect doesn't redirect non-root URLs ([73d1525](https://github.com/angular/angular/commit/73d1525)), closes [#2221](https://github.com/angular/angular/issues/2221)
* **router:** rethrow exceptions ([5782f06](https://github.com/angular/angular/commit/5782f06)), closes [#2391](https://github.com/angular/angular/issues/2391)
* **selector:** select by attribute independent of value and order ([9bad70b](https://github.com/angular/angular/commit/9bad70b)), closes [#2513](https://github.com/angular/angular/issues/2513)
* **shadow_dom:** moves the imported nodes into the correct location. ([92d5658](https://github.com/angular/angular/commit/92d5658))
* **shrinkwrap:** restore fsevents dependency ([833048f](https://github.com/angular/angular/commit/833048f)), closes [#2511](https://github.com/angular/angular/issues/2511)
* **view:** local variables override local variables set by ng-for ([d8e2795](https://github.com/angular/angular/commit/d8e2795))

### Features

* **AstTranformer:** add support for missing nodes ([da60381](https://github.com/angular/angular/commit/da60381))
* **BaseRequestOptions:** add merge method to make copies of options ([93596df](https://github.com/angular/angular/commit/93596df))
* **Directive:** Have a single Directive.host which mimics HTML ([f3b4937](https://github.com/angular/angular/commit/f3b4937)), closes [#2268](https://github.com/angular/angular/issues/2268)
* **ElementInjector:** throw if multiple directives define the same host injectable ([6a6b43d](https://github.com/angular/angular/commit/6a6b43d))
* **Events:** allow a different event vs field name ([29c72ab](https://github.com/angular/angular/commit/29c72ab)), closes [#2272](https://github.com/angular/angular/issues/2272) [#2344](https://github.com/angular/angular/issues/2344)
* **FakeAsync:** check pending timers at the end of fakeAsync in Dart ([53694eb](https://github.com/angular/angular/commit/53694eb))
* **Http:** add Http class ([b68e561](https://github.com/angular/angular/commit/b68e561)), closes [#2530](https://github.com/angular/angular/issues/2530)
* **Parser:** implement Unparser ([331a051](https://github.com/angular/angular/commit/331a051)), closes [#1949](https://github.com/angular/angular/issues/1949) [#2395](https://github.com/angular/angular/issues/2395)
* **Parser:** support if statements in actions ([7d32879](https://github.com/angular/angular/commit/7d32879)), closes [#2022](https://github.com/angular/angular/issues/2022)
* **View:** add support for styleUrls and styles ([ac3e624](https://github.com/angular/angular/commit/ac3e624)), closes [#2382](https://github.com/angular/angular/issues/2382)
* **benchpress:** add mean frame time metric ([6834c49](https://github.com/angular/angular/commit/6834c49)), closes [#2474](https://github.com/angular/angular/issues/2474)
* **benchpress:** more smoothness metrics ([35589a6](https://github.com/angular/angular/commit/35589a6))
* **broccoli:** add diffing MergeTrees plugin ([4ee3fda](https://github.com/angular/angular/commit/4ee3fda)), closes [#1815](https://github.com/angular/angular/issues/1815) [#2064](https://github.com/angular/angular/issues/2064)
* **broccoli:** improve merge-trees plugin and add "overwrite" option ([dc8dac7](https://github.com/angular/angular/commit/dc8dac7))
* **build:** add `test.unit.dartvm` for a faster roundtrip of dartvm tests ([46eeee6](https://github.com/angular/angular/commit/46eeee6))
* **change detect:** Throw on attempts to use dehydrated detector ([b6e95bb](https://github.com/angular/angular/commit/b6e95bb))
* **dart/change_detect:** Add type to ChangeDetector context ([5298055](https://github.com/angular/angular/commit/5298055)), closes [#2070](https://github.com/angular/angular/issues/2070)
* **dart/transform:** Add onInit and onCheck hooks in Dart ([17c6d6a](https://github.com/angular/angular/commit/17c6d6a))
* **dart/transform:** Allow absolute urls in templates ([a187c78](https://github.com/angular/angular/commit/a187c78))
* **dart/transform:** Record Type interfaces ([dc6e7eb](https://github.com/angular/angular/commit/dc6e7eb)), closes [#2204](https://github.com/angular/angular/issues/2204)
* **dart/transform:** Use the best available Change Detectors ([8e3bf39](https://github.com/angular/angular/commit/8e3bf39)), closes [#502](https://github.com/angular/angular/issues/502)
* **diffing-broccoli-plugin:** support multiple inputTrees ([41ae8e7](https://github.com/angular/angular/commit/41ae8e7)), closes [#1815](https://github.com/angular/angular/issues/1815) [#2064](https://github.com/angular/angular/issues/2064)
* **e2e:** added e2e tests for forms ([552d1ed](https://github.com/angular/angular/commit/552d1ed))
* **facade:** add isMap method ([548f3dd](https://github.com/angular/angular/commit/548f3dd))
* **forms:** added hasError and getError methods to all controls ([1a4d237](https://github.com/angular/angular/commit/1a4d237))
* **forms:** changed forms to capture submit events and fires synthetic ng-submit events ([5fc23ca](https://github.com/angular/angular/commit/5fc23ca))
* **forms:** export validator directives as part of formDirectives ([73bce40](https://github.com/angular/angular/commit/73bce40))
* **forms:** set exportAs to form for all form related directives ([e7e82cb](https://github.com/angular/angular/commit/e7e82cb))
* **forms.ts:** formInjectables with FormBuilder ([a6cb86b](https://github.com/angular/angular/commit/a6cb86b)), closes [#2367](https://github.com/angular/angular/issues/2367)
* adjust formatting for clang-format v1.0.19. ([a6e7123](https://github.com/angular/angular/commit/a6e7123))
* allow Type.annotations = Component(...).View(...) ([b2c6694](https://github.com/angular/angular/commit/b2c6694)), closes [#2577](https://github.com/angular/angular/issues/2577)
* support decorator chaining and class creation in ES5 ([c3ae34f](https://github.com/angular/angular/commit/c3ae34f)), closes [#2534](https://github.com/angular/angular/issues/2534)
* update ts2dart to 0.6.1. ([9613772](https://github.com/angular/angular/commit/9613772))
* **http:** add basic http service ([2156810](https://github.com/angular/angular/commit/2156810)), closes [#2028](https://github.com/angular/angular/issues/2028)
* **query:** adds support for descendants and more list apis. ([355ab5b](https://github.com/angular/angular/commit/355ab5b))
* **query:** notify on changes ([5bfcca2](https://github.com/angular/angular/commit/5bfcca2))
* **router:** add routing to async components ([cd95e07](https://github.com/angular/angular/commit/cd95e07))
* **router:** allow configuring app base href via token ([cab1d0e](https://github.com/angular/angular/commit/cab1d0e))
* **transform:** update for Directive.host ([591f742](https://github.com/angular/angular/commit/591f742))
* **transformers:** updated transformers ([e5419fe](https://github.com/angular/angular/commit/e5419fe))
* **view:** added support for exportAs, so any directive can be assigned to a variable ([69b75b7](https://github.com/angular/angular/commit/69b75b7))
* upgrade to clang-format v1.0.19. ([1c2abbc](https://github.com/angular/angular/commit/1c2abbc))

### Performance Improvements

* **RouterLink:** use hostListeners for click ([92f1af8](https://github.com/angular/angular/commit/92f1af8)), closes [#2401](https://github.com/angular/angular/issues/2401)
* **render:** don't create property setters if not needed ([4f27611](https://github.com/angular/angular/commit/4f27611))
* **render:** don’t create an intermediate element array in renderer ([9cd510a](https://github.com/angular/angular/commit/9cd510a))
* **render:** only create `LightDom` instances if the element has children ([ca09701](https://github.com/angular/angular/commit/ca09701))
* **render:** precompute # bound text nodes and root nodes in `DomProtoView` ([24e647e](https://github.com/angular/angular/commit/24e647e))


### BREAKING CHANGES

* By default Query only queries direct children.

* Before
    @Directive({
      hostListeners: {'event': 'statement'},
      hostProperties: {'expression': 'hostProp'},
      hostAttributes: {'attr': 'value'},
      hostActions: {'action': 'statement'}
    })
After
    @Directive({
      host: {
        '(event)': 'statement',
        '[hostProp]': 'expression'  // k & v swapped
        'attr': 'value',
        '@action': 'statement'
      }
    })

* no longer cache ref
