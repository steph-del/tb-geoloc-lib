import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TbGeolocLibComponent } from './tb-geoloc-lib.component';

describe('TbGeolocLibComponent', () => {
  let component: TbGeolocLibComponent;
  let fixture: ComponentFixture<TbGeolocLibComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TbGeolocLibComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TbGeolocLibComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
