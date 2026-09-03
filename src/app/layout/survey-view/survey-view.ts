import { Component, computed, inject, input, signal, OnInit, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Surveys } from '../../services/surveys';
import { Votes } from '../../services/votes';
import { NewVote } from '../../services/service';

/**
 * Shows a single survey with its questions and answer options.
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

  /** Letters in front of the answers, in the order of the options. */
  letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  /** Ticked answers per question id. */
  selection = signal<Record<number, number[]>>({});

  /** True once a vote has been cast in this session. */
  hasVoted = signal(false);

  /** Running timer that brings the user back to the home page after voting. */
  private returnTimer?: ReturnType<typeof setTimeout>;

  /** True once at least one answer is ticked. */
  hasSelection = computed(() =>
    Object.values(this.selection()).some((indexes) => indexes.length > 0),
  );

  /**
   * Loads the survey and afterwards the votes that were already cast.
   * @returns Promise that resolves once both requests are done.
   */
  async ngOnInit(): Promise<void> {
    await this.surveys.load();
    await this.votes.load(this.questionIds());
  }

  /**
   * Stops the timer in case the page is left beforehand.
   */
  ngOnDestroy(): void {
    clearTimeout(this.returnTimer);
  }

  /** The ids of all questions of this survey. */
  questionIds(): number[] {
    return this.questions().map((question) => question.id);
  }

  /** The survey belonging to the id from the URL, or undefined. */
  survey = computed(() =>
    this.surveys.surveylist().find((s) => s.id === Number(this.id())),
  );

  /** All questions of the survey, each with its answers as a ready made list. */
  questions = computed(() =>
    (this.survey()?.questions ?? []).map((question) => ({
      ...question,
      answers: this.toList(question.options),
    })),
  );

  /**
   * Turns the database value into a real list of answers.
   * @param value Array, JSON text or single text from the options column.
   * @returns The answers as a list, empty if nothing else works.
   */
  toList(value: unknown): string[] {
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string') return [];
    if (!value.startsWith('[')) return [value];
    try { return JSON.parse(value); } catch { return [value]; }
  }

  /**
   * Whether a certain answer is ticked right now.
   * @param questionId Id of the question.
   * @param index Number of the answer, 0 is A.
   * @returns True when this answer is ticked.
   */
  isChecked(questionId: number, index: number): boolean {
    return (this.selection()[questionId] ?? []).includes(index);
  }

  /**
   * Sets or removes the tick on an answer.
   * @param questionId Id of the question.
   * @param multiple Whether the question allows several answers.
   * @param index Number of the clicked answer.
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
   * Turns the selection into the rows for the database.
   * @returns One entry per ticked answer.
   */
  chosenRows(): NewVote[] {
    return Object.entries(this.selection()).flatMap(([id, indexes]) =>
      indexes.map((option_index) => ({ question_id: Number(id), option_index })),
    );
  }

  /**
   * Sends the ticked answers to the database.
   * @returns Promise that resolves once the save attempt is done.
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
   * How many percent of the votes of a question go to one answer.
   * @param questionId Id of the question.
   * @param index Number of the answer, 0 is A.
   * @returns Share in percent, rounded. Without votes 0.
   */
  percent(questionId: number, index: number): number {
    const votes = this.votes.votelist().filter((v) => v.question_id === questionId);
    if (!votes.length) return 0;

    const hits = votes.filter((v) => v.option_index === index).length;
    return Math.round((hits / votes.length) * 100);
  }

  /**
   * Brings the user back to the home page after voting.
   * @param delay Waiting time in milliseconds.
   */
  scheduleReturn(delay = 5000): void {
    this.returnTimer = setTimeout(() => this.router.navigate(['/home']), delay);
  }
}
