"use client";
import React, { useState } from "react";
import LeadSummaryCards from "./LeadSummaryCards";
import FilterComponent from "./FilterComponent";

interface Option { value: string; label: string; }
interface FilterValues {
  startDate: string; endDate: string; statuses: string[]; leadTypes: string[];
  assignedTo: string[]; interestLevels: string[]; projects: string[];
}
interface ProgressProps {
  counts: { [key: string]: number };
  leadTypeCounts: { [key: string]: number };
  onLeadTypeSelect: (type: string) => void;
  onFilterApply: (filters: FilterValues) => void;
  onFilterClear: () => void;
  currentFilters: FilterValues;
  filterText: string;
  setFilterText: (text: string) => void;
  selectedLeadType: string;
  isLoading: boolean;
  statusOptions: Option[];
  leadTypeOptions: Option[];
  assignedToOptions: Option[];
  interestLevelOptions: Option[];
  projectOptions: Option[];
}

const Progress: React.FC<ProgressProps> = ({
  counts, leadTypeCounts, onLeadTypeSelect, onFilterApply, onFilterClear,
  currentFilters, filterText, setFilterText, selectedLeadType, isLoading,
  statusOptions, leadTypeOptions, assignedToOptions, interestLevelOptions, projectOptions,
}) => {
  const [filterOpen, setFilterOpen] = useState(false);

  const statusCards = [
    { label: "New",           key: "New",           color: "var(--theme-color)", bg: "rgba(var(--theme-color-rgb), 0.1)" },
    { label: "Contacted",     key: "Contacted",     color: "#0EA5E9", bg: "#F0F9FF" },
    { label: "Qualified",     key: "Qualified",     color: "#059669", bg: "#ECFDF5" },
    { label: "Working",       key: "Working",       color: "#D97706", bg: "#FFFBEB" },
    { label: "Proposal Sent", key: "Proposal Sent", color: "#7C3AED", bg: "#F5F3FF" },
    { label: "Lost",          key: "Lost",          color: "#DC2626", bg: "#FEF2F2" },
  ];

  const interestChips = [
    { label: "All",  key: "all"  },
    { label: "🔥 Hot",  key: "Hot",  color: "#DC2626", bg: "#FEF2F2" },
    { label: "🌡 Warm", key: "Warm", color: "#D97706", bg: "#FFFBEB" },
    { label: "🆕 New",  key: "New",  color: "#2563EB", bg: "#EEF3FF" },
    { label: "❄ Cold",  key: "Cold", color: "var(--theme-color)", bg: "rgba(var(--theme-color-rgb), 0.1)" },
  ];

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Status summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, marginBottom: 14 }}>
        {statusCards.map(s => (
          <div key={s.key} style={{ background: "hsl(var(--card))", borderRadius: 10, padding: "12px 14px", border: "1px solid hsl(var(--border))", borderLeft: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>{counts[s.key] ?? 0}</div>
            <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", fontWeight: 600, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Source tabs */}
      <LeadSummaryCards
        leadTypeCounts={leadTypeCounts}
        onCardClick={onLeadTypeSelect}
        selectedLeadType={selectedLeadType}
        isLoading={isLoading}
      />

      {/* Filter bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const, background: "hsl(var(--card))", borderRadius: 10, padding: "10px 14px", border: "1px solid hsl(var(--border))" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "0 0 220px" }}>
          <svg style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-muted-foreground" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            placeholder="Search leads…"
            style={{ width: "100%", paddingLeft: 28, paddingRight: 10, height: 32, border: "1px solid hsl(var(--border))", borderRadius: 7, fontSize: 12, outline: "none", background: "hsl(var(--background))", color: "hsl(var(--foreground))", fontFamily: "inherit" }}
          />
        </div>

        {/* Interest chips */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {interestChips.map(chip => {
            const isAll = chip.key === "all";
            const active = isAll ? (currentFilters.interestLevels?.length === 0) : currentFilters.interestLevels?.includes(chip.key);
            return (
              <button key={chip.key} onClick={() => {
                if (isAll) onFilterApply({ ...currentFilters, interestLevels: [] });
                else {
                  const cur = currentFilters.interestLevels || [];
                  onFilterApply({ ...currentFilters, interestLevels: active ? cur.filter(x => x !== chip.key) : [...cur, chip.key] });
                }
              }} style={{
                padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                border: `1.5px solid ${active ? "var(--theme-color)" : "hsl(var(--border))"}`,
                background: active ? "var(--theme-color)" : "hsl(var(--card))",
                color: active ? "#fff" : (isAll ? "hsl(var(--muted-foreground))" : chip.color),
                cursor: "pointer", whiteSpace: "nowrap" as const,
              }}>{chip.label}</button>
            );
          })}
        </div>

        {/* Advanced filter + Clear */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginLeft: "auto" }}>
          {/* Clear Filters — only visible when filters are active */}
          {(currentFilters.interestLevels?.length > 0 ||
            currentFilters.statuses?.length > 0 ||
            currentFilters.leadTypes?.length > 0 ||
            currentFilters.assignedTo?.length > 0 ||
            currentFilters.projects?.length > 0 ||
            currentFilters.startDate ||
            currentFilters.endDate ||
            filterText) && (
            <button
              onClick={() => { onFilterClear(); setFilterText(""); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, border: "1.5px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              Clear Filters
            </button>
          )}
          <button onClick={() => setFilterOpen(o => !o)} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, border: "1px solid hsl(var(--border))", background: filterOpen ? "rgba(var(--theme-color-rgb), 0.1)" : "hsl(var(--card))", color: filterOpen ? "var(--theme-color)" : "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 4h18M7 12h10M11 20h2"/></svg>
            Filters
          </button>
        </div>
      </div>

      {filterOpen && (
        <div style={{ marginTop: 10 }}>
          <FilterComponent
            initialFilters={currentFilters}
            onApply={(f) => { onFilterApply(f); setFilterOpen(false); }}
            onClear={() => { onFilterClear(); setFilterOpen(false); }}
            onClose={() => setFilterOpen(false)}
            statusOptions={statusOptions}
            leadTypeOptions={leadTypeOptions}
            assignedToOptions={assignedToOptions}
            interestLevelOptions={interestLevelOptions}
            projectOptions={projectOptions}
          />
        </div>
      )}
    </div>
  );
};
export default Progress;
