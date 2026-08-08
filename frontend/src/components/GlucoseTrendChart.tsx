"use client";

import React, { useMemo, useState } from "react";
import { useTCREStore, Measurement } from "../store/useTCREStore";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from "recharts";
import { Calendar, TrendingUp, ShieldAlert, Award } from "lucide-react";

interface GlucoseTrendChartProps {
  measurements: Measurement[];
  isLoading: boolean;
}

export default function GlucoseTrendChart({ measurements, isLoading }: GlucoseTrendChartProps) {
  const [highlightedPoint, setHighlightedPoint] = useState<any | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const units = useTCREStore((state) => state.units);
  const isMmol = units === "mmol/L";

  React.useEffect(() => {
    setIsClient(true);
    if (!containerRef.current) return;
    
    setContainerWidth(containerRef.current.offsetWidth);

    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Helper to convert glucose value
  const convertValue = (mg: number) => {
    return isMmol ? parseFloat((mg / 18.0182).toFixed(1)) : mg;
  };

  // Compute 7-day rolling average and prepare chart data
  const chartData = useMemo(() => {
    const sorted = [...measurements].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return sorted.map((item, index) => {
      const currentDate = new Date(item.date);
      const sevenDaysAgo = new Date(item.date);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Filter items in the last 7 days up to the current item
      const windowItems = sorted.slice(0, index + 1).filter((d) => {
        const dDate = new Date(d.date);
        return dDate >= sevenDaysAgo && dDate <= currentDate;
      });

      const sum = windowItems.reduce((acc, d) => acc + d.glucose, 0);
      const rolling7dMg = windowItems.length > 0 ? sum / windowItems.length : undefined;

      return {
        ...item,
        displayDate: isClient ? new Date(item.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }) : "",
        glucose: convertValue(item.glucose),
        rolling7d: rolling7dMg !== undefined ? convertValue(rolling7dMg) : undefined,
      };
    });
  }, [measurements, isMmol, isClient]);

  // Statistics summaries
  const stats = useMemo(() => {
    if (measurements.length === 0 || !isClient) return null;
    const glucoses = measurements.map((m) => m.glucose);
    const sum = glucoses.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / measurements.length);
    const min = Math.min(...glucoses);
    const max = Math.max(...glucoses);
    const latest = measurements[measurements.length - 1];

    // Time ago string for latest
    let timeAgoStr = "Just now";
    try {
      const diffMs = new Date().getTime() - new Date(latest.date).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        timeAgoStr = diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
      } else {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours > 0) {
          timeAgoStr = diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
        }
      }
    } catch {}

    return {
      min: convertValue(min),
      max: convertValue(max),
      avg: convertValue(avg),
      latestValue: convertValue(latest.glucose),
      latestTimeAgo: timeAgoStr,
    };
  }, [measurements, isMmol, isClient]);

  const handlePointClick = (state: any) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      setHighlightedPoint(state.activePayload[0].payload);
    }
  };

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0].payload;

    return (
      <div className="bg-bg-primary/95 border border-border-secondary p-3 rounded shadow-lg text-xs flex flex-col gap-1.5 backdrop-blur-sm">
        <p className="font-semibold text-text-primary flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-text-tertiary" />
          {new Date(data.date).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <div className="space-y-1">
          <p className="flex justify-between items-center gap-4">
            <span className="text-text-secondary">Glucose:</span>
            <span className="font-bold text-text-info">{data.glucose} {units}</span>
          </p>
          {data.rolling7d !== undefined && (
            <p className="flex justify-between items-center gap-4">
              <span className="text-text-secondary">7-day average:</span>
              <span className="font-semibold text-text-secondary">{data.rolling7d} {units}</span>
            </p>
          )}
          {data.consumedSugarLast6Hours && (
            <p className="flex justify-between items-center gap-4">
              <span className="text-text-secondary">Sugar Intake (6h):</span>
              <span className={`font-bold ${data.consumedSugarLast6Hours === "YES" ? "text-text-danger" : "text-text-success"}`}>
                {data.consumedSugarLast6Hours}
              </span>
            </p>
          )}
          <p className="flex justify-between items-center gap-4 text-[10px]">
            <span className="text-text-tertiary">Source:</span>
            <span className="text-text-tertiary capitalize">{data.source.replace("_", " ")}</span>
          </p>
        </div>
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <section className="w-full h-80 bg-bg-primary border border-border-tertiary rounded-lg p-6 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="p-3 bg-text-info/10 rounded-full mb-3 text-text-info">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">No Glucose Trend Data</h3>
        <p className="text-xs text-text-secondary max-w-sm">
          Please add a manual measurement or upload a CSV file above to visualize the glucose trend line and target thresholds.
        </p>
      </section>
    );
  }

  // Calculate dynamic max domain for Y-axis to prevent clipping
  const yMaxDomain = stats ? Math.max(isMmol ? 14 : 250, Math.ceil(stats.max / (isMmol ? 2 : 50)) * (isMmol ? 2 : 50) + (isMmol ? 1 : 20)) : (isMmol ? 14 : 250);
  const yMinDomain = isMmol ? 2.5 : 50;

  return (
    <section className="w-full bg-bg-primary border border-border-tertiary rounded-lg p-6 shadow-sm flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-text-info" /> Glycemic Trajectory ({units})
          </h2>
          <p className="text-[11px] text-text-secondary">
            Continuous glucose visualization mapped against clinical safety targets.
          </p>
        </div>
      </div>

      <div ref={containerRef} className="w-full h-[250px] relative" style={{ height: '250px', minHeight: '250px' }}>
        {isLoading && (
          <div className="absolute inset-0 bg-bg-primary/50 backdrop-blur-xs flex items-center justify-center z-10">
            <TrendingUp className="w-8 h-8 text-text-info animate-pulse" />
          </div>
        )}
        {isClient && containerWidth > 0 ? (
          <ResponsiveContainer width={containerWidth} height={250} minWidth={0} minHeight={0}>
            <ComposedChart
              data={chartData}
              onClick={handlePointClick}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-tertiary)" />
              
              {/* Safe target ranges reference lines */}
              <ReferenceLine y={convertValue(70)} stroke="var(--color-text-danger)" strokeDasharray="3 3" opacity={0.4} />
              <ReferenceLine y={convertValue(130)} stroke="var(--color-text-success)" strokeDasharray="3 3" opacity={0.4} />
              <ReferenceLine y={convertValue(180)} stroke="var(--color-text-warning)" strokeDasharray="3 3" opacity={0.4} />

              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                domain={[yMinDomain, yMaxDomain]}
                tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }}
                axisLine={false}
                tickLine={false}
                dx={-5}
              />

              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />

              {/* Rolling 7-day average line */}
              <Line
                name="7d Rolling Average"
                type="monotone"
                dataKey="rolling7d"
                stroke="var(--color-text-secondary)"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
                activeDot={false}
                connectNulls
              />

              {/* Glucose Reading line */}
              <Line
                name="Glucose Level"
                type="monotone"
                dataKey="glucose"
                stroke="var(--color-text-info)"
                strokeWidth={2}
                dot={{ fill: "var(--color-text-info)", stroke: "var(--color-bg-primary)", strokeWidth: 1, r: 3.5 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-text-info animate-pulse" />
          </div>
        )}
      </div>

      {stats && (
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border-tertiary text-xs text-text-secondary">
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-text-danger" />
              Range: <strong className="text-text-primary">{stats.min} – {stats.max} {units}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-text-success" />
              Average: <strong className="text-text-primary">{stats.avg} {units}</strong>
            </span>
            <span>
              Latest: <strong className="text-text-primary">{stats.latestValue} {units}</strong> ({stats.latestTimeAgo})
            </span>
          </div>
          {highlightedPoint && (
            <div className="text-[11px] bg-bg-secondary px-2.5 py-1 rounded border border-border-tertiary text-text-primary">
              Selected: <strong className="text-text-info">{highlightedPoint.glucose} {units}</strong> on {highlightedPoint.date}
              <button
                onClick={() => setHighlightedPoint(null)}
                className="ml-2 text-[10px] text-text-tertiary hover:text-text-primary underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
