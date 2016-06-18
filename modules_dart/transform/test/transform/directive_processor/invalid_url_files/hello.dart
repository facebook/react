library test.transform.directive_processor.invalid_url_files.hello;

import 'package:angular2/angular2.dart'
    show Component, Directive, View, NgElement;

@Component(selector: 'hello-app')
@View(
    templateUrl: '/bad/absolute/url.html',
    styleUrls: const ['package:invalid/package.css', 'bad_relative_url.css'])
class HelloCmp {}
