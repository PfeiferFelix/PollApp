import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Root component of the app. Holds nothing but the RouterOutlet
 * the current page is loaded into.
 */
@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('PollApp');
}
