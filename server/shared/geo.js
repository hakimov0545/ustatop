export function distanceKm(fromLat,fromLng,toLat,toLng) {
  const radians=value=>value*Math.PI/180;
  const dLat=radians(toLat-fromLat),dLng=radians(toLng-fromLng);
  const a=Math.sin(dLat/2)**2+Math.cos(radians(fromLat))*Math.cos(radians(toLat))*Math.sin(dLng/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

export function etaMinutes(distance) {
  if(!Number.isFinite(distance))return null;
  return Math.max(10,Math.ceil((distance/22)*60+8));
}
