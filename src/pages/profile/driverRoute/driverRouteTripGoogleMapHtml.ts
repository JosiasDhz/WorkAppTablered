import type { TripMapModel } from "./tripMapModelFromAssignment";

export type MapFitPadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export const MAP_STYLES_FOR_EMBED: object[] = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.attraction", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "simplified" }, { lightness: 18 }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
  { featureType: "administrative.neighborhood", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e2e8f0" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
  { featureType: "road.arterial", elementType: "geometry.fill", stylers: [{ color: "#f8fafc" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#f1f5f9" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#cbd5e1" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#eef2f6" }] },
  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#e8edf3" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#dbe4ee" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
];

const NO_KEY_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>html,body,#map{margin:0;height:100%;width:100%;font-family:-apple-system,BlinkMacSystemFont,sans-serif;}
.msg{display:flex;height:100%;align-items:center;justify-content:center;padding:24px;text-align:center;color:#64748b;font-size:14px;line-height:1.45;background:#1e293b;}
</style></head><body><div id="map" class="msg">Define EXPO_PUBLIC_GOOGLE_MAPS_API_KEY para ver el mapa.</div></body></html>`;

const SHELL = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>html,body,#map{margin:0;padding:0;height:100%;width:100%;}</style>
</head>
<body>
<div id="map"></div>
<script>
window.initTripRouteMap=function(){
var G=window.google&&window.google.maps;if(!G)return;
var raw='___PAYLOAD___';
var p={path:[],stops:[]};
try{p=JSON.parse(decodeURIComponent(raw));}catch(e){}
var pathPts=(p.path||[]).map(function(P){return{lat:Number(P.latitude),lng:Number(P.longitude)};});
var center={lat:17.065,lng:-96.72};
if(pathPts.length)center=pathPts[Math.floor(pathPts.length/2)];
var map=new G.Map(document.getElementById("map"),{
center:center,zoom:12,gestureHandling:"greedy",mapTypeControl:false,streetViewControl:false,fullscreenControl:false,zoomControl:false,
styles:___STYLES___
});
if(pathPts.length>=2){
new G.Polyline({
path:pathPts,geodesic:true,strokeColor:"#EA7600",strokeOpacity:1,strokeWeight:5,map:map,
icons:[{icon:{path:G.SymbolPath.FORWARD_CLOSED_ARROW,scale:3.2,fillColor:"#ffffff",fillOpacity:1,strokeColor:"#EA7600",strokeWeight:1.5},offset:"18px",repeat:"92px"}]
});
}else if(pathPts.length===1){
map.setCenter(pathPts[0]);map.setZoom(14);
}
var bounds=new G.LatLngBounds();
pathPts.forEach(function(pt){bounds.extend(pt);});
(p.stops||[]).forEach(function(s){
var pt={lat:Number(s.latitude),lng:Number(s.longitude)};
bounds.extend(pt);
new G.Marker({
position:pt,map:map,
label:{text:String(s.visitOrder),color:"#ffffff",fontSize:"12px",fontWeight:"bold"},
icon:{path:G.SymbolPath.CIRCLE,scale:15,fillColor:s.color||"#EA7600",fillOpacity:1,strokeColor:"#ffffff",strokeWeight:2}
});
});
if(!bounds.isEmpty()){
var pad=p.fit;
if(pad&&typeof pad.top==="number"&&typeof pad.bottom==="number"){
map.fitBounds(bounds,{top:pad.top,right:pad.right||44,bottom:pad.bottom,left:pad.left||16});
}else{map.fitBounds(bounds,48);}
G.event.addListenerOnce(map,"bounds_changed",function(){if(map.getZoom()>15)map.setZoom(15);});
}
else if((p.stops||[]).length){var s0=p.stops[0];map.setCenter({lat:Number(s0.latitude),lng:Number(s0.longitude)});map.setZoom(14);}
else{map.setCenter(center);map.setZoom(11);}
};
</script>
<script async defer src="https://maps.googleapis.com/maps/api/js?key=___API_KEY___&callback=initTripRouteMap"></script>
</body>
</html>`;

export function buildDriverRouteTripGoogleMapHtml(
  apiKey: string,
  model: TripMapModel,
  fitPadding?: MapFitPadding,
): string {
  const key = apiKey.trim();
  if (!key) return NO_KEY_HTML;
  const body: { path: TripMapModel["path"]; stops: TripMapModel["stops"]; fit?: MapFitPadding } = {
    path: model.path,
    stops: model.stops,
  };
  if (fitPadding) body.fit = fitPadding;
  const enc = encodeURIComponent(JSON.stringify(body));
  const styles = JSON.stringify(MAP_STYLES_FOR_EMBED);
  return SHELL.replace("___PAYLOAD___", enc)
    .replace("___STYLES___", styles)
    .replace("___API_KEY___", encodeURIComponent(key));
}
