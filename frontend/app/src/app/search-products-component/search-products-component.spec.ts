import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchProductsComponent } from './search-products-component';

describe('SearchProductsComponent', () => {
  let component: SearchProductsComponent;
  let fixture: ComponentFixture<SearchProductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchProductsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchProductsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
