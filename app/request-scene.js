import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { requestStages } from "./request-model";

// A miniature cloud lab: workstation (screen, stand, keyboard), rack (feet,
// posts, rails, roof), edge appliance, balancer, two removable API cartridges,
// storage drawers, chip pins, heat sinks, vents, status lamps, screws and cables.
export function createRequestScene(host) {
  const renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0,0);
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35,1,.1,100);
  const assembly = new THREE.Group();scene.add(assembly);
  scene.add(new THREE.HemisphereLight(0xfff4de,0x53483c,2.8));
  const light = new THREE.DirectionalLight(0xfff8eb,3);light.position.set(-5,10,8);scene.add(light);
  const metal = new THREE.MeshStandardMaterial({color:0x897c6c,metalness:.6,roughness:.38});
  const dark = new THREE.MeshStandardMaterial({color:0x29251f,roughness:.65});
  const board = new THREE.MeshStandardMaterial({color:0x655745,roughness:.65});
  const gold = new THREE.MeshStandardMaterial({color:0xeac080,metalness:.4,roughness:.3});
  const lamps = Array.from({length:6},()=>new THREE.MeshStandardMaterial({color:0xb99a66,emissive:0xffb74d,emissiveIntensity:0,roughness:.3}));
  const pulseMat = new THREE.MeshBasicMaterial({color:0xffd690});
  const lidParts=[];
  function box(parent,w,h,d,x,y,z,mat=metal) {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(.055,h*.22)),mat);
    mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  function cylinder(parent,r,h,x,y,z,mat=metal) {
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,20),mat);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  box(assembly,10.6,.2,5.5,0,-.2,0,dark);
  for(const x of [-4.6,4.6]) for(const z of [-2.1,2.1]) {
    cylinder(assembly,.19,.2,x,-.4,z,dark);
    cylinder(assembly,.055,.025,x,-.085,z,gold);
  }
  // Browser workstation, with actual screen UI geometry and keyboard keys.
  const desktop=new THREE.Group();desktop.position.set(-3.35,0,.4);assembly.add(desktop);
  box(desktop,1.4,.12,.9,0,0,0);
  box(desktop,.19,.75,.2,0,.43,-.1);
  box(desktop,2.25,1.55,.19,0,1.5,-.1);
  box(desktop,2.06,1.35,.035,0,1.5,.015,dark);
  box(desktop,1.9,.12,.02,0,2.05,.04,lamps[0]);
  for(let i=0;i<3;i++) box(desktop,.42,.55,.025,-.64+i*.64,1.48,.045,board);
  for(let i=0;i<3;i++) box(desktop,.36,.055,.025,-.64+i*.64,1.04,.045,lamps[0]);
  box(desktop,1.8,.09,.65,0,.02,1);
  for(let row=0;row<3;row++) for(let col=0;col<9;col++) box(desktop,.14,.04,.12,-.72+col*.18,.085,.8+row*.17,dark);
  // Cloud rack: open front, rails and removable roof reveal real hardware.
  const rack=new THREE.Group();rack.position.set(1.45,0,-.4);assembly.add(rack);
  box(rack,3.9,.15,2.7,0,0,0,metal);
  for(const x of [-1.85,1.85]) for(const z of [-1.23,1.23]) {
    box(rack,.13,3.8,.13,x,1.975,z);
    for(let i=0;i<9;i++) box(rack,.045,.045,.015,x,.35+i*.39,z+.075,dark);
  }
  const roof=box(rack,3.95,.13,2.75,0,3.96,0,metal);lidParts.push([roof,3.96]);
  function appliance(y,material,depth=1.9) {
    box(rack,3.45,.3,depth,0,y,0,dark);
    box(rack,3.45,.25,.08,0,y,depth/2+.04,metal);
    for(const x of [-1.58,1.58]) cylinder(rack,.04,.025,x,y+.163,depth/2-.1,gold);
    for(let i=0;i<8;i++) box(rack,.11,.025,.02,-.9+i*.18,y,depth/2+.09,dark);
    box(rack,.15,.075,.02,1.3,y,depth/2+.09,material);
  }
  appliance(3.32,lamps[1]);appliance(2.7,lamps[2]);

  for(let i=0;i<2;i++) {
    const tray=new THREE.Group();tray.position.set(-.88+i*1.76,1.65,0);rack.add(tray);
    box(tray,1.5,.11,2.1,0,0,0,metal);
    box(tray,1.34,.07,1.83,0,.09,0,board);
    box(tray,.52,.12,.52,0,.185,-.1,lamps[3+i]);
    for(let j=0;j<6;j++) box(tray,.45,.07,.035,0,.28,-.3+j*.08,metal);
    for(let j=0;j<5;j++) for(const x of [-.32,.32]) box(tray,.11,.025,.035,x,.18,-.26+j*.08,gold);
    for(let j=0;j<2;j++) box(tray,.12,.12,.7,.45-j*.9,.18,-.2,dark);
    box(tray,1.5,.25,.08,0,.07,1.09,metal);
    box(tray,.35,.08,.06,0,.06,1.16,lamps[3+i]);
  }
  for(let i=0;i<2;i++) appliance(.42+i*.43,lamps[5]);
  // Physical connector paths: separate front lanes; terminals touch equipment faces.
  const cloud = new THREE.Vector3(1.45,3.32,.69);
  const balance = new THREE.Vector3(1.45,2.7,.69);
  const browser = new THREE.Vector3(-3.35,1.48,.46);
  const storage = new THREE.Vector3(1.45,.85,.69);
  const service = [new THREE.Vector3(.57,1.72,.76),new THREE.Vector3(2.33,1.72,.76)];
  function cable(points) {
    const curve=new THREE.CatmullRomCurve3(points.map(p=>p.clone()),false,"centripetal");
    const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,40,.028,6,false),board);assembly.add(mesh);
    const dots=Array.from({length:4},()=>{const dot=new THREE.Mesh(new THREE.SphereGeometry(.065,10,8),pulseMat);assembly.add(dot);return dot;});
    return {curve,dots};
  }
  const entry=cable([browser,new THREE.Vector3(-1.7,1.6,1.9),new THREE.Vector3(-.8,3.32,1.9),cloud]);
  const edge=cable([cloud,new THREE.Vector3(1.45,3.22,1.6),new THREE.Vector3(1.45,2.8,1.6),balance]);
  const routes=service.map((p,i)=>[
    cable([balance,new THREE.Vector3(p.x,2.5,1.95+i*.25),new THREE.Vector3(p.x,1.9,1.95+i*.25),p]),
    cable([p,new THREE.Vector3(p.x,1.4,2.4+i*.24),new THREE.Vector3(p.x,.85,2.4+i*.24),storage]),
  ]);
  let state={step:0,expanded:true,playing:false,replica:0,view:false};
  let visible=false,frame=0,last=0,time=0,open=0,angle=0;
  const reduce=matchMedia("(prefers-reduced-motion: reduce)");
  function draw(now) {
    frame=0;
    const dt=last?Math.min(.05,(now-last)/1000):.016;last=now;
    if(state.playing&&!reduce.matches)time+=dt;
    const target=state.expanded?1:0,targetAngle=state.view?-.35:.15;
    open=reduce.matches?target:THREE.MathUtils.damp(open,target,7,dt);
    angle=reduce.matches?targetAngle:THREE.MathUtils.damp(angle,targetAngle,5,dt);
    assembly.rotation.y=angle;
    lidParts.forEach(([part,y])=>part.position.y=y+open*.65);
    // Only the roof separates: connected equipment stays seated on its mounts.
    const active=requestStages[state.step].node;
    let lightsMoving=false;
    lamps.forEach((mat,i)=>{
      const lit=active===3?i===3+state.replica:active===4?i===5:i===active;
      const intensity=lit?.85:.03;
      mat.emissiveIntensity=reduce.matches?intensity:THREE.MathUtils.damp(mat.emissiveIntensity,intensity,8,dt);
      lightsMoving ||= Math.abs(mat.emissiveIntensity-intensity)>.001;
    });
    const all=[entry,edge,...routes.flat()];
    all.forEach(path=>path.dots.forEach(dot=>dot.visible=false));
    const selected=state.step===0||state.step===1?[entry]:state.step===2?[edge,routes[state.replica][0]]:state.step===3?[routes[state.replica][0]]:state.step===4?[routes[state.replica][1]]:[entry,edge,...routes[state.replica]];
    selected.forEach(path=>path.dots.forEach((dot,i)=>{
      dot.visible=true;
      const progress=(time*.3+i/4)%1;
      dot.position.copy(path.curve.getPointAt(state.step===5?1-progress:progress));
    }));
    renderer.render(scene,camera);
    const moving=Math.abs(open-target)>.001||Math.abs(angle-targetAngle)>.001;
    if(visible&&!document.hidden&&!reduce.matches&&(state.playing||moving||lightsMoving))frame=requestAnimationFrame(draw);
  }
  function schedule(){if(!frame&&visible&&!document.hidden)frame=requestAnimationFrame(draw);}
  function resize(){
    const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);
    renderer.setSize(w,h,false);camera.aspect=w/h;
    // Fit the entire instrument on narrow screens rather than cropping hardware.
    const distance=Math.max(16,11/(2*Math.tan(THREE.MathUtils.degToRad(17.5))*camera.aspect));
    camera.position.set(3.5,8.5,14).normalize().multiplyScalar(distance);
    camera.lookAt(0,1.4,0);camera.updateProjectionMatrix();schedule();
  }
  const observer=new ResizeObserver(resize);observer.observe(host);
  const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;last=0;if(!visible){cancelAnimationFrame(frame);frame=0;}else schedule();});intersection.observe(host);
  function resume(){last=0;schedule();}
  document.addEventListener("visibilitychange",resume);reduce.addEventListener("change",resume);
  function lost(event){event.preventDefault();host.dispatchEvent(new Event("scene-unavailable"));}
  renderer.domElement.addEventListener("webglcontextlost",lost);
  resize();
  return {
    setState(next){if(next.step!==state.step||next.replica!==state.replica)time=0;state=next;last=0;schedule();},
    dispose(){
      cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();
      document.removeEventListener("visibilitychange",resume);reduce.removeEventListener("change",resume);
      renderer.domElement.removeEventListener("webglcontextlost",lost);
      const materials=new Set();scene.traverse(o=>{o.geometry?.dispose();if(o.material)materials.add(o.material);});
      materials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();
    },
  };
}
