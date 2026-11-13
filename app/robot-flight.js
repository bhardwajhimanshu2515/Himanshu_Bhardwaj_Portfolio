const GAP = 22;
export const FLIGHT_TIME = 760;

export function headlineDock(home, headline, width, height, header) {
  const right = headline.right + GAP;
  const left = headline.left - GAP - home.width;
  const minTop = header + 28;
  const maxTop = Math.max(minTop, height - home.height - 60);
  const beside = right + home.width <= width - 10 || left >= 10;
  const x = right + home.width <= width - 10 ? right : left;
  const y = (headline.top + headline.bottom - home.height) / 2;
  if (beside) return { x: x - home.left, y: Math.max(minTop, Math.min(maxTop, y)) - home.top };

  // When the title spans the screen, hover below its right edge.
  const below = headline.bottom + GAP;
  const above = headline.top - GAP - home.height;
  const top = below <= maxTop ? below : Math.max(minTop, above);
  return { x: 0, y: Math.min(maxTop, top) - home.top };
}

export function flightPose(from, to, progress) {
  const ease = progress * progress * (3 - 2 * progress);
  const thrust = Math.sin(Math.PI * progress);
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  return {
    x: from.x + (to.x - from.x) * ease,
    y: from.y + (to.y - from.y) * ease - Math.min(64, distance * .15) * thrust,
    thrust: Math.min(1, distance / 35) * thrust,
    bank: Math.sign(to.x - from.x) * thrust,
  };
}
