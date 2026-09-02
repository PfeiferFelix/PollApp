import { Component, signal, inject, WritableSignal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Surveys } from '../../services/surveys';
import { NewQuestion, NewSurvey } from '../../services/service';

interface Question {
  id: number;
  text: WritableSignal<string>;
  allowMultiple: WritableSignal<boolean>;
  answers: WritableSignal<{ id: number; text: string }[]>;
}

/**
 * Formular zum Anlegen einer neuen Umfrage samt Frage und Antworten.
 */
@Component({
  imports: [RouterLink],
  selector: 'app-create-survey',
  styleUrl: './create-survey.scss',
  templateUrl: './create-survey.html',
})

export class CreateSurvey {
  /**das Template liest surveys.isLoading() und surveys.errorMessage(). */
  surveys = inject(Surveys);
  router = inject(Router);

  /** Hinweis, welche Angabe im Formular noch fehlt. Null wenn alles passt. */
  formError = signal<string | null>(null);

  maxQuestions = 4;
  nextQuestionId = 2;

  /** Buchstaben der Antwortfelder. Die Laenge legt zugleich die Obergrenze fest. */
  letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  /** Enddatum der Umfrage im Format der Datenbank. */
  endDate = signal('');

  /** Auswälbare Kategorien. */
  categories = ['Sport', 'Health', 'Gaming', 'Vacation', 'Food', 'Artist'];

  /** Gewählte Kategorie, oder null solange keine gewählt wurde. */
  category = signal<string | null>(null);

  /** Ob das Kategorie-Menue gerade offen ist. */
  categoryOpen = signal(false);

  /** minimal zwei antworten pro frage*/
  minAnswers = 2;

  /**minimal eine question*/
  minQuestions = 1;

  /** 1 und 2 sind schon vergeben, die naechste neue Antwort bekommt die 3. */
  nextAnswerId = 3;

  /** Optionaler Beschreibungstext. */
  description = signal('');

  /** Name der Umfrage. */
  title = signal('');

  /** Oeffnet das Kategorie-Menue, oder schliesst es wenn es offen war. */
  toggleCategory(): void {
    this.categoryOpen.update((open) => !open);
  }

  /**
   * Uebernimmt die gewaehlte Kategorie und schliesst das Menue.
   * @param cat Die gewaehlte Kategorie.
   */
  selectCategory(cat: string): void {
    this.category.set(cat);
    this.categoryOpen.set(false);
  }

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

  /** Haengt eine neue Frage an, solange die Obergrenze nicht erreicht ist. */
  addQuestion(): void {
    if (this.questions().length >= this.maxQuestions) return;
    this.questions.update((list) => [...list, this.createQuestion()]);
  }

  /**
   * Entfernt eine Frage, solange danach noch eine uebrig bleibt.
   * @param id Namensschild der zu entfernenden Frage.
   */
  removeQuestion(id: number): void {
    if (this.questions().length <= this.minQuestions) return;
    this.questions.update((list) => list.filter((question) => question.id !== id));
  }

  /**
   * Haengt ein leeres Antwortfeld an, solange die Obergrenze nicht erreicht ist.
   * @param question Die Frage, zu der die Antwort gehoert.
   */
  addAnswer(question: Question): void {
    if (question.answers().length >= this.letters.length) return;
    question.answers.update((list) => [...list, { id: this.nextAnswerId++, text: '' }]);
  }

  /**
   * Entfernt ein Antwortfeld, solange danach noch genug uebrig bleiben.
   * @param question Die Frage, zu der die Antwort gehoert.
   * @param id Namensschild der zu entfernenden Antwort.
   */
  removeAnswer(question: Question, id: number): void {
    if (question.answers().length <= this.minAnswers) return;
    question.answers.update((list) => list.filter((answer) => answer.id !== id));
  }

  /**
   * Uebernimmt den getippten Text in das passende Antwortfeld.
   * @param question Die Frage, zu der die Antwort gehoert.
   * @param id Namensschild der bearbeiteten Antwort.
   * @param event Das Eingabe-Ereignis des Feldes.
   */
  onAnswerInput(question: Question, id: number, event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    question.answers.update((list) =>
      list.map((answer) => (answer.id === id ? { ...answer, text } : answer)),
    );
  }

  /**
   * Uebernimmt das getippte Enddatum.
   * @param event Das Eingabe-Ereignis des Datumsfeldes.
   */
  onEndDateInput(event: Event): void {
    this.endDate.set((event.target as HTMLInputElement).value);
  }

  /** Leert das Enddatum-Feld. */
  deleteEndDateInput(): void {
    this.endDate.set('');
  }

  /**
   * Holt den getippten Text aus einem Eingabe-Ereignis.
   * @param event Das Ereignis eines input- oder textarea-Feldes.
   * @returns Der aktuelle Inhalt des Feldes.
   */
  readValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  /**
   * Holt den Haken-Zustand aus einer Checkbox.
   * @param event Das Ereignis der Checkbox.
   * @returns True, wenn der Haken gesetzt ist.
   */
  readChecked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  /**
   * Prueft die Eingaben, speichert die Umfrage und leitet bei Erfolg zur Startseite.
   * @returns Promise, das erfuellt ist sobald der Speicherversuch durch ist.
   */
  async publish(): Promise<void> {
    const error = this.validate();
    if (error) {
      this.formError.set(error);
      return;
    }
    this.formError.set(null);
    const ok = await this.surveys.create(this.buildSurvey());
    if (ok) this.router.navigate(['/home']);
  }

  /**
   * Sammelt die ausgefuellten Antworten einer Frage ein.
   * @param question Die Frage, deren Antwortfelder gelesen werden.
   * @returns Die Antworttexte ohne Leerzeichen am Rand, leere ausgelassen.
   */
  filledOptions(question: Question): string[] {
    return question
      .answers()
      .map((answer) => answer.text.trim())
      .filter((text) => text.length > 0);
  }

  /**
   * Prueft, ob alle Pflichtangaben ausgefuellt sind.
   * @returns Hinweis auf die erste fehlende Angabe, oder null wenn alles passt.
   */
  validate(): string | null {
    if (!this.title().trim()) return 'Bitte gib der Umfrage einen Namen.';
    if (!this.category()) return 'Bitte waehle eine Kategorie.';
    if (!this.endDate()) return 'Bitte waehle ein Enddatum.';
    return this.validateQuestions();
  }

  /**
   * Prueft jede Frage auf Text und genug ausgefuellte Antworten.
   * @returns Hinweis zur ersten unvollstaendigen Frage, oder null wenn alle passen.
   */
  private validateQuestions(): string | null {
    for (const [index, question] of this.questions().entries()) {
      const nr = index + 1;
      if (!question.text().trim()) return `Bitte formuliere Frage ${nr}.`;
      if (this.filledOptions(question).length < this.minAnswers) {
        return `Bitte fuelle zwei Antworten bei Frage ${nr} aus.`;
      }
    }
    return null;
  }

  /**
   * Baut aus den Formularfeldern das Paket, das der Service speichert.
   * @returns Die vollstaendigen Daten der neuen Umfrage.
   */
  buildSurvey(): NewSurvey {
    return {
      title: this.title().trim(),
      description: this.description().trim(),
      ends_at: this.endDate(),
      category: this.category()!,
      questions: this.questions().map((question) => this.buildQuestion(question)),
    };
  }

  /**
   * Macht aus einer Frage des Formulars die Zeile fuer die Datenbank.
   * @param question Die Frage aus dem Formular.
   * @returns Fragetext, Mehrfachauswahl und die ausgefuellten Antworten.
   */
  private buildQuestion(question: Question): NewQuestion {
    return {
      questions_text: question.text().trim(),
      allow_multiple: question.allowMultiple(),
      options: this.filledOptions(question),
    };
  }
}
