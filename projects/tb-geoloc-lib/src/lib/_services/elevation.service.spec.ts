import { TestBed, inject } from '@angular/core/testing';

import { ElevationService } from './elevation.service';

describe('ElevationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ElevationService]
    });
  });

  it('should be created', inject([ElevationService], (service: ElevationService) => {
    expect(service).toBeTruthy();
  }));
});
