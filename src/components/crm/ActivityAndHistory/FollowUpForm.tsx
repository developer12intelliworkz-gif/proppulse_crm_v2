import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActivityStates } from "../ActivityHistory";
import { formatTime } from "../ActivityHistory";
import { ACTIVITY_STATUS_OPTIONS } from "@/utils/activityFormUtils";

interface FollowUpFormProps {
  isEditing: boolean;
  canEditActivities: boolean;
  activityStates: ActivityStates;
  editingActivityId: number | null;
  today: string;
  followupCount: number;
  updateActivityState: <K extends keyof ActivityStates>(
    key: K,
    updates: Partial<ActivityStates[K]>
  ) => void;
  handleApply: (type: keyof ActivityStates) => void;
  getMinTime: (date: string) => string;
}

const FollowUpForm: React.FC<FollowUpFormProps> = ({
  isEditing,
  canEditActivities,
  activityStates,
  editingActivityId,
  today,
  followupCount,
  updateActivityState,
  handleApply,
  getMinTime,
}) => {
  return (
    <Card className="h-full border border-slate-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.01)] rounded-2xl overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <div className="p-2 bg-orange-50 text-[var(--theme-color)] border border-orange-100/60 rounded-xl">
          <Clock className="h-4 w-4" />
        </div>
        <CardTitle className="text-base font-bold text-slate-800">
          {editingActivityId ? "Edit Follow-up" : "Schedule Follow-up"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Schedule On (date & time)
            </label>
            <div className="flex gap-2 mt-1.5">
              <Input
                type="date"
                value={activityStates.followup.scheduleDate}
                min={today}
                onChange={(e) =>
                  updateActivityState("followup", {
                    scheduleDate: e.target.value,
                  })
                }
                className="w-full text-xs h-9 focus-visible:ring-[var(--theme-color)]/30 focus-visible:ring-1 focus-visible:border-[var(--theme-color)]"
                disabled={!isEditing || !canEditActivities}
              />
              <Input
                type="time"
                value={activityStates.followup.scheduleTime}
                min={getMinTime(activityStates.followup.scheduleDate)}
                onChange={(e) =>
                  updateActivityState("followup", {
                    scheduleTime: e.target.value,
                  })
                }
                className="w-full text-xs h-9 focus-visible:ring-[var(--theme-color)]/30 focus-visible:ring-1 focus-visible:border-[var(--theme-color)]"
                disabled={!isEditing || !canEditActivities}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lead's Timezone</label>
            <Select
              value={activityStates.followup.leadsTimezone}
              onValueChange={(value) =>
                updateActivityState("followup", { leadsTimezone: value })
              }
              disabled={!isEditing || !canEditActivities}
            >
              <SelectTrigger className="w-full mt-1.5 text-xs h-9">
                <SelectValue placeholder="Select Timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asiakolkata" className="text-xs">Asia/Kolkata</SelectItem>
                <SelectItem value="uspst" className="text-xs">US/PST</SelectItem>
                <SelectItem value="europeparis" className="text-xs">Europe/Paris</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
          <Select
            value={activityStates.followup.status || "scheduled"}
            onValueChange={(value) =>
              updateActivityState("followup", { status: value })
            }
            disabled={!isEditing || !canEditActivities}
          >
            <SelectTrigger className="w-full mt-1.5 text-xs h-9">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Followup Type</label>
          <Select
            value={activityStates.followup.followupType}
            onValueChange={(value) =>
              updateActivityState("followup", { followupType: value })
            }
            disabled={!isEditing || !canEditActivities}
          >
            <SelectTrigger className="w-full mt-1.5 text-xs h-9">
              <SelectValue placeholder="Select Followup Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="call" className="text-xs">Call</SelectItem>
              <SelectItem value="email" className="text-xs">Email</SelectItem>
              <SelectItem value="sms" className="text-xs">SMS</SelectItem>
              <SelectItem value="wa" className="text-xs">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-[11px] font-bold text-slate-500 select-none">
          Number of followups scheduled/pending on (
          <span className="text-[var(--theme-color)]">{activityStates.followup.scheduleDate || "select date"}</span>):{" "}
          <span className="text-slate-800">{followupCount}</span>
        </p>
        <p className="text-[11px] font-bold text-slate-500 select-none">
          {activityStates.followup.scheduleDate &&
          activityStates.followup.scheduleTime
            ? `Will be scheduled in your timezone at ${
                activityStates.followup.scheduleDate
              } ${formatTime(activityStates.followup.scheduleTime)}`
            : "Please select a schedule date and time"}
        </p>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</label>
          <Input
            type="text"
            placeholder="Enter follow-up subject"
            value={activityStates.followup.subject}
            onChange={(e) =>
              updateActivityState("followup", { subject: e.target.value })
            }
            className="w-full mt-1.5 text-xs h-9 focus-visible:ring-[var(--theme-color)]/30 focus-visible:ring-1 focus-visible:border-[var(--theme-color)]"
            disabled={!isEditing || !canEditActivities}
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Agenda</label>
          <Textarea
            className="w-full p-3 mt-1.5 text-xs border rounded-xl focus-visible:ring-[var(--theme-color)]/30 focus-visible:ring-1 focus-visible:border-[var(--theme-color)]"
            placeholder="Notes / Agenda details..."
            rows={3}
            value={activityStates.followup.agenda}
            onChange={(e) =>
              updateActivityState("followup", { agenda: e.target.value })
            }
            disabled={!isEditing || !canEditActivities}
          />
        </div>
        <Button
          onClick={() => handleApply("followup")}
          size="sm"
          className="w-full bg-[var(--theme-color)] hover:bg-[var(--theme-color-hover)] text-white font-bold h-9 rounded-lg transition-all"
          disabled={
            !isEditing ||
            !canEditActivities ||
            !activityStates.followup.scheduleDate ||
            !activityStates.followup.scheduleTime ||
            !activityStates.followup.followupType
          }
        >
          {editingActivityId ? "Update Follow-up" : "Schedule Follow-up"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default FollowUpForm;
