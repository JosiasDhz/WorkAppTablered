import type { TripMapModel } from "./tripMapModelFromAssignment";

export type MapFitPadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type MapFitOptions = {
  zoomBoost?: boolean;
  zoomOut?: number;
  maxZoom?: number;
  panUp?: number;
  panDown?: number;
  animateDraw?: boolean;
};

export const ROUTE_POLYLINE_COLOR = "#EA7600";

export const MAP_STYLES_FOR_EMBED: object[] = [
  {
    featureType: "administrative",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "landscape",
    elementType: "all",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ saturation: "0" }, { lightness: "0" }, { gamma: "1.00" }],
  },
  {
    featureType: "landscape",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi",
    elementType: "all",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ visibility: "off" }, { weight: "1.43" }],
  },
  {
    featureType: "road",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "road.arterial",
    elementType: "labels.text",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "transit",
    elementType: "all",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
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
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
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
var bounds=new G.LatLngBounds();
pathPts.forEach(function(pt){bounds.extend(pt);});
var routeLine=null;
if(pathPts.length>=2){
routeLine=new G.Polyline({
path:p.animateDraw?[pathPts[0]]:pathPts,geodesic:true,strokeColor:"#EA7600",strokeOpacity:1,strokeWeight:5,map:map,
icons:[{icon:{path:G.SymbolPath.FORWARD_CLOSED_ARROW,scale:3.2,fillColor:"#ffffff",fillOpacity:1,strokeColor:"#EA7600",strokeWeight:1.5},offset:"18px",repeat:"92px"}]
});
}else if(pathPts.length===1){
map.setCenter(pathPts[0]);map.setZoom(14);
}
var originMarker=null;
if(p.origin&&typeof p.origin.latitude==="number"&&typeof p.origin.longitude==="number"){
var opt={lat:Number(p.origin.latitude),lng:Number(p.origin.longitude)};
bounds.extend(opt);
originMarker=new G.Marker({
position:opt,map:map,opacity:p.animateDraw?0:1,
icon:{path:G.SymbolPath.CIRCLE,scale:11,fillColor:"#4E6D82",fillOpacity:1,strokeColor:"#ffffff",strokeWeight:3}
});
}
var stopMarkers=[];
(p.stops||[]).forEach(function(s){
var pt={lat:Number(s.latitude),lng:Number(s.longitude)};
bounds.extend(pt);
var m=new G.Marker({
position:pt,map:map,opacity:p.animateDraw?0:1,
label:{text:String(s.visitOrder),color:"#ffffff",fontSize:"12px",fontWeight:"bold"},
icon:{path:G.SymbolPath.CIRCLE,scale:15,fillColor:s.color||"#EA7600",fillOpacity:1,strokeColor:"#ffffff",strokeWeight:2}
});
stopMarkers.push(m);
});
function fitMap(){
if(!bounds.isEmpty()){
var pad=p.fit;
if(pad&&typeof pad.top==="number"&&typeof pad.bottom==="number"){
map.fitBounds(bounds,{top:pad.top,right:pad.right||44,bottom:pad.bottom,left:pad.left||16});
}else{map.fitBounds(bounds,48);}
G.event.addListenerOnce(map,"bounds_changed",function(){
var z=map.getZoom();
var opts=p.fitOpts||{};
var boost=opts.zoomBoost;
var maxZ=typeof opts.maxZoom==="number"?opts.maxZoom:(boost?17:15);
if(boost){
if(z>maxZ)map.setZoom(maxZ);
else try{map.setZoom(Math.min(z+1,maxZ));}catch(e){}
}else if(z>maxZ)map.setZoom(maxZ);
if(typeof opts.zoomOut==="number"&&opts.zoomOut>0){
try{map.setZoom(Math.max(map.getZoom()-opts.zoomOut,4));}catch(e){}
}
if(typeof opts.panUp==="number"&&opts.panUp>0){
try{map.panBy(0,opts.panUp);}catch(e){}
}
if(typeof opts.panDown==="number"&&opts.panDown>0){
try{map.panBy(0,opts.panDown);}catch(e){}
}
});
}
else if((p.stops||[]).length){var s0=p.stops[0];map.setCenter({lat:Number(s0.latitude),lng:Number(s0.longitude)});map.setZoom(14);}
else{map.setCenter(center);map.setZoom(11);}
}
fitMap();
if(p.animateDraw&&routeLine&&pathPts.length>=2&&window.gsap){
var drawState={idx:1};
var tl=gsap.timeline({defaults:{ease:"power2.out"}});
tl.to(drawState,{
idx:pathPts.length,
duration:Math.min(2.4,Math.max(1.2,pathPts.length*0.014)),
onUpdate:function(){
var i=Math.max(2,Math.floor(drawState.idx));
routeLine.setPath(pathPts.slice(0,i));
}
});
if(originMarker)tl.to(originMarker,{opacity:1,duration:0.3,ease:"back.out(2)"},"-=0.7");
if(stopMarkers.length)tl.to(stopMarkers,{opacity:1,duration:0.35,stagger:0.08,ease:"back.out(2)"},"-=0.8");
}
};
</script>
<script async defer src="https://maps.googleapis.com/maps/api/js?key=___API_KEY___&callback=initTripRouteMap"></script>
</body>
</html>`;

export function buildDriverRouteTripGoogleMapHtml(
  apiKey: string,
  model: TripMapModel,
  fitPadding?: MapFitPadding,
  fitOptions?: MapFitOptions,
): string {
  const key = apiKey.trim();
  if (!key) return NO_KEY_HTML;
  const body: {
    path: TripMapModel["path"];
    stops: TripMapModel["stops"];
    origin?: TripMapModel["origin"];
    fit?: MapFitPadding;
    fitOpts?: MapFitOptions;
    animateDraw?: boolean;
  } = {
    path: model.path,
    stops: model.stops,
    origin: model.origin,
  };
  if (fitPadding) body.fit = fitPadding;
  if (fitOptions) {
    body.fitOpts = fitOptions;
    if (fitOptions.animateDraw) body.animateDraw = true;
  }
  const enc = encodeURIComponent(JSON.stringify(body));
  const styles = JSON.stringify(MAP_STYLES_FOR_EMBED);
  return SHELL.replace("___PAYLOAD___", enc)
    .replace("___STYLES___", styles)
    .replace("___API_KEY___", encodeURIComponent(key));
}
