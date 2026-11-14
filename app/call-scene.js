import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// A phone on a service bench: enclosure, battery, PCB, shields, chips,
// microphone, earpiece, camera barrels, display, screws, pins and test equipment.
export function createCallScene(host) {
  const renderer = new THREE.WebGLRenderer({alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1,1.5));
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36,1,.1,100);
  camera.position.set(10,12,15);
  camera.lookAt(0,1.4,0);
  scene.add(new THREE.HemisphereLight(0xfff8e9,0x33313b,2.5));
  const key = new THREE.DirectionalLight(0xffffff,3);
  key.position.set(-5,10,7);scene.add(key);
  const metal = new THREE.MeshStandardMaterial({color:0x8b8984,metalness:.65,roughness:.34});
  const dark = new THREE.MeshStandardMaterial({color:0x292b2e,roughness:.6});
  const board = new THREE.MeshStandardMaterial({color:0x484b43,roughness:.8});
  const gold = new THREE.MeshStandardMaterial({color:0xcba065,metalness:.5,roughness:.3});
  const active = Array.from({length:5},()=>new THREE.MeshStandardMaterial({color:0xbfa475,emissive:0xffb34d,emissiveIntensity:0,roughness:.4}));
  function box(parent,w,h,d,x,y,z,mat=metal) {
    const mesh=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(.07,h*.2)),mat);
    mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  function cylinder(parent,r,h,x,y,z,mat=metal) {
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,20),mat);
    mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  const bench=new THREE.Group();scene.add(bench);
  box(bench,11,.24,6,0,-.3,0,dark);
  for(const x of [-4.8,4.8]) for(const z of [-2.4,2.4]) cylinder(bench,.19,.25,x,-.54,z);
  const phone=new THREE.Group();phone.position.x=-2.7;scene.add(phone);
  const layers=Array.from({length:4},()=>{const g=new THREE.Group();phone.add(g);return g;});
  box(layers[0],2.4,.16,4.6,0,0,0,metal);
  for(const x of [-1.12,1.12]) box(layers[0],.13,.3,4.4,x,.22,0);
  for(const z of [-2.15,2.15]) box(layers[0],2.18,.3,.12,0,.22,z);
  box(layers[1],2.12,.12,4.15,0,.4,0,board);
  box(layers[1],1.75,.24,2.05,0,.58,.45,dark);
  box(layers[1],.5,.17,.55,-.58,.55,-1.4,active[1]);
  box(layers[1],.55,.17,.65,.38,.55,-1.4,active[2]);
  box(layers[1],.8,.19,.28,0,.56,1.8,active[1]);
  for(let i=0;i<9;i++) {
    box(layers[1],.07,.06,.13,-.94+i*.23,.5,-1.91,gold);
    box(layers[1],.07,.06,.13,-.94+i*.23,.5,1.97,gold);
  }
  for(const x of [-.96,.96]) for(let i=0;i<8;i++) cylinder(layers[1],.035,.04,x,.49,-1.6+i*.45,gold);
  box(layers[2],2.05,.1,4.05,0,.8,0,dark);
  box(layers[2],1.88,.03,3.6,0,.87,.05,active[0]);
  box(layers[2],.65,.025,.08,0,.9,-1.84,active[4]);
  for(let i=0;i<7;i++) cylinder(layers[2],.025,.03,-.24+i*.08,.93,-1.84,dark);
  box(layers[3],2.25,.08,4.4,0,1.03,0,metal);
  box(layers[3],1.99,.035,3.95,0,1.09,.04,dark);
  for(const x of [-.85,.85]) for(const z of [-1.9,1.9]) cylinder(layers[0],.055,.04,x,.105,z);
  for(const x of [-.7,-.25]) { cylinder(layers[1],.16,.16,x,.62,-.83);cylinder(layers[1],.11,.02,x,.71,-.83,dark); }
  const tower=new THREE.Group();tower.position.set(.6,0,-1.3);scene.add(tower);
  box(tower,1,.14,1,0,0,0);
  cylinder(tower,.07,2.7,0,1.42,0);
  for(const x of [-.32,.32]) box(tower,.17,.85,.14,x,2.25,0,active[2]);
  box(tower,.78,.06,.12,0,1.9,0);
  const rack=new THREE.Group();rack.position.set(2.5,0,-1.2);scene.add(rack);
  box(rack,1.5,1.7,1.1,0,.9,0,dark);
  for(let i=0;i<5;i++) {
    box(rack,1.34,.23,.08,0,.3+i*.3,.6,metal);
    cylinder(rack,.028,.04,.48,.43+i*.3,.62,active[3]);
    for(let j=0;j<4;j++) box(rack,.18,.025,.02,-.45+j*.2,.32+i*.3,.65,dark);
  }
  const receiver=new THREE.Group();receiver.position.set(3.5,.05,1.4);scene.add(receiver);
  box(receiver,1.25,.18,2.3,0,0,0);
  box(receiver,1.12,.04,1.95,0,.12,0,dark);
  box(receiver,.4,.05,.08,0,.16,-.91,active[4]);
  const route=new THREE.CatmullRomCurve3([new THREE.Vector3(-2.7,.6,1.8),new THREE.Vector3(-1.8,2.7,0),new THREE.Vector3(.6,2.7,-1.3),new THREE.Vector3(2.5,1.9,-1.2),new THREE.Vector3(3.5,.4,1.4)]);
  const particles=Array.from({length:12},()=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.055,8,6),gold);scene.add(m);return m;});
  let step=0, expanded=true, playing=false, visible=false, frame=0, last=0, time=0, amount=0;
  const reduce=matchMedia("(prefers-reduced-motion: reduce)");
  function draw(now) {
    frame=0;
    const dt=last?Math.min(.04,(now-last)/1000):0;last=now;
    if(!reduce.matches && playing) time+=dt;
    const target=expanded?1:0;
    amount=reduce.matches?target:THREE.MathUtils.damp(amount,target,9,dt);
    layers.forEach((layer,i)=>{layer.position.y=i*amount*.78;});
    active.forEach((mat,i)=>{mat.emissiveIntensity=i===step?.75:0;});
    particles.forEach((m,i)=>{
      m.visible=step>=2;
      m.position.copy(route.getPointAt(((reduce.matches?0:time*.18)+i/particles.length)%1));
    });
    renderer.render(scene,camera);
    if(visible&&!document.hidden&&!reduce.matches&&(playing||Math.abs(target-amount)>.001)) frame=requestAnimationFrame(draw);
  }
  function schedule(){if(!frame&&visible&&!document.hidden)frame=requestAnimationFrame(draw);}
  function resize(){
    const w=host.clientWidth,h=host.clientHeight;
    renderer.setSize(w,h,false);camera.aspect=w/h;
    camera.position.set(10,12,15).multiplyScalar(w<600?1.5:1);
    camera.lookAt(0,1.5,0);camera.updateProjectionMatrix();schedule();
  }
  const observer=new ResizeObserver(resize);observer.observe(host);
  const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;last=0;schedule();});intersection.observe(host);
  function resume(){last=0;schedule();}
  document.addEventListener("visibilitychange",resume);reduce.addEventListener("change",schedule);
  resize();
  return {
    setState(next,apart,tour){step=next;expanded=apart;playing=tour;schedule();},
    dispose(){
      cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();
      document.removeEventListener("visibilitychange",resume);reduce.removeEventListener("change",schedule);
      const materials=new Set();
      scene.traverse(o=>{o.geometry?.dispose();if(o.material)materials.add(o.material);});
      materials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();
    },
  };
}
