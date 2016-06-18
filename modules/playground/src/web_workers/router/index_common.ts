import {Component} from '@angular/core';
import {Start} from './components/start';
import {About} from './components/about';
import {Contact} from './components/contact';
import {ROUTER_DIRECTIVES, RouteConfig, Route} from '@angular/router-deprecated';

@Component({selector: 'app', directives: [ROUTER_DIRECTIVES], templateUrl: 'app.html'})
@RouteConfig([
  new Route({path: '/', component: Start, name: "Start"}),
  new Route({path: '/contact', component: Contact, name: "Contact"}),
  new Route({path: '/about', component: About, name: "About"})
])
export class App {
}
