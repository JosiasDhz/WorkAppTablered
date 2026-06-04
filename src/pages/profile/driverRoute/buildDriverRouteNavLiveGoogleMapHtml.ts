import type { TripMapModel } from "./tripMapModelFromAssignment";
import type { MapFitPadding } from "./driverRouteTripGoogleMapHtml";

const LIVE_NAV_MAP_STYLES: object[] = [
  { featureType: "all", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "labels.text", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi.attraction", stylers: [{ visibility: "off" }] },
  { featureType: "poi.attraction", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi.government", stylers: [{ visibility: "off" }] },
  { featureType: "poi.medical", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", stylers: [{ visibility: "off" }] },
  { featureType: "poi.place_of_worship", stylers: [{ visibility: "off" }] },
  { featureType: "poi.school", stylers: [{ visibility: "off" }] },
  { featureType: "poi.sports_complex", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.locality", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e2e8f0" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#eef2f6" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#dbe4ee" }] },
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
window.__navFollow=true;
window.centerOnDriverLocation(lat,lng,true,(typeof rot==="number"&&isFinite(rot))?rot:null);
if(Gevt&&typeof Gevt.addListenerOnce==="function"){
Gevt.addListenerOnce(window.__navMap,"idle",function(){__navDockPan(window.__navMap);});
}else{__navDockPan(window.__navMap);}
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
var dy=Math.round(h*0.14);
if(dy<56)dy=56;
if(dy>150)dy=150;
map.panBy(0,dy);
}catch(e0){}
}
function __navAttachInteractionListeners(map,G){
var Gevt=G.event;
if(!Gevt||typeof Gevt.addListener!=="function")return;
Gevt.addListener(map,"dragstart",function(){window.__navFollow=false;window.__routeOverviewActive=false;});
}
function __navApplyCleanMapStyles(map,G){
try{if(typeof map.setOptions==="function"){map.setOptions({styles:___STYLES___});}}catch(e0){}
try{
if(G.FeatureType&&typeof map.getFeatureLayer==="function"){
var poi=map.getFeatureLayer(G.FeatureType.POI);
if(poi){poi.style=function(){return{visibility:"OFF"};};}
}
}catch(e1){}
}
function __navApplyFollowCamera(map,pos,head){
var hn=__navNormalizeHeadingDeg(head)||0;
var navTilt=67;
var navZoom=20;
var camCenter=__navAhead(pos.lat,pos.lng,hn,58);
var cam={center:camCenter,zoom:navZoom,tilt:navTilt,heading:hn};
try{
if(typeof map.moveCamera==="function"){map.moveCamera(cam);}
else{map.setCenter(camCenter);map.setZoom(navZoom);map.setTilt(navTilt);map.setHeading(hn);}
}catch(e){
try{map.setCenter(camCenter);map.setZoom(navZoom);map.setTilt(navTilt);map.setHeading(hn);}catch(e2){}
}
if(typeof requestAnimationFrame==="function"){
requestAnimationFrame(function(){
try{
var m=window.__navMap;if(!m||!window.__navFollow)return;
var hh=__navNormalizeHeadingDeg(head)||0;
if(typeof m.moveCamera==="function"){m.moveCamera({center:camCenter,zoom:navZoom,tilt:navTilt,heading:hh});}
else{
if(typeof m.setHeading==="function")m.setHeading(hh);
if(typeof m.setTilt==="function")m.setTilt(navTilt);
}
}catch(e3){}
});
}
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
var bestI=0,bestT=0,bestD=1e18;
for(var i=0;i<pts.length-1;i++){
var a=pts[i],b=pts[i+1];
var al=a.lat,ao=a.lng,bl=b.lat,bo=b.lng;
var abLat=bl-al,abLng=bo-ao;
var apLat=lat-al,apLng=lng-ao;
var ab2=abLat*abLat+abLng*abLng;
var t=ab2<1e-20?0:Math.max(0,Math.min(1,(apLat*abLat+apLng*abLng)/ab2));
var cl=al+t*abLat,co=ao+t*abLng;
var d=(lat-cl)*(lat-cl)+(lng-co)*(lng-co);
if(d<bestD){bestD=d;bestI=i;bestT=t;}
}
var fwd=bestT>0.55&&bestI<pts.length-2?bestI+1:bestI;
var p0=pts[fwd],p1=pts[fwd+1];
if(!p1&&fwd>0){p0=pts[fwd-1];p1=pts[fwd];}
if(!p0||!p1)return null;
return __navBearingDeg(p0.lat,p0.lng,p1.lat,p1.lng);
}
function __navNormalizeHeadingDeg(h){
if(typeof h!=="number"||!isFinite(h))return null;
var x=((h%360)+360)%360;
return x;
}
function __navResolveDriveHeading(lat,lng,posForRoute,rotDeg){
var routeBr=__navBearingAlongRoute(posForRoute.lat,posForRoute.lng,window.__routePathPts);
if(routeBr!=null){
window.__lastDriveHeading=routeBr;
return __navNormalizeHeadingDeg(routeBr)||0;
}
var hasRot=typeof rotDeg==="number"&&isFinite(rotDeg);
var rot=hasRot?Number(rotDeg):null;
var gps=null;
if(rot!=null&&rot>=0&&rot!==-1)gps=__navNormalizeHeadingDeg(rot);
if(gps!=null)window.__lastDriveHeading=gps;
var head=gps;
if(head==null&&window.__lastDriveHeading!=null&&!isNaN(window.__lastDriveHeading)&&window.__lastDriveHeading>=0)
head=__navNormalizeHeadingDeg(window.__lastDriveHeading);
if(head==null)head=0;
return __navNormalizeHeadingDeg(head)||0;
}
function __navBearingOnCurrentSegment(lat,lng,pts){
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
if(!p0||!p1)return null;
return __navBearingDeg(p0.lat,p0.lng,p1.lat,p1.lng);
}
function __navIconRotationDeg(map,iconBearing){
var b=__navNormalizeHeadingDeg(iconBearing);
if(b==null)b=0;
if(!window.__navFollow||window.__routeOverviewActive)return b;
var mapHead=0;
try{if(map&&typeof map.getHeading==="function"){var mh=map.getHeading();if(typeof mh==="number"&&isFinite(mh))mapHead=mh;}}catch(e){}
return __navNormalizeHeadingDeg((b-mapHead+360)%360)||0;
}
function __navDriverSymbols(G,rotDeg){
var head=(typeof rotDeg==="number"&&!isNaN(rotDeg))?Number(rotDeg):0;
return{
ring:{
path:G.SymbolPath.CIRCLE,
fillColor:"#2563EB",
fillOpacity:1,
strokeColor:"#FFFFFF",
strokeWeight:3,
scale:13
},
arrow:{
path:"M 0 -1.7 1.15 1.35 0 0.5 -1.15 1.35 Z",
fillColor:"#FFFFFF",
fillOpacity:1,
strokeColor:"#2563EB",
strokeWeight:0.5,
scale:8.5,
rotation:head
}
};
}
function __navSetDriverMarkers(map,G,pos,driveHead,rotDeg){
var iconBr=__navBearingOnCurrentSegment(pos.lat,pos.lng,window.__routePathPts);
var iconHead=iconBr!=null?iconBr:driveHead;
var iconRot=__navIconRotationDeg(map,iconHead);
var syms=__navDriverSymbols(G,iconRot);
if(!window.__driverRing){
window.__driverRing=new G.Marker({map:map,position:pos,optimized:false,flat:true,icon:syms.ring,zIndex:999});
window.__driverArrow=new G.Marker({map:map,position:pos,optimized:false,flat:true,icon:syms.arrow,zIndex:1000});
}else{
window.__driverRing.setPosition(pos);
window.__driverArrow.setPosition(pos);
window.__driverArrow.setIcon(syms.arrow);
}
}
window.setDriverPose=function(lat,lng,rotDeg){
var G=window.google&&window.google.maps;if(!G||!window.__navMap)return;
var map=window.__navMap;
var posRaw={lat:Number(lat),lng:Number(lng)};
window.__lastDriverPos=posRaw;
var snap=__navSnapToRoutePath(posRaw.lat,posRaw.lng,window.__routePathPts,68);
var pos=snap||posRaw;
var head=__navResolveDriveHeading(posRaw.lat,posRaw.lng,pos,rotDeg);
__navSetDriverMarkers(map,G,pos,head,rotDeg);
if(window.__routeOverviewActive)return;
if(!window.__navFollow){
window.centerOnDriverLocation(lat,lng,true,rotDeg);
return;
}
__navApplyFollowCamera(map,pos,head);
};
window.updateNavigation=function(lat,lng,headingDeg){
var la=Number(lat),ln=Number(lng);
if(!isFinite(la)||!isFinite(ln))return;
var rv=null;
if(headingDeg!==null&&headingDeg!==undefined&&String(headingDeg)!=="null"){var t=Number(headingDeg);if(isFinite(t))rv=t;}
window.setDriverPose(la,ln,rv);
};
window.__setLiveRoutePath=function(rawPts){
var G=window.google&&window.google.maps;if(!G||!window.__navMap)return;
var map=window.__navMap;
var pts=(rawPts||[]).map(function(P){return{lat:Number(P.latitude),lng:Number(P.longitude)};}).filter(function(P){return isFinite(P.lat)&&isFinite(P.lng);});
window.__routePathPts=pts;
if(window.__routePolyline){window.__routePolyline.setMap(null);window.__routePolyline=null;}
if(pts.length>=2){
window.__routePolyline=new G.Polyline({
path:pts,geodesic:true,strokeColor:"#2563EB",strokeOpacity:1,strokeWeight:10,strokeLineCap:"round",strokeLineJoin:"round",map:map,
icons:[{icon:{path:G.SymbolPath.FORWARD_CLOSED_ARROW,scale:3,fillColor:"#ffffff",fillOpacity:1,strokeColor:"#2563EB",strokeWeight:1.2},offset:"18px",repeat:"62px"}]
});
}
var lp=window.__lastDriverPos;
if(lp&&isFinite(lp.lat)&&isFinite(lp.lng)){
if(window.__navFollow&&!window.__routeOverviewActive){
window.setDriverPose(lp.lat,lp.lng,null);
}else if(!window.__navFollow&&!window.__routeOverviewActive){
window.centerOnDriverLocation(lp.lat,lp.lng,true,null);
}
}
};
window.centerOnDriverLocation=function(lat,lng,skipDockPan,rotDeg){
var G=window.google&&window.google.maps;if(!G||!window.__navMap)return;
var map=window.__navMap;
var Gevt=G.event;
var posRaw={lat:Number(lat),lng:Number(lng)};
if(!isFinite(posRaw.lat)||!isFinite(posRaw.lng))return;
var snap=__navSnapToRoutePath(posRaw.lat,posRaw.lng,window.__routePathPts,68);
var pos=snap||posRaw;
window.__lastDriverPos=posRaw;
window.__routeOverviewActive=false;
window.__navFollow=true;
var rot=null;
if(rotDeg!==null&&rotDeg!==undefined&&String(rotDeg)!=="null"){var rv=Number(rotDeg);if(isFinite(rv))rot=rv;}
var head=__navResolveDriveHeading(posRaw.lat,posRaw.lng,pos,rot);
__navSetDriverMarkers(map,G,pos,head,rot);
__navApplyFollowCamera(map,pos,head);
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
var lp=window.__lastDriverPos;
if(lp&&isFinite(lp.lat)&&isFinite(lp.lng))b.extend(lp);
if(b.isEmpty())return;
window.__routeOverviewActive=true;
window.__navFollow=false;
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
var mapId="___MAP_ID___";
var mapOpts={
center:center,zoom:13,gestureHandling:"greedy",disableDefaultUI:true,mapTypeControl:false,streetViewControl:false,fullscreenControl:false,zoomControl:false,clickableIcons:false,
tilt:0,heading:0,mapTypeId:"roadmap",isFractionalZoomEnabled:true
};
if(mapId){mapOpts.mapId=mapId;}
if(G.RenderingType&&G.RenderingType.VECTOR){mapOpts.renderingType=G.RenderingType.VECTOR;}
if(!mapOpts.renderingType&&!mapId){mapOpts.styles=___STYLES___;}
var map=new G.Map(document.getElementById("map"),mapOpts);
__navApplyCleanMapStyles(map,G);
__navAttachInteractionListeners(map,G);
window.__navMap=map;
window.__routePathPts=pathPts.map(function(P){return{lat:P.lat,lng:P.lng};});
window.__routeStops=(p.stops||[]).slice();
window.__navFitPaddingForRoute=p.fit||null;
window.__routePolyline=null;
if(pathPts.length>=2){
window.__routePolyline=new G.Polyline({
path:pathPts,geodesic:true,strokeColor:"#2563EB",strokeOpacity:1,strokeWeight:10,strokeLineCap:"round",strokeLineJoin:"round",map:map,
icons:[{icon:{path:G.SymbolPath.FORWARD_CLOSED_ARROW,scale:3,fillColor:"#ffffff",fillOpacity:1,strokeColor:"#2563EB",strokeWeight:1.2},offset:"18px",repeat:"62px"}]
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
}else if(pathPts.length>=1){
map.setCenter(pathPts[Math.floor(pathPts.length/2)]);
map.setZoom(pathPts.length>=2?15:16);
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
  mapId?: string,
): string {
  const key = apiKey.trim();
  if (!key) return NO_KEY_HTML;
  const body: { path: TripMapModel["path"]; stops: TripMapModel["stops"]; fit?: MapFitPadding } = {
    path: model.path,
    stops: model.stops,
  };
  if (fitPadding) body.fit = fitPadding;
  const enc = encodeURIComponent(JSON.stringify(body));
  const styles = JSON.stringify(LIVE_NAV_MAP_STYLES);
  const cloudMapId = (mapId ?? "").trim();
  return SHELL.replace("___PAYLOAD___", enc)
    .replace("___STYLES___", styles)
    .replace("___MAP_ID___", cloudMapId.replace(/\\/g, "\\\\").replace(/"/g, '\\"'))
    .replace("___API_KEY___", encodeURIComponent(key));
}
