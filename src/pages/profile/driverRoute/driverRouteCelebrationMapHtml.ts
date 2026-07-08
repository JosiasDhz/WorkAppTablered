import type { TripMapModel } from "./tripMapModelFromAssignment";
import { MAP_STYLES_FOR_EMBED, type MapFitPadding } from "./driverRouteTripGoogleMapHtml";
import {
  DRIVER_ROUTE_PIN_ANCHOR,
  DRIVER_ROUTE_PIN_ICON_SIZE,
} from "./driverRouteMapPinIcon";

export type DriverRouteCelebrationMapOptions = {
  interactive?: boolean;
  fitPadding?: MapFitPadding;
};

const NO_KEY_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>html,body,#map{margin:0;height:100%;width:100%;font-family:-apple-system,BlinkMacSystemFont,sans-serif;}
.msg{display:flex;height:100%;align-items:center;justify-content:center;padding:24px;text-align:center;color:#64748b;font-size:14px;line-height:1.45;background:#0f172a;}
</style></head><body><div id="map" class="msg">Define EXPO_PUBLIC_GOOGLE_MAPS_API_KEY para ver el mapa.</div></body></html>`;

const SHELL = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
html,body,#map{margin:0;padding:0;height:100%;width:100%;background:#0f172a;}
</style>
</head>
<body>
<div id="map"></div>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script>
window.initCelebrationRouteMap=function(){
var G=window.google&&window.google.maps;
if(!G)return;
var raw='___PAYLOAD___';
var p={path:[],stops:[]};
try{p=JSON.parse(decodeURIComponent(raw));}catch(e){}
var pathPts=(p.path||[]).map(function(P){return{lat:Number(P.latitude),lng:Number(P.longitude)};});
var center={lat:17.065,lng:-96.72};
if(pathPts.length)center=pathPts[Math.floor(pathPts.length/2)];
var map=new G.Map(document.getElementById("map"),{
center:center,zoom:12,gestureHandling:p.interactive?"greedy":"none",disableDefaultUI:true,mapTypeControl:false,streetViewControl:false,fullscreenControl:false,zoomControl:false,
styles:___STYLES___
});
var bounds=new G.LatLngBounds();
pathPts.forEach(function(pt){bounds.extend(pt);});
var markers=[];
var originMarker=null;
function pinIconUrl(color,num){
var c=color||"#10B981";
var svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z" fill="'+c+'" stroke="#ffffff" stroke-width="1.2"/><circle cx="12" cy="9" r="4.8" fill="#ffffff"/><text x="12" y="10.6" text-anchor="middle" font-family="Arial,sans-serif" font-size="6.2" font-weight="700" fill="'+c+'">'+num+'</text></svg>';
return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
}
if(p.origin&&typeof p.origin.latitude==="number"&&typeof p.origin.longitude==="number"){
var opt={lat:Number(p.origin.latitude),lng:Number(p.origin.longitude)};
bounds.extend(opt);
originMarker=new G.Marker({
position:opt,map:map,opacity:0,
icon:{path:G.SymbolPath.CIRCLE,scale:11,fillColor:"#4E6D82",fillOpacity:1,strokeColor:"#ffffff",strokeWeight:3}
});
}
(p.stops||[]).forEach(function(s){
var pt={lat:Number(s.latitude),lng:Number(s.longitude)};
bounds.extend(pt);
var m=new G.Marker({
position:pt,map:map,opacity:1,
icon:{url:pinIconUrl(s.color,String(s.visitOrder)),scaledSize:new G.Size(___PIN_SIZE___,___PIN_SIZE___),anchor:new G.Point(___PIN_ANCHOR_X___,___PIN_ANCHOR_Y___)}
});
markers.push(m);
});
function revealMarkersFallback(){
setTimeout(function(){
if(originMarker&&originMarker.getOpacity&&originMarker.getOpacity()<1)originMarker.setOpacity(1);
markers.forEach(function(m){if(m.getOpacity&&m.getOpacity()<1)m.setOpacity(1);});
},3200);
}
var glowLine=null;
var routeLine=null;
if(pathPts.length>=2){
glowLine=new G.Polyline({
path:pathPts,geodesic:true,strokeColor:"#34D399",strokeOpacity:0.35,strokeWeight:14,map:map
});
routeLine=new G.Polyline({
path:pathPts,geodesic:true,strokeColor:"#10B981",strokeOpacity:1,strokeWeight:6,map:map,
icons:[{icon:{path:G.SymbolPath.FORWARD_CLOSED_ARROW,scale:3.2,fillColor:"#ffffff",fillOpacity:1,strokeColor:"#10B981",strokeWeight:1.5},offset:"18px",repeat:"92px"}]
});
}else if(pathPts.length===1){
map.setCenter(pathPts[0]);map.setZoom(14);
}
function revealRouteFallback(){
setTimeout(function(){
if(routeLine&&pathPts.length>=2)routeLine.setPath(pathPts);
if(glowLine&&pathPts.length>=2)glowLine.setPath(pathPts);
},3200);
}
function fitMap(){
if(!bounds.isEmpty()){
var pad=p.fit;
if(pad&&typeof pad.top==="number"&&typeof pad.bottom==="number"){
map.fitBounds(bounds,{top:pad.top,right:pad.right||24,bottom:pad.bottom,left:pad.left||24});
}else{
map.fitBounds(bounds,{top:72,right:24,bottom:280,left:24});
}
G.event.addListenerOnce(map,"bounds_changed",function(){
var z=map.getZoom();
if(z>15)map.setZoom(15);
});
}else if((p.stops||[]).length){
var s0=p.stops[0];
map.setCenter({lat:Number(s0.latitude),lng:Number(s0.longitude)});
map.setZoom(14);
}else{
map.setCenter(center);map.setZoom(11);
}
}
fitMap();
if(window.gsap&&routeLine&&pathPts.length>=2){
var drawState={idx:1};
routeLine.setPath([pathPts[0]]);
if(glowLine)glowLine.setPath([pathPts[0]]);
var tl=gsap.timeline({
defaults:{ease:"power2.inOut"},
onComplete:function(){
try{
window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:"celebration-map-done"}));
}catch(e){}
}
});
tl.to(drawState,{
idx:pathPts.length,
duration:Math.min(3.2,Math.max(1.6,pathPts.length*0.018)),
ease:"power2.out",
onUpdate:function(){
var i=Math.max(2,Math.floor(drawState.idx));
var slice=pathPts.slice(0,i);
routeLine.setPath(slice);
if(glowLine)glowLine.setPath(slice);
}
});
tl.to({}, {duration:0.15});
if(glowLine)tl.to(glowLine, {strokeOpacity:0.55, duration:0.35, yoyo:true, repeat:1}, "-=0.1");
}
if(originMarker)originMarker.setOpacity(1);
revealMarkersFallback();
revealRouteFallback();
};
</script>
<script async defer src="https://maps.googleapis.com/maps/api/js?key=___API_KEY___&callback=initCelebrationRouteMap"></script>
</body>
</html>`;

export function buildDriverRouteCelebrationMapHtml(
  apiKey: string,
  model: TripMapModel,
  options?: DriverRouteCelebrationMapOptions,
): string {
  const key = apiKey.trim();
  if (!key) return NO_KEY_HTML;
  const stops = model.stops.map((stop) => ({
    latitude: stop.latitude,
    longitude: stop.longitude,
    color: stop.color,
    visitOrder: stop.visitOrder,
  }));
  const body: {
    path: TripMapModel["path"];
    stops: typeof stops;
    origin?: TripMapModel["origin"];
    interactive?: boolean;
    fit?: MapFitPadding;
  } = {
    path: model.path,
    stops,
    origin: model.origin,
    interactive: options?.interactive === true,
  };
  if (options?.fitPadding) body.fit = options.fitPadding;
  const enc = encodeURIComponent(JSON.stringify(body));
  const styles = JSON.stringify(MAP_STYLES_FOR_EMBED);
  return SHELL.replace("___PAYLOAD___", enc)
    .replace("___STYLES___", styles)
    .replace("___PIN_SIZE___", String(DRIVER_ROUTE_PIN_ICON_SIZE))
    .replace("___PIN_ANCHOR_X___", String(DRIVER_ROUTE_PIN_ANCHOR.x))
    .replace("___PIN_ANCHOR_Y___", String(DRIVER_ROUTE_PIN_ANCHOR.y))
    .replace("___API_KEY___", encodeURIComponent(key));
}
