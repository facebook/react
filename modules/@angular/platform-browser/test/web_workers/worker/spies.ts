import {SpyObject, proxy} from '@angular/core/testing/testing_internal';
import {ClientMessageBroker} from '@angular/platform-browser/src/web_workers/shared/client_message_broker';

export class SpyMessageBroker extends SpyObject {
  constructor() { super(ClientMessageBroker); }
}
