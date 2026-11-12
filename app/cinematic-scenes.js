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

function brainScene(group) {
  const random = randomSequence(4801);
  const neurons = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 108; i++) {
      const height = random() * 2 - 1;
      const angle = random() * TAU;
      const radius = Math.sqrt(1 - height * height) * (0.65 + random() * 0.35);
      const folds = 1 + 0.10 * Math.sin(angle * 9 + height * 11);
      neurons.push(new THREE.Vector3(
        side * (0.63 + 0.59 * radius * Math.cos(angle) * folds),
        height * 0.89 + 0.14,
        radius * Math.sin(angle) * 1.12 * folds,
      ));
    }
  }
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
  group.add(lineSegments(strands, 0xff7525, 0.34));
  group.add(glowingPoints(neurons.flatMap(point => [...point]), 0xff7d2e, 9, 0.84));

  const shell = [];
  for (let i = 0; i < 420; i++) {
    const y = 1 - (2 * i + 1) / 420;
    const angle = i * 2.399963;
    const r = Math.sqrt(1 - y * y);
    shell.push(1.58 * r * Math.cos(angle), 1.58 * y, 1.58 * r * Math.sin(angle));
  }
  group.add(glowingPoints(shell, 0xff6d21, 3.4, 0.45));
  const rings = orbitalRings(group, 0xff8b3d, 1.72, 4);
  const sparks = glowingPoints(new Float32Array(68 * 5 * 3), 0xff9e43, 7.2, 0.92, 5);
  sparks.frustumCulled = false;
  group.add(sparks);
  const positions = sparks.geometry.attributes.position;
  positions.setUsage(THREE.DynamicDrawUsage);
  const point = new THREE.Vector3();
  const paths = Array.from({ length: 68 }, () => ({
    curve: connections[Math.floor(random() * connections.length)],
    phase: random(),
    speed: 0.32 + random() * 0.66,
  }));

  return (time, burst) => {
    rings.rotation.set(0.38, time * 0.19, 0.24 - time * 0.11);
    sparks.material.uniforms.opacity.value = 0.74 + burst * 0.26;
    sparks.material.uniforms.size.value = 7.2 + burst * 3;
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

  host.append(renderer.domElement);

  return {
    resize() {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      camera.aspect = width / height;
      camera.position.z = (brain ? 6.9 : 6.1) / Math.min(camera.aspect, 1);
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);
    },
    draw(time, pointer, burst) {
      group.rotation.set(0.16 + pointer.y * 0.16, time * (brain ? 0.29 : 0.09) + pointer.x * 0.35, 0);
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
