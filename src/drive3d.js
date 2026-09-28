import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

const stage = document.getElementById('heroStage');
const host = document.getElementById('drive3d');
const glassScreen = document.getElementById('windshieldScreen');
const status = document.getElementById('dreamerStatus');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const replay = document.getElementById('replayDrive');
const explore = document.getElementById('resetDreamer');
const enter = document.getElementById('enterWindshield');
const wiperToggle = document.getElementById('toggleWipers');
const duration = 17;
let renderer, ready = false, playing = false, visible = false, elapsed = 0, last = 0;
let introSkipped = false, notified = false, lastProgress = -1, titleSource, titleCanvas, titleContext, titleMap, lastTitleProgress = -1;
let car, titlePlane, shadow, environment, loadedScene;
const wheels = [], headlights = [], cones = [], lightPools = [], mist = [];
const wipers = [];
let wipersEnabled = true, motionTime = 0, logoImage;
const pointer = new THREE.Vector2(0, 0);
const smoothPointer = new THREE.Vector2();
const scene = new THREE.Scene();
scene.background = new THREE.Color('#242133');
scene.fog = new THREE.FogExp2('#242133', .045);
const camera = new THREE.PerspectiveCamera(43, 1, .025, 120);
const lerp = THREE.MathUtils.lerp;
const clamp = THREE.MathUtils.clamp;
const smooth = (a,b,x) => THREE.MathUtils.smoothstep(x,a,b);

function setScreen(amount) {
  const shown = amount > .97;
  glassScreen.style.setProperty('--glass-opacity', amount);
  glassScreen.style.setProperty('--glass-scale', 1 + (1-amount) * .07);
  glassScreen.inert = !shown;
  glassScreen.setAttribute('aria-hidden', String(!shown));
  stage.classList.toggle('inside-windshield', shown);
  stage.classList.toggle('title-revealing', elapsed>=12.4 || introSkipped || reduced.matches);
  stage.dataset.phase = shown ? 'windshield' : elapsed > 7 ? 'close-up' : elapsed > 4 ? 'headlights' : 'driving';
}

function fail(error) {
  console.warn('3D scene unavailable; showing accessible event title.', error?.message || error);
  renderer?.setAnimationLoop(null);
  stage.classList.add('drive-fallback');
  status.textContent = 'STATIC VIEW · 3D UNAVAILABLE';
  setScreen(1);
  replay.disabled = true; explore.disabled = true; enter.disabled = true;
  wiperToggle.disabled = true;
  document.dispatchEvent(new CustomEvent('cloud:intro-failed'));
}

function labelTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,1024,512);
  // Preserve the supplied artwork and its alpha channel: no rectangular backing.
  const height=440, width=height*logoImage.naturalWidth/logoImage.naturalHeight;
  ctx.drawImage(logoImage,(1024-width)/2,(512-height)/2,width,height);
  titleSource=canvas;
  titleCanvas=document.createElement('canvas');titleCanvas.width=1024;titleCanvas.height=512;titleContext=titleCanvas.getContext('2d');
  titleMap=new THREE.CanvasTexture(titleCanvas);titleMap.colorSpace=THREE.SRGBColorSpace;return titleMap;
}

function makeWipers() {
  // A local frame on the sloping windshield keeps both blades against the glass.
  const frame=new THREE.Group();
  frame.position.copy(titlePlane.position);frame.rotation.copy(titlePlane.rotation);
  const metal=new THREE.MeshStandardMaterial({color:'#60777a',metalness:.85,roughness:.3});
  const rubber=new THREE.MeshStandardMaterial({color:'#10121d',roughness:.78});
  for(const x of [-.43,.18]) {
    const pivot=new THREE.Group();pivot.position.set(x,-.25,.018);
    const axle=new THREE.Mesh(new THREE.CylinderGeometry(.027,.027,.024,12),metal);
    axle.rotation.x=Math.PI/2;pivot.add(axle);
    const arm=new THREE.Mesh(new THREE.BoxGeometry(.015,.30,.018),metal);arm.position.y=.15;pivot.add(arm);
    const blade=new THREE.Mesh(new THREE.BoxGeometry(.025,.31,.026),rubber);blade.position.set(0,.32,.014);pivot.add(blade);
    const spine=new THREE.Mesh(new THREE.BoxGeometry(.008,.29,.006),metal);spine.position.set(0,.32,.03);pivot.add(spine);
    frame.add(pivot);wipers.push(pivot);
  }
  car.add(frame);
}

function paintTitle(progress) {
  if(Math.abs(progress-lastTitleProgress)<.012)return;
  lastTitleProgress=progress;
  titleContext.clearRect(0,0,1024,512);
  titleContext.save();titleContext.beginPath();titleContext.rect(0,0,1024*progress,512);titleContext.clip();titleContext.drawImage(titleSource,0,0);titleContext.restore();
  if(progress>0&&progress<1){titleContext.fillStyle='rgba(110,231,255,.35)';titleContext.fillRect(1024*progress-3,90,3,330);}
  titleMap.needsUpdate=true;
}

function makeHeadlights() {
  const glowMap=softTexture();
  for (const x of [-.73,.73]) {
    const light = new THREE.SpotLight('#b0f1ff', 10, 24, .22, .8, 1.2);
    light.position.set(x,.57,-1.93);
    const target = new THREE.Object3D(); target.position.set(x, .04, -9);
    car.add(light,target); light.target=target; headlights.push(light);
    const material = new THREE.MeshBasicMaterial({color:'#6ee7ff',transparent:true,opacity:.025,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
    const beam = new THREE.Mesh(new THREE.ConeGeometry(.95,6,24,1,true), material);
    beam.geometry.translate(0,-3,0); beam.geometry.rotateX(-Math.PI/2);
    beam.position.copy(light.position); car.add(beam); cones.push(beam);
    const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowMap,color:'#6ee7ff',transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false}));
    glow.position.set(Math.sign(x)*.8,.65,-1.77);glow.scale.set(.24,.24,1);car.add(glow);
    const pool=new THREE.Mesh(new THREE.PlaneGeometry(2.5,5),new THREE.MeshBasicMaterial({map:glowMap,color:'#6ee7ff',transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false}));
    pool.rotation.x=-Math.PI/2;car.add(pool);lightPools.push(pool);
  }
}

function softTexture() {
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
  const ctx=canvas.getContext('2d'), gradient=ctx.createRadialGradient(128,128,6,128,128,128);
  gradient.addColorStop(0,'rgba(255,255,255,1)');gradient.addColorStop(.35,'rgba(255,255,255,.5)');gradient.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,256,256);return new THREE.CanvasTexture(canvas);
}

function buildWorld() {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment(); environment = pmrem.fromScene(room,.04); scene.environment=environment.texture;
  room.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#d1c9ff','#242133',1.4));
  const key = new THREE.DirectionalLight('#fff5e7',2.2); key.position.set(3,7,-4); key.castShadow=true;
  key.shadow.mapSize.set(1024,1024); key.shadow.camera.left=-5; key.shadow.camera.right=5; key.shadow.camera.top=5; key.shadow.camera.bottom=-5; key.shadow.bias=-.001; scene.add(key);
  const edge = new THREE.DirectionalLight('#6ee7ff',2.2); edge.position.set(-5,2,3); scene.add(edge);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(160,160),new THREE.MeshBasicMaterial({color:'#211e31'}));
  floor.rotation.x=-Math.PI/2; floor.position.y=-.02; floor.receiveShadow=true; scene.add(floor);
  const grid = new THREE.GridHelper(150,150,'#554b81','#383348'); grid.position.y=.001; grid.material.transparent=true; grid.material.opacity=.32; scene.add(grid); scene.userData.grid=grid;
  const soft=softTexture();
  shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.5,6),new THREE.MeshBasicMaterial({map:soft,color:'#080912',transparent:true,opacity:.8,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2; shadow.position.y=.002; scene.add(shadow);
  for(let i=0;i<30;i++) {
    const puff=new THREE.Sprite(new THREE.SpriteMaterial({map:soft,color:i%3?'#756aa7':'#60777a',transparent:true,opacity:.25,depthWrite:false}));
    const side=i%2?1:-1;
    puff.position.set(side*(1.7+(i%5)*.7),.35+(i%4)*.6,2+(i%10)*1.6);
    puff.scale.set(4+(i%3),2.5+(i%4)*.3,1);puff.userData.base=puff.position.clone();scene.add(puff);mist.push(puff);
  }
}

function start(at=0) {
  if (!ready) return;
  elapsed = reduced.matches || introSkipped ? duration : at; playing=elapsed<duration; last=0;notified=false;lastProgress=-1;
  setScreen(reduced.matches ? 1 : 0);
  stage.classList.toggle('sequence-active',playing);
  renderer.setAnimationLoop(renderFrame);
  renderFrame(performance.now());
}

function resize() {
  if (!renderer) return;
  camera.aspect=stage.clientWidth/stage.clientHeight; camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<760?1.35:1.8));
  renderer.setSize(stage.clientWidth,stage.clientHeight,false);
  if (ready) renderFrame(performance.now());
}

function renderFrame(now) {
  const dt=last?Math.min((now-last)/1000,.05):0; last=now;
  if (!ready || !visible || document.hidden) return;
  if (playing) elapsed=Math.min(duration,elapsed+dt);
  motionTime+=dt;
  const approach=smooth(0,5,elapsed), orbit=smooth(5,7.5,elapsed), push=smooth(7.5,12.5,elapsed);
  const distance=lerp(15,0,approach);
  car.position.set(0,Math.sin(elapsed*17)*.008*(1-approach),distance);
  car.rotation.z=Math.sin(elapsed*3)*.004*(1-approach);
  wheels.forEach(wheel=>{wheel.rotation.x=(15-distance)/.355;});
  shadow.position.z=distance;
  scene.userData.grid.position.z=(distance*.8)%1;
  // Ease from a three-quarter driving shot to a straight-on windshield approach.
  const mobile=camera.aspect<.8;
  const initialDistance=mobile?8.8:4.8;
  camera.position.set(lerp(lerp(2.6,0,orbit),0,push),lerp(1.5,1.05,push),lerp(-initialDistance,-.81,push));
  camera.lookAt(0,lerp(.6,1.035,push),lerp(.2,-.4,push));
  camera.fov=lerp(43,50,push); camera.updateProjectionMatrix();
  smoothPointer.lerp(pointer,1-Math.exp(-dt*10));
  headlights.forEach((light,i)=>{
    light.target.position.set(smoothPointer.x*5+(i? .2:-.2),.05+Math.max(0,smoothPointer.y)*2,-8-smoothPointer.y*2);
    cones[i].lookAt(car.localToWorld(light.target.position.clone()));
    lightPools[i].position.set(smoothPointer.x*3+(i?.6:-.6),.012,-4.5-smoothPointer.y*2);
  });
  titlePlane.material.opacity=smooth(4.8,6,elapsed);
  paintTitle(!playing&&elapsed<duration?1:smooth(5,8.7,elapsed));
  const wipe=wipersEnabled&&!reduced.matches?(1-Math.cos(motionTime*Math.PI*1.15))/2:0;
  wipers.forEach(pivot=>{pivot.rotation.z=lerp(-1.15,.22,wipe);});
  stage.dataset.wipers=wipersEnabled&&!reduced.matches?'running':'parked';
  mist.forEach((puff,i)=>{
    const base=puff.userData.base;
    puff.position.x=base.x+Math.sign(base.x)*approach*.7+Math.sin(elapsed*.35+i)*.25;
    puff.position.z=base.z-approach*3;
    puff.material.opacity=.26*(1-push*.8);
  });
  const takeover=smooth(11.7,13,elapsed);
  setScreen(takeover);
  stage.style.setProperty('--cloud-shift',`${approach*55}%`);
  stage.style.setProperty('--mist-opacity',lerp(.8,.16,approach));
  const phaseLabel=elapsed>=13?'HACK THE CLOUD / ONLINE':elapsed>7.5?'ENTERING WINDSHIELD':elapsed>5?'HEADLIGHTS ACTIVE':'CLOUD DRIVE / APPROACH';
  if(status.textContent!==phaseLabel) status.textContent=phaseLabel;
  stage.dataset.progress=elapsed.toFixed(2);
  const progress=Math.floor(elapsed/duration*100);
  if(progress!==lastProgress){lastProgress=progress;document.dispatchEvent(new CustomEvent('cloud:intro-progress',{detail:{progress:elapsed/duration,label:elapsed>=13?'Revealing Hack the Cloud':elapsed>7.5?'Opening the windshield':elapsed>5?'Synchronizing the headlights':'Driving through the clouds'}}));}
  renderer.render(scene,camera);
  if (elapsed>=duration) {playing=false;stage.classList.remove('sequence-active');renderer.setAnimationLoop(null);if(!notified){notified=true;document.dispatchEvent(new CustomEvent('cloud:intro-complete'));}}
}

function move(event) {
  if (event.target.closest('a,button') || event.pointerType==='touch'&&!stage.hasPointerCapture(event.pointerId)) return;
  const rect=stage.getBoundingClientRect();
  pointer.set(clamp((event.clientX-rect.left)/rect.width*2-1,-1,1),clamp(1-(event.clientY-rect.top)/rect.height*2,-1,1));
}
stage.addEventListener('pointermove',move);
stage.addEventListener('pointerdown',event=>{if(elapsed>=duration||event.target.closest('a,button'))return;stage.setPointerCapture(event.pointerId);move(event);});
stage.addEventListener('pointerleave',()=>pointer.set(0,0));
stage.addEventListener('pointercancel',()=>pointer.set(0,0));
stage.addEventListener('keydown',event=>{
  if(elapsed>=duration||event.target.closest('a,button'))return;
  const directions={ArrowLeft:[-.15,0],ArrowRight:[.15,0],ArrowUp:[0,.15],ArrowDown:[0,-.15]};
  if(!directions[event.key])return; event.preventDefault();
  pointer.x=clamp(pointer.x+directions[event.key][0],-1,1);pointer.y=clamp(pointer.y+directions[event.key][1],-1,1);
});
replay.addEventListener('click',()=>{introSkipped=false;scrollTo({top:0,behavior:'instant'});document.dispatchEvent(new CustomEvent('cloud:replay-intro'));start();});
explore.addEventListener('click',()=>{if(!ready)return;introSkipped=false;elapsed=6.8;playing=false;pointer.set(0,0);stage.scrollIntoView({behavior:reduced.matches?'instant':'smooth'});renderer.setAnimationLoop(renderFrame);renderFrame(performance.now());});
enter.addEventListener('click',()=>{introSkipped=false;stage.scrollIntoView({behavior:reduced.matches?'instant':'smooth'});start(7.5);});
wiperToggle.addEventListener('click',()=>{
  wipersEnabled=!wipersEnabled;
  wiperToggle.setAttribute('aria-pressed',String(wipersEnabled));
  wiperToggle.textContent=`Wipers ${wipersEnabled?'on':'off'} ≋`;
});
document.addEventListener('cloud:skip-intro',()=>{introSkipped=true;if(ready){elapsed=duration;playing=false;renderFrame(performance.now());}});
reduced.addEventListener('change',()=>{if(reduced.matches&&ready){elapsed=duration;playing=false;renderFrame(performance.now());}});
document.addEventListener('visibilitychange',()=>{last=0;});
addEventListener('resize',resize,{passive:true});

async function init() {
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  host.append(renderer.domElement);
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();fail(new Error('Graphics context lost'));});
  resize();buildWorld();
  const draco=new DRACOLoader();draco.setDecoderPath('assets/draco/');
  const loader=new GLTFLoader();loader.setDRACOLoader(draco);
  const timeout = setTimeout(()=>{if(!ready)status.textContent='LOADING CAR · YOU CAN EXPLORE BELOW';},8000);
  let gltf;
  try {
    [gltf,logoImage]=await Promise.all([
      loader.loadAsync('assets/ferrari.glb'),
      new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('HackHere logo could not load'));img.src='assets/hackhere-logo.png';})
    ]);
  }
  finally {clearTimeout(timeout);draco.dispose();}
  loadedScene=gltf.scene;car=gltf.scene.children[0];
  car.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});
  car.getObjectByName('body').material=new THREE.MeshPhysicalMaterial({color:'#554b81',metalness:.85,roughness:.24,clearcoat:1,clearcoatRoughness:.08});
  car.getObjectByName('glass').material=new THREE.MeshPhysicalMaterial({color:'#151b31',metalness:.28,roughness:.08,clearcoat:1,transparent:true,opacity:.9});
  for(const name of ['rim_fl','rim_fr','rim_rl','rim_rr','trim']) car.getObjectByName(name).material=new THREE.MeshStandardMaterial({color:'#60777a',metalness:.85,roughness:.23});
  for(const name of ['lights','leds']) {const object=car.getObjectByName(name);if(object)object.material=new THREE.MeshStandardMaterial({color:'#b9f5ff',emissive:'#6ee7ff',emissiveIntensity:3});}
  for(const name of ['wheel_fl','wheel_fr','wheel_rl','wheel_rr']) wheels.push(car.getObjectByName(name));
  scene.add(car);makeHeadlights();
  titlePlane=new THREE.Mesh(new THREE.PlaneGeometry(1.28,.62),new THREE.MeshBasicMaterial({map:labelTexture(),transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));
  titlePlane.position.set(0,1.03,-.785);titlePlane.rotation.set(-1.99,0,Math.PI);car.add(titlePlane);
  makeWipers();
  ready=true;stage.classList.add('has-3d');
  document.documentElement.classList.add('drive-ready');
  stage.dataset.renderer='webgl';stage.dataset.model='loaded';
  renderer.setAnimationLoop(renderFrame);
  let started=false;
  const attempt=()=>{if(!started&&visible){started=true;start();}};
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;last=0;attempt();},{threshold:.12});observer.observe(stage);
  attempt();
}
let letterIndex=0;
document.getElementById('hero-title').setAttribute('aria-label','Hack the Cloud');
document.querySelectorAll('#hero-title > span,#hero-title > em').forEach(line=>{
  const text=line.textContent;line.textContent='';line.setAttribute('aria-hidden','true');
  for(const letter of text){if(letter===' '){line.append(document.createTextNode(' '));continue;}const span=document.createElement('span');span.className='title-letter';span.textContent=letter;span.style.setProperty('--letter-delay',`${letterIndex++*.14}s`);line.append(span);}
});
glassScreen.inert=true;
init().catch(fail);
