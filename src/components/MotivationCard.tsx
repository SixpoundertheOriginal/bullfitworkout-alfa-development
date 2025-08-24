import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Info, RefreshCw } from "lucide-react";

interface MotivationCardProps {
  tonnage: number;
  deltaPct?: number;
  coachCopy?: string;
  loading?: boolean;
  loadingCoach?: boolean;
  onRefresh: () => void;
  locale: string;
}

interface Equivalence {
  weight: number;
  label: string;
  emoji: string;
  fact: string;
}

const EQUIVALENTS: Equivalence[] = [
  { weight: 70, label: "person", emoji: "🧍", fact: "An average person weighs about 70 kg." },
  { weight: 400, label: "grand piano", emoji: "🎹", fact: "A grand piano weighs roughly 400 kg." },
  { weight: 500, label: "minotaur", emoji: "🐂", fact: "In Greek myth, the labyrinth's Minotaur might tip the scales at around 500 kg." },
  { weight: 1000, label: "small car", emoji: "🚗", fact: "A small car weighs around 1,000 kg." },
  { weight: 2500, label: "pyramid stone", emoji: "🪨", fact: "A stone block from the Great Pyramid weighs about 2,500 kg." },
  { weight: 3000, label: "hippopotamus", emoji: "🦛", fact: "A hippo can weigh about 3,000 kg." },
  { weight: 6000, label: "elephant", emoji: "🐘", fact: "An African elephant weighs around 6,000 kg." },
  { weight: 150000, label: "blue whale", emoji: "🐋", fact: "The blue whale, Earth's largest animal, can weigh up to 150,000 kg." },
  { weight: 300000, label: "Ishtar Gate", emoji: "🏛️", fact: "Babylon's legendary Ishtar Gate is estimated to have weighed around 300,000 kg." },
];

function getEquivalence(tonnage: number) {
  if (tonnage <= 0) return null;
  const eq = [...EQUIVALENTS].reverse().find(item => tonnage / item.weight >= 1) || EQUIVALENTS[0];
  const n = Math.round(tonnage / eq.weight);
  return { ...eq, n };
}

export const MotivationCard: React.FC<MotivationCardProps> = ({
  tonnage,
  deltaPct = 0,
  coachCopy,
  loading,
  loadingCoach,
  onRefresh,
  locale,
}) => {
  const equivalence = getEquivalence(tonnage);
  const trend = Math.round(deltaPct);
  let trendSymbol = "—";
  let trendClasses = "text-[#A3AED0] border-white/10";
  if (tonnage > 0) {
    if (trend > 0) {
      trendSymbol = "▲";
      trendClasses = "text-emerald-400 border-emerald-400/30";
    } else if (trend < 0) {
      trendSymbol = "▼";
      trendClasses = "text-rose-400 border-rose-400/30";
    }
  }

  const [rotated, setRotated] = useState(false);
  const handleRefresh = () => {
    setRotated(r => !r);
    onRefresh();
  };

  return (
    <Card className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur shadow-[0_1px_0_0_rgba(255,255,255,0.04),0_16px_40px_-20px_rgba(0,0,0,0.6)]">
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400" />
      <CardContent className="flex items-start justify-between gap-3 p-3">
        <div className="flex-1">
          <div className="text-xs text-[#9AA3B2] mb-1">Weekly Tonnage</div>
          {loading ? (
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center" aria-live="polite">
              <div className="flex items-baseline gap-1">
                <span className="text-[clamp(22px,7vw,28px)] leading-tight tabular-nums font-semibold text-white">
                  {tonnage.toLocaleString(locale)}
                </span>
                <span className="text-sm text-white/80">kg</span>
              </div>
              <div className="flex items-center gap-2">
                {tonnage > 0 && equivalence && (
                  <span className="max-w-[60%] truncate whitespace-nowrap text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/90">
                    ≈ {equivalence.n.toLocaleString(locale)} {equivalence.label}
                    {equivalence.n > 1 ? 's' : ''} {equivalence.emoji}
                  </span>
                )}
                {tonnage > 0 && (
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border", trendClasses)}>
                    {trendSymbol === '—' ? '—' : `${trendSymbol} ${Math.abs(trend)}%`}
                  </span>
                )}
              </div>
            </div>
          )}
          {loadingCoach ? (
            <Skeleton className="h-4 w-3/5 mt-1" />
          ) : (
            <p className="mt-1 text-[13px] leading-snug text-white/80 line-clamp-2">
              {tonnage === 0 ? 'Keep lifting—every rep counts.' : coachCopy}
            </p>
          )}
        </div>
        <div className="ml-auto sm:ml-0 shrink-0 flex items-center gap-1">
          {tonnage > 0 && equivalence && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="h-11 w-11 grid place-items-center rounded-full hover:bg-white/5"
                    aria-label="Info"
                  >
                    <Info className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{equivalence.fact}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <button
            onClick={handleRefresh}
            className={cn(
              "h-11 w-11 grid place-items-center rounded-full hover:bg-white/5 transition-transform",
              rotated && "motion-safe:rotate-180"
            )}
            aria-label="Refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MotivationCard;
