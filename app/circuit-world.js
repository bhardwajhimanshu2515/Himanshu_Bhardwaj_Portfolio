import * as THREE from "three";

export function createCircuitWorld(host) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setClearColor(0, 0);
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 100);
  camera.position.z = 22;
  const layers = [];
  const rings = [];
  const panels = [];
  const signals = [];
  const materials = [];
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let seed = 93;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const material = opacity => {
    const value = new THREE.LineBasicMaterial({ color: 0xffba49, transparent: true, opacity });
    materials.push(value);
    return value;
  };
  const fine = material(.36), bright = material(.85);
  function line(parent, points, ink = fine) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p)));
    const object = new THREE.Line(geometry, ink);
    parent.add(object);
    return object;
  }
  for (let depth = 0; depth < 3; depth++) {
    const layer = new THREE.Group();
    layer.position.z = -depth * 3;
    scene.add(layer);
    layers.push(layer);
    for (let i = 0; i < 12; i++) {
      const x = (random() - .5) * 34, y = (random() - .5) * 25;
      const path = [[x,y,0],[x,y+1,0],[x+.6,y+1.6,0],[x+.6,y+4,0],[x+1.1,y+4.5,0]];
      line(layer,path);
      const curve = new THREE.CurvePath();
      for (let n=1;n<path.length;n++) curve.add(new THREE.LineCurve3(new THREE.Vector3(...path[n-1]),new THREE.Vector3(...path[n])));
      const dot = new THREE.Mesh(new THREE.SphereGeometry(.045,6,4),new THREE.MeshBasicMaterial({color:0xffd98f}));
      layer.add(dot);
      signals.push({dot,curve,offset:random(),speed:.20+random()*.20});
      const module = new THREE.Group();
      module.position.set(x,y,0);
      layer.add(module);
      if (i % 2 === 0) {
        for (let r=0;r<3;r++) {
          const points = [];
          for(let j=0;j<=56;j++) {
            const angle=j/56*Math.PI*(r===1?1.65:2);
            points.push([Math.cos(angle)*(.5+r*.13),Math.sin(angle)*(.5+r*.13),0]);
          }
          const ring=line(module,points,r===1?bright:fine);
          rings.push({ring,speed:(r%2?1:-1)*(.30+random()*.50)});
        }
      } else {
        line(module,[[-.65,-.9,0],[.65,-.9,0],[.65,.7,0],[.45,.9,0],[-.65,.9,0],[-.65,-.9,0]]);
        for(let bar=0;bar<9;bar++) {
          const object=line(module,[[0,0,0],[.85,0,0]],bright);
          object.position.set(-.48,-.68+bar*.16,0);
          panels.push({object,phase:random()*6,speed:1.25+random()*2.5});
        }
        for(let pin=0;pin<6;pin++) {
          const py=-.65+pin*.25;
          line(module,[[-.8,py,0],[-.65,py,0]]);
          line(module,[[.65,py,0],[.8,py,0]]);
        }
      }
    }
  }
  const stars = new Float32Array(180*3);
  for(let i=0;i<stars.length;i+=3) {
    stars[i]=(random()-.5)*38; stars[i+1]=(random()-.5)*28; stars[i+2]=-random()*8;
  }
  const dust = new THREE.Points(new THREE.BufferGeometry().setAttribute("position",new THREE.BufferAttribute(stars,3)),
    new THREE.PointsMaterial({color:0xffa02d,size:.025,transparent:true,opacity:.45}));
  scene.add(dust);
  let frame=0, previous=0, time=0, pointerX=0, pointerY=0;
  function draw(now) {
    frame=0;
    if(document.hidden) return;
    const delta=previous?Math.min((now-previous)/1000,.05):0;
    previous=now;
    if(!motion.matches) time+=delta;
    layers.forEach((layer,i) => {
      layer.position.x=Math.sin(time*.09+i)*.22+pointerX*(i+1)*.13;
      layer.position.y=Math.cos(time*.08+i)*.2+Math.sin(scrollY*.00035+i)*.6;
      layer.rotation.z=Math.sin(time*.06+i)*.018;
    });
    rings.forEach(({ring,speed})=>{ring.rotation.z=time*speed;});
    panels.forEach(({object,phase,speed})=>{object.scale.x=.2+.8*(.5+.5*Math.sin(time*speed+phase));});
    signals.forEach(({dot,curve,offset,speed})=>dot.position.copy(curve.getPoint((time*speed+offset)%1)));
    camera.position.y=pointerY*.15;
    dust.rotation.z=time*.005;
    renderer.render(scene,camera);
    if(!motion.matches) frame=requestAnimationFrame(draw);
  }
  function schedule() { if(!frame) frame=requestAnimationFrame(draw); }
  function resize() {
    camera.aspect=host.clientWidth/Math.max(1,host.clientHeight);
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
    renderer.setSize(host.clientWidth,host.clientHeight,false);
    schedule();
  }
  function pointer(event) {
    pointerX=event.clientX/innerWidth-.5; pointerY=event.clientY/innerHeight-.5;
  }
  function visibility() { previous=0; schedule(); }
  const observer=new ResizeObserver(resize);
  observer.observe(host);
  window.addEventListener("pointermove",pointer,{passive:true});
  document.addEventListener("visibilitychange",visibility);
  motion.addEventListener("change",schedule);
  resize();
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    window.removeEventListener("pointermove",pointer);
    document.removeEventListener("visibilitychange",visibility);
    motion.removeEventListener("change",schedule);
    const used=new Set(materials);
    scene.traverse(object=>{object.geometry?.dispose();if(object.material) used.add(object.material);});
    used.forEach(value=>value.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
}
