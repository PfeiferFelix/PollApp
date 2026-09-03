import { Component, computed, inject, input, signal, OnInit, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Surveys } from '../../services/surveys';
import { Votes } from '../../services/votes';
import { NewVote } from '../../services/service';

/**
 * Zeigt eine einzelne Umfrage mit ihren Fragen und Antwortmoeglichkeiten.
 */
@Component({
  imports: [RouterLink, DatePipe],
  selector: 'app-survey-view',
  styleUrl: './survey-view.scss',
  templateUrl: './survey-view.html',
})
export class SurveyView implements OnInit, OnDestroy {
  id = input.required<string>();

  surveys = inject(Surveys);
  votes = inject(Votes);
  router = inject(Router);

  /** Buchstaben vor den Antworten, in der Reihenfolge der Optionen. */
  letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  /** Angekreuzte Antworten je Frage-Id. */
  selection = signal<Record<number, number[]>>({});


  /** True, sobald in dieser Sitzung abgestimmt wurde. */
  hasVoted = signal(false);

  /** Laufender Timer, der nach dem Abstimmen zurueck zur Startseite bringt. */
  private returnTimer?: ReturnType<typeof setTimeout>;

  /** True, sobald mindestens eine Antwort angekreuzt ist. */
  hasSelection = computed(() =>
    Object.values(this.selection()).some((indexes) => indexes.length > 0),
  );

  /**
   * Laedt die Umfrage und danach die schon abgegebenen Stimmen.
   */
  async ngOnInit(): Promise<void> {
    await this.surveys.load();
    await this.votes.load(this.questionIds());
  }

  /**
   * Stoppt den Timer, falls die Seite vorher verlassen wird.
   */
  ngOnDestroy(): void {
    clearTimeout(this.returnTimer);
  }

  /** Die Ids aller Fragen dieser Umfrage. */
  questionIds(): number[] {
    return this.questions().map((question) => question.id);
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
  toList(value: unknown): string[] {
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string') return [];
    if (!value.startsWith('[')) return [value];
    try { return JSON.parse(value); } catch { return [value]; }
  }

  /**
 * Ob eine bestimmte Antwort gerade angekreuzt ist.
 * @param questionId Id der Frage.
 * @param index Nummer der Antwort, 0 ist A.
 */
  isChecked(questionId: number, index: number): boolean {
    return (this.selection()[questionId] ?? []).includes(index);
  }

  /**
   * Setzt oder entfernt den Haken bei einer Antwort.
   * @param questionId Id der Frage.
   * @param multiple Ob die Frage mehrere Antworten erlaubt.
   * @param index Nummer der angeklickten Antwort.
   */
  toggle(questionId: number, multiple: boolean, index: number): void {
    const chosen = this.selection()[questionId] ?? [];
    let next = [index];
    if (multiple) {
      next = chosen.includes(index)
        ? chosen.filter((i) => i !== index)
        : [...chosen, index];
    }
    this.selection.update((all) => ({ ...all, [questionId]: next }));
  }

  /**
 * Macht aus der Auswahl die Zeilen fuer die Datenbank.
 * @returns Je ein Eintrag pro angekreuzter Antwort.
 */
  chosenRows(): NewVote[] {
    return Object.entries(this.selection()).flatMap(([id, indexes]) =>
      indexes.map((option_index) => ({ question_id: Number(id), option_index })),
    );
  }

  /**
   * Schickt die angekreuzten Antworten an die Datenbank.
   */
  async submit(): Promise<void> {
    const rows = this.chosenRows();
    if (!rows.length || this.hasVoted()) return;
    this.hasVoted.set(true);
    const ok = await this.votes.save(rows);
    if (!ok) return this.hasVoted.set(false);
    await this.votes.load(this.questionIds());
    this.scheduleReturn();
  }


  /**
   * Wie viel Prozent der Stimmen einer Frage auf eine Antwort entfallen.
   * @param questionId Id der Frage.
   * @param index Nummer der Antwort, 0 ist A.
   * @returns Anteil in Prozent, gerundet. Ohne Stimmen 0.
   */
  percent(questionId: number, index: number): number {
    const votes = this.votes.votelist().filter((v) => v.question_id === questionId);
    if (!votes.length) return 0;

    const hits = votes.filter((v) => v.option_index === index).length;
    return Math.round((hits / votes.length) * 100);
  }

  /**
   * Bringt den Nutzer nach dem Abstimmen zurueck zur Startseite.
   * @param delay Wartezeit in Millisekunden.
   */
  private scheduleReturn(delay = 5000): void {
    this.returnTimer = setTimeout(() => this.router.navigate(['/home']), delay);
  }
}

