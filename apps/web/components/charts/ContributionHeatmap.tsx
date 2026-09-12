'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  ContributionCalendar,
  ContributionDay,
  ContributionWeek,
  computeStreaks,
  getContributionLevel,
  getDayForWeekday,
  getMonthLabels,
  formatContributionDate,
  generatePlaceholderWeeks,
  LEVEL_COLORS,
} from './contributionUtils';

export * from './contributionUtils';

interface ContributionHeatmapProps {
  calendar?: ContributionCalendar | null;
  className?: string;
  referenceDate?: Date | string;
}

export const ContributionHeatmap: React.FC<ContributionHeatmapProps> = ({
  calendar,
  className = '',
  referenceDate,
}) => {
  const streaks = useMemo(
    () => computeStreaks(calendar, referenceDate),
    [calendar, referenceDate],
  );

  const displayWeeks = useMemo(() => {
    if (!calendar || !calendar.weeks || calendar.weeks.length === 0) {
      return generatePlaceholderWeeks(53);
    }

    const rawWeeks = [...calendar.weeks];

    // If already 52 or 53 weeks, keep as-is without slicing away contributions
    if (rawWeeks.length === 52 || rawWeeks.length === 53) {
      return rawWeeks;
    }

    // If fewer than 52 weeks, pad on the left to maintain standard 53-week view
    if (rawWeeks.length < 52) {
      const missingWeeks = 53 - rawWeeks.length;
      const firstWeek = rawWeeks[0];
      const firstDay = firstWeek?.contributionDays?.[0];
      const paddedWeeks: ContributionWeek[] = [];

      if (firstDay?.date) {
        const [fy, fm, fd] = firstDay.date.slice(0, 10).split('-').map(Number);
        const firstDate = new Date(Date.UTC(fy, fm - 1, fd));
        const firstWeekday = firstDay.weekday ?? firstDate.getUTCDay();
        const firstSunday = new Date(
          firstDate.getTime() - firstWeekday * 86400000,
        );

        for (let w = missingWeeks; w >= 1; w--) {
          const weekSunday = new Date(
            firstSunday.getTime() - w * 7 * 86400000,
          );
          paddedWeeks.push({
            contributionDays: Array.from({ length: 7 }, (_, d) => {
              const dayDate = new Date(weekSunday.getTime() + d * 86400000);
              return {
                contributionCount: 0,
                date: dayDate.toISOString().slice(0, 10),
                weekday: d,
              };
            }),
          });
        }
      } else {
        for (let w = 0; w < missingWeeks; w++) {
          paddedWeeks.push({
            contributionDays: Array.from({ length: 7 }, (_, d) => ({
              contributionCount: 0,
              date: '',
              weekday: d,
            })),
          });
        }
      }
      return [...paddedWeeks, ...rawWeeks];
    }

    // If more than 53 weeks, keep the latest 53 weeks
    return rawWeeks.slice(rawWeeks.length - 53);
  }, [calendar]);

  const { quartiles, maxCount, calculatedTotal } = useMemo(() => {
    const counts: number[] = [];
    let max = 0;
    let sum = 0;

    for (const week of displayWeeks) {
      for (const day of week.contributionDays || []) {
        const c = day.contributionCount || 0;
        sum += c;
        if (c > 0) {
          counts.push(c);
          if (c > max) max = c;
        }
      }
    }

    if (counts.length === 0) {
      return {
        quartiles: { q1: 1, q2: 2, q3: 3 },
        maxCount: 0,
        calculatedTotal: sum,
      };
    }

    counts.sort((a, b) => a - b);
    const q1 = counts[Math.floor(counts.length * 0.25)] || 1;
    const q2 = counts[Math.floor(counts.length * 0.5)] || 2;
    const q3 = counts[Math.floor(counts.length * 0.75)] || 3;

    return {
      quartiles: {
        q1: Math.max(1, q1),
        q2: Math.max(q1 + 1, q2),
        q3: Math.max(q2 + 1, q3),
      },
      maxCount: max,
      calculatedTotal: sum,
    };
  }, [displayWeeks]);

  const totalContributions =
    typeof calendar?.totalContributions === 'number'
      ? calendar.totalContributions
      : calculatedTotal;

  const monthLabels = useMemo(
    () => getMonthLabels(displayWeeks),
    [displayWeeks],
  );

  const [hoveredCell, setHoveredCell] = useState<{
    count: number;
    date: string;
    x: number;
    y: number;
  } | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to end on small screens so latest days are immediately visible
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && container.scrollWidth > container.clientWidth) {
      container.scrollLeft = container.scrollWidth;
    }
  }, [displayWeeks]);

  const handleMouseEnter = (
    e: React.MouseEvent<SVGRectElement> | React.FocusEvent<SVGRectElement>,
    day: ContributionDay,
  ) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const wrapperRect = wrapper.getBoundingClientRect();
    const rect = e.currentTarget.getBoundingClientRect();

    setHoveredCell({
      count: day.contributionCount || 0,
      date: day.date || '',
      x: rect.left - wrapperRect.left + rect.width / 2,
      y: rect.top - wrapperRect.top,
    });
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
  };

  // SVG grid sizing
  const step = 15;
  const cellSize = 11;
  const cellRadius = 2;
  const leftGutter = 32;
  const topGutter = 20;
  const totalWeeks = displayWeeks.length;
  const svgWidth = leftGutter + totalWeeks * step + 4;
  const svgHeight = topGutter + 7 * step + 4;

  return (
    <div
      ref={wrapperRef}
      className={`rounded-xl bg-[#1b1b23]/90 backdrop-blur-xl p-6 shadow-xl relative overflow-hidden border border-[#292932]/40 ${className}`}
    >
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#6bde80]">
              calendar_view_week
            </span>
            <h2 className="text-[18px] leading-[26px] font-[600] text-[#e4e1ed]">
              Full 52-Week Contribution Matrix
            </h2>
          </div>
          <p className="text-[12px] leading-[18px] text-[#c7c5d0] mt-0.5">
            Daily telemetry density across public and upstream repositories (
            {totalContributions.toLocaleString()} total contributions)
          </p>
        </div>

        <div className="flex items-center gap-6 flex-wrap">
          {/* Streaks badge */}
          <div className="flex items-center gap-3 bg-[#0d0d15] px-3 py-1.5 rounded-lg shadow-inner border border-[#292932]/30">
            <div className="flex flex-col">
              <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] text-[#918f9a] uppercase">
                Current Streak
              </span>
              <span className="text-[16px] leading-[24px] font-bold text-[#6bde80]">
                {streaks.currentStreak}{' '}
                {streaks.currentStreak === 1 ? 'Day' : 'Days'}{' '}
                {streaks.currentStreak > 0 ? '🔥' : ''}
              </span>
            </div>
            <div className="w-px h-6 bg-[#46464f]/30" />
            <div className="flex flex-col">
              <span className="text-[10px] leading-[14px] font-[600] tracking-[0.06em] text-[#918f9a] uppercase">
                Longest Streak
              </span>
              <span className="text-[16px] leading-[24px] font-bold text-[#e1dfff]">
                {streaks.longestStreak}{' '}
                {streaks.longestStreak === 1 ? 'Day' : 'Days'}
              </span>
            </div>
          </div>

          {/* GitHub-style Legend */}
          <div className="flex items-center gap-1.5 text-[10px] leading-[14px] font-[600] text-[#918f9a]">
            <span>Less</span>
            <span className="w-2.5 h-2.5 rounded-xs bg-[#161b22] border border-white/5" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#0e4429]" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#006d32]" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#26a641]" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#39d353]" />
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Floating Interactive Tooltip */}
      {hoveredCell && (
        <div
          className="pointer-events-none absolute z-30 px-2.5 py-1 text-[11px] leading-tight text-white bg-[#0d0d15]/95 border border-[#292932] rounded-md shadow-2xl backdrop-blur-md transition-all duration-75 -translate-x-1/2 -translate-y-full"
          style={{
            left: hoveredCell.x,
            top: hoveredCell.y - 8,
          }}
        >
          <div className="font-medium whitespace-nowrap">
            <span className="font-semibold text-[#6bde80]">
              {hoveredCell.count === 0
                ? 'No contributions'
                : `${hoveredCell.count} contribution${hoveredCell.count === 1 ? '' : 's'}`}
            </span>
            {hoveredCell.date && (
              <span className="text-[#918f9a]">
                {' '}
                on {formatContributionDate(hoveredCell.date)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Responsive Horizontal Scroll Container */}
      <div
        ref={scrollContainerRef}
        onScroll={() => setHoveredCell(null)}
        className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#292932] scrollbar-track-transparent"
      >
        <div className="min-w-[760px]">
          <svg
            className="w-full h-auto block"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ minHeight: '128px' }}
          >
            <defs>
              <filter
                id="glow-green"
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
              >
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="1"
                  floodColor="#39d353"
                  floodOpacity="0.3"
                />
              </filter>
            </defs>

            {/* Month Labels aligned to week columns */}
            <g className="month-labels">
              {monthLabels.map((m) => (
                <text
                  key={`${m.name}-${m.weekIndex}`}
                  x={leftGutter + m.weekIndex * step}
                  y={12}
                  fill="#918f9a"
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="inherit"
                >
                  {m.name}
                </text>
              ))}
            </g>

            {/* Weekday Labels aligned to Mon, Wed, Fri rows */}
            <g className="weekday-labels">
              <text
                x={0}
                y={topGutter + 1 * step + 9}
                fill="#918f9a"
                fontSize="10"
                fontWeight="600"
                fontFamily="inherit"
              >
                Mon
              </text>
              <text
                x={0}
                y={topGutter + 3 * step + 9}
                fill="#918f9a"
                fontSize="10"
                fontWeight="600"
                fontFamily="inherit"
              >
                Wed
              </text>
              <text
                x={0}
                y={topGutter + 5 * step + 9}
                fill="#918f9a"
                fontSize="10"
                fontWeight="600"
                fontFamily="inherit"
              >
                Fri
              </text>
            </g>

            {/* Matrix Cells */}
            <g className="heatmap-tiles">
              {displayWeeks.map((week, cIndex) => {
                const x = leftGutter + cIndex * step;
                return (
                  <g key={cIndex} transform={`translate(${x}, 0)`}>
                    {Array.from({ length: 7 }).map((_, rIndex) => {
                      const day = getDayForWeekday(week, rIndex);
                      if (!day) return null;

                      const count = day.contributionCount || 0;
                      const level = getContributionLevel(
                        count,
                        day.contributionLevel,
                        quartiles,
                        maxCount,
                      );
                      const color = LEVEL_COLORS[level];
                      const y = topGutter + rIndex * step;

                      return (
                        <rect
                          key={rIndex}
                          x={0}
                          y={y}
                          width={cellSize}
                          height={cellSize}
                          rx={cellRadius}
                          fill={color}
                          stroke={
                            level === 0
                              ? 'rgba(255, 255, 255, 0.04)'
                              : undefined
                          }
                          strokeWidth={1}
                          filter={
                            level === 4 ? 'url(#glow-green)' : undefined
                          }
                          className="transition-colors duration-150 cursor-pointer outline-none focus:stroke-white focus:stroke-1"
                          tabIndex={0}
                          role="gridcell"
                          aria-label={`${count} contributions on ${day.date || 'unknown date'}`}
                          onMouseEnter={(e) => handleMouseEnter(e, day)}
                          onMouseLeave={handleMouseLeave}
                          onFocus={(e) => handleMouseEnter(e, day)}
                          onBlur={handleMouseLeave}
                        >
                          <title>
                            {day.date
                              ? `${count === 0 ? 'No' : count} contribution${count === 1 ? '' : 's'} on ${formatContributionDate(day.date)}`
                              : `${count} contribution${count === 1 ? '' : 's'}`}
                          </title>
                        </rect>
                      );
                    })}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};
