/**
 * 作品集页面交互脚本
 *
 * 模块概览：
 * 1. 导航菜单 — 移动端抽屉开关、点击链接关闭、大屏重置
 * 2. 锚点滚动 — 平滑滚动到 # 区块，并扣除固定导航占位
 * 3. Logo 墙物理 — 技能图标下落、碰撞、落地静止；进入视口后启动
 * 4. 照片区揭幕 — 双图叠放，上层不位移，随滚动用裁剪减小上层可见区域以露出下层（非透明度）
 * 5. GSAP Flair — 鼠标移动拖尾小图动画（需先加载 gsap.min.js）
 * 6. 工作经历区悬停预览 — GreenSock quickTo + autoAlpha（.works-swipe-section，CodePen PwqrzeG）
 * 7. 作品区无限卡片 — Draggable + 横向滚轮（无 pin，CodePen RwKwLWK 变体）
 */

// =============================================================================
// 模块 1：导航菜单（.menu-toggle / .menu-wrap）
// =============================================================================
const menuToggle = document.getElementById("menuToggle");
const menuWrap = document.getElementById("menuWrap");
const navbar = document.querySelector(".navbar");

if (menuToggle && menuWrap) {
  const isMobileViewport = () => window.innerWidth <= 768;

  const syncMenuOpenState = () => {
    const isOpen = isMobileViewport() && menuWrap.classList.contains("open");
    document.body.classList.toggle("menu-open", isOpen);
  };

  const closeMenu = () => {
    menuWrap.classList.remove("open");
    syncMenuOpenState();
  };

  menuToggle.addEventListener("click", () => {
    menuWrap.classList.toggle("open");
    syncMenuOpenState();
  });

  menuWrap.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  // 点击菜单外区域时关闭，避免 body 一直处于 overflow:hidden。
  document.addEventListener("click", (event) => {
    if (!isMobileViewport()) return;
    if (!menuWrap.classList.contains("open")) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (menuWrap.contains(target) || menuToggle.contains(target)) return;
    closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      closeMenu();
    }
  });

  window.addEventListener("hashchange", closeMenu);
  window.addEventListener("pageshow", syncMenuOpenState);
  syncMenuOpenState();
}

// 导航栏：仅在页面滚动后出现边框与背景（与顶部透明态区分）
const NAVBAR_SCROLL_THRESHOLD = 8;

function updateNavbarScrolledState() {
  if (!navbar) return;
  navbar.classList.toggle(
    "navbar--scrolled",
    window.scrollY > NAVBAR_SCROLL_THRESHOLD
  );
}

if (navbar) {
  updateNavbarScrolledState();
  window.addEventListener("scroll", updateNavbarScrolledState, { passive: true });
}

// =============================================================================
// 模块 2：锚点平滑滚动（a[href^="#"]）
// =============================================================================
/** 与顶栏实际占位一致：小屏为 fixed，大屏为 sticky，均用布局测量避免与 CSS 脱节 */
function getAnchorOffset() {
  if (!navbar) return 96;
  const r = navbar.getBoundingClientRect();
  const breathe = window.innerWidth <= 768 ? 8 : 24;
  return r.bottom + breathe;
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const href = anchor.getAttribute("href");
    if (!href || href === "#") return;

    const target = document.querySelector(href);
    if (!target) return;

    event.preventDefault();
    const targetTop = target.getBoundingClientRect().top + window.pageYOffset;
    const y = Math.max(0, targetTop - getAnchorOffset());

    window.scrollTo({
      top: y,
      behavior: "smooth",
    });
  });
});

// =============================================================================
// 模块 2.5：首屏小视频 — 初次与每次回到视口都播放一次
// =============================================================================
const heroBadgeVideo = document.querySelector(".hero-img2-video");

if (heroBadgeVideo) {
  let hasPlayedInCurrentViewport = false;

  const playHeroBadgeVideo = () => {
    heroBadgeVideo.currentTime = 0;
    const playPromise = heroBadgeVideo.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  };

  const heroBadgeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!hasPlayedInCurrentViewport) {
            hasPlayedInCurrentViewport = true;
            playHeroBadgeVideo();
          }
        } else {
          hasPlayedInCurrentViewport = false;
        }
      });
    },
    { threshold: 0.55 }
  );

  heroBadgeObserver.observe(heroBadgeVideo);
}

// =============================================================================
// 模块 3：技能 Logo 墙 — 2D 简易物理（重力 + 边界 + 粒子碰撞）
// =============================================================================
const logoWall = document.querySelector(".logo-wall");
let physicsStarted = false;
let physicsRafId = null;
let logoParticles = [];

/** 随机数，用于初始位置与速度抖动 */
function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

/** 读取当前 CSS 下图标边长，供碰撞与边界计算 */
function getLogoSize() {
  if (!logoWall) return 64;
  const first = logoWall.querySelector("img");
  if (!first) return 64;
  const width = parseFloat(window.getComputedStyle(first).width);
  return Number.isFinite(width) && width > 0 ? width : 64;
}

/** 两两粒子弹性分离 + 冲量，减少图标重叠 */
function resolveLogoCollisions(particles, size) {
  const minDist = size * 0.86;
  const restitution = 0.32;

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

      // 先分离位置，防止图标重叠穿透。
      a.x -= nx * overlap * 0.5;
      a.y -= ny * overlap * 0.5;
      b.x += nx * overlap * 0.5;
      b.y += ny * overlap * 0.5;

      // 再做速度冲量，形成“碰撞后分开”的牛顿感。
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

/** 按容器宽度铺排初始 x，从上方随机高度落下，写入 logoParticles */
function setupLogoParticles() {
  if (!logoWall) return;

  const logos = Array.from(logoWall.querySelectorAll("img"));
  if (!logos.length) {
    logoParticles = [];
    return;
  }

  const wallWidth = logoWall.clientWidth;
  const wallHeight = logoWall.clientHeight;
  const isMobile = window.innerWidth <= 768;
  const size = getLogoSize();
  const edgeSafe = isMobile ? 6 : 14;
  const floorSafe = isMobile ? 20 : 44;
  const usableWidth = wallWidth - size - edgeSafe * 2;
  const step = usableWidth / Math.max(logos.length - 1, 1);
  const baseGround = wallHeight - size - floorSafe;

  logoParticles = logos.map((el, index) => {
    const jitter = isMobile ? randomInRange(-11, 11) : randomInRange(-18, 18);
    const x = Math.max(
      edgeSafe,
      Math.min(wallWidth - size - edgeSafe, edgeSafe + index * step + jitter)
    );
    const ground = baseGround;
    const angle = randomInRange(-26, 26);
    // 起始高度随容器高度变化，移动端略轻、避免窄屏横向挤出
    const startY = isMobile
      ? -Math.min(240, wallHeight * 0.72) - randomInRange(0, 56)
      : -280 - randomInRange(0, 120);

    el.style.opacity = "0";
    el.style.transform = `translate3d(${x}px, ${startY}px, 0) rotate(${angle}deg)`;

    return {
      el,
      x,
      y: startY,
      vx: randomInRange(-20, 20),
      vy: randomInRange(0, 20),
      angle,
      av: randomInRange(-120, 120),
      ground,
      delay: randomInRange(0, 0.75),
      active: false,
      settled: false,
    };
  });
}

/** 启动 rAF 主循环：重力、地面反弹、静止判定，结束时停止帧循环 */
function startLogoPhysics() {
  if (!logoWall || physicsStarted || !logoParticles.length) return;
  physicsStarted = true;

  const isMobile = window.innerWidth <= 768;
  const gravity = isMobile ? 1800 : 2100;
  const bounce = isMobile ? 0.34 : 0.38;
  const drag = 0.996;
  const sideDamp = 0.55;
  const rotationDamp = 0.88;
  const wallWidth = logoWall.clientWidth;
  const size = getLogoSize();
  const edgeSafe = isMobile ? 6 : 14;
  const floorSafe = isMobile ? 20 : 44;
  const floorY = logoWall.clientHeight - size - floorSafe;
  let elapsed = 0;
  let lastTs = 0;

  const tick = (ts) => {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.033, (ts - lastTs) / 1000);
    lastTs = ts;
    elapsed += dt;

    let allSettled = true;

    logoParticles.forEach((p) => {
      if (!p.active && elapsed >= p.delay) {
        p.active = true;
        p.el.style.opacity = "1";
      }

      if (!p.active) {
        allSettled = false;
        return;
      }

      if (p.settled) {
        return;
      }

      p.vy += gravity * dt;
      p.vx *= drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle += p.av * dt;

      if (p.x < edgeSafe) {
        p.x = edgeSafe;
        p.vx *= -sideDamp;
      } else if (p.x > wallWidth - size - edgeSafe) {
        p.x = wallWidth - size - edgeSafe;
        p.vx *= -sideDamp;
      }

      if (p.y >= p.ground) {
        p.y = p.ground;
        p.vy *= -bounce;
        p.vx *= 0.9;
        p.av *= rotationDamp;

        if (Math.abs(p.vy) < 24) {
          p.vy = 0;
          p.av *= 0.7;
        }
      }

      if (Math.abs(p.vx) < 3 && Math.abs(p.vy) < 3 && Math.abs(p.y - p.ground) < 0.5) {
        p.vx = 0;
        p.vy = 0;
        p.av = 0;
        p.y = p.ground;
        p.settled = true;
      } else {
        allSettled = false;
      }

      p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.angle.toFixed(2)}deg)`;
    });

    // 迭代两次，提升“堆叠稳定性”，避免 logo 互相穿透重叠。
    resolveLogoCollisions(logoParticles, size);
    resolveLogoCollisions(logoParticles, size);

    // 碰撞后再做一轮边界回收，防止被挤出墙或地面。
    logoParticles.forEach((p) => {
      if (!p.active) return;

      if (p.x < edgeSafe) p.x = edgeSafe;
      if (p.x > wallWidth - size - edgeSafe) p.x = wallWidth - size - edgeSafe;
      if (p.y > floorY) p.y = floorY;

      p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.angle.toFixed(2)}deg)`;
    });

    if (!allSettled) {
      physicsRafId = requestAnimationFrame(tick);
    } else {
      physicsRafId = null;
    }
  };

  physicsRafId = requestAnimationFrame(tick);

  setTimeout(() => {
    logoParticles.forEach((p) => {
      if (!p.settled) p.el.style.opacity = "1";
    });
  }, 120);
}

// --- 模块 3（续）：何时启动物理 — 每次进入视口都重播 + resize 重置 ---
if (logoWall) {
  setupLogoParticles();

  const restartLogoPhysics = () => {
    if (physicsRafId) {
      cancelAnimationFrame(physicsRafId);
      physicsRafId = null;
    }
    physicsStarted = false;
    setupLogoParticles();
    startLogoPhysics();
  };

  let hasPlayedInCurrentViewport = false;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!hasPlayedInCurrentViewport) {
            hasPlayedInCurrentViewport = true;
            restartLogoPhysics();
          }
        } else {
          hasPlayedInCurrentViewport = false;
        }
      });
    },
    // 进入可视区再触发，避免首屏未到达时提前开始动画
    { threshold: 0.2, rootMargin: "0px 0px -6% 0px" }
  );

  observer.observe(logoWall);

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      hasPlayedInCurrentViewport = false;
      restartLogoPhysics();
    }, 160);
  });
}

// =============================================================================
// 模块 4：#photo 双图揭幕（上层固定叠放，clip-path 裁切露出下层，非视差、非透明度）
// =============================================================================
const photoSection = document.querySelector("#photo");
const photoImagesWrap = document.querySelector("#photo .photo-images");
const frontPhotoImage = document.querySelector("#photo .photo-image-front");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (photoSection && photoImagesWrap && frontPhotoImage && !prefersReducedMotion) {
  let revealRafId = null;

  /** 根据区块在视口中的滚动进度（0~1），从下往上裁切上层图，露出同位置叠放的下层 */
  const renderPhotoReveal = () => {
    const rect = photoSection.getBoundingClientRect();
    const vh = window.innerHeight;
    // 裁切进度 0→1 对应区块上沿从 start 滚到 end。(start−end) 越大，同样手势下变化越慢
    const start = vh * 0.72;
    const end = vh * -0.18;
    const progressRaw = (start - rect.top) / (start - end);
    const progress = Math.max(0, Math.min(1, progressRaw));
    // 指数越小，全程越均匀；过大则前慢后快、末尾容易显得「一下裁完」
    const easedProgress = Math.pow(progress, 2.6);
    // inset(top right bottom left)：从下侧向内 inset，越大上层可见越少，下层露出越多
    const bottomInsetPct = (easedProgress * 100).toFixed(2);
    const clip = `inset(0 0 ${bottomInsetPct}% 0)`;
    frontPhotoImage.style.clipPath = clip;
    frontPhotoImage.style.webkitClipPath = clip;

    revealRafId = null;
  };

  /** 用 rAF 合并 scroll/resize，避免同一帧内重复计算 */
  const requestPhotoReveal = () => {
    if (revealRafId) return;
    revealRafId = requestAnimationFrame(renderPhotoReveal);
  };

  requestPhotoReveal();
  window.addEventListener("scroll", requestPhotoReveal, { passive: true });
  window.addEventListener("resize", requestPhotoReveal);
}

// =============================================================================
// 模块 5：GSAP Flair 鼠标轨迹
// 参考：https://codepen.io/GreenSock/pen/WbbEGmp
// 依赖：index.html 中先于本文件引入 gsap.min.js；无 gsap 或用户偏好减少动效则跳过
// 原理：鼠标移动超过一定距离时轮流使用固定数量的 .flair 图片，在指针处播放
//       弹出 → 随机旋转 → 落出视口的动画，形成拖尾感。
// =============================================================================
const flairReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (typeof gsap !== "undefined" && !flairReducedMotion) {
  /**
   * 单个 flair 图形的入场与离场时间轴（与 CodePen 原版一致）
   * @param {HTMLElement} shape - 带 .flair 类的 img 元素
   */
  function playAnimation(shape) {
    const tl = gsap.timeline();
    tl.from(shape, {
      opacity: 0,
      scale: 0,
      ease: "elastic.out(1,0.3)",
    })
      .to(
        shape,
        {
          rotation: "random([-360, 360])",
        },
        "<"
      )
      .to(
        shape,
        {
          y: "120vh",
          ease: "back.in(.4)",
          duration: 1,
        },
        0
      );
  }

  // --- 多张小图轮流复用；gap 为两次触发之间的最小鼠标位移（像素）---
  const flair = gsap.utils.toArray(".flair");
  // 鼠标累计移动超过该像素距离才触发一次动画，数值越大「粒子」越稀疏
  let gap = 100;
  let index = 0;
  const wrapper = gsap.utils.wrap(0, flair.length);

  gsap.defaults({ duration: 1 });

  let mousePos = { x: 0, y: 0 };
  let lastMousePos = mousePos;
  const cachedMousePos = mousePos;

  window.addEventListener("mousemove", (e) => {
    mousePos = { x: e.clientX, y: e.clientY };
  });

  /**
   * 每帧在 GSAP ticker 中执行：根据鼠标位移决定是否播放下一个 flair
   *（原版里 cachedMousePos 插值保留，与 CodePen 行为一致）
   */
  function imageTrail() {
    const travelDistance = Math.hypot(
      lastMousePos.x - mousePos.x,
      lastMousePos.y - mousePos.y
    );

    cachedMousePos.x = gsap.utils.interpolate(
      cachedMousePos.x || mousePos.x,
      mousePos.x,
      0.1
    );
    cachedMousePos.y = gsap.utils.interpolate(
      cachedMousePos.y || mousePos.y,
      mousePos.y,
      0.1
    );

    if (travelDistance > gap) {
      animateImage();
      lastMousePos = mousePos;
    }
  }

  /** 取下一个轮询到的 .flair 元素，重置到指针处并播放 playAnimation */
  function animateImage() {
    const wrappedIndex = wrapper(index);
    const img = flair[wrappedIndex];

    gsap.killTweensOf(img);
    gsap.set(img, { clearProps: "all" });

    gsap.set(img, {
      opacity: 1,
      left: mousePos.x,
      top: mousePos.y,
      xPercent: -50,
      yPercent: -50,
    });

    playAnimation(img);
    index += 1;
  }

  gsap.ticker.add(imageTrail);
}

// =============================================================================
// 模块 6：工作经历 — 悬停行时大图跟随指针（GSAP quickTo，需 gsap.min.js）
// =============================================================================
(function initWorksSwipePreview() {
  if (typeof gsap === "undefined" || !gsap.utils || !gsap.quickTo) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceMotion.matches) return;

  const section = document.querySelector(".works-swipe-section");
  if (!section) return;

  const items = gsap.utils.toArray(".works-swipe-item");
  if (!items.length) return;

  gsap.set(section.querySelectorAll("img.swipeimage"), {
    xPercent: -50,
    yPercent: -50,
  });

  items.forEach((el) => {
    const image = el.querySelector("img.swipeimage");
    if (!image) return;

    let firstEnter = false;

    const setX = gsap.quickTo(image, "x", {
      duration: 0.4,
      ease: "power3.out",
    });
    const setY = gsap.quickTo(image, "y", {
      duration: 0.4,
      ease: "power3.out",
    });

    const stopFollow = () => {
      el.removeEventListener("mousemove", moveImage);
    };

    const moveImage = (e) => {
      setX(e.clientX);
      setY(e.clientY);
    };

    const fade = gsap.to(image, {
      autoAlpha: 1,
      paused: true,
      duration: 0.1,
      onReverseComplete: stopFollow,
    });

    el.addEventListener("mouseenter", (e) => {
      if (firstEnter) {
        setX(e.clientX);
        setY(e.clientY);
      } else {
        firstEnter = true;
        setX(e.clientX);
        setY(e.clientY);
      }
      fade.play();
      el.addEventListener("mousemove", moveImage);
    });

    el.addEventListener("mouseleave", () => {
      fade.reverse();
    });
  });
})();

// =============================================================================
// 模块 7：作品 — 无限卡片（CodePen RwKwLWK 核心逻辑：wrapTime + seamlessLoop；
// 本站无 ScrollTrigger pin，保留横向滚轮与独立 drag-hit；类名 portfolio-*）
// =============================================================================
(function initPortfolioInfiniteCards() {
  if (typeof gsap === "undefined") return;
  if (typeof Draggable === "undefined") return;

  const root = document.querySelector(".portfolio-cards-section");
  const gallery = document.querySelector(".portfolio-gallery");
  const cardsRoot = document.querySelector(".portfolio-cards");
  if (!root || !gallery || !cardsRoot) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceMotion.matches) {
    root.classList.add("portfolio-cards-section--reduced");
    return;
  }

  gsap.registerPlugin(Draggable);

  const cards = gsap.utils.toArray(".portfolio-cards li");
  if (!cards.length) return;
  const isNarrowScreen = window.matchMedia("(max-width: 768px)").matches;

  gsap.set(cards, {
    xPercent: 400,
    opacity: 0,
    scale: 0,
    force3D: true,
  });

  const spacing = 0.1;
  const snapTime = gsap.utils.snap(spacing);

  /**
   * CodePen 原版：与横移同时，scale/opacity 先出现再 yoyo 收回 → 逐渐变小隐藏。
   * 与 xPercent 同起点(t=0)叠放。
   */
  const animateFunc = (element) => {
    const tl = gsap.timeline();
    tl.fromTo(
      element,
      { scale: 0, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        zIndex: 100,
        duration: 0.5,
        yoyo: true,
        repeat: 1,
        ease: "power1.in",
        immediateRender: false,
        force3D: true,
      }
    ).fromTo(
      element,
      { xPercent: 400 },
      {
        xPercent: -400,
        duration: 1,
        ease: "none",
        immediateRender: false,
        force3D: true,
      },
      0
    );
    return tl;
  };

  const seamlessLoop = buildSeamlessLoop(cards, spacing, animateFunc);
  const loopDur = seamlessLoop.duration();
  if (!Number.isFinite(loopDur) || loopDur <= 0) return;
  /** CodePen：任意 offset → 映射到 timeline 合法 time */
  const wrapTime = gsap.utils.wrap(0, loopDur);

  const playhead = { offset: 0 };
  let portfolioBtnTween = null;

  function syncLoopToPlayhead() {
    seamlessLoop.time(wrapTime(playhead.offset));
  }

  /** 对齐 CodePen scrollToOffset：snap 后写回 offset，再映射到环 */
  function scrollToOffset(offset) {
    const snapped = snapTime(offset);
    playhead.offset = snapped;
    syncLoopToPlayhead();
  }

  function stepCarouselByButton(delta) {
    if (portfolioBtnTween) {
      portfolioBtnTween.kill();
      portfolioBtnTween = null;
    }
    gsap.killTweensOf(playhead);
    if (!Number.isFinite(loopDur) || loopDur <= 0) return;

    const start = playhead.offset;
    const proxy = { v: start };

    portfolioBtnTween = gsap.to(proxy, {
      v: start + delta,
      duration: 0.52,
      ease: "none",
      overwrite: true,
      onUpdate: () => {
        playhead.offset = proxy.v;
        syncLoopToPlayhead();
      },
      onComplete: () => {
        portfolioBtnTween = null;
        scrollToOffset(proxy.v);
      },
    });
  }

  function getHorizontalWheelDelta(e) {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return e.deltaX;
    if (e.shiftKey && Math.abs(e.deltaY) >= Math.abs(e.deltaX)) return e.deltaY;
    return 0;
  }

  function isPureVerticalWheel(e) {
    if (e.shiftKey) return false;
    return Math.abs(e.deltaY) > Math.abs(e.deltaX) * 1.15;
  }

  if (!isNarrowScreen) {
    gallery.addEventListener(
      "wheel",
      (e) => {
        if (isPureVerticalWheel(e)) return;
        const dh = getHorizontalWheelDelta(e);
        if (Math.abs(dh) < 0.25) return;
        e.preventDefault();
        playhead.offset -= dh * 0.0011;
        syncLoopToPlayhead();
      },
      { passive: false }
    );
  }

  const prevBtn = document.querySelector(".portfolio-prev");
  const nextBtn = document.querySelector(".portfolio-next");
  if (prevBtn) {
    prevBtn.addEventListener("click", () => stepCarouselByButton(-spacing));
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => stepCarouselByButton(spacing));
  }

  const dragHit = document.querySelector(".portfolio-drag-hit");
  if (dragHit) {
    Draggable.create(".portfolio-drag-proxy", {
      type: "x",
      trigger: dragHit,
      minimumMovement: 2,
      onPress() {
        if (portfolioBtnTween) {
          portfolioBtnTween.kill();
          portfolioBtnTween = null;
        }
        gsap.killTweensOf(playhead);
        this.startOffset = playhead.offset;
      },
      onDrag() {
        playhead.offset = this.startOffset + (this.startX - this.x) * 0.001;
        syncLoopToPlayhead();
      },
      onDragEnd() {
        scrollToOffset(playhead.offset);
      },
    });
  }

  scrollToOffset(0);

  function buildSeamlessLoop(items, spacing, animateFunc) {
    const overlap = Math.ceil(1 / spacing);
    const startTime = items.length * spacing + 0.5;
    const loopTime = (items.length + overlap) * spacing + 1;
    const rawSequence = gsap.timeline({ paused: true });
    const seamlessLoop = gsap.timeline({
      paused: true,
      repeat: -1,
      onRepeat() {
        if (this._time === this._dur) {
          this._tTime += this._dur - 0.01;
        }
      },
    });
    const l = items.length + overlap * 2;
    let time;
    let i;
    let index;

    for (i = 0; i < l; i++) {
      index = i % items.length;
      time = i * spacing;
      rawSequence.add(animateFunc(items[index]), time);
      if (i <= items.length) {
        seamlessLoop.add("label" + i, time);
      }
    }

    rawSequence.time(startTime);
    seamlessLoop
      .to(rawSequence, {
        time: loopTime,
        duration: loopTime - startTime,
        ease: "none",
      })
      .fromTo(
        rawSequence,
        { time: overlap * spacing + 1 },
        {
          time: startTime,
          duration: startTime - (overlap * spacing + 1),
          immediateRender: false,
          ease: "none",
        }
      );

    return seamlessLoop;
  }
})();
