import { Component, signal, inject, WritableSignal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Surveys } from '../../services/surveys';
import { NewSurvey } from '../../services/service';

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
  /** Nicht privat: das Template liest surveys.isLoading() und surveys.errorMessage(). */
  surveys = inject(Surveys);
  private router = inject(Router);

  /** Hinweis, welche Angabe im Formular noch fehlt. Null wenn alles passt. */
  formError = signal<string | null>(null);

  maxQuestions = 4;
  nextQuestionId = 2;

  /** Buchstaben der Antwortfelder. Die Laenge legt zugleich die Obergrenze fest. */
  letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  /** Enddatum der Umfrage im Format der Datenbank. */
  endDate = signal('');

  /** Auswaehlbare Kategorien. */
  categories = ['Gaming', 'Team Activity', 'Healthy Lifestyle', 'Nature Camping and Vacation'];

  /** Gewaehlte Kategorie, oder null solange keine gewaehlt wurde. */
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
    const options = this.filledOptions();
    const error = this.validate(options);

    if (error) {
      this.formError.set(error);
      return;
    }

    this.formError.set(null);
    const ok = await this.surveys.create(this.buildSurvey(options));
    if (ok) this.router.navigate(['/home']);
  }

  /**
   * Die erste Frage. Nur sie wird derzeit gespeichert.
   * @returns Die erste Frage der Liste.
   */
  firstQuestion(): Question {
    return this.questions()[0];
  }

  /**
   * Sammelt die ausgefuellten Antworten der ersten Frage ein.
   * @returns Die Antworttexte ohne Leerzeichen am Rand, leere ausgelassen.
   */
  filledOptions(): string[] {
    return this.firstQuestion()
      .answers()
      .map((answer) => answer.text.trim())
      .filter((text) => text.length > 0);
  }

  /**
   * Prueft, ob alle Pflichtangaben ausgefuellt sind.
   * @param options Die bereits eingesammelten Antworttexte.
   * @returns Hinweis auf die erste fehlende Angabe, oder null wenn alles passt.
   */
  validate(options: string[]): string | null {
    if (!this.title().trim()) return 'Bitte gib der Umfrage einen Namen.';
    if (!this.category()) return 'Bitte waehle eine Kategorie.';
    if (!this.endDate()) return 'Bitte waehle ein Enddatum.';
    if (!this.firstQuestion().text().trim()) return 'Bitte formuliere eine Frage.';
    if (options.length < this.minAnswers) return 'Bitte fuelle zwei Antworten aus.';
    return null;
  }

  /**
   * Baut aus den Formularfeldern das Paket, das der Service speichert.
   * @param options Die bereits eingesammelten Antworttexte.
   * @returns Die vollstaendigen Daten der neuen Umfrage.
   */
  buildSurvey(options: string[]): NewSurvey {
    const question = this.firstQuestion();
    return {
      title: this.title().trim(),
      description: this.description().trim(),
      ends_at: this.endDate(),
      category: this.category()!,
      questions_text: question.text().trim(),
      allow_multiple: question.allowMultiple(),
      options,
    };
  }
}
