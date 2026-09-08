import { describe, it, expect } from "vitest";
import {
  easeInOutCubic,
  calculateScrollDuration,
  getNavbarOffset,
  calculateTargetScrollY,
} from "../lib/smoothScroll";

describe("smoothScroll utility", () => {
  describe("easeInOutCubic", () => {
    it("starts at 0 when t = 0", () => {
      expect(easeInOutCubic(0)).toBe(0);
    });

    it("reaches midpoint 0.5 at t = 0.5", () => {
      expect(easeInOutCubic(0.5)).toBe(0.5);
    });

    it("finishes at 1 when t = 1", () => {
      expect(easeInOutCubic(1)).toBe(1);
    });

    it("increases monotonically across [0, 1]", () => {
      let previous = -1;
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const value = easeInOutCubic(t);
        expect(value).toBeGreaterThanOrEqual(previous);
        previous = value;
      }
    });

    it("has a gentle acceleration at start and gentle deceleration at end", () => {
      // Delta in first 10% should be less than delta in middle 10%
      const startDelta = easeInOutCubic(0.1) - easeInOutCubic(0);
      const midDelta = easeInOutCubic(0.55) - easeInOutCubic(0.45);
      const endDelta = easeInOutCubic(1) - easeInOutCubic(0.9);

      expect(startDelta).toBeLessThan(midDelta);
      expect(endDelta).toBeLessThan(midDelta);
      // Symmetry between start and end
      expect(startDelta).toBeCloseTo(endDelta, 5);
    });
  });

  describe("calculateScrollDuration", () => {
    it("returns clamped minimum of 420ms for small distances", () => {
      expect(calculateScrollDuration(0)).toBe(420);
      expect(calculateScrollDuration(100)).toBe(420);
      expect(calculateScrollDuration(400)).toBe(420);
    });

    it("scales responsively for medium distances", () => {
      const duration1000 = calculateScrollDuration(1000);
      const duration1500 = calculateScrollDuration(1500);
      expect(duration1000).toBeGreaterThanOrEqual(420);
      expect(duration1500).toBeGreaterThan(duration1000);
      expect(duration1500).toBeLessThanOrEqual(780);
    });

    it("caps at maximum 780ms for very long distances", () => {
      expect(calculateScrollDuration(3000)).toBe(780);
      expect(calculateScrollDuration(10000)).toBe(780);
    });

    it("handles negative distances identically to positive distances", () => {
      expect(calculateScrollDuration(-1200)).toBe(calculateScrollDuration(1200));
    });
  });

  describe("getNavbarOffset", () => {
    it("returns default fallback 96px when window or header is not in DOM", () => {
      expect(getNavbarOffset()).toBe(96);
    });
  });

  describe("calculateTargetScrollY", () => {
    it("returns clamped non-negative value", () => {
      const mockElement = {
        getBoundingClientRect: () => ({
          top: -200,
          bottom: 0,
          left: 0,
          right: 0,
          width: 100,
          height: 100,
          x: 0,
          y: -200,
          toJSON: () => {},
        }),
      } as unknown as HTMLElement;

      const target = calculateTargetScrollY(mockElement, 80);
      expect(target).toBeGreaterThanOrEqual(0);
    });
  });
});
