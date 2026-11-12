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
    draw({ target, lift, power }) {
      if (visible) context.clearRect(0, 0, width, height);
      visible = Boolean(target && power > .005);
      if (!visible) return;

      const box = figure.getBoundingClientRect();
      const wristX = box.left + box.width * .27;
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
      halo.addColorStop(0, "rgba(255, 210, 135, .31)");
      halo.addColorStop(1, "rgba(255, 172, 72, 0)");
      context.fillStyle = halo;
      context.fillRect(-1, -1, 2, 2);
      context.restore();

      context.save();
      context.globalAlpha = power;
      context.translate(wristX, wristY);
      context.rotate(angle);
      const light = context.createLinearGradient(reach, 0, Math.max(reach + 1, distance), 0);
      light.addColorStop(0, "rgba(255, 230, 170, .72)");
      light.addColorStop(.78, "rgba(255, 183, 88, .31)");
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
