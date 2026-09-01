import { Component, computed, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Surveys } from '../../services/surveys';

/**
 * Zeigt eine einzelne Umfrage mit ihren Fragen und Antwortmoeglichkeiten.
 */
@Component({
  imports: [RouterLink, DatePipe],
  selector: 'app-survey-view',
  styleUrl: './survey-view.scss',
  templateUrl: './survey-view.html',
})
export class SurveyView {
  id = input.required<string>();

  surveys = inject(Surveys);

  /** Buchstaben vor den Antworten, in der Reihenfolge der Optionen. */
  letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  constructor() {
    this.surveys.load();
  }

  /** Die Umfrage, die zur Id aus der URL gehoert, oder undefined. */
  survey = computed(() =>
    this.surveys.surveylist().find((s) => s.id === Number(this.id())),
  );

  /** Alle Fragen der Umfrage, jede mit ihren Antworten als fertige Liste. */
  questions = computed(() =>
    (this.survey()?.questions ?? []).map((question) => ({
      ...question,
      answers: this.toList(question.options),
    })),
  );

  /**
   * Macht aus dem Datenbankwert eine echte Liste von Antworten.
   * @param value Array, JSON-Text oder einzelner Text aus der Spalte options.
   * @returns Die Antworten als Liste, notfalls leer.
   */
  private toList(value: unknown): string[] {
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string') return [];
    if (!value.startsWith('[')) return [value];
    try { return JSON.parse(value); } catch { return [value]; }
  }
}
