const keyframes = [
  // Angle around the reactor, camera distance, elevation, screen offset, layer separation.
  ["overview",   [0.12, 7.2, 0.3, 0.55, 0]],
  ["projects",   [1.08, 6.8, 0.5, 0.53, 0]],
  ["experience", [2.16, 8.8, 1.1, -0.5, 0]],
  ["expertise",  [2.93, 6.2, 1.7, -0.50, 1]],
  ["contact",    [3.80, 9.6, 0.8, 0.46, 0]],
];

export function measureJourney(main, height, maxScroll, scroll) {
  return keyframes.map(([id, pose], index) => {
    const top = main.querySelector(`#${id}`).getBoundingClientRect().top + scroll;
    return { at: index === 0 ? 0 : Math.min(maxScroll, Math.max(0, top - height * 0.38)), pose };
  });
}

export function journeyPose(keyframes, scroll) {
  for (let i = 1; i < keyframes.length; i++) {
    const next = keyframes[i];
    if (scroll >= next.at) continue;
    const previous = keyframes[i - 1];
    const progress = Math.max(0, (scroll - previous.at) / Math.max(1, next.at - previous.at));
    const blend = progress * progress * (3 - 2 * progress);
    return previous.pose.map((value, index) => value + (next.pose[index] - value) * blend);
  }
  return keyframes.at(-1).pose;
}
