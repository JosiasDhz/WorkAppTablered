import type { TripMapModel } from "./tripMapModelFromAssignment";
import type { MapFitPadding } from "./driverRouteTripGoogleMapHtml";
import { MAP_STYLES_FOR_EMBED } from "./driverRouteTripGoogleMapHtml";

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
window.__navFollow=false;
window.__lastDriveHeading=null;
window.__routeOverviewActive=false;
window.__lastDriverPos=null;
window.__navBootstrapLat=null;
window.__navBootstrapLng=null;
window.__navBootstrapRot=null;
window.__applyNavBootstrapIfReady=function(){
var G=window.google&&window.google.maps;if(!G||!window.__navMap)return;
var Gevt=G.event;
var lat=window.__navBootstrapLat,lng=window.__navBootstrapLng,rot=window.__navBootstrapRot;
if(typeof lat!=="number"||!isFinite(lat)||typeof lng!=="number"||!isFinite(lng))return;
var map=window.__navMap;
window.centerOnDriverLocation(lat,lng,true);
window.setDriverPose(lat,lng,(typeof rot==="number"&&isFinite(rot))?rot:null);
if(Gevt&&typeof Gevt.addListenerOnce==="function"){
Gevt.addListenerOnce(map,"idle",function(){__navDockPan(map);});
}else{__navDockPan(map);}
};
window.__setNavBootstrapPose=function(lat,lng,rotDeg){
var la=Number(lat),ln=Number(lng);
if(!isFinite(la)||!isFinite(ln))return;
var r=null;
if(rotDeg!==null&&rotDeg!==undefined&&String(rotDeg)!=="null"){var rv=Number(rotDeg);if(isFinite(rv))r=rv;}
window.__navBootstrapLat=la;
window.__navBootstrapLng=ln;
window.__navBootstrapRot=r;
window.__applyNavBootstrapIfReady();
};
function __navAhead(lat,lng,headingDeg,meters){
var R=6378137;
var m=typeof meters==="number"&&!isNaN(meters)?meters:110;
var h=(Number(headingDeg)||0)*Math.PI/180;
var d=m;
var lat1=lat*Math.PI/180;
var lng1=lng*Math.PI/180;
var lat2=Math.asin(Math.sin(lat1)*Math.cos(d/R)+Math.cos(lat1)*Math.sin(d/R)*Math.cos(h));
var lng2=lng1+Math.atan2(Math.sin(h)*Math.sin(d/R)*Math.cos(lat1),Math.cos(d/R)-Math.sin(lat1)*Math.sin(lat2));
return{lat:lat2*180/Math.PI,lng:lng2*180/Math.PI};
}
function __navDockPan(map){
try{
var h=window.innerHeight||700;
var dy=Math.round(h*0.12);
if(dy<56)dy=56;
if(dy>150)dy=150;
map.panBy(0,dy);
}catch(e0){}
}
function __navSnapToRoutePath(lat,lng,pts,maxMeters){
if(!pts||pts.length<2||typeof lat!=="number"||typeof lng!=="number"||!isFinite(lat)||!isFinite(lng))return null;
var toRad=Math.PI/180;
var coslat=Math.cos(lat*toRad);
var mLat=111320;
var mLng=111320*coslat;
var bestD=1e18,best=null;
for(var i=0;i<pts.length-1;i++){
var a=pts[i],b=pts[i+1];
var al=a.lat,ao=a.lng,bl=b.lat,bo=b.lng;
var abLat=bl-al,abLng=bo-ao;
var apLat=lat-al,apLng=lng-ao;
var ab2=abLat*abLat+abLng*abLng;
var t=ab2<1e-20?0:Math.max(0,Math.min(1,(apLat*abLat+apLng*abLng)/ab2));
var cl=al+t*abLat,co=ao+t*abLng;
var dLat=(lat-cl)*mLat,dLng=(lng-co)*mLng;
var d=Math.sqrt(dLat*dLat+dLng*dLng);
if(d<bestD){bestD=d;best={lat:cl,lng:co};}
}
if(best&&bestD<=maxMeters)return best;
return null;
}
function __navBearingDeg(lat1,lng1,lat2,lng2){
var φ1=lat1*Math.PI/180,φ2=lat2*Math.PI/180,Δλ=(lng2-lng1)*Math.PI/180;
var y=Math.sin(Δλ)*Math.cos(φ2);
var x=Math.cos(φ1)*Math.sin(φ2)-Math.sin(φ1)*Math.cos(φ2)*Math.cos(Δλ);
var θ=Math.atan2(y,x);
return(θ*180/Math.PI+360)%360;
}
function __navBearingAlongRoute(lat,lng,pts){
if(!pts||pts.length<2||!isFinite(lat)||!isFinite(lng))return null;
var bestI=0,bestD=1e18;
for(var i=0;i<pts.length-1;i++){
var a=pts[i],b=pts[i+1];
var al=a.lat,ao=a.lng,bl=b.lat,bo=b.lng;
var abLat=bl-al,abLng=bo-ao;
var apLat=lat-al,apLng=lng-ao;
var ab2=abLat*abLat+abLng*abLng;
var t=ab2<1e-20?0:Math.max(0,Math.min(1,(apLat*abLat+apLng*abLng)/ab2));
var cl=al+t*abLat,co=ao+t*abLng;
var d=(lat-cl)*(lat-cl)+(lng-co)*(lng-co);
if(d<bestD){bestD=d;bestI=i;}
}
var p0=pts[bestI],p1=pts[bestI+1];
return __navBearingDeg(p0.lat,p0.lng,p1.lat,p1.lng);
}
function __navNormalizeHeadingDeg(h){
if(typeof h!=="number"||!isFinite(h))return null;
var x=((h%360)+360)%360;
return x;
}
function __navResolveDriveHeading(lat,lng,posForRoute,rotDeg){
var hasRot=typeof rotDeg==="number"&&isFinite(rotDeg);
var rot=hasRot?Number(rotDeg):null;
var gps=null;
if(rot!=null&&rot>=0&&rot!==-1)gps=__navNormalizeHeadingDeg(rot);
if(gps!=null)window.__lastDriveHeading=gps;
var head=gps;
if(head==null&&window.__lastDriveHeading!=null&&!isNaN(window.__lastDriveHeading)&&window.__lastDriveHeading>=0)
head=__navNormalizeHeadingDeg(window.__lastDriveHeading);
if(head==null){
var br=__navBearingAlongRoute(posForRoute.lat,posForRoute.lng,window.__routePathPts);
if(br!=null){head=br;window.__lastDriveHeading=head;}
}
if(head==null)head=0;
return __navNormalizeHeadingDeg(head)||0;
}
function __navCarIcon(G,rotDeg){
var r=(typeof rotDeg==="number"&&!isNaN(rotDeg))?Number(rotDeg):0;
var svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 56"><path fill="#1d4ed8" stroke="#f8fafc" stroke-width="2" stroke-linejoin="round" d="M20 8L29 22L30 40L26 48L14 48L10 40L11 22Z"/><rect x="14" y="22" width="12" height="10" rx="2" fill="rgba(255,255,255,0.45)"/></svg>';
return{
url:"data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(svg),
scaledSize:new G.Size(30,42),
anchor:new G.Point(15,37),
rotation:r
};
}
window.setDriverPose=function(lat,lng,rotDeg){
var G=window.google&&window.google.maps;if(!G||!window.__navMap)return;
var map=window.__navMap;
var posRaw={lat:Number(lat),lng:Number(lng)};
window.__lastDriverPos=posRaw;
var snap=__navSnapToRoutePath(posRaw.lat,posRaw.lng,window.__routePathPts,68);
var pos=snap||posRaw;
var head=__navResolveDriveHeading(posRaw.lat,posRaw.lng,pos,rotDeg);
var iconRot=head;
var carIcon=__navCarIcon(G,iconRot);
if(!window.__driverMk){
window.__driverMk=new G.Marker({map:map,position:pos,optimized:false,flat:true,icon:carIcon});
}else{
window.__driverMk.setPosition(pos);
window.__driverMk.setIcon(carIcon);
if(typeof window.__driverMk.setFlat==="function"){window.__driverMk.setFlat(true);}
}
if(window.__routeOverviewActive)return;
if(!window.__navFollow){window.__navFollow=true;}
var camCenter=__navAhead(pos.lat,pos.lng,head,52);
var navTilt=67;
var hn=head;
var cam={center:camCenter,zoom:20,tilt:navTilt,heading:hn};
try{
if(typeof map.moveCamera==="function"){map.moveCamera(cam);}
else{
map.setCenter(camCenter);map.setZoom(20);map.setTilt(navTilt);map.setHeading(hn);
}
}catch(e){
try{map.setCenter(camCenter);map.setZoom(20);map.setTilt(navTilt);map.setHeading(hn);}catch(e2){}
}
try{
if(typeof map.setHeading==="function"){map.setHeading(hn);}
if(typeof map.setTilt==="function"){map.setTilt(navTilt);}
}catch(e3){}
if(typeof requestAnimationFrame==="function"){
requestAnimationFrame(function(){
try{
var m=window.__navMap;if(!m)return;
if(typeof m.setHeading==="function")m.setHeading(hn);
if(typeof m.setTilt==="function")m.setTilt(navTilt);
}catch(e4){}
});
}
};
window.updateNavigation=function(lat,lng,headingDeg){
var la=Number(lat),ln=Number(lng);
if(!isFinite(la)||!isFinite(ln))return;
var rv=null;
if(headingDeg!==null&&headingDeg!==undefined&&String(headingDeg)!=="null"){var t=Number(headingDeg);if(isFinite(t))rv=t;}
window.setDriverPose(la,ln,rv);
};
window.centerOnDriverLocation=function(lat,lng,skipDockPan){
var G=window.google&&window.google.maps;if(!G||!window.__navMap)return;
var map=window.__navMap;
var Gevt=G.event;
var posRaw={lat:Number(lat),lng:Number(lng)};
if(!isFinite(posRaw.lat)||!isFinite(posRaw.lng))return;
var snap=__navSnapToRoutePath(posRaw.lat,posRaw.lng,window.__routePathPts,68);
var pos=snap||posRaw;
window.__lastDriverPos=posRaw;
window.__routeOverviewActive=false;
var head=__navResolveDriveHeading(posRaw.lat,posRaw.lng,pos,null);
var hn=__navNormalizeHeadingDeg(head)||0;
var navTiltCenter=67;
var cam={center:pos,zoom:20,tilt:navTiltCenter,heading:hn};
try{
if(typeof map.moveCamera==="function"){map.moveCamera(cam);}
else{map.setCenter(pos);map.setZoom(20);map.setTilt(navTiltCenter);map.setHeading(hn);}
}catch(e){try{map.setCenter(pos);map.setZoom(20);map.setTilt(navTiltCenter);map.setHeading(hn);}catch(e2){}}
try{
if(typeof map.setHeading==="function"){map.setHeading(hn);}
if(typeof map.setTilt==="function"){map.setTilt(navTiltCenter);}
}catch(e3){}
if(typeof requestAnimationFrame==="function"){
requestAnimationFrame(function(){
try{
var m=window.__navMap;if(!m)return;
if(typeof m.setHeading==="function")m.setHeading(hn);
if(typeof m.setTilt==="function")m.setTilt(navTiltCenter);
}catch(e4){}
});
}
if(!skipDockPan&&Gevt&&typeof Gevt.addListenerOnce==="function"){
Gevt.addListenerOnce(map,"idle",function(){__navDockPan(map);});
}else if(!skipDockPan){__navDockPan(map);}
};
window.fitEntireRouteOnMap=function(){
var G=window.google&&window.google.maps;if(!G||!window.__navMap)return;
var map=window.__navMap;
var pts=window.__routePathPts||[];
var stops=window.__routeStops||[];
var b=new G.LatLngBounds();
pts.forEach(function(pt){b.extend(pt);});
stops.forEach(function(s){
var la=Number(s.latitude),ln=Number(s.longitude);
if(isFinite(la)&&isFinite(ln))b.extend({lat:la,lng:ln});
});
if(b.isEmpty())return;
window.__routeOverviewActive=true;
var pad=window.__navFitPaddingForRoute;
var Gevt=G.event;
try{
if(pad&&typeof pad.top==="number"){map.fitBounds(b,{top:pad.top,right:pad.right,bottom:pad.bottom,left:pad.left});}
else{map.fitBounds(b,{top:162,right:34,bottom:340,left:34});}
map.setTilt(0);map.setHeading(0);
if(Gevt&&typeof Gevt.addListenerOnce==="function"){
Gevt.addListenerOnce(map,"idle",function(){
var z=map.getZoom();
if(typeof z==="number"&&isFinite(z)&&z>=10&&z<=16){
try{map.setZoom(Math.min(z+1,17));}catch(e3){}
}
});
}
}catch(e){}
};
window.initLiveNavMap=function(){
var G=window.google&&window.google.maps;if(!G)return;
window.__navFollow=false;
window.__routeOverviewActive=false;
var raw='___PAYLOAD___';
var p={path:[],stops:[]};
try{p=JSON.parse(decodeURIComponent(raw));}catch(e){}
var pathPts=(p.path||[]).map(function(P){return{lat:Number(P.latitude),lng:Number(P.longitude)};});
var center={lat:17.065,lng:-96.72};
if(pathPts.length)center=pathPts[Math.floor(pathPts.length/2)];
var mapOpts={
center:center,zoom:13,gestureHandling:"greedy",disableDefaultUI:true,mapTypeControl:false,streetViewControl:false,fullscreenControl:false,zoomControl:false,
tilt:0,heading:0,mapTypeId:"roadmap",
styles:___STYLES___
};
if(G.RenderingType&&G.RenderingType.VECTOR){mapOpts.renderingType=G.RenderingType.VECTOR;}
else{mapOpts.renderingType="VECTOR";}
var mid=___MAP_ID_JSON___;
if(typeof mid==="string"&&mid.length>0){mapOpts.mapId=mid;}
var map=new G.Map(document.getElementById("map"),mapOpts);
window.__navMap=map;
window.__routePathPts=pathPts.map(function(P){return{lat:P.lat,lng:P.lng};});
window.__routeStops=(p.stops||[]).slice();
window.__navFitPaddingForRoute=p.fit||null;
if(pathPts.length>=2){
new G.Polyline({
path:pathPts,geodesic:true,strokeColor:"#16a34a",strokeOpacity:1,strokeWeight:16,strokeLineCap:"round",strokeLineJoin:"round",map:map,
icons:[{icon:{path:G.SymbolPath.FORWARD_CLOSED_ARROW,scale:4,fillColor:"#ffffff",fillOpacity:1,strokeColor:"#16a34a",strokeWeight:1.6},offset:"24px",repeat:"78px"}]
});
}else if(pathPts.length===1){
map.setCenter(pathPts[0]);map.setZoom(15);
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
var padInit=p.fit;
var bootLat=window.__navBootstrapLat,bootLng=window.__navBootstrapLng;
var hasBoot=typeof bootLat==="number"&&isFinite(bootLat)&&typeof bootLng==="number"&&isFinite(bootLng);
if(hasBoot){
window.__applyNavBootstrapIfReady();
}else{
try{
if(padInit&&typeof padInit.top==="number"){map.fitBounds(bounds,{top:padInit.top,right:padInit.right,bottom:padInit.bottom,left:padInit.left});}
else{map.fitBounds(bounds,{top:162,right:34,bottom:340,left:34});}
}catch(e2){
var c=bounds.getCenter();
var ne=bounds.getNorthEast();
var sw=bounds.getSouthWest();
var latSpan=Math.abs(ne.lat()-sw.lat());
var lngSpan=Math.abs(ne.lng()-sw.lng());
var span=Math.max(latSpan,lngSpan);
var z=13;
if(span>0.55)z=11;
else if(span>0.22)z=12;
else if(span>0.08)z=13;
else z=14;
map.setCenter(c);
map.setZoom(z);
}
}
}else if((p.stops||[]).length){var s0=p.stops[0];map.setCenter({lat:Number(s0.latitude),lng:Number(s0.longitude)});map.setZoom(15);}
};
</script>
<script async defer src="https://maps.googleapis.com/maps/api/js?v=weekly&key=___API_KEY___&callback=initLiveNavMap"></script>
</body>
</html>`;

export function buildDriverRouteNavLiveGoogleMapHtml(
  apiKey: string,
  model: TripMapModel,
  fitPadding?: MapFitPadding,
  mapId?: string | null,
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
  const TABLE_RED_VECTOR_MAP_ID = "e1de796ceeb39e97dfe80867";
  const midRaw = mapId != null ? String(mapId).trim() : "";
  const mapIdJson = JSON.stringify(midRaw.length > 0 ? midRaw : TABLE_RED_VECTOR_MAP_ID);
  return SHELL.replace("___PAYLOAD___", enc)
    .replace("___STYLES___", styles)
    .replace("___MAP_ID_JSON___", mapIdJson)
    .replace("___API_KEY___", encodeURIComponent(key));
}
