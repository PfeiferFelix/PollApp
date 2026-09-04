import { Component, input, output } from '@angular/core';

/**
 * Floating status message that slides in and can be dismissed.
 */
@Component({
  selector: 'app-notice',
  styleUrl: './notice.scss',
  templateUrl: './notice.html',
})
export class Notice {
  /** Message shown inside the notice. */
  text = input.required<string>();

  /** Emitted when the close button is pressed. */
  closed = output<void>();
}
