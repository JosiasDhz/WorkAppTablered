import type { TripMapModel } from "./tripMapModelFromAssignment";
import { MAP_STYLES_FOR_EMBED, type MapFitPadding } from "./driverRouteTripGoogleMapHtml";

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
if(!G||!window.gsap)return;
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
position:pt,map:map,opacity:0,
label:{text:String(s.visitOrder),color:"#ffffff",fontSize:"12px",fontWeight:"bold"},
icon:{path:G.SymbolPath.CIRCLE,scale:15,fillColor:"#10B981",fillOpacity:1,strokeColor:"#ffffff",strokeWeight:2}
});
markers.push(m);
});
var glowLine=null;
var routeLine=null;
if(pathPts.length>=2){
glowLine=new G.Polyline({
path:[pathPts[0]],geodesic:true,strokeColor:"#34D399",strokeOpacity:0.35,strokeWeight:14,map:map
});
routeLine=new G.Polyline({
path:[pathPts[0]],geodesic:true,strokeColor:"#10B981",strokeOpacity:1,strokeWeight:6,map:map,
icons:[{icon:{path:G.SymbolPath.FORWARD_CLOSED_ARROW,scale:3.2,fillColor:"#ffffff",fillOpacity:1,strokeColor:"#10B981",strokeWeight:1.5},offset:"18px",repeat:"92px"}]
});
}else if(pathPts.length===1){
map.setCenter(pathPts[0]);map.setZoom(14);
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
var drawState={idx:1};
var tl=gsap.timeline({
defaults:{ease:"power2.inOut"},
onComplete:function(){
try{
window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:"celebration-map-done"}));
}catch(e){}
}
});
if(routeLine&&pathPts.length>=2){
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
tl.to(glowLine, {strokeOpacity:0.55, duration:0.35, yoyo:true, repeat:1}, "-=0.1");
}
if(originMarker){
tl.to(originMarker, {opacity:1, duration:0.35, ease:"back.out(2)"}, routeLine?"-=0.8":"0");
}
if(markers.length){
tl.to(markers, {
opacity:1,
duration:0.45,
stagger:0.12,
ease:"back.out(2.4)"
}, routeLine?"-=1.1":"0");
}
if(!routeLine){
tl.to({}, {duration:0.6, onComplete:function(){
try{
window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:"celebration-map-done"}));
}catch(e){}
}});
}
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
  const body: {
    path: TripMapModel["path"];
    stops: TripMapModel["stops"];
    origin?: TripMapModel["origin"];
    interactive?: boolean;
    fit?: MapFitPadding;
  } = {
    path: model.path,
    stops: model.stops,
    origin: model.origin,
    interactive: options?.interactive === true,
  };
  if (options?.fitPadding) body.fit = options.fitPadding;
  const enc = encodeURIComponent(JSON.stringify(body));
  const styles = JSON.stringify(MAP_STYLES_FOR_EMBED);
  return SHELL.replace("___PAYLOAD___", enc)
    .replace("___STYLES___", styles)
    .replace("___API_KEY___", encodeURIComponent(key));
}
