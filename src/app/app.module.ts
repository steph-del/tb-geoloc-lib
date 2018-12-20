import { BrowserModule } from '@angular/platform-browser';
import { NgModule, Injector } from '@angular/core';
import { createCustomElement } from '@angular/elements';

import { AppComponent } from './app.component';
import { TbGeolocLibModule, MapComponent } from 'tb-geoloc-lib';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    TbGeolocLibModule
  ],
  providers: [],
  entryComponents: [MapComponent]
})
export class AppModule {
  constructor(private injector: Injector) {
    const elm = createCustomElement(MapComponent, { injector: this.injector });
    customElements.define('tb-geolocation-element', elm);
  }
  ngDoBootstrap() { }
}
