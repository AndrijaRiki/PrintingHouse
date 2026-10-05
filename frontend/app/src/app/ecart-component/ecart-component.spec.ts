import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ECartComponent } from './ecart-component';

describe('ECartComponent', () => {
  let component: ECartComponent;
  let fixture: ComponentFixture<ECartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ECartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ECartComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
