// // src/components/FilterComponent.tsx
// "use client";

// import React, { useState } from "react";
// import { format } from "date-fns";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Calendar } from "@/components/ui/calendar";
// import {
//   Popover,
//   PopoverTrigger,
//   PopoverContent,
// } from "@/components/ui/popover";
// import { cn } from "@/lib/utils";
// import { CalendarIcon, ChevronDown } from "lucide-react";

// interface Option {
//   value: string;
//   label: string;
// }

// interface FilterValues {
//   startDate: string;
//   endDate: string;
//   statuses: string[];
//   leadTypes: string[];
//   projectName: string;
//   assignedTo: string[];
//   interestLevels: string[];
//   projects: string[];
// }

// interface Props {
//   onApply: (f: FilterValues) => void;
//   onClose: () => void;
//   statusOptions?: Option[];
//   leadTypeOptions?: Option[];
//   assignedToOptions?: Option[];
//   interestLevelOptions?: Option[];
//   projectOptions?: Option[];
// }

// /* ---------- Multi-Select ---------- */
// const MultiSelect = ({
//   label,
//   options,
//   selected,
//   setSelected,
// }: {
//   label: string;
//   options: Option[];
//   selected: Option[];
//   setSelected: React.Dispatch<React.SetStateAction<Option[]>>;
// }) => {
//   const [open, setOpen] = useState(false);

//   return (
//     <div className="relative">
//       <Label>{label}</Label>
//       <Popover open={open} onOpenChange={setOpen}>
//         <PopoverTrigger asChild>
//           <Button
//             variant="outline"
//             role="combobox"
//             className="w-full justify-between font-normal"
//           >
//             {selected.length > 0
//               ? `${selected.length} selected`
//               : `Select ${label.toLowerCase()}…`}
//             <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//           </Button>
//         </PopoverTrigger>
//         <PopoverContent className="w-full p-0" align="start">
//           <div className="max-h-60 overflow-auto p-1">
//             {options.length === 0 ? (
//               <p className="px-3 py-2 text-sm text-muted-foreground">
//                 No options
//               </p>
//             ) : (
//               options.map((opt) => {
//                 const checked = selected.some((i) => i.value === opt.value);
//                 return (
//                   <button
//                     key={opt.value}
//                     type="button"
//                     className={cn(
//                       "flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent",
//                       checked && "bg-accent font-medium"
//                     )}
//                     onClick={() => {
//                       setSelected((prev) =>
//                         checked
//                           ? prev.filter((i) => i.value !== opt.value)
//                           : [...prev, opt]
//                       );
//                     }}
//                   >
//                     <div
//                       className={cn(
//                         "flex h-4 w-4 items-center justify-center rounded-sm border",
//                         checked
//                           ? "bg-primary text-primary-foreground"
//                           : "border-input"
//                       )}
//                     >
//                       {checked && (
//                         <svg
//                           className="h-3 w-3"
//                           fill="none"
//                           stroke="currentColor"
//                           viewBox="0 0 24 24"
//                         >
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth={3}
//                             d="M5 13l4 4L19 7"
//                           />
//                         </svg>
//                       )}
//                     </div>
//                     {opt.label}
//                   </button>
//                 );
//               })
//             )}
//           </div>
//         </PopoverContent>
//       </Popover>
//     </div>
//   );
// };

// /* ---------- Date Range Picker ---------- */
// const DateRangePicker = ({
//   startDate,
//   endDate,
//   onChange,
// }: {
//   startDate: Date | undefined;
//   endDate: Date | undefined;
//   onChange: (start: Date, end: Date) => void;
// }) => {
//   const [open, setOpen] = useState(false);

//   return (
//     <Popover open={open} onOpenChange={setOpen}>
//       <PopoverTrigger asChild>
//         <Button
//           variant="outline"
//           className={cn(
//             "w-full justify-start text-left font-normal",
//             !startDate && "text-muted-foreground"
//           )}
//         >
//           <CalendarIcon className="mr-2 h-4 w-4" />
//           {startDate ? (
//             endDate ? (
//               <>
//                 {format(startDate, "MMM d, yyyy")} -{" "}
//                 {format(endDate, "MMM d, yyyy")}
//               </>
//             ) : (
//               format(startDate, "MMM d, yyyy")
//             )
//           ) : (
//             <span>Pick a date range</span>
//           )}
//         </Button>
//       </PopoverTrigger>
//       <PopoverContent className="w-auto p-0" align="start">
//         <Calendar
//           mode="range"
//           selected={{ from: startDate, to: endDate }}
//           onSelect={(range) => {
//             if (range?.from && range?.to) {
//               onChange(range.from, range.to);
//               setOpen(false);
//             }
//           }}
//           numberOfMonths={2}
//           className="rounded-md border"
//         />
//       </PopoverContent>
//     </Popover>
//   );
// };

// export default function FilterComponent({
//   onApply,
//   onClose,
//   statusOptions = [],
//   leadTypeOptions = [],
//   assignedToOptions = [],
//   interestLevelOptions = [],
//   projectOptions = [],
// }: Props) {
//   const today = new Date();
//   const [startDate, setStartDate] = useState<Date | undefined>(today);
//   const [endDate, setEndDate] = useState<Date | undefined>(today);

//   const [selectedStatuses, setSelectedStatuses] = useState<Option[]>([]);
//   const [selectedLeadTypes, setSelectedLeadTypes] = useState<Option[]>([]);
//   const [projectName, setProjectName] = useState("");
//   const [selectedAssignedTo, setSelectedAssignedTo] = useState<Option[]>([]);
//   const [selectedInterestLevels, setSelectedInterestLevels] = useState<
//     Option[]
//   >([]);
//   const [selectedProjects, setSelectedProjects] = useState<Option[]>([]);

//   const apply = () => {
//     onApply({
//       startDate: startDate ? format(startDate, "yyyy-MM-dd") : "",
//       endDate: endDate ? format(endDate, "yyyy-MM-dd") : "",
//       statuses: selectedStatuses.map((o) => o.value),
//       leadTypes: selectedLeadTypes.map((o) => o.value),
//       projectName,
//       assignedTo: selectedAssignedTo.map((o) => o.value),
//       interestLevels: selectedInterestLevels.map((o) => o.value),
//       projects: selectedProjects.map((o) => o.value),
//     });
//     onClose();
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-start justify-end p-4">
//       {/* Backdrop */}
//       <div className="absolute inset-0 bg-black/20" onClick={onClose} />

//       {/* Card */}
//       <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
//         <div className="mb-4 flex items-center justify-between">
//           <h3 className="text-lg font-semibold">Filters</h3>
//           <Button variant="ghost" size="icon" onClick={onClose}>
//             <svg
//               className="h-4 w-4"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M6 18L18 6M6 6l12 12"
//               />
//             </svg>
//           </Button>
//         </div>

//         {/* Date Range */}
//         <div className="mb-5">
//           <Label>Date Range (Created)</Label>
//           <DateRangePicker
//             startDate={startDate}
//             endDate={endDate}
//             onChange={(s, e) => {
//               setStartDate(s);
//               setEndDate(e);
//             }}
//           />
//         </div>

//         {/* 2-column grid */}
//         <div className="grid grid-cols-2 gap-4">
//           <MultiSelect
//             label="Status"
//             options={statusOptions}
//             selected={selectedStatuses}
//             setSelected={setSelectedStatuses}
//           />
//           <MultiSelect
//             label="Lead Source"
//             options={leadTypeOptions}
//             selected={selectedLeadTypes}
//             setSelected={setSelectedLeadTypes}
//           />

//           <div>
//             <Label>Project Name</Label>
//             <Input
//               placeholder="Enter project name…"
//               value={projectName}
//               onChange={(e) => setProjectName(e.target.value)}
//             />
//           </div>

//           <MultiSelect
//             label="Assigned To"
//             options={assignedToOptions}
//             selected={selectedAssignedTo}
//             setSelected={setSelectedAssignedTo}
//           />

//           <MultiSelect
//             label="Interest Level"
//             options={interestLevelOptions}
//             selected={selectedInterestLevels}
//             setSelected={setSelectedInterestLevels}
//           />

//           {/* NEW: Projects dropdown */}
//           <MultiSelect
//             label="Projects"
//             options={projectOptions}
//             selected={selectedProjects}
//             setSelected={setSelectedProjects}
//           />
//         </div>

//         <Button onClick={apply} className="mt-6 w-full">
//           Apply Filters
//         </Button>
//       </div>
//     </div>
//   );
// }

// src/components/FilterComponent.tsx
"use client";

import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface FilterValues {
  startDate: string;
  endDate: string;
  statuses: string[];
  leadTypes: string[];
  assignedTo: string[];
  interestLevels: string[];
  projects: string[];
}

interface Props {
  onApply: (f: FilterValues) => void;
  onClear: () => void;
  onClose: () => void;
  initialFilters?: FilterValues; // ← NEW: receive current filters
  statusOptions?: Option[];
  leadTypeOptions?: Option[];
  assignedToOptions?: Option[];
  interestLevelOptions?: Option[];
  projectOptions?: Option[];
}

/* ---------- Multi-Select ---------- */
const MultiSelect = ({
  label,
  options,
  selected,
  setSelected,
}: {
  label: string;
  options: Option[];
  selected: Option[];
  setSelected: React.Dispatch<React.SetStateAction<Option[]>>;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Label className="dark:text-slate-350">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between font-normal dark:border-slate-800 dark:hover:bg-slate-850 dark:text-slate-300 relative group"
          >
            <span className="truncate">
              {selected.length > 0
                ? `${selected.length} selected`
                : `Select ${label.toLowerCase()}…`}
            </span>
            {selected.length > 0 ? (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected([]);
                }}
                className="hover:text-rose-500 p-0.5 rounded-full transition-colors z-10"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
            ) : (
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 dark:bg-slate-900 dark:border-slate-800" align="start">
          <div className="max-h-60 overflow-auto p-1">
            {selected.length > 0 && (
              <button
                type="button"
                className="flex w-full items-center justify-center rounded-sm px-3 py-1.5 text-xs font-semibold text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-b dark:border-slate-800 mb-1 transition-colors"
                onClick={() => setSelected([])}
              >
                Clear Selection
              </button>
            )}
            {options.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                No options
              </p>
            ) : (
              options.map((opt) => {
                const checked = selected.some((i) => i.value === opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent dark:hover:bg-slate-800 dark:text-slate-300",
                      checked && "bg-accent dark:bg-slate-850 font-medium"
                    )}
                    onClick={() => {
                      setSelected((prev) =>
                        checked
                          ? prev.filter((i) => i.value !== opt.value)
                          : [...prev, opt]
                      );
                    }}
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-sm border",
                        checked
                          ? "bg-primary dark:bg-[var(--theme-color)] text-primary-foreground border-transparent"
                          : "border-input dark:border-slate-850"
                      )}
                    >
                      {checked && (
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    {opt.label}
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

/* ---------- Date Range Picker ---------- */
const DateRangePicker = ({
  startDate,
  endDate,
  onChange,
}: {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onChange: (start: Date | undefined, end: Date | undefined) => void;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-between text-left font-normal dark:border-slate-800 dark:hover:bg-slate-850 dark:text-slate-300 relative",
            !startDate && "text-muted-foreground"
          )}
        >
          <div className="flex items-center truncate">
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            {startDate ? (
              endDate ? (
                <span>
                  {format(startDate, "MMM d, yyyy")} -{" "}
                  {format(endDate, "MMM d, yyyy")}
                </span>
              ) : (
                <span>{format(startDate, "MMM d, yyyy")}</span>
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </div>
          {startDate ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange(undefined, undefined);
              }}
              className="hover:text-rose-500 p-0.5 rounded-full transition-colors z-10"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          ) : (
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 dark:bg-slate-900 dark:border-slate-800" align="start">
        <Calendar
          mode="range"
          selected={{ from: startDate, to: endDate }}
          onSelect={(range) => {
            onChange(range?.from, range?.to);
            if (range?.from && range?.to) setOpen(false);
          }}
          numberOfMonths={2}
          className="rounded-md border"
        />
      </PopoverContent>
    </Popover>
  );
};

export default function FilterComponent({
  onApply,
  onClear,
  onClose,
  initialFilters = {
    startDate: "",
    endDate: "",
    statuses: [],
    leadTypes: [],
    assignedTo: [],
    interestLevels: [],
    projects: [],
  },
  statusOptions = [],
  leadTypeOptions = [],
  assignedToOptions = [],
  interestLevelOptions = [],
  projectOptions = [],
}: Props) {
  // Parse initial dates
  const initialStart = initialFilters.startDate
    ? parseISO(initialFilters.startDate)
    : undefined;
  const initialEnd = initialFilters.endDate
    ? parseISO(initialFilters.endDate)
    : undefined;

  const [startDate, setStartDate] = useState<Date | undefined>(initialStart);
  const [endDate, setEndDate] = useState<Date | undefined>(initialEnd);
  const [selectedStatuses, setSelectedStatuses] = useState<Option[]>(
    statusOptions.filter((o) => initialFilters.statuses.includes(o.value))
  );
  const [selectedLeadTypes, setSelectedLeadTypes] = useState<Option[]>(
    leadTypeOptions.filter((o) => initialFilters.leadTypes.includes(o.value))
  );
  const [selectedAssignedTo, setSelectedAssignedTo] = useState<Option[]>(
    assignedToOptions.filter((o) => initialFilters.assignedTo.includes(o.value))
  );
  const [selectedInterestLevels, setSelectedInterestLevels] = useState<
    Option[]
  >(
    interestLevelOptions.filter((o) =>
      initialFilters.interestLevels.includes(o.value)
    )
  );
  const [selectedProjects, setSelectedProjects] = useState<Option[]>(
    projectOptions.filter((o) => initialFilters.projects.includes(o.value))
  );

  // Sync with parent when options change (e.g. new users)
  useEffect(() => {
    setSelectedStatuses((prev) =>
      prev.filter((s) => statusOptions.some((o) => o.value === s.value))
    );
    setSelectedLeadTypes((prev) =>
      prev.filter((s) => leadTypeOptions.some((o) => o.value === s.value))
    );
    setSelectedAssignedTo((prev) =>
      prev.filter((s) => assignedToOptions.some((o) => o.value === s.value))
    );
    setSelectedInterestLevels((prev) =>
      prev.filter((s) => interestLevelOptions.some((o) => o.value === s.value))
    );
    setSelectedProjects((prev) =>
      prev.filter((s) => projectOptions.some((o) => o.value === s.value))
    );
  }, [
    statusOptions,
    leadTypeOptions,
    assignedToOptions,
    interestLevelOptions,
    projectOptions,
  ]);

  const apply = () => {
    onApply({
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : "",
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : "",
      statuses: selectedStatuses.map((o) => o.value),
      leadTypes: selectedLeadTypes.map((o) => o.value),
      assignedTo: selectedAssignedTo.map((o) => o.value),
      interestLevels: selectedInterestLevels.map((o) => o.value),
      projects: selectedProjects.map((o) => o.value),
    });
    onClose();
  };

  const clear = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedStatuses([]);
    setSelectedLeadTypes([]);
    setSelectedAssignedTo([]);
    setSelectedInterestLevels([]);
    setSelectedProjects([]);
    onClear();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold dark:text-slate-100">Filters</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </div>

        <div className="mb-5">
          <Label className="dark:text-slate-350">Date Range (Created)</Label>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(s, e) => {
              setStartDate(s);
              setEndDate(e);
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <MultiSelect
            label="Status"
            options={statusOptions}
            selected={selectedStatuses}
            setSelected={setSelectedStatuses}
          />
          <MultiSelect
            label="Lead Source"
            options={leadTypeOptions}
            selected={selectedLeadTypes}
            setSelected={setSelectedLeadTypes}
          />
          <MultiSelect
            label="Assigned To"
            options={assignedToOptions}
            selected={selectedAssignedTo}
            setSelected={setSelectedAssignedTo}
          />
          <MultiSelect
            label="Interest Level"
            options={interestLevelOptions}
            selected={selectedInterestLevels}
            setSelected={setSelectedInterestLevels}
          />
          <MultiSelect
            label="Projects"
            options={projectOptions}
            selected={selectedProjects}
            setSelected={setSelectedProjects}
          />
        </div>

        <div className="mt-6 flex justify-between gap-3">
          <Button variant="outline" onClick={clear} className="border-slate-200 dark:border-slate-800 dark:text-slate-355 dark:hover:bg-slate-850 rounded-xl h-9 px-4 font-semibold">
            Clear All
          </Button>
          <Button onClick={apply} className="bg-[var(--theme-color)] hover:bg-[var(--theme-color-hover)] text-white border-none shadow-sm hover:shadow-md transition-all font-semibold rounded-xl h-9 px-4">
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
}
