import { Component, signal, inject, computed, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Surveys } from '../../services/surveys';
import { Survey } from '../../services/service';

/** Zeigt entweder laufende oder bereits beendete Umfragen. */
type SurveyFilter = 'active' | 'past';

/**
 * Startseite: listet die Umfragen und laesst sie filtern.
 */
@Component({
  imports: [RouterLink],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {
  /** Ob gerade laufende oder vergangene Umfragen gezeigt werden. */
  filter = signal<SurveyFilter>('active');

  /** Gewaehlte Kategorie, oder null fuer alle Kategorien. */
  category = signal<string | null>(null);

  /** Ob das Kategorie-Menue gerade offen ist. */
  dropdownOpen = signal(false);

  surveys = inject(Surveys);

  /** Laedt die Umfragen, sobald die Seite geoeffnet wird. */
  constructor() {
    this.surveys.load();
  }

  /**
   * Rechnet aus, wie viele Tage eine Umfrage noch laeuft.
   * @param endsAt Enddatum der Umfrage als ISO-Zeichenkette.
   * @returns Anzahl voller Tage bis zum Ende, mindestens 0.
   */
  daysLeft(endsAt: string): number {
    const diff = new Date(endsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86_400_000));
  }

  /**
   * Prueft, ob das Enddatum einer Umfrage noch in der Zukunft liegt.
   * @param survey Die zu pruefende Umfrage.
   * @returns True, solange die Umfrage laeuft.
   */
  isActive(survey: Survey): boolean {
    return new Date(survey.ends_at).getTime() > Date.now();
  }

  /** Alle in den Umfragen vorkommenden Kategorien, alphabetisch und ohne Doppelte. */
  categories = computed(() => {
    const all = this.surveys.surveylist().map((s) => s.category);
    return [...new Set(all)].sort();
  });

  /** Die Umfragen, die zum aktuellen Filter und zur gewaehlten Kategorie passen. */
  visibleSurveys = computed(() => {
    const mode = this.filter();
    const selected = this.category();
    const list = this.surveys.surveylist();
    return list
      .filter((s) => (mode === 'active' ? this.isActive(s) : !this.isActive(s)))
      .filter((s) => selected === null || s.category === selected);
  });

  /** Oeffnet das Kategorie-Menue, oder schliesst es wenn es offen war. */
  toggleDropdown(): void {
    this.dropdownOpen.update((open) => !open);
  }

  /**
   * Uebernimmt die gewaehlte Kategorie als Filter und schliesst das Menue.
   * @param category Die gewaehlte Kategorie, oder null fuer alle.
   */
  selectCategory(category: string | null): void {
    this.category.set(category);
    this.dropdownOpen.set(false);
  }

  /**
   * Schliesst das Kategorie-Menue, wenn irgendwo ausserhalb geklickt wird.
   * @param event Das Klick-Ereignis des Dokuments.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.dropdown')) {
      this.dropdownOpen.set(false);
    }
  }

  /** Schliesst das Kategorie-Menue beim Druck auf Escape. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.dropdownOpen.set(false);
  }

  /** Die drei Umfragen, die als naechstes enden. */
  endingSoon = computed(() =>
    [...this.surveys.surveylist()]
      .sort((a, b) => new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime())
      .slice(0, 3),
  );
}
