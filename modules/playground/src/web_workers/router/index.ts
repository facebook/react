import {WORKER_UI_LOCATION_PROVIDERS} from '@angular/platform-browser';
import {bootstrapWorkerUi} from "@angular/platform-browser-dynamic";

export function main() {
  bootstrapWorkerUi("loader.js", WORKER_UI_LOCATION_PROVIDERS);
}
