/**
 * Auto format a DMS coordinates
 * eg. user can enter 43 0 14.77
 * and the formatter returns 43° 0' 14.77"
 * + avoid enter non numeric (or . ,) characters
 * + force entire numbers for degrees and minutes
 */
export function dmsFormatter(dmsStr: string): string {
  try {
    // replace multiples spaces
    dmsStr = dmsStr.replace(/\s\s+/g, ' ');
    // replace space at first position
    if (dmsStr.charAt(0) === ' ') { dmsStr = dmsStr.slice(1, dmsStr.length - 1); }
    // replace , by .
    dmsStr = dmsStr.replace(',', '.');
    // delete all non numeric characters
    dmsStr = dmsStr.replace(/[^0-9\-.,°\'"\s]/g, '');

    let nbSpaces: number;
    let degChr = '';
    let minChr = '';
    let secChr = '';

    let v = dmsStr.split(' ');
    // remove last space od input string
    if (dmsStr.charAt(dmsStr.length - 1) === ' ') {
      v = v.slice(0 , v.length - 1);
    }
    // remove last item of v array if it's empty
    if (v[v.length - 1] === '') {
      v = v.slice(0 , v.length - 1);
    }
    if (v.length === 1) {
      degChr = v[0];
      // degChr must be an entire number
      if (degChr.indexOf('.') !== -1) { degChr = degChr.slice(0, degChr.indexOf('.')); }
      // between -90 & +90
      if (Number(degChr) < -90) { degChr = '-90'; }
      if (Number(degChr) > 90) { degChr = '90'; }
    }
    if (v.length === 2) {
      degChr = v[0]; minChr = v[1];
      if (degChr.indexOf('.') !== -1) { degChr = degChr.slice(0, degChr.indexOf('.')); }
      if (minChr.indexOf('.') !== -1) { minChr = minChr.slice(0, degChr.indexOf('.')); }
      if (Number(degChr) < -90) { degChr = '-90'; }
      if (Number(degChr) > 90) { degChr = '90'; }
      if (Number(minChr) < -90) { minChr = '-90'; }
      if (Number(minChr) > 90) { minChr = '90'; }
      }
    if (v.length === 3) {
      degChr = v[0]; minChr = v[1]; secChr = v[2];
      if (degChr.indexOf('.') !== -1) { degChr = degChr.slice(0, degChr.indexOf('.')); }
      if (minChr.indexOf('.') !== -1) { minChr = minChr.slice(0, degChr.indexOf('.')); }
      if (Number(degChr) < -90) { degChr = '-90'; }
      if (Number(degChr) > 90) { degChr = '90'; }
      if (Number(minChr) < -90) { minChr = '-90'; }
      if (Number(minChr) > 90) { minChr = '90'; }
      }
    if (v.length >= 4) {
      v = v.slice(0, 2);
      if (degChr.indexOf('.') !== -1) { degChr = degChr.slice(0, degChr.indexOf('.')); }
      if (minChr.indexOf('.') !== -1) { minChr = minChr.slice(0, degChr.indexOf('.')); }
      if (Number(degChr) < -90) { degChr = '-90'; }
      if (Number(degChr) > 90) { degChr = '90'; }
      if (Number(minChr) < -90) { minChr = '-90'; }
      if (Number(minChr) > 90) { minChr = '90'; }
    }

    try {
      nbSpaces = dmsStr.match(/\s/g).length;
    } catch (e) {
      nbSpaces = 0;
    }
    if (nbSpaces === 0 && v.length === 1) {
      // do nothing
    } else if (nbSpaces === 1 && v.length >= 1) {
      degChr = degChr.replace(' ', '');
      if (degChr.slice(degChr.length - 1, degChr.length) !== '°') { degChr += '° '; } else { degChr += ' '; }
    } else if (nbSpaces === 2 && v.length >= 2) {
      degChr = degChr.replace(' ', '');
      minChr = minChr.replace(' ', '');
      if (degChr.slice(degChr.length - 1, degChr.length) !== '°') { degChr += '° '; } else { degChr += ' '; }
      if (minChr.slice(minChr.length - 1, minChr.length) !== '\'') { minChr += '\' '; } else { minChr += ' '; }
    } else if (nbSpaces === 3 && v.length >= 3) {
      degChr = degChr.replace(' ', '');
      minChr = minChr.replace(' ', '');
      secChr = secChr.replace(' ', '');
      if (degChr.slice(degChr.length - 1, degChr.length) !== '°') { degChr += '° '; } else { degChr += ' '; }
      if (minChr.slice(minChr.length - 1, minChr.length) !== '\'') { minChr += '\' '; } else { minChr += ' '; }
      if (secChr.slice(secChr.length - 1, secChr.length) !== '"') { secChr += '"'; }
    } else {
      throw { error: 'Can\'t manage input string.' };
    }

    return degChr + minChr + secChr;

  } catch (e) {
    return dmsStr;
  }
}
