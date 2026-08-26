import { Component, signal, inject, computed, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Surveys } from '../../services/surveys';
import { Survey } from '../../services/service';

type SurveyFilter = 'active' | 'past';

@Component({
  imports: [RouterLink],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {
  filter = signal<SurveyFilter>('active');
  category = signal<string | null>(null);
  dropdownOpen = signal(false);

  surveys = inject(Surveys);

  constructor() {
    this.surveys.load();
  }


  daysLeft(endsAt: string): number {
    const diff = new Date(endsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86_400_000));
  }

  // Laeuft die Umfrage noch, oder ist ihr Enddatum schon vorbei?
    isActive(survey: Survey): boolean {
    return new Date(survey.ends_at).getTime() > Date.now();
  }

  categories = computed(() => {
    const all = this.surveys.surveylist().map((s) => s.category);
    return [...new Set(all)].sort();
  });

  visibleSurveys = computed(() => {
    const mode = this.filter();
    const selected = this.category();
    const list = this.surveys.surveylist();
    return list
      .filter((s) => (mode === 'active' ? this.isActive(s) : !this.isActive(s)))
      .filter((s) => selected === null || s.category === selected);
  });

  toggleDropdown(): void { 
    this.dropdownOpen.update((open) => !open);
  }

  selectCategory(category: string | null): void {
    this.category.set(category);
    this.dropdownOpen.set(false);
  }

  // Klick irgendwo ausserhalb des Dropdowns schliesst es wieder.
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.dropdown')) {
      this.dropdownOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.dropdownOpen.set(false);
  }

  endingSoon = computed(() =>
    [...this.surveys.surveylist()]
      .sort(
        (a, b) => new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime()
      )
      .slice(0, 3)
  );



}


