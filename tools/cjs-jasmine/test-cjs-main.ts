var testingPlatformServer = require('../../all/@angular/platform-server/testing/server.js');
var testing = require('../../all/@angular/core/testing');

testing.setBaseTestProviders(
    testingPlatformServer.TEST_SERVER_PLATFORM_PROVIDERS,
    testingPlatformServer.TEST_SERVER_APPLICATION_PROVIDERS);
