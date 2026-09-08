/**
 * Smooth Scrolling Utility with Natural Easing & Navbar Offset Compensation
 *
 * Features:
 * - Natural, polished ease-in-out cubic easing curve for organic motion
 * - Responsive duration scaling based on scroll distance (420ms - 780ms)
 * - Dynamic fixed/sticky navbar height and margin detection
 * - Immediate user cancellation on wheel, touch, or keyboard input
 * - Respects prefers-reduced-motion accessibility settings
 * - Safe URL hash updating without browser jump cuts
 */

/**
 * Natural, polished cubic easing function (easeInOutCubic).
 * Starts smoothly, accelerates progressively, and gently decelerates
 * into the target destination without harsh stops.
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Calculates a responsive animation duration based on scroll distance.
 * Clamped between 420ms (responsive on short scrolls) and 780ms (fast enough to not feel slow on long scrolls).
 */
export function calculateScrollDuration(distance: number): number {
  const absDistance = Math.abs(distance);
  // Uses square-root scaling: distance grows much faster than duration
  return Math.min(780, Math.max(420, Math.round(Math.sqrt(absDistance) * 16)));
}

/**
 * Calculates the dynamic navbar offset.
 * Inspects the fixed header / navbar pill to get its exact bottom edge,
 * and adds breathing space (20px) so content is never hidden behind the navbar.
 */
export function getNavbarOffset(): number {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return 96;
  }
  const header = document.querySelector("header");
  if (header) {
    // The navbar pill inside the header
    const pill = header.querySelector(".h-16") as HTMLElement | null;
    if (pill) {
      const rect = pill.getBoundingClientRect();
      if (rect.bottom > 0) {
        return Math.round(rect.bottom + 20);
      }
    }
    const headerRect = header.getBoundingClientRect();
    if (headerRect.height > 0) {
      return Math.round(Math.min(headerRect.height, 80) + 20);
    }
  }
  // Default offset: 12px top padding + 64px header pill + 20px margin = 96px
  return 96;
}

/**
 * Calculates target Y position for a given element, accounting for current scroll and navbar offset.
 */
export function calculateTargetScrollY(
  element: HTMLElement,
  customOffset?: number
): number {
  if (typeof window === "undefined" || typeof document === "undefined") return 0;
  const offset = customOffset ?? getNavbarOffset();
  const rect = element.getBoundingClientRect();
  const currentScrollY = window.scrollY ?? window.pageYOffset ?? 0;
  const rawTargetY = currentScrollY + rect.top - offset;
  const maxScrollY = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight
  );
  return Math.round(Math.max(0, Math.min(rawTargetY, maxScrollY)));
}

export interface SmoothScrollOptions {
  duration?: number;
  offset?: number;
  updateHash?: boolean;
  onComplete?: () => void;
}

let activeScrollAnimationId: number | null = null;
let activeCleanupListeners: (() => void) | null = null;

/**
 * Immediately cancels any running smooth scroll animation and cleans up event listeners.
 */
export function stopCurrentScrollAnimation(): void {
  if (activeScrollAnimationId !== null && typeof window !== "undefined") {
    cancelAnimationFrame(activeScrollAnimationId);
    activeScrollAnimationId = null;
  }
  if (activeCleanupListeners) {
    activeCleanupListeners();
    activeCleanupListeners = null;
  }
}

/**
 * Smoothly scrolls the window to the target element with a polished easing animation.
 */
export function scrollToTarget(
  target: HTMLElement | string,
  options: SmoothScrollOptions = {}
): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  const element =
    typeof target === "string"
      ? document.getElementById(target.replace(/^#/, ""))
      : target;

  if (!element) return false;

  // Cancel any running animation
  stopCurrentScrollAnimation();

  const targetId = typeof target === "string" ? target.replace(/^#/, "") : element.id;

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const targetY = calculateTargetScrollY(element, options.offset);
  const startY = window.scrollY ?? window.pageYOffset ?? 0;
  const distance = targetY - startY;

  // Update URL hash smoothly without native jump
  if (options.updateHash !== false && targetId) {
    try {
      window.history.pushState(null, "", `#${targetId}`);
    } catch {
      // Ignore in restricted environments
    }
  }

  // If already at target or user prefers reduced motion, scroll instantly
  if (prefersReducedMotion || Math.abs(distance) < 2) {
    window.scrollTo({ top: targetY, behavior: "auto" });
    options.onComplete?.();
    return true;
  }

  const duration = options.duration ?? calculateScrollDuration(distance);
  const startTime = performance.now();

  const removeListeners = () => {
    window.removeEventListener("wheel", handleUserCancel);
    window.removeEventListener("touchstart", handleUserCancel);
    window.removeEventListener("keydown", handleKeyCancel);
    activeCleanupListeners = null;
  };

  const handleUserCancel = () => {
    stopCurrentScrollAnimation();
  };

  const handleKeyCancel = (e: KeyboardEvent) => {
    if (
      ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(
        e.key
      )
    ) {
      handleUserCancel();
    }
  };

  window.addEventListener("wheel", handleUserCancel, { passive: true });
  window.addEventListener("touchstart", handleUserCancel, { passive: true });
  window.addEventListener("keydown", handleKeyCancel, { passive: true });
  activeCleanupListeners = removeListeners;

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(1, elapsed / duration);
    const eased = easeInOutCubic(progress);
    const currentY = Math.round(startY + distance * eased);

    window.scrollTo({ top: currentY, behavior: "instant" as ScrollBehavior });

    if (progress < 1) {
      activeScrollAnimationId = requestAnimationFrame(step);
    } else {
      activeScrollAnimationId = null;
      removeListeners();
      options.onComplete?.();
    }
  };

  activeScrollAnimationId = requestAnimationFrame(step);
  return true;
}

/**
 * Smoothly scrolls back to the top of the page.
 */
export function scrollToTop(options: SmoothScrollOptions = {}): void {
  if (typeof window === "undefined") return;

  stopCurrentScrollAnimation();

  const prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const startY = window.scrollY ?? window.pageYOffset ?? 0;
  const distance = -startY;

  if (options.updateHash !== false) {
    try {
      window.history.pushState(null, "", window.location.pathname);
    } catch {
      // Ignore
    }
  }

  if (prefersReducedMotion || Math.abs(distance) < 2) {
    window.scrollTo({ top: 0, behavior: "auto" });
    options.onComplete?.();
    return;
  }

  const duration = options.duration ?? calculateScrollDuration(distance);
  const startTime = performance.now();

  const removeListeners = () => {
    window.removeEventListener("wheel", handleUserCancel);
    window.removeEventListener("touchstart", handleUserCancel);
    window.removeEventListener("keydown", handleKeyCancel);
    activeCleanupListeners = null;
  };

  const handleUserCancel = () => {
    stopCurrentScrollAnimation();
  };

  const handleKeyCancel = (e: KeyboardEvent) => {
    if (
      ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(
        e.key
      )
    ) {
      handleUserCancel();
    }
  };

  window.addEventListener("wheel", handleUserCancel, { passive: true });
  window.addEventListener("touchstart", handleUserCancel, { passive: true });
  window.addEventListener("keydown", handleKeyCancel, { passive: true });
  activeCleanupListeners = removeListeners;

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(1, elapsed / duration);
    const eased = easeInOutCubic(progress);
    const currentY = Math.round(startY + distance * eased);

    window.scrollTo({ top: currentY, behavior: "instant" as ScrollBehavior });

    if (progress < 1) {
      activeScrollAnimationId = requestAnimationFrame(step);
    } else {
      activeScrollAnimationId = null;
      removeListeners();
      options.onComplete?.();
    }
  };

  activeScrollAnimationId = requestAnimationFrame(step);
}
