import { Component, signal, inject, computed, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Surveys } from '../../services/surveys';
import { Survey } from '../../services/service';

/** Shows either running or already finished surveys. */
type SurveyFilter = 'active' | 'past';

/**
 * Home page: lists the surveys and lets them be filtered.
 */
@Component({
  imports: [RouterLink],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {
  /** Whether running or past surveys are shown right now. */
  filter = signal<SurveyFilter>('active');

  /** Chosen category, or null for all categories. */
  category = signal<string | null>(null);

  /** Whether the category menu is currently open. */
  dropdownOpen = signal(false);

  surveys = inject(Surveys);

  /** Loads the surveys as soon as the page is opened. */
  constructor() {
    this.surveys.load();
  }

  /**
   * Works out how many days a survey is still running.
   * @param endsAt End date of the survey as an ISO string.
   * @returns Number of full days until the end, at least 0.
   */
  daysLeft(endsAt: string): number {
    const diff = new Date(endsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86_400_000));
  }

  /**
   * Checks whether the end date of a survey still lies in the future.
   * Surveys without an end date keep running.
   * @param survey The survey to check.
   * @returns True as long as the survey is running.
   */
  isActive(survey: Survey): boolean {
    if (!survey.ends_at) return true;
    return new Date(survey.ends_at).getTime() > Date.now();
  }

  /**
   * Delivers the timestamp used for sorting.
   * @param survey The survey to place.
   * @returns The end date in milliseconds, without an end date it goes last.
   */
  private endTime(survey: Survey): number {
    if (!survey.ends_at) return Number.MAX_SAFE_INTEGER;
    return new Date(survey.ends_at).getTime();
  }

  /** All categories appearing in the surveys, sorted and without duplicates. */
  categories = computed(() => {
    const all = this.surveys.surveylist().map((s) => s.category);
    return [...new Set(all)].sort();
  });

  /** The surveys matching the current filter and the chosen category. */
  visibleSurveys = computed(() => {
    const mode = this.filter();
    const selected = this.category();
    const list = this.surveys.surveylist();
    return list
      .filter((s) => (mode === 'active' ? this.isActive(s) : !this.isActive(s)))
      .filter((s) => selected === null || s.category === selected);
  });

  /** Opens the category menu, or closes it if it was open. */
  toggleDropdown(): void {
    this.dropdownOpen.update((open) => !open);
  }

  /**
   * Takes over the chosen category as a filter and closes the menu.
   * @param category The chosen category, or null for all of them.
   */
  selectCategory(category: string | null): void {
    this.category.set(category);
    this.dropdownOpen.set(false);
  }

  /**
   * Closes the category menu when a click happens anywhere outside of it.
   * @param event The click event of the document.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.dropdown')) {
      this.dropdownOpen.set(false);
    }
  }

  /** Closes the category menu when Escape is pressed. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.dropdownOpen.set(false);
  }

  /** The three running surveys that end next; expired surveys never show up here. */
  endingSoon = computed(() =>
    this.surveys
      .surveylist()
      .filter((s) => this.isActive(s))
      .sort((a, b) => this.endTime(a) - this.endTime(b))
      .slice(0, 3),
  );
}
