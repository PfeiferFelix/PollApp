import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SurveyView } from './survey-view';

describe('SurveyView', () => {
  let component: SurveyView;
  let fixture: ComponentFixture<SurveyView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurveyView],
    }).compileComponents();

    fixture = TestBed.createComponent(SurveyView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
