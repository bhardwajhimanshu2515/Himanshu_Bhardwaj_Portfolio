import * as THREE from "three";
import { createRobotBeam } from "./robot-beam";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

function fabricTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 96;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#747474";
  ctx.fillRect(0, 0, 96, 96);
  for (let x = 0; x < 96; x += 6) {
    ctx.fillStyle = "#a5a5a5";
    ctx.fillRect(x, 0, 2, 96);
    ctx.fillStyle = "#505050";
    ctx.fillRect(x + 2, 0, 1, 96);
    for (let y = 0; y < 96; y += 4) {
      ctx.fillRect(x + (y % 8 === 0 ? 0 : 3), y, 3, 1);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

function rounded(width, height, depth, radius, material) {
  return new THREE.Mesh(new RoundedBoxGeometry(width, height, depth, 3, radius), material);
}

function ellipsoid(parent, material, position, scale) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), material);
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  parent.add(mesh);
  return mesh;
}

function addTube(parent, points, radius, material, closed = false) {
  const path = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), closed);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, closed ? 72 : 18, radius, 7, closed), material);
  parent.add(mesh);
}

function hoodShape(parent, fabric, trim) {
  const rings = [
    [.76, .59, .48], [.82, .69, .43], [.87, .74, .30],
    [.88, .75, .13], [.83, .72, -.18], [.70, .62, -.39],
    [.43, .43, -.55], [.06, .06, -.61], [0, 0, -.62],
  ];
  const points = [];
  const uv = [];
  const indices = [];
  const rim = [];
  const sides = 64;
  rings.forEach(([rx, ry, z], index) => {
    for (let i = 0; i <= sides; i++) {
      const angle = i / sides * Math.PI * 2;
      const x = Math.cos(angle), y = Math.sin(angle);
      const sx = Math.sign(x) * Math.pow(Math.abs(x), .78);
      const sy = Math.sign(y) * Math.pow(Math.abs(y), .84);
      const point = [sx * rx, .13 + sy * ry, z + .12 * y];
      points.push(...point);
      uv.push(i / sides, index / (rings.length - 1));
      if (!index && i < sides) rim.push(point);
      if (index && i < sides) {
        const vertex = index * (sides + 1) + i;
        indices.push(vertex, vertex + 1, vertex - sides - 1,
          vertex + 1, vertex - sides, vertex - sides - 1);
      }
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  parent.add(new THREE.Mesh(geometry, fabric));
  addTube(parent, rim, .044, trim, true);
}

function buildTorchArm(root, cloth, seam, metal) {
  const shoulder = new THREE.Group();
  shoulder.position.set(-.40, 1.24, .13);
  root.add(shoulder);
  ellipsoid(shoulder, cloth, [0, -.18, 0], [.20, .26, .23]);

  const elbow = new THREE.Group();
  elbow.position.y = -.36;
  shoulder.add(elbow);
  ellipsoid(elbow, cloth, [0, -.10, .01], [.18, .23, .21]);
  ellipsoid(elbow, seam, [0, -.23, .01], [.16, .10, .18]);

  const grip = new THREE.Group();
  grip.position.set(0, -.34, .08);
  elbow.add(grip);
  const palm = rounded(.23, .19, .20, .055, metal);
  grip.add(palm);

  const bezel = new THREE.MeshStandardMaterial({ color: 0xbb8553, metalness: .68, roughness: .30 });
  const lensMaterial = new THREE.MeshStandardMaterial({ color: 0x58432a, emissive: 0xffb348, emissiveIntensity: 0, roughness: .32 });
  const torch = new THREE.Group();
  torch.position.z = .09;
  grip.add(torch);

  function barrel(top, bottom, length, y, material) {
    const part = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, length, 20), material);
    part.position.y = y;
    torch.add(part);
  }

  barrel(.086, .092, .35, .01, metal);
  barrel(.09, .135, .13, -.18, bezel);
  barrel(.135, .135, .057, -.264, metal);
  barrel(.116, .116, .014, -.298, lensMaterial);
  const lens = new THREE.Object3D();
  lens.position.y = -.307;
  torch.add(lens);
  const spill = new THREE.PointLight(0xffab4d, 0, 1.35, 2);
  spill.position.set(0, -.33, .09);
  torch.add(spill);
  return { shoulder, elbow, torch, lens, lensMaterial, spill };
}

function buildBackpack(root, metal) {
  const pack = new THREE.Group();
  pack.position.set(0, .98, -.37);
  root.add(pack);
  pack.add(rounded(.64, .62, .27, .12, metal));
  const brass = new THREE.MeshStandardMaterial({ color: 0x9a6838, metalness: .62, roughness: .37 });
  const flame = new THREE.MeshBasicMaterial({
    color: 0xffaa45, transparent: true, opacity: 0, depthWrite: false, toneMapped: false,
  });
  const core = new THREE.MeshBasicMaterial({
    color: 0xffefbe, transparent: true, opacity: 0, depthWrite: false, toneMapped: false,
  });
  const plumes = [-.35, .35].map(x => {
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(.09, .115, .23, 16), brass);
    nozzle.position.set(x, -.22, -.035);
    pack.add(nozzle);
    const exhaust = new THREE.Group();
    exhaust.position.set(x, -.34, -.035);
    for (const [radius, length, material] of [[.105, .88, flame], [.055, .46, core]]) {
      const plume = new THREE.Mesh(new THREE.ConeGeometry(radius, length, 16), material);
      plume.rotation.z = Math.PI;
      plume.position.y = -length / 2;
      exhaust.add(plume);
    }
    pack.add(exhaust);
    return exhaust;
  });
  return { plumes, flame, core };
}

function hoodieBot() {
  const root = new THREE.Group();
  const bump = fabricTexture();
  const cloth = new THREE.MeshStandardMaterial({color:0x92949b, roughness:.94, bumpMap:bump, bumpScale:.015, side:THREE.DoubleSide});
  const seam = new THREE.MeshStandardMaterial({color:0x777982, roughness:.95, bumpMap:bump, bumpScale:.014});
  const pants = new THREE.MeshStandardMaterial({color:0x292a31, roughness:.87});
  const metal = new THREE.MeshStandardMaterial({color:0x292b34, roughness:.34, metalness:.48});
  const visor = new THREE.MeshPhysicalMaterial({color:0x151820, roughness:.31, metalness:.20, clearcoat:.54, clearcoatRoughness:.23});
  const trim = new THREE.MeshStandardMaterial({color:0x0c0d12, roughness:.64});
  const cord = new THREE.MeshStandardMaterial({color:0xdba893, roughness:.85});
  const eye = new THREE.MeshBasicMaterial({color:0xffb4bd, toneMapped:false});
  const eyeGlow = new THREE.MeshBasicMaterial({color:0xff667e, transparent:true, opacity:.23, depthWrite:false, toneMapped:false});

  const torso = rounded(.91, .97, .58, .23, cloth);
  torso.position.y = .90;
  root.add(torso);
  const hem = rounded(.88, .15, .59, .073, seam);
  hem.position.y = .49;
  root.add(hem);
  const pocket = rounded(.57, .30, .10, .10, seam);
  pocket.position.set(0, .68, .292);
  root.add(pocket);
  ellipsoid(root, seam, [0,1.40,-.09], [.48,.15,.36]);

  for (const side of [-1,1]) {
    if (side === 1) {
      const arm = ellipsoid(root, cloth, [.51,.94,0], [.20,.47,.25]);
      arm.rotation.z = .26;
      const cuff = ellipsoid(root, seam, [.60,.59,.018], [.17,.14,.21]);
      cuff.rotation.z = .22;
      const palm = rounded(.21,.20,.18,.05,metal);
      palm.position.set(.61,.48,.03);
      root.add(palm);
      for (let digit = 0; digit < 3; digit++) {
        const x = .61 + (digit - 1) * .053;
        addTube(root, [[x,.45,.07],[x,.38,.09],[x,.35,.11]], .019, metal);
      }
    }
    const leg = rounded(.35,.52,.41,.13,pants);
    leg.position.set(side*.22,.29,-.03);
    root.add(leg);
    const shoe = rounded(.38,.21,.52,.085,metal);
    shoe.position.set(side*.22,.105,.062);
    root.add(shoe);
    addTube(root, [[side*.10,1.39,.25],[side*.13,1.24,.33],[side*.16,.99,.34],[side*.18,.88,.34]],.018,cord);
  }

  const backpack = buildBackpack(root, metal);
  const torchArm = buildTorchArm(root, cloth, seam, metal);
  const head = new THREE.Group();
  head.position.set(0,1.92,0);
  root.add(head);
  hoodShape(head, cloth, seam);
  const gasket = rounded(1.53,1.15,.63,.32,trim);
  gasket.position.set(0,.10,.17);
  head.add(gasket);
  const face = rounded(1.38,1.00,.48,.28,visor);
  face.position.set(0,.10,.27);
  head.add(face);

  const eyes = new THREE.Group();
  eyes.position.set(0,.10,.519);
  head.add(eyes);
  for (const side of [-1,1]) {
    const bloom = rounded(.162,.286,.012,.025,eyeGlow);
    bloom.position.x = side*.264;
    eyes.add(bloom);
    const light = rounded(.105,.22,.024,.035,eye);
    light.position.set(side*.264,0,.013);
    eyes.add(light);
  }
  root.rotation.y = -.17;
  return { root, head, eyes, bump, torchArm, backpack };
}

export function createRobotScene(figure, overlay) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;
  const scene = new THREE.Scene();
  const beam = createRobotBeam();
  const { root, head, eyes, bump, torchArm, backpack } = hoodieBot();
  const { shoulder, elbow, torch, lens, lensMaterial, spill } = torchArm;
  scene.add(root);
  const sky = new THREE.HemisphereLight(0xe5ebff, 0x493a32, 2.1);
  const key = new THREE.DirectionalLight(0xfff0e5, 2.1);
  key.position.set(3, 4, 5);
  const rim = new THREE.DirectionalLight(0xc4d4ff, 1.8);
  rim.position.set(-3, 2, -4);
  scene.add(sky, key, rim);

  const camera = new THREE.OrthographicCamera(-1, 1, 1.46, -1.46, .1, 20);
  camera.position.set(0, 1.56, 7);
  camera.lookAt(0, 1.40, 0);
  camera.updateMatrixWorld();
  overlay.append(renderer.domElement);

  const position = new THREE.Vector3();
  const hand = new THREE.Vector2();
  const muzzle = new THREE.Vector2();
  const aim = new THREE.Vector3();
  const down = new THREE.Vector3(0, -1, 0);
  const cameraRight = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const cameraUp = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
  const parentRotation = new THREE.Quaternion();
  const aimedRotation = new THREE.Quaternion();
  let width = 1;
  let height = 1;

  return {
    canvas: renderer.domElement,
    resize() {
      width = overlay.clientWidth || 1;
      height = overlay.clientHeight || 1;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(3200000 / (width * height))));
      renderer.setSize(width, height, false);
    },
    draw({ yaw, pitch, blink, lift, power, target, elapsed, settle, thrust = 0, bank = 0 }) {
      const box = figure.getBoundingClientRect();
      if (!box.height) return;
      const viewportWidth = Math.round(box.width * 1.65);
      const viewportHeight = Math.round(box.height * 1.42);
      const left = Math.round(box.left + (box.width - viewportWidth) * .5);
      const top = Math.round(box.top + (box.height - viewportHeight) * .36);
      camera.top = 1.46 * viewportHeight / box.height;
      camera.bottom = -camera.top;
      camera.left = -camera.top * viewportWidth / viewportHeight;
      camera.right = -camera.left;
      camera.updateProjectionMatrix();

      const targetY = target ? target.y - (box.top + box.height * .5) : 0;
      const targetX = target ? target.x - (box.left + box.width * .5) : -width * .5;
      const vertical = THREE.MathUtils.clamp(-targetY / (Math.abs(targetX) + Math.abs(targetY) + 1), -.5, 1);
      root.rotation.y = -.17 + yaw * .12 - lift * .15;
      root.position.y = lift * .05;
      root.rotation.z = -bank * .26;
      root.rotation.x = -thrust * .10;
      backpack.flame.opacity = thrust * .67;
      backpack.core.opacity = thrust * .91;
      for (const [index, plume] of backpack.plumes.entries()) {
        plume.visible = thrust > .015;
        plume.scale.y = thrust * (.82 + .18 * Math.sin(elapsed * 72 + index * 2));
      }
      head.rotation.set(pitch * .22 - vertical * lift * .18, yaw * .36 - lift * .18, -yaw * .10 + lift * .04);
      eyes.position.x = yaw * .10 - lift * .055;
      eyes.position.y = .10 - pitch * .07 + vertical * lift * .048;
      eyes.scale.y = blink;
      shoulder.rotation.set(-.10 - lift * .20, 0, -.20 - lift * (.87 + vertical * .30));
      elbow.rotation.set(-.16 - lift * .25, 0, -.12 - lift * (.36 + vertical * .27));
      lensMaterial.emissiveIntensity = power * 2.6;
      spill.intensity = power * .75;

      function project(object, point) {
        object.getWorldPosition(position).project(camera);
        point.set(left + (position.x + 1) * viewportWidth / 2, top + (1 - position.y) * viewportHeight / 2);
      }

      torch.quaternion.identity();
      if (target && lift > 0) {
        project(torch, hand);
        aim.copy(cameraRight).multiplyScalar(target.x - hand.x)
          .addScaledVector(cameraUp, hand.y - target.y).normalize();
        torch.parent.getWorldQuaternion(parentRotation).invert();
        aimedRotation.setFromUnitVectors(down, aim.applyQuaternion(parentRotation));
        torch.quaternion.slerp(aimedRotation, Math.max(lift, settle));
      }

      project(lens, muzzle);
      renderer.setViewport(0, 0, width, height);
      renderer.clear();
      beam.render(renderer, width, height, muzzle, target, power, elapsed);
      renderer.setViewport(left, height - top - viewportHeight, viewportWidth, viewportHeight);
      renderer.render(scene, camera);
    },
    dispose() {
      const materials = new Set();
      root.traverse(object => {
        object.geometry?.dispose();
        if (object.material) materials.add(object.material);
      });
      for (const material of materials) material.dispose();
      bump.dispose();
      beam.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
