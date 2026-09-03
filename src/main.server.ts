import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';

/**
 * Starts the app on the server so the page is delivered ready made.
 * @param context The render context Angular hands over for the server run.
 * @returns Promise with the started application.
 */
const bootstrap = (context: BootstrapContext) =>
    bootstrapApplication(App, config, context);

export default bootstrap;
