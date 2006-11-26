/*
 * LatLong object - methods summary
 *
 *   p = new LatLong('512839N', '0002741W')
 *   p = new LatLong(53.123, -1.987)
 *
 *   dist = LatLong.distHaversine(p1, p2)
 *   dist = LatLong.distCosineLaw(p1, p2)
 *   dist = LatLong.distVincenty(p1, p2)
 *
 *   brng = LatLong.bearing(p1, p2)
 *   dist = p1.distAlongVector(orig, dirn)
 *   p = LatLong.midPoint(p1, p2)
 *   p2 = p1.destPoint(initBrng, dist)
 *   brng = p.finalBrng(initBrng, dist)
 *
 *   dist = LatLong.distRhumb(p1, p2)
 *   brng = LatLong.brngRhumb(p1, p2)
 *   p2 = p1.destPointRhumb(brng, dist)
 *
 *   rad = LatLong.llToRad('51º28'39"N')
 *   latDms = p.latitude()
 *   lonDms = p.longitude()
 *   dms = LatLong.radToDegMinSec(0.1284563)
 *   dms = LatLong.radToBrng(0.1284563)
 *
 * properties:
 *   p.lat - latitude in radians (0=equator, pi/2=N.pole)
 *   p.lon - longitude in radians (0=Greenwich, E=+ve)
 *
 * © 2002-2005 Chris Veness, www.movable-type.co.uk
 */


/*
 * LatLong constructor:
 *
 *   arguments are in degrees: signed decimal or d-m-s + NSEW as per LatLong.llToRad()
 */
function LatLong(degLat, degLong) {
  this.lat = LatLong.llToRad(degLat);
  this.lon = LatLong.llToRad(degLong);
}


/*
 * Calculate distance (in km) between two points specified by latitude/longitude with Haversine formula
 *
 * from: Haversine formula - R. W. Sinnott, "Virtues of the Haversine",
 *       Sky and Telescope, vol 68, no 2, 1984
 *       http://www.census.gov/cgi-bin/geo/gisfaq?Q5.1
 */

LatLong.distHaversine = function(p1, p2) {
  var R = 6378.137; // earth's mean radius in km
  var dLat  = p2.lat - p1.lat;
  var dLong = p2.lon - p1.lon;

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(p1.lat) * Math.cos(p2.lat) * Math.sin(dLong/2) * Math.sin(dLong/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c;

  return d;
}


/*
 * Calculate distance (in km) between two points specified by latitude/longitude using law of cosines.
 */
LatLong.distCosineLaw = function(p1, p2) {
  var R = 6371; // earth's mean radius in km
  var d = Math.acos(Math.sin(p1.lat)*Math.sin(p2.lat) +
                    Math.cos(p1.lat)*Math.cos(p2.lat)*Math.cos(p2.lon-p1.lon)) * R;
  return d;
}


/*
 * calculate (initial) bearing (in radians clockwise) between two points
 *
 * from: Ed Williams' Aviation Formulary, http://williams.best.vwh.net/avform.htm#Crs
 */
LatLong.bearing = function(p1, p2) {
  var y = Math.sin(p2.lon-p1.lon) * Math.cos(p2.lat);
  var x = Math.cos(p1.lat)*Math.sin(p2.lat) -
          Math.sin(p1.lat)*Math.cos(p2.lat)*Math.cos(p2.lon-p1.lon);
  return Math.atan2(y, x);
}


/*
 * calculate distance of point along a given vector defined by origin point
 * and direction in radians (uses planar not spherical geometry, so only valid
 * for small distances).
 */
LatLong.prototype.distAlongVector = function(orig, dirn) {
  var dist = LatLong.distHaversine(this, orig);  // distance from orig to point
  var brng = LatLong.bearing(this, orig);        // bearing between orig and point
  return dist * Math.cos(brng-dirn);
}


/*
 * calculate midpoint of great circle line between p1 & p2.
 *   see http://mathforum.org/library/drmath/view/51822.html for derivation
 */
LatLong.midPoint = function(p1, p2) {
  var dLon = p2.lon - p1.lon;

  var Bx = Math.cos(p2.lat) * Math.cos(dLon);
  var By = Math.cos(p2.lat) * Math.sin(dLon);

  lat3 = Math.atan2(Math.sin(p1.lat)+Math.sin(p2.lat),
                    Math.sqrt((Math.cos(p1.lat)+Bx)*(Math.cos(p1.lat)+Bx) + By*By ) );
  lon3 = p1.lon + Math.atan2(By, Math.cos(p1.lat) + Bx);

  if (isNaN(lat3) || isNaN(lon3)) return null;
  return new LatLong(lat3*180/Math.PI, lon3*180/Math.PI);
}


/*
 * calculate destination point given start point, initial bearing and distance
 *   see http://williams.best.vwh.net/avform.htm#LL
 */
LatLong.prototype.destPoint = function(brng, dist) {
  var R = 6371; // earth's mean radius in km
  var p1 = this, p2 = new LatLong(0,0), d = parseFloat(dist)/R;  // d = angular distance covered on earth's surface
  brng = LatLong.degToRad(brng);

  p2.lat = Math.asin( Math.sin(p1.lat)*Math.cos(d) + Math.cos(p1.lat)*Math.sin(d)*Math.cos(brng) );
  p2.lon = p1.lon + Math.atan2(Math.sin(brng)*Math.sin(d)*Math.cos(p1.lat), Math.cos(d)-Math.sin(p1.lat)*Math.sin(p2.lat));

  if (isNaN(p2.lat) || isNaN(p2.lon)) return null;
  return p2;
}


/*
 * calculate final bearing arriving at destination point given start point, initial bearing and distance
 */
LatLong.prototype.finalBrng = function(brng, dist) {
  var p1 = this, p2 = p1.destPoint(brng, dist);
  // get reverse bearing point 2 to point 1 & reverse it by adding 180º
  var h2 = (LatLong.bearing(p2, p1) + Math.PI) % (2*Math.PI);
  return h2;
}


/*
 * calculate distance, bearing, destination point on rhumb line
 *   see http://williams.best.vwh.net/avform.htm#Rhumb
 */
LatLong.distRhumb = function(p1, p2) {
  var R = 6371; // earth's mean radius in km
  var dLat = p2.lat-p1.lat, dLon = Math.abs(p2.lon-p1.lon);
  var dPhi = Math.log(Math.tan(p2.lat/2+Math.PI/4)/Math.tan(p1.lat/2+Math.PI/4));
  var q = dLat/dPhi;
  if (!isFinite(q)) q = Math.cos(p1.lat);
  // if dLon over 180° take shorter rhumb across 180° meridian:
  if (dLon > Math.PI) dLon = 2*Math.PI - dLon;
  var d = Math.sqrt(dLat*dLat + q*q*dLon*dLon); 
  return d * R;
}


LatLong.brngRhumb = function(p1, p2) {
  var dLon = p2.lon-p1.lon;
  var dPhi = Math.log(Math.tan(p2.lat/2+Math.PI/4)/Math.tan(p1.lat/2+Math.PI/4));
  if (Math.abs(dLon) > Math.PI) dLon = dLon>0 ? -(2*Math.PI-dLon) : (2*Math.PI+dLon);
  return Math.atan2(dLon, dPhi);
}


LatLong.prototype.destPointRhumb = function(brng, dist) {
  var R = 6371; // earth's mean radius in km
  var p1 = this, p2 = new LatLong(0,0);
  var d = parseFloat(dist)/R;  // d = angular distance covered on earth's surface
  brng = LatLong.degToRad(brng);

  p2.lat = p1.lat + d*Math.cos(brng);
  var dPhi = Math.log(Math.tan(p2.lat/2+Math.PI/4)/Math.tan(p1.lat/2+Math.PI/4));
  var q = (p2.lat-p1.lat)/dPhi;
  if (!isFinite(q)) q = Math.cos(p1.lat);
  var dLon = d*Math.sin(brng)/q;
  // check for some daft bugger going past the pole
  if (Math.abs(p2.lat) > Math.PI/2) p2.lat = p2.lat>0 ? Math.PI-p2.lat : -Math.PI-p2.lat;
  p2.lon = (p1.lon+dLon+Math.PI)%(2*Math.PI) - Math.PI;
 
  if (isNaN(p2.lat) || isNaN(p2.lon)) return null;
  return p2;
}


/*
 * convert lat/long in degrees to radians, for handling input values
 *
 *   this is very flexible on formats, allowing signed decimal degrees (numeric or text), or
 *   deg-min-sec suffixed by compass direction (NSEW). A variety of separators are accepted 
 *   (eg 3º 37' 09"W) or fixed-width format without separators (eg 0033709W). Seconds and minutes
 *   may be omitted. Minimal validation is done.
 */
LatLong.llToRad = function(llDeg) {
  if (!isNaN(llDeg)) return llDeg * Math.PI / 180;  // signed decimal degrees without NSEW

  llDeg = llDeg.replace(/[\s]*$/,'');               // strip trailing whitespace
  var dir = llDeg.slice(-1).toUpperCase();          // compass dir'n
  if (!/[NSEW]/.test(dir)) return NaN;              // check for correct compass direction
  llDeg = llDeg.slice(0,-1);                        // and lose it off the end
  var dms = llDeg.split(/[\s:,°º′\'″\"]/);          // check for separators indicating d/m/s
  if (dms[dms.length-1] == '') dms.length--;        // trailing separator? (see note below)
  switch (dms.length) {                             // convert to decimal degrees...
    case 3:                                         // interpret 3-part result as d/m/s
      var deg = dms[0]/1 + dms[1]/60 + dms[2]/3600; break;
    case 2:                                         // interpret 2-part result as d/m
      var deg = dms[0]/1 + dms[1]/60; break;
    case 1:                                         // non-separated format dddmmss
      if (/[NS]/.test(dir)) llDeg = '0' + llDeg;    // - normalise N/S to 3-digit degrees
      var deg = llDeg.slice(0,3)/1 + llDeg.slice(3,5)/60 + llDeg.slice(5)/3600; break;
    default: return NaN;
  }
  if (/[WS]/.test(dir)) deg = -deg;                 // take west and south as -ve
  return deg * Math.PI / 180;                       // then convert to radians
}
// note: 'x-'.split(/-/) should give ['x',''] but in IE just gives ['x']


/* 
 * convert degrees to radians - used for bearing, so 360º with no N/S/E/W suffix
 *   can accept d/m/s, d/m, or decimal degrees
 */
LatLong.degToRad = function(brng) {
  var dms = brng.split(/[\s:,º°\'\"′″]/)          // check for separators indicating d/m/s
  switch (dms.length) {                           // convert to decimal degrees...
    case 3:                                       // interpret 3-part result as d/m/s
      var deg = dms[0]/1 + dms[1]/60 + dms[2]/3600; break;
    case 2:                                       // interpret 2-part result as d/m
      var deg = dms[0]/1 + dms[1]/60; break;
    default: 
      var deg = parseFloat(brng); break;          // otherwise decimal degrees
  }
  return deg * Math.PI / 180;                     // then convert to radians
}


/*
 * convert latitude into degrees, minutes, seconds; eg 51º28'38"N
 */
LatLong.prototype.latitude = function() {
  return LatLong._dms(this.lat).slice(1) + (this.lat<0 ? 'S' : 'N');
}


/*
 * convert longitude into degrees, minutes, seconds; eg 000º27'41"W
 */
LatLong.prototype.longitude = function() {
  return LatLong._dms(this.lon) + (this.lon>0 ? 'E' : 'W');
}


/*
 * convert radians to (signed) degrees, minutes, seconds; eg -0.1rad = -000°05'44"
 */
LatLong.radToDegMinSec = function(rad) {
  return (rad<0?'-':'') + LatLong._dms(rad);
}


/*
 * convert radians to compass bearing - 0°-360° rather than +ve/-ve
 */
LatLong.radToBrng = function(rad) {
  return LatLong.radToDegMinSec((rad+2*Math.PI) % (2*Math.PI));
}


/*
 * convert radians to deg/min/sec, with no sign or compass dirn (internal use)
 */
LatLong._dms = function(rad) {
  var d = Math.abs(rad * 180 / Math.PI);
  d += 1/7200;  // add ½ second for rounding
  var deg = Math.floor(d);
  var min = Math.floor((d-deg)*60);
  var sec = Math.floor((d-deg-min/60)*3600);
  // add leading zeros if required
  if (deg<100) deg = '0' + deg; if (deg<10) deg = '0' + deg;
  if (min<10) min = '0' + min;
  if (sec<10) sec = '0' + sec;
  return deg + '\u00B0' + min + '\u2032' + sec + '\u2033';
}


/*
 * override toPrecision method with one which displays trailing zeros in place
 *   of exponential notation
 *
 * (for Haversine, use 4 sf to reflect reasonable indication of accuracy)
 */
Number.prototype.toPrecision = function(fig) {
  var scale = Math.ceil(Math.log(this)*Math.LOG10E);
  var mult = Math.pow(10, fig-scale);
  return Math.round(this*mult)/mult;
}


/*
 * it's good form to include a toString method...
 */
LatLong.prototype.toString = function() {
  return this.latitude() + ', ' + this.longitude();
}

var cities = [
    [ 'Afghanistan', 'Kabul', 34.28, 69.11 ],
    [ 'Albania', 'Tirane', 41.18, 19.49 ],
    [ 'Algeria', 'Algiers', 36.42, 3.8 ],
    [ 'American Samoa', 'Pago Pago', -14.16, -170.43 ],
    [ 'Andorra', 'Andorra la Vella', 42.31, 1.32 ],
    [ 'Angola', 'Luanda', -8.50, 13.15 ],
    [ 'Antigua and Barbuda', 'W. Indies', 17.20, -61.48 ],
    [ 'Argentina', 'Buenos Aires', -36.30, -60.0 ],
    [ 'Armenia', 'Yerevan', 40.10, 44.31 ],
    [ 'Aruba', 'Oranjestad', 12.32, -70.2 ],
    [ 'Australia', 'Canberra', -35.15, 149.8 ],
    [ 'Austria', 'Vienna', 48.12, 16.22 ],
    [ 'Azerbaijan', 'Baku', 40.29, 49.56 ],
    [ 'Bahamas', 'Nassau', 25.5, -77.20 ],
    [ 'Bahrain', 'Manama', 26.10, 50.30 ],
    [ 'Bangladesh', 'Dhaka', 23.43, 90.26 ],
    [ 'Barbados', 'Bridgetown', 13.5, -59.30 ],
    [ 'Belarus', 'Minsk', 53.52, 27.30 ],
    [ 'Belgium', 'Brussels', 50.51, 4.21 ],
    [ 'Belize', 'Belmopan', 17.18, -88.30 ],
    [ 'Benin', 'Porto-Novo (constitutional cotonou (seat of gvnt)', 6.23, 2.42 ],
    [ 'Bhutan', 'Thimphu', 27.31, 89.45 ],
    [ 'Bolivia', 'La Paz (adm.)/sucre (legislative)', -16.20, -68.10 ],
    [ 'Bosnia and Herzegovina', 'Sarajevo', 43.52, 18.26 ],
    [ 'Botswana', 'Gaborone', -24.45, 25.57 ],
    [ 'Brazil', 'Brasilia', -15.47, -47.55 ],
    [ 'British Virgin Islands', 'Road Town', 18.27, -64.37 ],
    [ 'Brunei Darussalam', 'Bandar Seri Begawan', 4.52, 115.0 ],
    [ 'Bulgaria', 'Sofia', 42.45, 23.20 ],
    [ 'Burkina Faso', 'Ouagadougou', 12.15, -1.30 ],
    [ 'Burundi', 'Bujumbura', -3.16, 29.18 ],
    [ 'Cambodia', 'Phnom Penh', 11.33, 104.55 ],
    [ 'Cameroon', 'Yaounde', 3.50, 11.35 ],
    [ 'Canada', 'Ottawa', 45.27, -75.42 ],
    [ 'Cape Verde', 'Praia', 15.2, -23.34 ],
    [ 'Cayman Islands', 'George Town', 19.20, -81.24 ],
    [ 'Central African Republic', 'Bangui', 4.23, 18.35 ],
    [ 'Chad', 'N\'Djamena', 12.10, 14.59 ],
    [ 'Chile', 'Santiago', -33.24, -70.40 ],
    [ 'China', 'Beijing', 39.55, 116.20 ],
    [ 'Colombia', 'Bogota', 4.34, -74.0 ],
    [ 'Comros', 'Moroni', -11.40, 43.16 ],
    [ 'Congo', 'Brazzaville', -4.9, 15.12 ],
    [ 'Costa Rica', 'San Jose', 9.55, -84.2 ],
    [ 'Cote d\'Ivoire', 'Yamoussoukro', 6.49, -5.17 ],
    [ 'Croatia', 'Zagreb', 45.50, 15.58 ],
    [ 'Cuba', 'Havana', 23.8, -82.22 ],
    [ 'Cyprus', 'Nicosia', 35.10, 33.25 ],
    [ 'Czech Republic', 'Prague', 50.5, 14.22 ],
    [ 'Democratic People\'s Republic of', 'P\'yongyang', 39.9, 125.30 ],
    [ 'Democratic Republic of the Congo', 'Kinshasa', -4.20, 15.15 ],
    [ 'Denmark', 'Copenhagen', 55.41, 12.34 ],
    [ 'Djibouti', 'Djibouti', 11.8, 42.20 ],
    [ 'Dominica', 'Roseau', 15.20, -61.24 ],
    [ 'Dominica Republic', 'Santo Domingo', 18.30, -69.59 ],
    [ 'East Timor', 'Dili', -8.29, 125.34 ],
    [ 'Ecuador', 'Quito', -0.15, -78.35 ],
    [ 'Egypt', 'Cairo', 30.1, 31.14 ],
    [ 'El Salvador', 'San Salvador', 13.40, -89.10 ],
    [ 'Equatorial Guinea', 'Malabo', 3.45, 8.50 ],
    [ 'Eritrea', 'Asmara', 15.19, 38.55 ],
    [ 'Estonia', 'Tallinn', 59.22, 24.48 ],
    [ 'Ethiopia', 'Addis Ababa', 9.2, 38.42 ],
    [ 'Falkland Islands (Malvinas)', 'Stanley', -51.40, -59.51 ],
    [ 'Faroe Islands', 'Torshavn', 62.5, -6.56 ],
    [ 'Fiji', 'Suva', -18.6, 178.30 ],
    [ 'Finland', 'Helsinki', 60.15, 25.3 ],
    [ 'France', 'Paris', 48.50, 2.20 ],
    [ 'French Guiana', 'Cayenne', 5.5, -52.18 ],
    [ 'French Polynesia', 'Papeete', -17.32, -149.34 ],
    [ 'Gabon', 'Libreville', 0.25, 9.26 ],
    [ 'Gambia', 'Banjul', 13.28, -16.40 ],
    [ 'Georgia', 'T\'bilisi', 41.43, 44.50 ],
    [ 'Germany', 'Berlin', 52.30, 13.25 ],
    [ 'Ghana', 'Accra', 5.35, -0.6 ],
    [ 'Greece', 'Athens', 37.58, 23.46 ],
    [ 'Greenland', 'Nuuk', 64.10, -51.35 ],
    [ 'Guadeloupe', 'Basse-Terre', 16.0, -61.44 ],
    [ 'Guatemala', 'Guatemala', 14.40, -90.22 ],
    [ 'Guernsey', 'St. Peter Port', 49.26, -2.33 ],
    [ 'Guinea', 'Conakry', 9.29, -13.49 ],
    [ 'Guinea-Bissau', 'Bissau', 11.45, -15.45 ],
    [ 'Guyana', 'Georgetown', 6.50, -58.12 ],
    [ 'Haiti', 'Port-au-Prince', 18.40, -72.20 ],
    [ 'Heard Island and McDonald Islands', ' ', -53.0, 74.0 ],
    [ 'Honduras', 'Tegucigalpa', 14.5, -87.14 ],
    [ 'Hungary', 'Budapest', 47.29, 19.5 ],
    [ 'Iceland', 'Reykjavik', 64.10, -21.57 ],
    [ 'India', 'New Delhi', 28.37, 77.13 ],
    [ 'Indonesia', 'Jakarta', -6.9, 106.49 ],
    [ 'Iran (Islamic Republic of)', 'Tehran', 35.44, 51.30 ],
    [ 'Iraq', 'Baghdad', 33.20, 44.30 ],
    [ 'Ireland', 'Dublin', 53.21, -6.15 ],
    [ 'Israel', 'Jerusalem', 31.71, -35.10 ],
    [ 'Italy', 'Rome', 41.54, 12.29 ],
    [ 'Jamaica', 'Kingston', 18.0, -76.50 ],
    [ 'Jordan', 'Amman', 31.57, 35.52 ],
    [ 'Kazakhstan', 'Astana', 51.10, 71.30 ],
    [ 'Kenya', 'Nairobi', -1.17, 36.48 ],
    [ 'Kiribati', 'Tarawa', 1.30, 173.0 ],
    [ 'Kuwait', 'Kuwait', 29.30, 48.0 ],
    [ 'Kyrgyzstan', 'Bishkek', 42.54, 74.46 ],
    [ 'Lao People\'s Democratic Republic', 'Vientiane', 17.58, 102.36 ],
    [ 'Latvia', 'Riga', 56.53, 24.8 ],
    [ 'Lebanon', 'Beirut', 33.53, 35.31 ],
    [ 'Lesotho', 'Maseru', -29.18, 27.30 ],
    [ 'Liberia', 'Monrovia', 6.18, -10.47 ],
    [ 'Libyan Arab Jamahiriya', 'Tripoli', 32.49, 13.7 ],
    [ 'Liechtenstein', 'Vaduz', 47.8, 9.31 ],
    [ 'Lithuania', 'Vilnius', 54.38, 25.19 ],
    [ 'Luxembourg', 'Luxembourg', 49.37, 6.9 ],
    [ 'Macao, China', 'Macau', 22.12, 113.33 ],
    [ 'Madagascar', 'Antananarivo', -18.55, 47.31 ],
    [ 'Malawi', 'Lilongwe', -14.0, 33.48 ],
    [ 'Malaysia', 'Kuala Lumpur', 3.9, 101.41 ],
    [ 'Maldives', 'Male', 4.0, 73.28 ],
    [ 'Mali', 'Bamako', 12.34, -7.55 ],
    [ 'Malta', 'Valletta', 35.54, 14.31 ],
    [ 'Martinique', 'Fort-de-France', 14.36, -61.2 ],
    [ 'Mauritania', 'Nouakchott', -20.10, 57.30 ],
    [ 'Mayotte', 'Mamoudzou', -12.48, 45.14 ],
    [ 'Mexico', 'Mexico', 19.20, -99.10 ],
    [ 'Micronesia (Federated States of)', 'Palikir', 6.55, 158.9 ],
    [ 'Moldova, Republic of', 'Chisinau', 47.2, 28.50 ],
    [ 'Mozambique', 'Maputo', -25.58, 32.32 ],
    [ 'Myanmar', 'Yangon', 16.45, 96.20 ],
    [ 'Namibia', 'Windhoek', -22.35, 17.4 ],
    [ 'Nepal', 'Kathmandu', 27.45, 85.20 ],
    [ 'Netherlands', 'Amsterdam/The Hague (seat of Gvnt)', 52.23, 4.54 ],
    [ 'Netherlands Antilles', 'Willemstad', 12.5, -69.0 ],
    [ 'New Caledonia', 'Noumea', -22.17, 166.30 ],
    [ 'New Zealand', 'Wellington', -41.19, 174.46 ],
    [ 'Nicaragua', 'Managua', 12.6, -86.20 ],
    [ 'Niger', 'Niamey', 13.27, 2.6 ],
    [ 'Nigeria', 'Abuja', 9.5, 7.32 ],
    [ 'Norfolk Island', 'Kingston', -45.20, 168.43 ],
    [ 'Northern Mariana Islands', 'Saipan', 15.12, 145.45 ],
    [ 'Norway', 'Oslo', 59.55, 10.45 ],
    [ 'Oman', 'Masqat', 23.37, 58.36 ],
    [ 'Pakistan', 'Islamabad', 33.40, 73.10 ],
    [ 'Palau', 'Koror', 7.20, 134.28 ],
    [ 'Panama', 'Panama', 9.0, -79.25 ],
    [ 'Papua New Guinea', 'Port Moresby', -9.24, 147.8 ],
    [ 'Paraguay', 'Asuncion', -25.10, -57.30 ],
    [ 'Peru', 'Lima', -12.0, -77.0 ],
    [ 'Philippines', 'Manila', 14.40, 121.3 ],
    [ 'Poland', 'Warsaw', 52.13, 21.0 ],
    [ 'Portugal', 'Lisbon', 38.42, -9.10 ],
    [ 'Puerto Rico', 'San Juan', 18.28, -66.7 ],
    [ 'Qatar', 'Doha', 25.15, 51.35 ],
    [ 'Republic of Korea', 'Seoul', 37.31, 126.58 ],
    [ 'Romania', 'Bucuresti', 44.27, 26.10 ],
    [ 'Russian Federation', 'Moskva', 55.45, 37.35 ],
    [ 'Rawanda', 'Kigali', -1.59, 30.4 ],
    [ 'Saint Kitts and Nevis', 'Basseterre', 17.17, -62.43 ],
    [ 'Saint Lucia', 'Castries', 14.2, -60.58 ],
    [ 'Saint Pierre and Miquelon', 'Saint-Pierre', 46.46, -56.12 ],
    [ 'Saint vincent and the Greenadines', 'Kingstown', 13.10, -61.10 ],
    [ 'Samoa', 'Apia', -13.50, -171.50 ],
    [ 'San Marino', 'San Marino', 43.55, 12.30 ],
    [ 'Sao Tome and Principe', 'Sao Tome', 0.10, 6.39 ],
    [ 'Saudi Arabia', 'Riyadh', 24.41, 46.42 ],
    [ 'Senegal', 'Dakar', 14.34, -17.29 ],
    [ 'Sierra Leone', 'Freetown', 8.30, -13.17 ],
    [ 'Slovakia', 'Bratislava', 48.10, 17.7 ],
    [ 'Slovenia', 'Ljubljana', 46.4, 14.33 ],
    [ 'Solomon Islands', 'Honiara', -9.27, 159.57 ],
    [ 'Somalia', 'Mogadishu', 2.2, 45.25 ],
    [ 'South Africa', 'Pretoria (adm.) / Cap Town (Legislative) / Bloemfontein (Judicial)', -25.44, 28.12 ],
    [ 'Spain', 'Madrid', 40.25, -3.45 ],
    [ 'Sudan', 'Khartoum', 15.31, 32.35 ],
    [ 'Suriname', 'Paramaribo', 5.50, -55.10 ],
    [ 'Swaziland', 'Mbabane (Adm.)', -26.18, 31.6 ],
    [ 'Sweden', 'Stockholm', 59.20, 18.3 ],
    [ 'Switzerland', 'Bern', 46.57, 7.28 ],
    [ 'Syrian Arab Republic', 'Damascus', 33.30, 36.18 ],
    [ 'Tajikistan', 'Dushanbe', 38.33, 68.48 ],
    [ 'Thailand', 'Bangkok', 13.45, 100.35 ],
    [ 'The Former Yugoslav Republic of Macedonia', 'Skopje', 42.1, 21.26 ],
    [ 'Togo', 'Lome', 6.9, 1.20 ],
    [ 'Tonga', 'Nuku\'alofa', -21.10, -174.0 ],
    [ 'Tunisia', 'Tunis', 36.50, 10.11 ],
    [ 'Turkey', 'Ankara', 39.57, 32.54 ],
    [ 'Turkmenistan', 'Ashgabat', 38.0, 57.50 ],
    [ 'Tuvalu', 'Funafuti', -8.31, 179.13 ],
    [ 'Uganda', 'Kampala', 0.20, 32.30 ],
    [ 'Ukraine', 'Kiev (Rus)', 50.30, 30.28 ],
    [ 'United Arab Emirates', 'Abu Dhabi', 24.28, 54.22 ],
    [ 'United Kingdom of Great Britain and Northern Ireland', 'London', 51.36, -0.5 ],
    [ 'United Republic of Tanzania', 'Dodoma', -6.8, 35.45 ],
    [ 'United States of America', 'Washington DC', 39.91, -77.2 ],
    [ 'United States of Virgin Islands', 'Charlotte Amalie', 18.21, -64.56 ],
    [ 'Uruguay', 'Montevideo', -34.50, -56.11 ],
    [ 'Uzbekistan', 'Tashkent', 41.20, 69.10 ],
    [ 'Vanuatu', 'Port-Vila', -17.45, 168.18 ],
    [ 'Venezuela', 'Caracas', 10.30, -66.55 ],
    [ 'Viet Nam', 'Hanoi', 21.5, 105.55 ],
    [ 'Yugoslavia', 'Belgrade', 44.50, 20.37 ],
    [ 'Zambia', 'Lusaka', -15.28, 28.16 ],
    [ 'Zimbabwe', 'Harare', -17.43, 31.2 ]
];

var todo = cities.length;
if (todo > 20) {
    todo = 20;
}

for (var i = 0; i < todo; i++) {
    for (var j = 0; j < todo; j++) {
        var c1 = cities[i];
        var c2 = cities[j];
        var p1 = new LatLong(c1[2], c1[3]);
        var p2 = new LatLong(c2[2], c2[3]);
        var dist = LatLong.distHaversine(p1, p2)

        print(dist * 1000 + ',');
    }
}

