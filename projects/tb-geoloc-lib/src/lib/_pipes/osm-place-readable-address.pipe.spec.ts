import { OsmPlaceReadableAddressPipe } from './osm-place-readable-address.pipe';

describe('OsmPlaceReadableAddressPipe', () => {
  it('create an instance', () => {
    const pipe = new OsmPlaceReadableAddressPipe(null);
    expect(pipe).toBeTruthy();
  });
});
