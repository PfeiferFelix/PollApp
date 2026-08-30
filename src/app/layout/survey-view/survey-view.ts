import { Component, computed, inject, input } from '@angular/core';
import { Surveys } from '../../services/surveys';

/**
 * Zeigt eine einzelne Umfrage mit ihren Fragen und Antwortmoeglichkeiten.
 */
@Component({
  imports: [],
  selector: 'app-survey-view',
  styleUrl: './survey-view.scss',
  templateUrl: './survey-view.html',
})
export class SurveyView {
  id = input.required<string>();

  surveys = inject(Surveys);

  constructor() {
    this.surveys.load();
  }

  /** Die Umfrage, die zur Id aus der URL gehoert, oder undefined. */
  survey = computed(() =>
    this.surveys.surveylist().find((s) => s.id === Number(this.id())),
  );

  /** Die erste Frage der Umfrage, oder undefined. */
  question = computed(() => this.survey()?.questions?.[0]);

  /** Die Antwortmoeglichkeiten der Frage, leer wenn es keine gibt. */
  options = computed(() => this.question()?.options ?? []);
}
