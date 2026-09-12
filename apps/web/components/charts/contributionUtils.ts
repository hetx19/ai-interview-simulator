export interface ContributionDay {
  contributionCount: number;
  date: string;
  weekday?: number;
  contributionLevel?:
    | 'NONE'
    | 'FIRST_QUARTILE'
    | 'SECOND_QUARTILE'
    | 'THIRD_QUARTILE'
    | 'FOURTH_QUARTILE';
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export const LEVEL_COLORS: Record<number, string> = {
  0: '#161b22',
  1: '#0e4429',
  2: '#006d32',
  3: '#26a641',
  4: '#39d353',
};

export const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function getDayDiff(dateStr1: string, dateStr2: string): number {
  const [y1, m1, d1] = dateStr1.slice(0, 10).split('-').map(Number);
  const [y2, m2, d2] = dateStr2.slice(0, 10).split('-').map(Number);
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return 0;
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((t2 - t1) / 86400000);
}

export function getPreviousDay(dateStr: string): string {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d - 1));
  const prevY = date.getUTCFullYear();
  const prevM = String(date.getUTCMonth() + 1).padStart(2, '0');
  const prevD = String(date.getUTCDate()).padStart(2, '0');
  return `${prevY}-${prevM}-${prevD}`;
}

export function formatISODateUTC(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatContributionDate(dateStr: string): string {
  if (!dateStr) return '';
  const cleanDate = dateStr.slice(0, 10);
  const [year, month, day] = cleanDate.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function computeStreaks(
  calendar?: ContributionCalendar | null,
  referenceDate?: Date | string,
): {
  currentStreak: number;
  longestStreak: number;
} {
  if (!calendar || !calendar.weeks || calendar.weeks.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const allDays = calendar.weeks.flatMap((w) => w.contributionDays || []);
  if (allDays.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const daysWithDates = allDays.filter((d) => d && Boolean(d.date));

  // Fallback for mock structures where no dates are provided
  if (daysWithDates.length === 0) {
    let current = 0;
    let longest = 0;
    for (const d of allDays) {
      if ((d?.contributionCount || 0) > 0) {
        current++;
        if (current > longest) longest = current;
      } else {
        current = 0;
      }
    }
    return { currentStreak: current, longestStreak: longest };
  }

  // Deduplicate and aggregate contributions by date
  const countByDate = new Map<string, number>();
  for (const day of daysWithDates) {
    const dateStr = day.date.slice(0, 10);
    const existing = countByDate.get(dateStr) ?? 0;
    countByDate.set(dateStr, existing + (day.contributionCount || 0));
  }

  const sortedDates = Array.from(countByDate.keys()).sort();
  if (sortedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // 1. Longest Streak Calculation
  let longestStreak = 0;
  let runningStreak = 0;
  let prevActiveDate: string | null = null;

  for (const dateStr of sortedDates) {
    const count = countByDate.get(dateStr) ?? 0;
    if (count > 0) {
      if (prevActiveDate && getDayDiff(prevActiveDate, dateStr) === 1) {
        runningStreak++;
      } else {
        runningStreak = 1;
      }
      prevActiveDate = dateStr;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
      prevActiveDate = null;
    }
  }

  // 2. Current Streak Calculation
  const now = referenceDate ? new Date(referenceDate) : new Date();
  const todayStr = formatISODateUTC(now);
  const yesterdayStr = getPreviousDay(todayStr);

  const latestDateInData = sortedDates[sortedDates.length - 1];

  let refToday = todayStr;
  let refYesterday = yesterdayStr;

  // When evaluating historical datasets or offline test mocks without explicit referenceDate
  if (!referenceDate && latestDateInData < yesterdayStr) {
    refToday = latestDateInData;
    refYesterday = getPreviousDay(latestDateInData);
  }

  let currentStreak = 0;
  let walkDate: string | null = null;

  const todayCount = countByDate.get(refToday) ?? 0;
  const yesterdayCount = countByDate.get(refYesterday) ?? 0;

  if (todayCount > 0) {
    walkDate = refToday;
  } else if (yesterdayCount > 0) {
    walkDate = refYesterday;
  } else {
    walkDate = null;
  }

  while (walkDate && (countByDate.get(walkDate) ?? 0) > 0) {
    currentStreak++;
    walkDate = getPreviousDay(walkDate);
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  return { currentStreak, longestStreak };
}

export function getContributionLevel(
  count: number,
  dayLevel?: string | null,
  quartiles?: { q1: number; q2: number; q3: number },
  maxCount?: number,
): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;

  if (dayLevel) {
    switch (dayLevel) {
      case 'FOURTH_QUARTILE':
        return 4;
      case 'THIRD_QUARTILE':
        return 3;
      case 'SECOND_QUARTILE':
        return 2;
      case 'FIRST_QUARTILE':
        return 1;
      case 'NONE':
        return 0;
    }
  }

  const max = maxCount ?? count;
  if (max <= 1) return 1;
  if (max <= 2) return count >= 2 ? 2 : 1;
  if (max <= 3) return count >= 3 ? 3 : count >= 2 ? 2 : 1;
  if (max <= 4)
    return count >= 4 ? 4 : count === 3 ? 3 : count === 2 ? 2 : 1;

  if (quartiles) {
    if (count > quartiles.q3) return 4;
    if (count > quartiles.q2) return 3;
    if (count > quartiles.q1) return 2;
    return 1;
  }

  const ratio = count / max;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

export function getDayForWeekday(
  week: ContributionWeek,
  weekdayIndex: number,
): ContributionDay | undefined {
  if (!week.contributionDays || week.contributionDays.length === 0) {
    return undefined;
  }

  const matchByWeekday = week.contributionDays.find(
    (d) => d.weekday === weekdayIndex,
  );
  if (matchByWeekday) return matchByWeekday;

  const matchByDate = week.contributionDays.find((d) => {
    if (!d.date) return false;
    const [y, m, dayNum] = d.date.slice(0, 10).split('-').map(Number);
    if (!y || !m || !dayNum) return false;
    return new Date(Date.UTC(y, m - 1, dayNum)).getUTCDay() === weekdayIndex;
  });
  if (matchByDate) return matchByDate;

  const hasMetadata = week.contributionDays.some(
    (d) => d.weekday !== undefined || Boolean(d.date),
  );
  if (!hasMetadata && week.contributionDays.length === 7) {
    return week.contributionDays[weekdayIndex];
  }

  return undefined;
}

export interface MonthLabel {
  name: string;
  weekIndex: number;
}

export function getMonthLabels(weeks: ContributionWeek[]): MonthLabel[] {
  const labels: MonthLabel[] = [];
  let prevMonth = -1;

  for (let w = 0; w < weeks.length; w++) {
    const week = weeks[w];
    if (!week.contributionDays || week.contributionDays.length === 0) continue;

    const firstDayWithDate = week.contributionDays.find((d) => Boolean(d.date));
    if (!firstDayWithDate) continue;

    const [y, m, d] = firstDayWithDate.date.slice(0, 10).split('-').map(Number);
    if (!y || !m || !d) continue;

    const monthIndex = m - 1;

    if (monthIndex !== prevMonth) {
      const isTooCloseToPrev =
        labels.length > 0 && w - labels[labels.length - 1].weekIndex < 2;
      const isTooCloseToEnd = weeks.length - w < 2;

      if (!isTooCloseToPrev && !isTooCloseToEnd) {
        labels.push({
          name: MONTH_NAMES[monthIndex],
          weekIndex: w,
        });
        prevMonth = monthIndex;
      } else if (labels.length === 1 && labels[0].weekIndex === 0 && w <= 2) {
        labels[0] = {
          name: MONTH_NAMES[monthIndex],
          weekIndex: w,
        };
        prevMonth = monthIndex;
      }
    }
  }

  if (labels.length === 0 && weeks.length > 0) {
    const step = weeks.length / 12;
    return MONTH_NAMES.map((name, i) => ({
      name,
      weekIndex: Math.floor(i * step),
    }));
  }

  return labels;
}

export function generatePlaceholderWeeks(numWeeks = 53): ContributionWeek[] {
  const now = new Date();
  const currentWeekday = now.getUTCDay();
  const endSaturday = new Date(now.getTime() + (6 - currentWeekday) * 86400000);
  const startSunday = new Date(
    endSaturday.getTime() - (numWeeks * 7 - 1) * 86400000,
  );

  const weeks: ContributionWeek[] = [];
  for (let w = 0; w < numWeeks; w++) {
    const days: ContributionDay[] = [];
    for (let d = 0; d < 7; d++) {
      const dayDate = new Date(startSunday.getTime() + (w * 7 + d) * 86400000);
      days.push({
        contributionCount: 0,
        date: formatISODateUTC(dayDate),
        weekday: d,
      });
    }
    weeks.push({ contributionDays: days });
  }
  return weeks;
}
