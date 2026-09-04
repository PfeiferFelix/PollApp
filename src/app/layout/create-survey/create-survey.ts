import { Component, signal, inject, WritableSignal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Surveys } from '../../services/surveys';
import { todayIso } from '../../services/dates';
import { NewQuestion, NewSurvey } from '../../services/service';
import { Notice } from '../notice/notice';

interface Question {
  id: number;
  text: WritableSignal<string>;
  allowMultiple: WritableSignal<boolean>;
  answers: WritableSignal<{ id: number; text: string }[]>;
}

type FieldErrors = Record<string, string>;

/**
 * Form for creating a new survey.
 */
@Component({
  imports: [RouterLink, Notice],
  selector: 'app-create-survey',
  styleUrl: './create-survey.scss',
  templateUrl: './create-survey.html',
})

export class CreateSurvey {
  /** The template reads surveys.isLoading() and surveys.errorMessage(). */
  surveys = inject(Surveys);
  router = inject(Router);

  /** Validation messages keyed by the input or answer group they belong to. */
  fieldErrors = signal<FieldErrors>({});

  /** True once the survey is saved and the success message is showing. */
  published = signal(false);

  /** Id of the survey that was just created, used to jump to it after publishing. */
  createdSurveyId = signal<number | null>(null);

  /** How long the success message stays before going back to the home page. */
  noticeDuration = 2500;

  /** Maximum number of questions. */
  maxQuestions = 4;

  /** Next id for a new question. */
  nextQuestionId = 2;

  /** Letters in front of the answer fields. */
  letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  /** End date of the survey. */
  endDate = signal('');

  /** Earliest date the survey may end on, so the past stays unreachable. */
  minDate = todayIso();

  /** Selectable categories. */
  categories = ['Sport', 'Health', 'Gaming', 'Vacation', 'Food', 'Artist'];

  /** Chosen category, or null as long as none is chosen. */
  category = signal<string | null>(null);

  /** Whether the category menu is currently open. */
  categoryOpen = signal(false);

  /** At least two answers per question. */
  minAnswers = 2;

  /** At least one question. */
  minQuestions = 1;

  /** 1 and 2 are already taken, so the next new answer gets 3. */
  nextAnswerId = 3;

  /** Describing text. */
  description = signal('');

  /** Name of the survey. */
  title = signal('');

  /** Opens the category menu, or closes it if it was open. */
  toggleCategory(): void {
    this.categoryOpen.update((open) => !open);
  }

  /**
   * Takes over the chosen category and closes the menu.
   * @param cat The chosen category.
   */
  selectCategory(cat: string): void {
    this.category.set(cat);
    this.categoryOpen.set(false);
    this.clearFieldError('category');
  }

  /**
   * Creates a new question with two empty answer fields.
   * @returns The new question, which still has to be appended to the list.
   */
  createQuestion(): Question {
    return {
      id: this.nextQuestionId++,
      text: signal(''),
      allowMultiple: signal(false),
      answers: signal([
        { id: this.nextAnswerId++, text: '' },
        { id: this.nextAnswerId++, text: '' },
      ]),
    };
  }

  questions = signal<Question[]>([this.createQuestion()]);

  /** Appends a new question as long as the upper limit is not reached. */
  addQuestion(): void {
    if (this.questions().length >= this.maxQuestions) return;
    this.questions.update((list) => [...list, this.createQuestion()]);
  }

  /**
   * Removes a question as long as one is left afterwards.
   * @param id Id of the question to remove.
   */
  removeQuestion(id: number): void {
    if (this.questions().length <= this.minQuestions) return;
    this.questions.update((list) => list.filter((question) => question.id !== id));
  }

  /**
   * Appends an empty answer field as long as the maximum is not reached.
   * @param question The question the answer belongs to.
   */
  addAnswer(question: Question): void {
    if (question.answers().length >= this.letters.length) return;
    question.answers.update((list) => [...list, { id: this.nextAnswerId++, text: '' }]);
  }

  /**
   * Removes an answer field as long as at least two are left.
   * @param question The question the answer belongs to.
   * @param id Id of the answer to remove.
   */
  removeAnswer(question: Question, id: number): void {
    if (question.answers().length <= this.minAnswers) return;
    question.answers.update((list) => list.filter((answer) => answer.id !== id));
  }

  /**
   * Takes the typed text over into the matching answer field.
   * @param question The question the answer belongs to.
   * @param id Id of the edited answer.
   * @param event The input event of the field.
   */
  onAnswerInput(question: Question, id: number, event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    question.answers.update((list) =>
      list.map((answer) => (answer.id === id ? { ...answer, text } : answer)),
    );
    this.clearFieldError(`answers-${question.id}`);
  }

  /**
   * Takes over the typed end date.
   * @param event The input event of the date field.
   */
  onEndDateInput(event: Event): void {
    this.endDate.set((event.target as HTMLInputElement).value);
    this.clearFieldError('endDate');
  }

  /** Clears the end date field. */
  deleteEndDateInput(): void {
    this.endDate.set('');
    this.clearFieldError('endDate');
  }

  /**
   * Reads the typed text out of an input event.
   * @param event The event of an input or textarea field.
   * @returns The current content of the field.
   */
  readValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  /** Updates the survey name and clears its validation message. */
  onTitleInput(event: Event): void {
    this.title.set(this.readValue(event));
    this.clearFieldError('title');
  }

  /** Updates one question and clears its validation message. */
  onQuestionInput(question: Question, event: Event): void {
    question.text.set(this.readValue(event));
    this.clearFieldError(`question-${question.id}`);
  }

  /** Returns the message belonging to an individual field, if it has one. */
  fieldError(key: string): string | null {
    return this.fieldErrors()[key] ?? null;
  }

  /** Removes an error as soon as the user updates its related field. */
  clearFieldError(key: string): void {
    this.fieldErrors.update((errors) => {
      if (!errors[key]) return errors;
      const { [key]: _removed, ...remaining } = errors;
      return remaining;
    });
  }

  /**
   * Reads the tick state out of a checkbox.
   * @param event The event of the checkbox.
   * @returns True when the box is ticked.
   */
  readChecked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  /**
   * Checks the entries, saves the survey and shows the message on success.
   * @returns Promise that resolves once the save attempt is done.
   */
  async publish(): Promise<void> {
    const errors = this.validate();
    if (Object.keys(errors).length) {
      this.fieldErrors.set(errors);
      return;
    }
    this.fieldErrors.set({});
    const id = await this.surveys.create(this.buildSurvey());
    if (id === null) return;
    this.createdSurveyId.set(id);
    this.published.set(true);
    setTimeout(() => this.goToCreatedSurvey(), this.noticeDuration);
  }

  /** Closes the message and jumps to the survey that was just created. */
  goToCreatedSurvey(): void {
    const id = this.createdSurveyId();
    this.router.navigate(id === null ? ['/home'] : ['/survey', id]);
  }

  /**
   * Collects the filled in answers of a question.
   * @param question The question whose answer fields are read.
   * @returns The answer texts without surrounding spaces, empty ones left out.
   */
  filledOptions(question: Question): string[] {
    return question
      .answers()
      .map((answer) => answer.text.trim())
      .filter((text) => text.length > 0);
  }

  /**
   * Checks whether all required entries are filled in.
   * @returns All missing required entries, keyed by their matching field.
   */
  validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!this.title().trim()) errors['title'] = 'Please give the survey a name.';
    if (!this.category()) errors['category'] = 'Please choose a category.';
    if (this.endDate() && this.endDate() < this.minDate) {
      errors['endDate'] = 'The end date must not be in the past.';
    }
    return { ...errors, ...this.validateQuestions() };
  }

  /**
   * Checks every question for its text and for enough filled in answers.
   * @returns Every incomplete question and answer group, keyed by their field.
   */
  validateQuestions(): FieldErrors {
    const errors: FieldErrors = {};
    for (const [index, question] of this.questions().entries()) {
      const nr = index + 1;
      if (!question.text().trim()) {
        errors[`question-${question.id}`] = `Please write question ${nr}.`;
      }
      if (this.filledOptions(question).length < this.minAnswers) {
        errors[`answers-${question.id}`] = `Please fill in two answers for question ${nr}.`;
      }
    }
    return errors;
  }

  /**
   * Builds the package the service saves out of the form fields.
   * @returns The complete data of the new survey.
   */
  buildSurvey(): NewSurvey {
    return {
      title: this.title().trim(),
      description: this.description().trim(),
      ends_at: this.endDate() || null,
      category: this.category()!,
      questions: this.questions().map((question) => this.buildQuestion(question)),
    };
  }

  /**
   * Turns a question of the form into the row for the database.
   * @param question The question from the form.
   * @returns Question text, multiple choice flag and the filled in answers.
   */
  buildQuestion(question: Question): NewQuestion {
    return {
      questions_text: question.text().trim(),
      allow_multiple: question.allowMultiple(),
      options: this.filledOptions(question),
    };
  }
}
