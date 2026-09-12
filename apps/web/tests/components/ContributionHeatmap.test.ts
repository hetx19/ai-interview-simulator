import { describe, it, expect } from 'vitest';
import {
  computeStreaks,
  getContributionLevel,
  getDayForWeekday,
  getMonthLabels,
  formatContributionDate,
  getDayDiff,
  getPreviousDay,
  formatISODateUTC,
  ContributionWeek,
  LEVEL_COLORS,
} from '@/components/charts/contributionUtils';

describe('ContributionHeatmap - Unit & Edge Case Tests', () => {
  describe('Date Helpers', () => {
    it('getDayDiff calculates exact calendar day difference', () => {
      expect(getDayDiff('2026-09-11', '2026-09-12')).toBe(1);
      expect(getDayDiff('2026-09-10', '2026-09-12')).toBe(2);
      expect(getDayDiff('2025-01-31', '2025-02-01')).toBe(1); // month boundary
      expect(getDayDiff('2025-12-31', '2026-01-01')).toBe(1); // year boundary
      expect(getDayDiff('2024-02-28', '2024-02-29')).toBe(1); // leap year day
      expect(getDayDiff('2024-02-29', '2024-03-01')).toBe(1); // leap year to march
      expect(getDayDiff('2025-02-28', '2025-03-01')).toBe(1); // non-leap year
    });

    it('getPreviousDay steps back exactly one calendar day across boundaries', () => {
      expect(getPreviousDay('2026-09-12')).toBe('2026-09-11');
      expect(getPreviousDay('2026-01-01')).toBe('2025-12-31');
      expect(getPreviousDay('2024-03-01')).toBe('2024-02-29'); // leap year
      expect(getPreviousDay('2025-03-01')).toBe('2025-02-28'); // non-leap year
      expect(getPreviousDay('2025-05-01')).toBe('2025-04-30');
    });

    it('formatISODateUTC formats Date to YYYY-MM-DD', () => {
      const d = new Date(Date.UTC(2026, 8, 12));
      expect(formatISODateUTC(d)).toBe('2026-09-12');
    });

    it('formatContributionDate formats string cleanly', () => {
      expect(formatContributionDate('2026-09-12')).toBe('Sat, Sep 12, 2026');
      expect(formatContributionDate('2024-02-29')).toBe('Thu, Feb 29, 2024');
      expect(formatContributionDate('')).toBe('');
      expect(formatContributionDate('invalid')).toBe('invalid');
    });
  });

  describe('computeStreaks', () => {
    it('returns zero streaks for null, undefined, or empty calendar', () => {
      expect(computeStreaks(null)).toEqual({ currentStreak: 0, longestStreak: 0 });
      expect(computeStreaks(undefined)).toEqual({ currentStreak: 0, longestStreak: 0 });
      expect(computeStreaks({ totalContributions: 0, weeks: [] })).toEqual({
        currentStreak: 0,
        longestStreak: 0,
      });
    });

    it('returns zero streaks when all contributions are zero', () => {
      const weeks: ContributionWeek[] = [
        {
          contributionDays: [
            { contributionCount: 0, date: '2026-09-10', weekday: 4 },
            { contributionCount: 0, date: '2026-09-11', weekday: 5 },
            { contributionCount: 0, date: '2026-09-12', weekday: 6 },
          ],
        },
      ];
      expect(computeStreaks({ totalContributions: 0, weeks }, '2026-09-12')).toEqual({
        currentStreak: 0,
        longestStreak: 0,
      });
    });

    it('calculates active streak when contributions exist today', () => {
      const weeks: ContributionWeek[] = [
        {
          contributionDays: [
            { contributionCount: 2, date: '2026-09-10', weekday: 4 },
            { contributionCount: 1, date: '2026-09-11', weekday: 5 },
            { contributionCount: 4, date: '2026-09-12', weekday: 6 },
          ],
        },
      ];
      const result = computeStreaks({ totalContributions: 7, weeks }, '2026-09-12');
      expect(result.currentStreak).toBe(3);
      expect(result.longestStreak).toBe(3);
    });

    it('preserves streak when today has 0 contributions but yesterday had contributions', () => {
      const weeks: ContributionWeek[] = [
        {
          contributionDays: [
            { contributionCount: 3, date: '2026-09-10', weekday: 4 },
            { contributionCount: 5, date: '2026-09-11', weekday: 5 },
            { contributionCount: 0, date: '2026-09-12', weekday: 6 }, // today, no commits yet
          ],
        },
      ];
      const result = computeStreaks({ totalContributions: 8, weeks }, '2026-09-12');
      expect(result.currentStreak).toBe(2);
      expect(result.longestStreak).toBe(2);
    });

    it('breaks current streak when both today and yesterday have 0 contributions', () => {
      const weeks: ContributionWeek[] = [
        {
          contributionDays: [
            { contributionCount: 5, date: '2026-09-09', weekday: 3 },
            { contributionCount: 5, date: '2026-09-10', weekday: 4 },
            { contributionCount: 0, date: '2026-09-11', weekday: 5 }, // yesterday
            { contributionCount: 0, date: '2026-09-12', weekday: 6 }, // today
          ],
        },
      ];
      const result = computeStreaks({ totalContributions: 10, weeks }, '2026-09-12');
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(2);
    });

    it('retains historical longest streak when current streak is shorter', () => {
      const weeks: ContributionWeek[] = [
        {
          contributionDays: [
            // 4-day streak in the past
            { contributionCount: 1, date: '2026-08-01', weekday: 6 },
            { contributionCount: 2, date: '2026-08-02', weekday: 0 },
            { contributionCount: 1, date: '2026-08-03', weekday: 1 },
            { contributionCount: 3, date: '2026-08-04', weekday: 2 },
            // gap
            { contributionCount: 0, date: '2026-08-05', weekday: 3 },
            // current 1-day streak
            { contributionCount: 2, date: '2026-09-12', weekday: 6 },
          ],
        },
      ];
      const result = computeStreaks({ totalContributions: 9, weeks }, '2026-09-12');
      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(4);
    });

    it('correctly calculates streaks across leap year boundary (Feb 28 -> Feb 29 -> Mar 1)', () => {
      const weeks: ContributionWeek[] = [
        {
          contributionDays: [
            { contributionCount: 1, date: '2024-02-27', weekday: 2 },
            { contributionCount: 2, date: '2024-02-28', weekday: 3 },
            { contributionCount: 3, date: '2024-02-29', weekday: 4 },
            { contributionCount: 1, date: '2024-03-01', weekday: 5 },
          ],
        },
      ];
      const result = computeStreaks({ totalContributions: 7, weeks }, '2024-03-01');
      expect(result.currentStreak).toBe(4);
      expect(result.longestStreak).toBe(4);
    });

    it('correctly calculates streaks across month and year boundary (Dec 31 -> Jan 1)', () => {
      const weeks: ContributionWeek[] = [
        {
          contributionDays: [
            { contributionCount: 1, date: '2025-12-30', weekday: 2 },
            { contributionCount: 2, date: '2025-12-31', weekday: 3 },
            { contributionCount: 1, date: '2026-01-01', weekday: 4 },
            { contributionCount: 3, date: '2026-01-02', weekday: 5 },
          ],
        },
      ];
      const result = computeStreaks({ totalContributions: 7, weeks }, '2026-01-02');
      expect(result.currentStreak).toBe(4);
      expect(result.longestStreak).toBe(4);
    });

    it('does not treat missing calendar dates as consecutive (gap detection)', () => {
      const weeks: ContributionWeek[] = [
        {
          contributionDays: [
            { contributionCount: 1, date: '2026-09-08', weekday: 2 },
            // 2026-09-09 is missing entirely from data
            { contributionCount: 1, date: '2026-09-10', weekday: 4 },
          ],
        },
      ];
      const result = computeStreaks({ totalContributions: 2, weeks }, '2026-09-10');
      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
    });

    it('handles a long streak of 60 consecutive days', () => {
      const days = [];
      const startDate = new Date(Date.UTC(2026, 0, 1));
      for (let i = 0; i < 60; i++) {
        const d = new Date(startDate.getTime() + i * 86400000);
        days.push({
          contributionCount: 2,
          date: formatISODateUTC(d),
          weekday: d.getUTCDay(),
        });
      }
      const endDate = formatISODateUTC(new Date(startDate.getTime() + 59 * 86400000));
      const result = computeStreaks(
        { totalContributions: 120, weeks: [{ contributionDays: days }] },
        endDate,
      );
      expect(result.currentStreak).toBe(60);
      expect(result.longestStreak).toBe(60);
    });

    it('works with fallback mock data when no dates are present on days', () => {
      const weeks: ContributionWeek[] = [
        {
          contributionDays: [
            { contributionCount: 1, date: '', weekday: 0 },
            { contributionCount: 1, date: '', weekday: 1 },
            { contributionCount: 0, date: '', weekday: 2 },
            { contributionCount: 2, date: '', weekday: 3 },
          ],
        },
      ];
      const result = computeStreaks({ totalContributions: 4, weeks });
      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(2);
    });
  });

  describe('getContributionLevel', () => {
    it('returns level 0 for 0 or negative count', () => {
      expect(getContributionLevel(0)).toBe(0);
      expect(getContributionLevel(-2)).toBe(0);
    });

    it('respects explicit contributionLevel strings from GitHub GraphQL', () => {
      expect(getContributionLevel(5, 'FOURTH_QUARTILE')).toBe(4);
      expect(getContributionLevel(5, 'THIRD_QUARTILE')).toBe(3);
      expect(getContributionLevel(5, 'SECOND_QUARTILE')).toBe(2);
      expect(getContributionLevel(5, 'FIRST_QUARTILE')).toBe(1);
      expect(getContributionLevel(0, 'NONE')).toBe(0);
    });

    it('maps levels correctly for low max counts', () => {
      expect(getContributionLevel(1, null, undefined, 1)).toBe(1);

      expect(getContributionLevel(1, null, undefined, 2)).toBe(1);
      expect(getContributionLevel(2, null, undefined, 2)).toBe(2);

      expect(getContributionLevel(1, null, undefined, 3)).toBe(1);
      expect(getContributionLevel(2, null, undefined, 3)).toBe(2);
      expect(getContributionLevel(3, null, undefined, 3)).toBe(3);

      expect(getContributionLevel(1, null, undefined, 4)).toBe(1);
      expect(getContributionLevel(2, null, undefined, 4)).toBe(2);
      expect(getContributionLevel(3, null, undefined, 4)).toBe(3);
      expect(getContributionLevel(4, null, undefined, 4)).toBe(4);
    });

    it('applies dynamic quartile thresholds for varied contribution counts', () => {
      const quartiles = { q1: 2, q2: 5, q3: 10 };
      expect(getContributionLevel(1, null, quartiles, 25)).toBe(1);
      expect(getContributionLevel(2, null, quartiles, 25)).toBe(1);
      expect(getContributionLevel(3, null, quartiles, 25)).toBe(2);
      expect(getContributionLevel(5, null, quartiles, 25)).toBe(2);
      expect(getContributionLevel(6, null, quartiles, 25)).toBe(3);
      expect(getContributionLevel(10, null, quartiles, 25)).toBe(3);
      expect(getContributionLevel(11, null, quartiles, 25)).toBe(4);
      expect(getContributionLevel(50, null, quartiles, 25)).toBe(4);
    });

    it('ensures all 5 LEVEL_COLORS are valid hex codes', () => {
      for (let lvl = 0; lvl <= 4; lvl++) {
        expect(LEVEL_COLORS[lvl]).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });
  });

  describe('getDayForWeekday', () => {
    it('finds day matching explicit weekday index', () => {
      const week: ContributionWeek = {
        contributionDays: [
          { contributionCount: 3, date: '2026-09-09', weekday: 3 },
          { contributionCount: 5, date: '2026-09-10', weekday: 4 },
        ],
      };
      expect(getDayForWeekday(week, 3)?.contributionCount).toBe(3);
      expect(getDayForWeekday(week, 4)?.contributionCount).toBe(5);
    });

    it('derives weekday from UTC date when weekday is omitted', () => {
      // 2026-09-12 is Saturday (weekday 6)
      const week: ContributionWeek = {
        contributionDays: [
          { contributionCount: 7, date: '2026-09-12' },
        ],
      };
      expect(getDayForWeekday(week, 6)?.contributionCount).toBe(7);
      expect(getDayForWeekday(week, 0)).toBeUndefined();
    });

    it('returns undefined for days not present in the week (prevents cell duplication)', () => {
      // Week starting Wednesday (weekday 3)
      const week: ContributionWeek = {
        contributionDays: [
          { contributionCount: 4, date: '2026-09-09', weekday: 3 },
          { contributionCount: 2, date: '2026-09-10', weekday: 4 },
        ],
      };
      // Sunday, Monday, Tuesday should NOT duplicate Wednesday or Thursday
      expect(getDayForWeekday(week, 0)).toBeUndefined();
      expect(getDayForWeekday(week, 1)).toBeUndefined();
      expect(getDayForWeekday(week, 2)).toBeUndefined();
      expect(getDayForWeekday(week, 5)).toBeUndefined();
    });

    it('falls back to index for raw 7-item array without metadata', () => {
      const week: ContributionWeek = {
        contributionDays: Array.from({ length: 7 }, (_, i) => ({
          contributionCount: i * 2,
          date: '',
        })),
      };
      expect(getDayForWeekday(week, 2)?.contributionCount).toBe(4);
      expect(getDayForWeekday(week, 6)?.contributionCount).toBe(12);
    });
  });

  describe('getMonthLabels', () => {
    it('generates chronological month labels aligned with week indices', () => {
      const weeks: ContributionWeek[] = [];
      const startDate = new Date(Date.UTC(2025, 8, 14)); // Mid September 2025

      for (let w = 0; w < 53; w++) {
        const weekSunday = new Date(startDate.getTime() + w * 7 * 86400000);
        const days = Array.from({ length: 7 }, (_, d) => {
          const dayDate = new Date(weekSunday.getTime() + d * 86400000);
          return {
            contributionCount: 0,
            date: formatISODateUTC(dayDate),
            weekday: d,
          };
        });
        weeks.push({ contributionDays: days });
      }

      const labels = getMonthLabels(weeks);

      // Verify labels are non-empty and in order
      expect(labels.length).toBeGreaterThanOrEqual(10);
      expect(labels[0].name).toBe('Sep');

      // Check week indices are strictly ascending
      for (let i = 1; i < labels.length; i++) {
        expect(labels[i].weekIndex).toBeGreaterThan(labels[i - 1].weekIndex);
      }

      // Ensure no two labels are closer than 2 weeks
      for (let i = 1; i < labels.length; i++) {
        expect(labels[i].weekIndex - labels[i - 1].weekIndex).toBeGreaterThanOrEqual(2);
      }
    });

    it('falls back to 12 evenly spaced months if no dates are present', () => {
      const weeks: ContributionWeek[] = Array.from({ length: 53 }, () => ({
        contributionDays: Array.from({ length: 7 }, (_, i) => ({
          contributionCount: 0,
          date: '',
          weekday: i,
        })),
      }));
      const labels = getMonthLabels(weeks);
      expect(labels).toHaveLength(12);
      expect(labels[0].name).toBe('Jan');
      expect(labels[11].name).toBe('Dec');
    });
  });
});
