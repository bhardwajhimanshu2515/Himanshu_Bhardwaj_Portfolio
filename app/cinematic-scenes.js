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
      pixelRatio: { value: 1 },
      opacity: { value: opacity },
    },
    vertexShader: `
      uniform float size;
      uniform float pixelRatio;
      attribute float strength;
      varying float glow;
      void main() {
        vec4 view = modelViewMatrix * vec4(position, 1.0);
        glow = strength;
        gl_PointSize = size * pixelRatio * (0.55 + strength * 0.45) * 7.0 / -view.z;
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

function circuitShell(group, random) {
  const shell = new THREE.Group();
  const copper = [];
  const gold = [];
  const junctions = [];
  const routes = [];
  for (const radius of [1.29, 1.56, 1.81]) {
    for (let index = 0; index < 165; index++) {
      const azimuth = random() * TAU;
      const latitude = Math.asin(random() * 1.86 - 0.93);
      const sweep = 0.12 + random() * 0.64;
      const step = (random() - 0.5) * 0.37;
      const segments = random() < 0.22 ? gold : copper;
      const route = [];
      for (let point = 0; point <= 22; point++) {
        const progress = point / 22;
        const angle = azimuth + sweep * (Math.min(progress, 0.48) + Math.max(progress - 0.64, 0));
        const height = latitude + step * THREE.MathUtils.clamp((progress - 0.48) / 0.16, 0, 1);
        const ring = radius * Math.cos(height);
        route.push(new THREE.Vector3(ring * Math.cos(angle), radius * Math.sin(height), ring * Math.sin(angle)));
        if (point > 0) segments.push(...route[point - 1], ...route[point]);
        if (point % 11 === 0) junctions.push(...route[point]);
      }
      if (index % 5 === 0) routes.push(route);
    }
  }
  shell.add(lineSegments(copper, 0xfe781b, 0.28));
  shell.add(lineSegments(gold, 0xffba49, 0.53));
  shell.add(glowingPoints(junctions, 0xffa02d, 4.8, 0.65));
  group.add(shell);
  return { shell, routes };
}

function reactorCore(group, random) {
  const core = orbitalRings(group, 0xffd067, 0.16, 7);
  const amber = [];
  const lights = [];
  for (let index = 0; index < 120; index++) {
    const angle = index * TAU / 120;
    const radius = 0.23 + random() * 0.8;
    const end = new THREE.Vector3(radius * Math.cos(angle), radius * Math.sin(angle), (random() - 0.5) * 0.48);
    const inner = end.clone().multiplyScalar(0.19);
    if (index % 3 === 0) amber.push(...inner, ...end);
    lights.push(...end);
  }
  core.add(lineSegments(amber, 0xffac36, 0.47));
  core.add(glowingPoints(lights, 0xffaa29, 7, 0.78));
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.7), new THREE.ShaderMaterial({
    uniforms: { energy: { value: 0.7 } },
    vertexShader: `
      varying vec2 coords;
      void main() {
        coords = uv * 2.0 - 1.0;
        vec4 center = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        vec2 scale = vec2(length(modelViewMatrix[0].xyz), length(modelViewMatrix[1].xyz));
        gl_Position = projectionMatrix * (center + vec4(position.xy * scale, 0.0, 0.0));
      }
    `,
    fragmentShader: `
      uniform float energy;
      varying vec2 coords;
      void main() {
        float r = length(coords);
        float glow = exp(-r * 7.0) * (1.0 - smoothstep(0.65, 1.0, r));
        float flare = exp(-abs(coords.y) * 85.0 - abs(coords.x) * 4.5);
        gl_FragColor = vec4(mix(vec3(1.0, 0.32, 0.018), vec3(1.0, 0.86, 0.44), exp(-r * 5.0)),
          energy * (glow + 0.32 * flare));
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  group.add(glow);
  return { core, glow };
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
  group.add(lineSegments(strands, 0xff7525, 0.18));
  group.add(glowingPoints(neurons.flatMap(point => [...point]), 0xff7d2e, 5.5, 0.54));

  const shell = [];
  for (let i = 0; i < 420; i++) {
    const y = 1 - (2 * i + 1) / 420;
    const angle = i * 2.399963;
    const r = Math.sqrt(1 - y * y);
    shell.push(1.58 * r * Math.cos(angle), 1.58 * y, 1.58 * r * Math.sin(angle));
  }
  group.add(glowingPoints(shell, 0xff6d21, 3.4, 0.45));
  const rings = orbitalRings(group, 0xffa338, 1.65, 5);
  const { shell: circuitry, routes } = circuitShell(group, random);
  const { core, glow } = reactorCore(group, random);
  const current = glowingPoints(new Float32Array(routes.length * 3), 0xffc359, 8, 0.84);
  current.frustumCulled = false;
  circuitry.add(current);
  const currentPositions = current.geometry.attributes.position;
  currentPositions.setUsage(THREE.DynamicDrawUsage);
  const activity = current.geometry.attributes.strength;
  activity.setUsage(THREE.DynamicDrawUsage);
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
    // A short second beat follows the first, with a longer rest between pairs.
    const cycle = (time + 0.35) % 0.94;
    const firstBeat = Math.exp(-Math.pow((cycle - 0.12) / 0.047, 2));
    const secondBeat = Math.exp(-Math.pow((cycle - 0.31) / 0.071, 2));
    const heartbeat = firstBeat + 0.52 * secondBeat;
    const thought = time * 0.18;
    rings.rotation.set(0.38, time * 0.19, 0.24 - time * 0.11);
    circuitry.rotation.set(0.09, -time * 0.14, -0.14);
    circuitry.scale.setScalar(1 + 0.025 * heartbeat);
    core.rotation.set(time * 0.42, time * 0.29, -time * 0.3);
    core.scale.setScalar(1 + 0.11 * heartbeat);
    glow.scale.setScalar(1 + 0.13 * heartbeat);
    glow.material.uniforms.energy.value = 0.52 + 0.45 * heartbeat + burst * 0.28;
    routes.forEach((route, index) => {
      const phase = (time * (0.24 + index % 6 * 0.07) + index * 0.618) % 1;
      const offset = phase * (route.length - 1);
      const segment = Math.floor(offset);
      point.copy(route[segment]).lerp(route[segment + 1], offset - segment);
      currentPositions.setXYZ(index, point.x, point.y, point.z);
      const longitude = Math.atan2(point.z, point.x) / TAU;
      const cluster = Math.pow(Math.max(0, Math.cos(TAU * (longitude - thought) + point.y * 0.9)), 5);
      activity.setX(index, Math.min(1, 0.32 + 0.58 * cluster + 0.17 * heartbeat + burst * 0.19));
    });
    currentPositions.needsUpdate = true;
    activity.needsUpdate = true;
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

function circuitLayers() {
  const group = new THREE.Group();
  const layers = Array.from({ length: 3 }, (_, index) => {
    const layer = new THREE.Group();
    layer.position.y = (1 - index) * 0.88;
    const geometry = new THREE.BoxGeometry(2.7, 0.11, 1.74);
    const surface = new THREE.MeshBasicMaterial({ color: 0x47240f, transparent: true, opacity: 0.62 });
    layer.add(new THREE.Mesh(geometry, surface));
    const outline = new THREE.LineBasicMaterial({ color: 0xfca456 });
    layer.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), outline));
    const traces = [];
    for (const side of [-1, 1]) {
      for (let row = -3; row <= 3; row++) {
        const z = row * 0.20;
        traces.push(side * 0.14, 0.061, z * 0.35, side * 0.56, 0.061, z * 0.35);
        traces.push(side * 0.56, 0.061, z * 0.35, side * 0.8, 0.061, z);
        traces.push(side * 0.8, 0.061, z, side * 1.23, 0.061, z);
      }
    }
    layer.add(lineSegments(traces, 0xff9c44, 0.67));
    group.add(layer);
    return { layer, surface, outline };
  });
  return { group, layers };
}

export function createPortfolioScene(host) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 45);
  const reactor = new THREE.Group();
  scene.add(reactor);
  const updateReactor = brainScene(reactor);
  const pedestal = new THREE.Group();
  for (const radius of [0.83, 1.16, 1.43]) {
    const points = Array.from({ length: 96 }, (_, index) => {
      const angle = index / 96 * TAU;
      return new THREE.Vector3(radius * Math.cos(angle), 0, radius * Math.sin(angle));
    });
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    pedestal.add(new THREE.LineLoop(geometry, new THREE.LineBasicMaterial({
      color: 0xe3873e, opacity: 0.43, transparent: true,
    })));
  }
  scene.add(pedestal);
  const stack = circuitLayers();
  scene.add(stack.group);
  const signal = glowingPoints(new Float32Array(30 * 3), 0xffc276, 12, 1, 30);
  signal.frustumCulled = false;
  reactor.add(signal);
  const signalPoints = signal.geometry.attributes.position;
  signalPoints.setUsage(THREE.DynamicDrawUsage);
  host.append(renderer.domElement);

  return {
    resize() {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2, Math.max(1, Math.sqrt(4500000 / (width * height))));
      renderer.setPixelRatio(pixelRatio);
      scene.traverse(object => {
        if (object.isPoints) object.material.uniforms.pixelRatio.value = pixelRatio;
      });
      renderer.setSize(width, height, false);
    },
    draw(time, pose, pulse, step, selectedLayer) {
      const [angle, distance, elevation, offset, open] = pose;
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);
      camera.position.set(sin * distance, elevation, cos * distance);
      camera.lookAt(0, 0, 0);
      const shift = offset * distance * Math.tan(camera.fov * Math.PI / 360) * camera.aspect;
      reactor.position.set(cos * shift, open * -1.9, -sin * shift);
      reactor.scale.setScalar(1 - open * 0.60);
      reactor.visible = open < 0.98;
      reactor.rotation.y = time * 0.12;
      pedestal.position.set(cos * shift, -2.02, -sin * shift);
      pedestal.scale.setScalar(1 - open * 0.6);
      pedestal.visible = open < 0.94;
      if (reactor.visible) updateReactor(time, pulse);

      signal.visible = pulse > 0.005;
      if (signal.visible) {
        signal.material.uniforms.opacity.value = pulse;
        for (let i = 0; i < signalPoints.count; i++) {
          const phase = step * TAU / 3 + (1 - pulse) * TAU - i * 0.045;
          signalPoints.setXYZ(i, 1.86 * Math.cos(phase), 0.47 * Math.sin(phase * 2), 1.86 * Math.sin(phase));
        }
        signalPoints.needsUpdate = true;
      }

      stack.group.visible = open > 0.015;
      stack.group.position.set(cos * shift, 0, -sin * shift);
      stack.group.rotation.set(0.12, angle + time * 0.09, -0.10);
      stack.group.scale.setScalar(open);
      stack.layers.forEach(({ layer, surface, outline }, index) => {
        const selected = selectedLayer === index || selectedLayer === 3;
        layer.position.y = (1 - index) * (0.45 + open * 0.46) + (selected ? 0.1 : 0);
        surface.color.setHex(selected ? 0xab5b21 : 0x47240f);
        outline.color.setHex(selected ? 0xffd395 : 0xc77b3f);
      });
      renderer.render(scene, camera);
    },
    dispose() {
      scene.traverse(object => {
        object.geometry?.dispose();
        object.material?.dispose();
      });
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
    canvas: renderer.domElement,
  };
}

function revealCloth(group) {
  const material = new THREE.ShaderMaterial({
    uniforms: { peel: { value: 0 }, clock: { value: 0 }, flash: { value: 0 } },
    vertexShader: `
      uniform float peel;
      uniform float clock;
      varying vec2 fabric;
      varying vec3 clothNormal;
      varying vec3 viewPosition;

      vec3 drape(vec2 uv) {
        vec2 centered = uv * 2.0 - 1.0;
        float lift = pow(peel, 1.15);
        float gathered = smoothstep(0.18, 0.94, uv.x);
        float falling = smoothstep(0.1, 0.95, 1.0 - uv.y);
        float folds = sin(uv.x * 30.0 + uv.y * 4.3)
          + 0.37 * sin(uv.x * 56.0 - uv.y * 12.0);
        float ripple = sin(uv.y * 17.0 - uv.x * 13.0 - clock * 2.4);
        float bulge = max(0.0, cos(centered.x * 1.57) * cos(centered.y * 1.40));
        return vec3(
          centered.x * 2.24 * (1.0 - 0.54 * lift) + lift * 4.25
            + 0.14 * centered.x * falling * folds,
          centered.y * 2.04 + 0.25 * bulge - 0.24 * centered.x * centered.x
            + lift * (1.48 + 0.68 * gathered + 0.18 * ripple),
          0.30 + 1.47 * pow(bulge, 0.65)
            + folds * (0.06 + 0.13 * falling) + ripple * (0.022 + lift * 0.31)
        );
      }

      void main() {
        fabric = uv;
        vec3 point = drape(uv);
        vec3 du = drape(uv + vec2(0.001, 0.0)) - drape(uv - vec2(0.001, 0.0));
        vec3 dv = drape(uv + vec2(0.0, 0.001)) - drape(uv - vec2(0.0, 0.001));
        clothNormal = normalize(normalMatrix * normalize(cross(du, dv)));
        vec4 view = modelViewMatrix * vec4(point, 1.0);
        viewPosition = view.xyz;
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: `
      uniform float peel;
      uniform float flash;
      varying vec2 fabric;
      varying vec3 clothNormal;
      varying vec3 viewPosition;

      void main() {
        vec3 normal = normalize(clothNormal) * (gl_FrontFacing ? 1.0 : -1.0);
        vec3 view = normalize(-viewPosition);
        vec3 key = normalize(vec3(-0.44, 0.72, 0.72));
        float diffuse = max(0.0, dot(normal, key));
        float satin = pow(max(0.0, dot(normal, normalize(key + view))), 18.0);
        float rim = pow(1.0 - clamp(dot(normal, view), 0.0, 1.0), 2.6);
        float hemDistance = min(min(fabric.x, 1.0 - fabric.x), min(fabric.y, 1.0 - fabric.y));
        float hem = 1.0 - smoothstep(0.005, 0.017, hemDistance);
        float glow = exp(-9.0 * length((fabric - vec2(0.5, 0.56)) * vec2(0.78, 1.0)));
        vec3 color = vec3(0.015, 0.019, 0.023)
          + diffuse * vec3(0.034, 0.041, 0.047)
          + satin * vec3(0.17, 0.19, 0.21)
          + (0.56 * rim + 0.44 * hem) * vec3(0.090, 0.100, 0.110);
        color += glow * flash * vec3(0.14, 0.090, 0.041);
        float opacity = (0.48 + 0.16 * rim + 0.08 * hem) * (1.0 - smoothstep(0.66, 0.98, peel));
        gl_FragColor = vec4(color, opacity);
        #include <colorspace_fragment>
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 128, 104), material);
  cloth.renderOrder = 5;
  cloth.frustumCulled = false;
  group.add(cloth);
  return cloth;
}

export function createEntranceScene(host) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 40);
  const cloth = revealCloth(scene);
  host.append(renderer.domElement);

  return {
    resize() {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      cloth.scale.set(Math.max(camera.aspect, 0.8), 1.17, 1);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
    },
    draw(time, progress) {
      const peel = THREE.MathUtils.smoothstep(progress, 0, 1);
      camera.position.z = 5.4 + 1.9 * peel;
      cloth.material.uniforms.peel.value = peel;
      cloth.material.uniforms.clock.value = time;
      cloth.material.uniforms.flash.value = 0.26 + 0.19 * Math.pow(Math.max(0, Math.sin(time * 2)), 5);
      renderer.render(scene, camera);
    },
    dispose() {
      cloth.geometry.dispose();
      cloth.material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
    canvas: renderer.domElement,
  };
}
