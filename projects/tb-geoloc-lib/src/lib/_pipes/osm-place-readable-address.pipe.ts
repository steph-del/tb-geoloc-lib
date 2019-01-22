import { Pipe, PipeTransform } from '@angular/core';
import { OsmPlaceModel } from '../_models/osmPlace.model';
import { GeocodingService } from '../_services/geocoding.service';

/**
 * To show an address to the user, we could use the display_name attribute returned by nominatim
 * This attribute is far complicated to read (road, neighbourhood, suburb, town, city, postcode, county, country, etc.)
 * This pipe use the getReadbleAddress() function of geocode service to show minimal information about the address returned by nominatim API
 */
@Pipe({
  name: 'osmPlaceReadableAddress'
})
export class OsmPlaceReadableAddressPipe implements PipeTransform {

  constructor(private geocodeService: GeocodingService) { }

  transform(value: OsmPlaceModel, args?: string): string {
    return this.geocodeService.getReadbleAddress(value, args);
  }

}
