import { TestBed } from '@angular/core/testing';

import { PublicProcurementService } from './public-procurement-service';

describe('PublicProcurementService', () => {
  let service: PublicProcurementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PublicProcurementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
