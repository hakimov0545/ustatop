export function requestLocation(){
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation)return reject(new Error('Bu brauzer joylashuvni aniqlamaydi.'));
    navigator.geolocation.getCurrentPosition(
      position=>resolve({latitude:position.coords.latitude,longitude:position.coords.longitude}),
      error=>reject(new Error(error.code===1?'Joylashuv ruxsati berilmadi. Sozlamadan ruxsat bering yoki tumanni tanlang.':'Joylashuvni aniqlab bo‘lmadi. Tuman filtri bilan qidiring.')),
      {enableHighAccuracy:true,timeout:10000,maximumAge:60000},
    );
  });
}
