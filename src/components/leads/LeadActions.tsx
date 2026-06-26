import React from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom"; // Importing useLocation
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical } from "lucide-react";
import { LocalLead } from "./ListingLeads"; // Import LocalLead

interface LeadActionsProps {
  lead: LocalLead;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  onViewDetails: (lead: LocalLead) => void;
  onEdit: (lead: LocalLead) => void;
  onAssign?: (lead: LocalLead) => void;
  onDelete?: (lead: LocalLead) => void;
  canDelete?: boolean;
}

const LeadActions: React.FC<LeadActionsProps> = ({
  lead,
  isLoading,
  hasPermission,
  onViewDetails,
  onEdit,
  onAssign,
  onDelete,
  canDelete = false,
}) => {
  const location = useLocation();

  // ✅ Detect if we're on the reassignment leads page
  const isOnReassignmentLeadsPage =
    location.pathname === "/settings/reassignment-leads";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" disabled={isLoading}>
          <EllipsisVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {/* ✅ Hide "Lead Details" on reassignment page */}
        {!isOnReassignmentLeadsPage && (
          <DropdownMenuItem onClick={() => onViewDetails(lead)}>
            Lead Details
          </DropdownMenuItem>
        )}

        {/* ✅ Show "Assign Lead" only on reassignment leads page */}
        {isOnReassignmentLeadsPage && (
          <DropdownMenuItem
            onClick={() => onAssign?.(lead)}
            disabled={!onAssign || isLoading}
            className={!onAssign ? "text-gray-400 cursor-not-allowed" : ""}
          >
            Assign Lead
          </DropdownMenuItem>
        )}

        {/* ✅ Hide "Edit" on reassignment page */}
        {!isOnReassignmentLeadsPage && !hasPermission("create_leads") && (
          <DropdownMenuItem
            disabled
            className="text-gray-400 cursor-not-allowed"
          >
            Edit
          </DropdownMenuItem>
        )}

        {!isOnReassignmentLeadsPage && hasPermission("create_leads") && (
          <DropdownMenuItem onClick={() => onEdit(lead)}>Edit</DropdownMenuItem>
        )}

        {canDelete && hasPermission("create_leads") && onDelete && (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(lead)}
            disabled={isLoading}
          >
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LeadActions;
