import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

console.info('AquaBalance build 2026-11-09-b');

bootstrapApplication(App, appConfig)
  .catch(err => console.error(err));
