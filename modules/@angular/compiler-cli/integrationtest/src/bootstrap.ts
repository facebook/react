import {ReflectiveInjector, coreBootstrap} from '@angular/core';
import {BROWSER_APP_PROVIDERS, browserPlatform} from '@angular/platform-browser';

import {Basic} from './basic';
import {BasicNgFactory} from './basic.ngfactory';

const appInjector =
    ReflectiveInjector.resolveAndCreate(BROWSER_APP_PROVIDERS, browserPlatform().injector);
coreBootstrap(BasicNgFactory, appInjector);
