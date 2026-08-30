import { Routes } from '@angular/router';
import { Home } from './layout/home/home';
import { CreateSurvey } from './layout/create-survey/create-survey';
import { SurveyView } from './layout/survey-view/survey-view';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Home, title: 'PollApp' },
  { path: 'create', component: CreateSurvey, title: 'Neue Umfrage' },
  { path: 'survey/:id', component: SurveyView, title: 'Umfrage' },
  { path: '**', redirectTo: 'home' },
];
