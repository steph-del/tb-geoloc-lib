import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { TbGeolocLibModule } from 'tb-geoloc-lib';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    TbGeolocLibModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
