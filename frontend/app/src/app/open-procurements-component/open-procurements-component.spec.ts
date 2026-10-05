import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenProcurementsComponent } from './open-procurements-component';

describe('OpenProcurementsComponent', () => {
  let component: OpenProcurementsComponent;
  let fixture: ComponentFixture<OpenProcurementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpenProcurementsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OpenProcurementsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
