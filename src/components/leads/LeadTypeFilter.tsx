import React from "react";
import Progress from "./Progress";

interface LeadTypeFilterProps {
  counts: { [key: string]: number };
  leadTypeCounts: { [key: string]: number };
  selectedLeadType: string;
  onLeadTypeSelect: (type: string) => void;
}

const LeadTypeFilter: React.FC<LeadTypeFilterProps> = ({
  counts,
  leadTypeCounts,
  selectedLeadType,
  onLeadTypeSelect,
}) => {
  return (
    <div className="pt-4">
      <Progress
        counts={counts}
        leadTypeCounts={leadTypeCounts}
        onLeadTypeSelect={onLeadTypeSelect}
      />
    </div>
  );
};

export default LeadTypeFilter;
