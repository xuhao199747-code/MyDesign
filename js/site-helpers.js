(function registerSiteHelpers() {
  function createHeadTrackerMath({ frameCount, angleKeys, frontFrame }) {
    const normalizeFrame = (frame) => {
      return ((Math.round(frame) % frameCount) + frameCount) % frameCount;
    };

    const interpolateFrame = (fromFrame, toFrame, t) => {
      let delta = toFrame - fromFrame;
      if (delta > frameCount / 2) delta -= frameCount;
      if (delta < -frameCount / 2) delta += frameCount;
      return normalizeFrame(fromFrame + delta * t);
    };

    const signedFrameDelta = (fromFrame, toFrame) => {
      if (toFrame === frontFrame && fromFrame > frontFrame) {
        return -fromFrame;
      }
      let delta = toFrame - fromFrame;
      if (delta > frameCount / 2) delta -= frameCount;
      if (delta < -frameCount / 2) delta += frameCount;
      return delta;
    };

    const pickCalibratedFrame = (angle) => {
      for (let i = 0; i < angleKeys.length - 1; i += 1) {
        const from = angleKeys[i];
        const to = angleKeys[i + 1];
        if (angle < from.angle || angle > to.angle) continue;
        const t = (angle - from.angle) / (to.angle - from.angle || 1);
        const frame = interpolateFrame(from.frame, to.frame, t);
        return {
          frame,
          direction:
            t < 0.34 ? from.direction : t > 0.66 ? to.direction : `${from.direction}-to-${to.direction}`,
        };
      }
      return angleKeys[0];
    };

    return {
      normalizeFrame,
      interpolateFrame,
      signedFrameDelta,
      pickCalibratedFrame,
    };
  }

  function getMeasuredBoxSize(container, selector, fallbackSize) {
    if (!container) return fallbackSize;
    const first = container.querySelector(selector);
    if (!first) return fallbackSize;
    const width = parseFloat(globalThis.getComputedStyle(first).width);
    return Number.isFinite(width) && width > 0 ? width : fallbackSize;
  }

  function resolveParticleCollisions(particles, size, options = {}) {
    const minDistRatio = options.minDistRatio ?? 0.86;
    const restitution = options.restitution ?? 0.32;
    const minDist = size * minDistRatio;

    for (let i = 0; i < particles.length; i += 1) {
      const a = particles[i];
      if (!a.active) continue;

      for (let j = i + 1; j < particles.length; j += 1) {
        const b = particles[j];
        if (!b.active) continue;

        const ax = a.x + size * 0.5;
        const ay = a.y + size * 0.5;
        const bx = b.x + size * 0.5;
        const by = b.y + size * 0.5;

        const dx = bx - ax;
        const dy = by - ay;
        const distSq = dx * dx + dy * dy;
        if (distSq === 0) continue;

        const dist = Math.sqrt(distSq);
        if (dist >= minDist) continue;

        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;

        a.x -= nx * overlap * 0.5;
        a.y -= ny * overlap * 0.5;
        b.x += nx * overlap * 0.5;
        b.y += ny * overlap * 0.5;

        const rvx = b.vx - a.vx;
        const rvy = b.vy - a.vy;
        const velAlongNormal = rvx * nx + rvy * ny;
        if (velAlongNormal > 0) continue;

        const impulse = (-(1 + restitution) * velAlongNormal) / 2;
        const ix = impulse * nx;
        const iy = impulse * ny;

        a.vx -= ix;
        a.vy -= iy;
        b.vx += ix;
        b.vy += iy;
      }
    }
  }

  const siteHelpers = {
    createHeadTrackerMath,
    getMeasuredBoxSize,
    resolveParticleCollisions,
  };

  globalThis.__siteHelpers = siteHelpers;
  if (typeof window !== "undefined") {
    window.__siteHelpers = siteHelpers;
  }
})();
