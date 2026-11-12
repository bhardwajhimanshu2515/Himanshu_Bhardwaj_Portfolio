import * as THREE from "three";

const TAU = Math.PI * 2;

function randomSequence(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function glowingPoints(positions, color, size, opacity = 1, trailLength = 1) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const strengths = Float32Array.from({ length: positions.length / 3 }, (_, index) =>
    1 - (index % trailLength) / trailLength,
  );
  geometry.setAttribute("strength", new THREE.BufferAttribute(strengths, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      tint: { value: new THREE.Color(color) },
      size: { value: size },
      opacity: { value: opacity },
    },
    vertexShader: `
      uniform float size;
      attribute float strength;
      varying float glow;
      void main() {
        vec4 view = modelViewMatrix * vec4(position, 1.0);
        glow = strength;
        gl_PointSize = size * (0.55 + strength * 0.45) * 7.0 / -view.z;
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: `
      uniform vec3 tint;
      uniform float opacity;
      varying float glow;
      void main() {
        float radius = length(gl_PointCoord - vec2(0.5)) * 2.0;
        float halo = pow(max(1.0 - radius, 0.0), 2.0);
        float core = 1.0 - smoothstep(0.04, 0.27, radius);
        gl_FragColor = vec4(mix(tint, vec3(1.0, 0.91, 0.72), core), glow * opacity * max(halo, core));
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(geometry, material);
}

function lineSegments(positions, color, opacity) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({
    color, opacity, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
}

function orbitalRings(group, color, radius, count) {
  const rings = new THREE.Group();
  for (let ring = 0; ring < count; ring++) {
    const positions = [];
    const r = radius + ring * 0.12;
    for (let i = 0; i < 144; i++) {
      if ((i + ring * 5) % (ring % 2 ? 18 : 36) > (ring % 2 ? 11 : 30)) continue;
      const a = i * TAU / 144;
      const b = (i + 1) * TAU / 144;
      positions.push(r * Math.cos(a), r * Math.sin(a), 0, r * Math.cos(b), r * Math.sin(b), 0);
      if (i % 4 === 0) positions.push(r * Math.cos(a), r * Math.sin(a), 0,
        (r + 0.035) * Math.cos(a), (r + 0.035) * Math.sin(a), 0);
    }
    const orbit = lineSegments(positions, color, 0.42 - ring * 0.045);
    orbit.rotation.set(ring * 0.78, ring * 0.61, ring);
    rings.add(orbit);
  }
  group.add(rings);
  return rings;
}

function brainSurface(side, latitude, longitude) {
  const belt = Math.cos(latitude);
  const groove = Math.pow(0.5 + 0.5 * Math.sin(
    longitude * 9 + latitude * 8 + 1.4 * Math.sin(latitude * 13 + longitude * 4),
  ), 5);
  const radius = 1 - groove * 0.11;
  return new THREE.Vector3(
    side * (0.58 + 0.56 * belt * Math.cos(longitude) * radius),
    0.15 + 0.79 * Math.sin(latitude) * radius,
    1.13 * belt * Math.sin(longitude) * radius,
  );
}

function neuralHemisphere(side) {
  const geometry = new THREE.SphereGeometry(1, 88, 56);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const latitude = Math.asin(position.getY(i));
    const longitude = Math.atan2(position.getZ(i), position.getX(i));
    const point = brainSurface(side, latitude, longitude);
    position.setXYZ(i, point.x, point.y, point.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function revealCloth(group) {
  const material = new THREE.ShaderMaterial({
    uniforms: { peel: { value: 0 }, clock: { value: 0 }, flash: { value: 0 } },
    vertexShader: `
      uniform float peel;
      uniform float clock;
      varying vec2 fabric;
      varying float fold;
      void main() {
        fabric = uv;
        float edge = smoothstep(0.1, 0.94, uv.x);
        float lift = pow(peel, 1.15);
        float ripple = sin(uv.y * 33.0 + uv.x * 16.0 - clock * 2.2);
        vec3 drape = position;
        drape.x = position.x * (1.0 - 0.62 * lift) + lift * 3.9;
        drape.y = position.y + lift * (1.8 + edge * 0.4) + 0.19 * sin(uv.x * 8.0);
        drape.z = 0.22 + 1.04 * sin(3.14159 * uv.x) * sin(3.14159 * uv.y);
        fold = ripple * (0.12 + 0.39 * lift) + 0.20 * sin(uv.x * 39.0 - uv.y * 8.0);
        drape.z += fold * (0.3 + 0.9 * lift);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(drape, 1.0);
      }
    `,
    fragmentShader: `
      uniform float peel;
      uniform float flash;
      varying vec2 fabric;
      varying float fold;
      void main() {
        vec3 dx = dFdx(vec3(fabric, fold * 0.24));
        vec3 dy = dFdy(vec3(fabric, fold * 0.24));
        vec3 normal = normalize(cross(dx, dy));
        float sheen = pow(max(0.0, dot(normal, normalize(vec3(-0.55, 0.45, 0.7)))), 4.0);
        float seam = pow(max(0.0, cos(fabric.y * 54.0 + fabric.x * 28.0)), 14.0);
        float glow = exp(-11.0 * length((fabric - vec2(0.5, 0.56)) * vec2(0.78, 1.0)));
        vec3 color = vec3(0.012, 0.019, 0.017) + sheen * vec3(0.05, 0.085, 0.073);
        color += seam * sheen * vec3(0.045, 0.066, 0.057);
        color += glow * flash * vec3(0.20, 0.52, 0.10);
        gl_FragColor = vec4(color, 1.0 - smoothstep(0.70, 0.98, peel));
        #include <colorspace_fragment>
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.65, 55, 42), material);
  cloth.renderOrder = 5;
  cloth.frustumCulled = false;
  group.add(cloth);
  return cloth;
}

function brainScene(group) {
  const random = randomSequence(4801);
  const neurons = [];
  const surface = new THREE.MeshStandardMaterial({
    color: 0x143b2a, emissive: 0x173d0f, emissiveIntensity: 0.37, roughness: 0.37,
    metalness: 0.13, side: THREE.DoubleSide,
  });
  for (const side of [-1, 1]) {
    const material = side === -1 ? surface : surface.clone();
    group.add(new THREE.Mesh(neuralHemisphere(side), material));
    for (let i = 0; i < 225; i++) {
      const latitude = Math.asin(1 - 2 * (i + 0.5) / 225);
      const longitude = i * 2.399963 + random() * 0.16;
      const point = brainSurface(side, latitude, longitude);
      const center = new THREE.Vector3(side * 0.58, 0.15, 0);
      neurons.push(point.addScaledVector(point.clone().sub(center).normalize(), 0.022));
    }
  }
  const stem = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.29, 6, 14), surface.clone());
  stem.position.set(0, -0.64, -0.26);
  stem.rotation.x = -0.37;
  group.add(stem);
  const connections = [];
  const strands = [];
  const edges = new Set();
  neurons.forEach((from, index) => {
    const neighbors = neurons.map((to, target) => ({ target, distance: from.distanceToSquared(to) }))
      .filter(({ target }) => target !== index)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 4);
    for (const { target } of neighbors) {
      const key = Math.min(index, target) * neurons.length + Math.max(index, target);
      if (edges.has(key)) continue;
      edges.add(key);
      const to = neurons[target];
      const bend = from.clone().lerp(to, 0.5).add(new THREE.Vector3(
        (random() - 0.5) * 0.19, (random() - 0.5) * 0.19, (random() - 0.5) * 0.19,
      ));
      const curve = new THREE.QuadraticBezierCurve3(from, bend, to);
      connections.push(curve);
      const samples = curve.getPoints(6);
      for (let i = 1; i < samples.length; i++) strands.push(...samples[i - 1], ...samples[i]);
    }
  });
  group.add(lineSegments(strands, 0x9be95c, 0.31));
  group.add(glowingPoints(neurons.flatMap(point => [...point]), 0xb4fa83, 5.2, 0.62));
  const rings = orbitalRings(group, 0x72b572, 1.44, 3);
  const sparks = glowingPoints(new Float32Array(90 * 5 * 3), 0xc1ff83, 8, 0.92, 5);
  sparks.frustumCulled = false;
  group.add(sparks);
  const positions = sparks.geometry.attributes.position;
  positions.setUsage(THREE.DynamicDrawUsage);
  const point = new THREE.Vector3();
  const paths = Array.from({ length: 90 }, () => ({
    curve: connections[Math.floor(random() * connections.length)],
    phase: random(),
    speed: 0.32 + random() * 0.66,
  }));

  return (time, burst) => {
    // A short second beat follows the first, with a longer rest between pairs.
    const cycle = (time + 0.35) % 0.94;
    const firstBeat = Math.exp(-Math.pow((cycle - 0.12) / 0.047, 2));
    const secondBeat = Math.exp(-Math.pow((cycle - 0.31) / 0.071, 2));
    const heartbeat = firstBeat + 0.52 * secondBeat;
    rings.rotation.set(0.38, time * 0.19, 0.24 - time * 0.11);
    sparks.material.uniforms.opacity.value = 0.72 + heartbeat * 0.17 + burst * 0.22;
    sparks.material.uniforms.size.value = 8 + burst * 3;
    paths.forEach(({ curve, phase, speed }, index) => {
      const progress = (phase + time * speed) % 1;
      for (let trail = 0; trail < 5; trail++) {
        curve.getPoint(Math.max(0, progress - trail * 0.053), point);
        positions.setXYZ(index * 5 + trail, point.x, point.y, point.z);
      }
    });
    positions.needsUpdate = true;
  };
}

const ambientPalettes = {
  orbit: 0x9edbff,
  field: 0x8be7bc,
  stack: 0xb2c5ff,
};

function ambientScene(group, variant) {
  const color = ambientPalettes[variant];
  const random = randomSequence(106);
  const dust = [];
  for (let i = 0; i < 170; i++) {
    dust.push((random() - 0.5) * 10, (random() - 0.5) * 4, (random() - 0.5) * 4);
  }
  group.add(glowingPoints(dust, color, 4.6, 0.57));

  const form = new THREE.Group();
  group.add(form);
  if (variant === "orbit") {
    orbitalRings(form, color, 1.15, 5);
    const geometry = new THREE.IcosahedronGeometry(1.02, 1);
    const wire = new THREE.WireframeGeometry(geometry);
    geometry.dispose();
    form.add(lineSegments(wire.attributes.position.array, color, 0.32));
    wire.dispose();
  } else if (variant === "field") {
    const waves = [];
    for (let row = 0; row < 19; row++) {
      for (let i = 0; i < 72; i++) {
        for (const column of [i, i + 1]) {
          const x = (column - 36) * 0.11;
          const z = (row - 9) * 0.13;
          waves.push(x, 0.38 * Math.sin(x * 1.7 + z * 2) + 0.23 * Math.cos(x * 2.7 - z), z);
        }
      }
    }
    form.add(lineSegments(waves, color, 0.34));
  } else {
    const cube = new THREE.BoxGeometry(1.55, 1.55, 1.55);
    const edges = new THREE.EdgesGeometry(cube);
    for (let i = 0; i < 6; i++) {
      const layer = lineSegments(edges.attributes.position.array, color, 0.38);
      layer.scale.setScalar(0.48 + i * 0.16);
      layer.rotation.y = i * 0.18;
      form.add(layer);
    }
    cube.dispose();
    edges.dispose();
  }
  return time => {
    form.rotation.set(0.46 + Math.sin(time * 0.27) * 0.18, 0.32 + time * 0.18, -0.18);
  };
}

export function createScene(host, variant) {
  const brain = variant === "brain";
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 40);
  const group = new THREE.Group();
  scene.add(group);
  const update = brain ? brainScene(group) : ambientScene(group, variant);

  const cloth = brain ? revealCloth(scene) : null;
  if (brain) {
    scene.add(new THREE.HemisphereLight(0xbbffd1, 0x163011, 2));
    const key = new THREE.DirectionalLight(0xdcffa8, 3.1);
    key.position.set(3, 4, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x5be7ac, 2.1);
    rim.position.set(-3, 1, -3);
    scene.add(rim);
  }
  let framing = 1;
  host.append(renderer.domElement);

  return {
    resize() {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      camera.aspect = width / height;
      framing = Math.max(1, 1 / camera.aspect);
      camera.position.z = 6.1 * framing;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);
    },
    draw(time, pointer, burst, reveal) {
      if (brain) {
        const progress = THREE.MathUtils.smoothstep(reveal, 0, 1);
        const pushIn = Math.sin(Math.PI * progress);
        camera.position.set(0, pushIn * 0.25, (5.4 - pushIn * 0.82 + progress * 0.28) * framing);
        camera.lookAt(0, 0.06, 0);
        group.rotation.set(0.18 + pointer.y * 0.14, 0.45 + 1.02 * progress + Math.sin(time * 0.43) * 0.16 + pointer.x * 0.31, -0.10);
        cloth.visible = progress < 0.98;
        cloth.material.uniforms.peel.value = progress;
        cloth.material.uniforms.clock.value = time;
        cloth.material.uniforms.flash.value = 0.33 + Math.pow(Math.max(0, Math.sin(time * 4)), 8) * 0.65;
      } else {
        group.rotation.set(0.16 + pointer.y * 0.16, time * 0.09 + pointer.x * 0.35, 0);
      }
      update(time, burst);
      renderer.render(scene, camera);
    },
    dispose() {
      scene.traverse(object => {
        object.geometry?.dispose();
        object.material?.dispose();
      });
      renderer.forceContextLoss();
      renderer.dispose();
      renderer.domElement.remove();
    },
    canvas: renderer.domElement,
  };
}
