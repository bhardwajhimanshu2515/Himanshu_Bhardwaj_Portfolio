export function createFallbackBeam(figure, overlay) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return;
  overlay.append(canvas);
  let width;
  let height;
  let visible = false;

  return {
    canvas,
    resize() {
      width = overlay.clientWidth;
      height = overlay.clientHeight;
      canvas.width = width;
      canvas.height = height;
    },
    draw({ target, lift, power, thrust, bank, elapsed }) {
      if (visible) context.clearRect(0, 0, width, height);
      visible = thrust > .015 || Boolean(target && power > .005);
      if (!visible) return;

      const box = figure.getBoundingClientRect();
      if (thrust > .015) {
        context.save();
        context.translate(box.left + box.width * .54, box.top + box.height * .72);
        context.rotate(bank * .24);
        for (const [index, x] of [-.16, .18].entries()) {
          const length = box.height * .63 * thrust * (.88 + .12 * Math.sin(elapsed * 72 + index * 2));
          const flame = context.createLinearGradient(0, 0, 0, length);
          flame.addColorStop(0, "rgba(255, 242, 194, .96)");
          flame.addColorStop(.34, "rgba(255, 168, 53, .79)");
          flame.addColorStop(1, "rgba(255, 118, 18, 0)");
          context.fillStyle = flame;
          context.beginPath();
          context.ellipse(box.width * x, length * .43, box.width * .074, length * .57, 0, 0, Math.PI * 2);
          context.fill();
        }
        context.restore();
      }

      if (!target || power <= .005) return;
      const wristX = box.left + box.width * (target.x < box.left + box.width / 2 ? .27 : .73);
      const wristY = box.top + box.height * (.76 - lift * .025);
      const angle = Math.atan2(target.y - wristY, target.x - wristX);
      const distance = Math.hypot(target.x - wristX, target.y - wristY);
      const reach = Math.min(27, distance * .35);
      const spread = Math.max(20, Math.min(86, distance * .085));
      context.save();
      context.globalAlpha = power;
      context.translate(target.x, target.y);
      context.scale(target.radiusX, target.radiusY);
      const halo = context.createRadialGradient(0, 0, 0, 0, 0, 1);
      halo.addColorStop(0, "rgba(255, 210, 135, .25)");
      halo.addColorStop(1, "rgba(255, 172, 72, 0)");
      context.fillStyle = halo;
      context.fillRect(-1, -1, 2, 2);
      context.restore();

      context.save();
      context.globalAlpha = power;
      context.translate(wristX, wristY);
      context.rotate(angle);
      const light = context.createLinearGradient(reach, 0, Math.max(reach + 1, distance), 0);
      light.addColorStop(0, "rgba(255, 230, 170, .58)");
      light.addColorStop(.78, "rgba(255, 183, 88, .25)");
      light.addColorStop(1, "rgba(255, 196, 110, 0)");
      context.fillStyle = light;
      context.beginPath();
      context.moveTo(reach, -2);
      context.lineTo(distance, -spread);
      context.lineTo(distance, spread);
      context.lineTo(reach, 2);
      context.filter = "blur(5px)";
      context.fill();
      context.filter = "none";
      context.fillStyle = "#352d26";
      context.fillRect(0, -3, reach, 6);
      context.shadowColor = "#ffa932";
      context.shadowBlur = 14;
      context.fillStyle = "#ffe3ae";
      context.fillRect(reach - 2, -3, 3, 6);
      context.restore();
    },
    dispose() {
      canvas.remove();
    },
  };
}
