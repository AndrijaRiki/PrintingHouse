import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicProcurementComponent } from './public-procurement-component';

describe('PublicProcurementComponent', () => {
  let component: PublicProcurementComponent;
  let fixture: ComponentFixture<PublicProcurementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicProcurementComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicProcurementComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
