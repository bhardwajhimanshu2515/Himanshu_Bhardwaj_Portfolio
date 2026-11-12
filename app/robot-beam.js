import * as THREE from "three";

export function createRobotBeam() {
  const uniforms = {
    resolution: { value: new THREE.Vector2() },
    origin: { value: new THREE.Vector2() },
    target: { value: new THREE.Vector2() },
    spotSize: { value: new THREE.Vector2() },
    strength: { value: 0 },
    time: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    vertexShader: `
      varying vec2 uvScreen;
      void main() {
        uvScreen = vec2(uv.x, 1.0 - uv.y);
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 uvScreen;
      uniform vec2 resolution, origin, target, spotSize;
      uniform float strength, time;

      void main() {
        vec2 pixel = uvScreen * resolution;
        vec2 ray = target - origin;
        float distanceToTarget = max(length(ray), 1.0);
        vec2 direction = ray / distanceToTarget;
        vec2 relative = pixel - origin;
        float along = dot(relative, direction);
        float progress = clamp(along / distanceToTarget, 0.0, 1.0);
        float crosswise = dot(relative, vec2(-direction.y, direction.x));
        float spread = mix(2.0, clamp(distanceToTarget * .085, 18.0, 112.0), progress);
        float crossRatio = crosswise / spread;
        float falloff = crossRatio * crossRatio;
        float cone = exp(-3.1 * falloff);
        float ends = smoothstep(-1.0, 16.0, along) *
          (1.0 - smoothstep(distanceToTarget * .87, distanceToTarget + 8.0, along));
        float haze = .85 + .15 * sin(along * .055 - time * 4.0 + crosswise * .12);
        float shaft = cone * ends * haze * mix(.30, .48, progress);
        float core = exp(-15.0 * falloff) * ends * .12;
        vec2 hit = (pixel - target) / spotSize;
        float halo = exp(-2.4 * dot(hit, hit));
        float lens = exp(-dot(relative, relative) / 82.0) * .72;
        float alpha = min(.84, (shaft + core + halo * .27 + lens) * strength);
        vec3 tint = mix(vec3(.91, .48, .12), vec3(1.0, .89, .65), clamp(core * 4.0 + halo + lens, 0.0, 1.0));
        gl_FragColor = vec4(tint, alpha);
      }
    `,
  });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const quad = new THREE.Mesh(geometry, material);
  quad.frustumCulled = false;
  scene.add(quad);
  return {
    render(renderer, width, height, lens, target, power, elapsed) {
      if (power < .005 || !target) return;
      uniforms.resolution.value.set(width, height);
      uniforms.origin.value.set(lens.x, lens.y);
      uniforms.target.value.set(target.x, target.y);
      uniforms.spotSize.value.set(target.radiusX, target.radiusY);
      uniforms.strength.value = power;
      uniforms.time.value = elapsed;
      renderer.render(scene, camera);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
