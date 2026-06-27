import { useEffect, useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  currentMonthYear,
  formatMonthYearLabel,
} from "@/utils/monthYearDate";

const MONTHS: Array<{ value: string; label: string }> = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Feb" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Apr" },
  { value: "05", label: "May" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Aug" },
  { value: "09", label: "Sep" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dec" },
];

interface MonthYearPickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  disabled?: boolean;
  className?: string;
}

const MonthYearPicker = ({
  value,
  onChange,
  min,
  disabled = false,
  className,
}: MonthYearPickerProps) => {
  const effectiveMin = min || "1900-01";
  const minYear = parseInt(effectiveMin.slice(0, 4), 10);
  const maxYear = new Date().getFullYear() + 30;

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    if (value && /^\d{4}-\d{2}$/.test(value)) {
      return parseInt(value.slice(0, 4), 10);
    }
    return minYear;
  });

  useEffect(() => {
    if (!open) return;
    if (value && /^\d{4}-\d{2}$/.test(value)) {
      setViewYear(parseInt(value.slice(0, 4), 10));
    } else {
      setViewYear(minYear);
    }
  }, [open, value, minYear]);

  const displayLabel = useMemo(
    () => formatMonthYearLabel(value) || "Select month & year",
    [value],
  );

  const isMonthDisabled = (monthValue: string) => {
    const candidate = `${viewYear}-${monthValue}`;
    return candidate < effectiveMin;
  };

  const handleSelectMonth = (monthValue: string) => {
    if (isMonthDisabled(monthValue)) return;
    onChange(`${viewYear}-${monthValue}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full max-w-xs justify-start gap-2 font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <Calendar className="h-4 w-4 shrink-0 opacity-70" />
          <span className="truncate">{displayLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="p-3">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={viewYear <= minYear}
              onClick={() => setViewYear((y) => y - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold tabular-nums">{viewYear}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={viewYear >= maxYear}
              onClick={() => setViewYear((y) => y + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {MONTHS.map((m) => {
              const selected = value === `${viewYear}-${m.value}`;
              const monthDisabled = isMonthDisabled(m.value);
              return (
                <button
                  key={m.value}
                  type="button"
                  disabled={monthDisabled}
                  onClick={() => handleSelectMonth(m.value)}
                  className={cn(
                    "h-10 rounded-md text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                    "disabled:pointer-events-none disabled:opacity-35 disabled:text-muted-foreground",
                    selected &&
                      "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                  )}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MonthYearPicker;
