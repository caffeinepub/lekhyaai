import { useEffect, useState } from "react";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatDate(date: Date): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${pad(date.getDate())} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export default function RealtimeClock() {
  const [now, setNow] = useState(() => new Date());
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      data-ocid="realtime-clock.panel"
      className="hidden sm:flex flex-col items-end leading-none select-none"
      title={`Timezone: ${tz}`}
    >
      <span className="text-xs font-mono font-semibold text-foreground/90 tracking-wider tabular-nums">
        {formatTime(now)}
      </span>
      <span className="text-[9px] font-sans text-muted-foreground mt-0.5 tracking-wide">
        {formatDate(now)}
      </span>
    </div>
  );
}
