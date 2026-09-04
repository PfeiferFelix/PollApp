import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Remembers which surveys this device has already answered.
 */
@Injectable({ providedIn: 'root' })
export class VotedSurveys {
   isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

   storageKey = 'pollapp-voted-surveys';

  /**
   * Reads the ids of all surveys that were answered on this device.
   * @returns The stored ids, empty when nothing is stored yet.
   */
  ids(): number[] {
    if (!this.isBrowser) return [];
    try {
      const stored = JSON.parse(localStorage.getItem(this.storageKey) ?? '[]');
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  }

  /**
   * Whether a survey was already answered on this device.
   * @param surveyId Id of the survey.
   * @returns True when a vote was cast before.
   */
  has(surveyId: number): boolean {
    return this.ids().includes(surveyId);
  }

  /**
   * Notes a survey as answered so it stays locked on this device.
   * @param surveyId Id of the survey.
   */
  add(surveyId: number): void {
    if (!this.isBrowser || this.has(surveyId)) return;
    const ids = JSON.stringify([...this.ids(), surveyId]);
    try { localStorage.setItem(this.storageKey, ids); } catch { return; }
  }
}
