import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrepareProductComponent } from './prepare-product-component';

describe('PrepareProductComponent', () => {
  let component: PrepareProductComponent;
  let fixture: ComponentFixture<PrepareProductComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrepareProductComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PrepareProductComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
