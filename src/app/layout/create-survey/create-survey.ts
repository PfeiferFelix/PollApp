import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Surveys } from '../../services/surveys';
import { NewSurvey } from '../../services/service';

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

  /**
   * Die Antwortfelder. Jedes hat ein Namensschild (id) und seinen Inhalt (text).
   * Der Buchstabe kommt aus der Position in der Liste, nicht aus den Daten.
   */
  answers = signal([
    { id: 1, text: '' },
    { id: 2, text: '' },
  ]);

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

  /** Unter zwei Antworten ist es keine Umfrage mehr. */
  minAnswers = 2;

  /** 1 und 2 sind schon vergeben, die naechste neue Antwort bekommt die 3. */
  nextAnswerId = 3;

  /** Name der Umfrage. */
  title = signal('');

  /** Optionaler Beschreibungstext. */
  description = signal('');

  /** Text der Frage. */
  questionText = signal('');

  /** Ob mehrere Antworten gleichzeitig gewaehlt werden duerfen. */
  allowMultiple = signal(false);

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

  /** Haengt ein leeres Antwortfeld an, solange die Obergrenze nicht erreicht ist. */
  addAnswer(): void {
    if (this.answers().length >= this.letters.length) return;
    this.answers.update((list) => [...list, { id: this.nextAnswerId++, text: '' }]);
  }

  /**
   * Entfernt ein Antwortfeld, solange danach noch genug uebrig bleiben.
   * @param id Namensschild der zu entfernenden Antwort.
   */
  removeAnswer(id: number): void {
    if (this.answers().length <= this.minAnswers) return;
    this.answers.update((list) => list.filter((answer) => answer.id !== id));
  }

  /**
   * Uebernimmt den getippten Text in das passende Antwortfeld.
   * @param id Namensschild der bearbeiteten Antwort.
   * @param event Das Eingabe-Ereignis des Feldes.
   */
  onAnswerInput(id: number, event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.answers.update((list) =>
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
   * Sammelt die ausgefuellten Antworten ein.
   * @returns Die Antworttexte ohne Leerzeichen am Rand, leere ausgelassen.
   */
  filledOptions(): string[] {
    return this.answers()
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
    if (!this.questionText().trim()) return 'Bitte formuliere eine Frage.';
    if (options.length < this.minAnswers) return 'Bitte fuelle zwei Antworten aus.';
    return null;
  }

  /**
   * Baut aus den Formularfeldern das Paket, das der Service speichert.
   * @param options Die bereits eingesammelten Antworttexte.
   * @returns Die vollstaendigen Daten der neuen Umfrage.
   */
  buildSurvey(options: string[]): NewSurvey {
    return {
      title: this.title().trim(),
      description: this.description().trim(),
      ends_at: this.endDate(),
      category: this.category()!,
      questions_text: this.questionText().trim(),
      allow_multiple: this.allowMultiple(),
      options,
    };
  }
}
