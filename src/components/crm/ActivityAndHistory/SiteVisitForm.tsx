import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActivityStates, Project, User as UserType } from "../ActivityHistory";
import { formatTime } from "../ActivityHistory";
import { ACTIVITY_STATUS_OPTIONS } from "@/utils/activityFormUtils";

// NEW PROPS — REMOVED hasPermission, ADDED canEditActivities
interface SiteVisitFormProps {
  isEditing: boolean;
  canEditActivities: boolean; // ← THIS REPLACES hasPermission("create_leads")
  activityStates: ActivityStates;
  editingActivityId: number | null;
  today: string;
  projects: Project[];
  users: UserType[];
  updateActivityState: <K extends keyof ActivityStates>(
    key: K,
    updates: Partial<ActivityStates[K]>
  ) => void;
  handleApply: (type: keyof ActivityStates) => void;
  getMinTime: (date: string) => string;
}

const SiteVisitForm: React.FC<SiteVisitFormProps> = ({
  isEditing,
  canEditActivities,
  activityStates,
  editingActivityId,
  today,
  projects,
  users,
  updateActivityState,
  handleApply,
  getMinTime,
}) => {
  return (
    <Card className="h-full border border-slate-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.01)] rounded-2xl overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <div className="p-2 bg-orange-50 text-[var(--theme-color)] border border-orange-100/60 rounded-xl">
          <User className="h-4 w-4" />
        </div>
        <CardTitle className="text-base font-bold text-slate-800">
          {editingActivityId ? "Edit Site Visit" : "Schedule Site Visit"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project</label>
            <Select
              value={activityStates.sitevisit.project}
              onValueChange={(value) =>
                updateActivityState("sitevisit", { project: value })
              }
              disabled={
                !isEditing ||
                !canEditActivities ||
                !projects ||
                projects.length === 0
              }
            >
              <SelectTrigger className="w-full mt-1.5 text-xs h-9">
                <SelectValue
                  placeholder={
                    projects && projects.length > 0
                      ? "Select Project"
                      : "No projects available"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {projects && projects.length > 0 ? (
                  projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()} className="text-xs">
                      {project.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No projects available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Site Visit Type</label>
            <Select
              value={activityStates.sitevisit.siteVisitType}
              onValueChange={(value) =>
                updateActivityState("sitevisit", { siteVisitType: value })
              }
              disabled={!isEditing || !canEditActivities}
            >
              <SelectTrigger className="w-full mt-1.5 text-xs h-9">
                <SelectValue placeholder="Select Site Visit Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="initial" className="text-xs">Initial</SelectItem>
                <SelectItem value="followup" className="text-xs">Follow-up</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lead's Timezone</label>
            <Select
              value={activityStates.sitevisit.leadsTimezone}
              onValueChange={(value) =>
                updateActivityState("sitevisit", { leadsTimezone: value })
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
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Team</label>
            <Select
              value={activityStates.sitevisit.teams}
              onValueChange={(value) =>
                updateActivityState("sitevisit", { teams: value })
              }
              disabled={
                !isEditing || !canEditActivities || !users || users.length === 0
              }
            >
              <SelectTrigger className="w-full mt-1.5 text-xs h-9">
                <SelectValue
                  placeholder={
                    users && users.length > 0
                      ? "Select Team"
                      : "No users available"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {users && users.length > 0 ? (
                  users.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="text-xs">
                      {u.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No users available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Schedule On (date & time)
            </label>
            <div className="flex gap-2 mt-1.5">
              <Input
                type="date"
                value={activityStates.sitevisit.scheduleDate}
                min={today}
                onChange={(e) =>
                  updateActivityState("sitevisit", {
                    scheduleDate: e.target.value,
                  })
                }
                className="w-full text-xs h-9 focus-visible:ring-[var(--theme-color)]/30 focus-visible:ring-1 focus-visible:border-[var(--theme-color)]"
                disabled={!isEditing || !canEditActivities}
              />
              <Input
                type="time"
                value={activityStates.sitevisit.scheduleTime}
                min={getMinTime(activityStates.sitevisit.scheduleDate)}
                onChange={(e) =>
                  updateActivityState("sitevisit", {
                    scheduleTime: e.target.value,
                  })
                }
                className="w-full text-xs h-9 focus-visible:ring-[var(--theme-color)]/30 focus-visible:ring-1 focus-visible:border-[var(--theme-color)]"
                disabled={!isEditing || !canEditActivities}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ends On (date & time)</label>
            <div className="flex gap-2 mt-1.5">
              <Input
                type="date"
                value={activityStates.sitevisit.endsDate}
                min={activityStates.sitevisit.scheduleDate || today}
                onChange={(e) =>
                  updateActivityState("sitevisit", { endsDate: e.target.value })
                }
                className="w-full text-xs h-9 focus-visible:ring-[var(--theme-color)]/30 focus-visible:ring-1 focus-visible:border-[var(--theme-color)]"
                disabled={!isEditing || !canEditActivities}
              />
              <Input
                type="time"
                value={activityStates.sitevisit.endsTime}
                min={
                  activityStates.sitevisit.endsDate ===
                  activityStates.sitevisit.scheduleDate
                    ? activityStates.sitevisit.scheduleTime
                    : "00:00"
                }
                onChange={(e) =>
                  updateActivityState("sitevisit", { endsTime: e.target.value })
                }
                className="w-full text-xs h-9 focus-visible:ring-[var(--theme-color)]/30 focus-visible:ring-1 focus-visible:border-[var(--theme-color)]"
                disabled={!isEditing || !canEditActivities}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Site Visit Confirmation
            </label>
            <Select
              value={activityStates.sitevisit.siteVisitConfirmation}
              onValueChange={(value) =>
                updateActivityState("sitevisit", {
                  siteVisitConfirmation: value,
                })
              }
              disabled={!isEditing || !canEditActivities}
            >
              <SelectTrigger className="w-full mt-1.5 text-xs h-9">
                <SelectValue placeholder="Select Confirmation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true" className="text-xs">True</SelectItem>
                <SelectItem value="false" className="text-xs">False</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Channel Partner</label>
            <Select
              value={activityStates.sitevisit.channelPartner}
              onValueChange={(value) =>
                updateActivityState("sitevisit", { channelPartner: value })
              }
              disabled={!isEditing || !canEditActivities}
            >
              <SelectTrigger className="w-full mt-1.5 text-xs h-9">
                <SelectValue placeholder="Select Channel Partner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">None</SelectItem>
                <SelectItem value="partner1" className="text-xs">Partner 1</SelectItem>
                <SelectItem value="partner2" className="text-xs">Partner 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-[11px] font-bold text-slate-500 select-none">
          {activityStates.sitevisit.scheduleDate &&
          activityStates.sitevisit.scheduleTime
            ? `Will be scheduled in your timezone at ${
                activityStates.sitevisit.scheduleDate
              } ${formatTime(activityStates.sitevisit.scheduleTime)}`
            : "Please select a schedule date and time"}
        </p>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
          <Select
            value={activityStates.sitevisit.status || "scheduled"}
            onValueChange={(value) =>
              updateActivityState("sitevisit", { status: value })
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
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Agenda</label>
          <Textarea
            className="w-full p-3 mt-1.5 text-xs border rounded-xl focus-visible:ring-[var(--theme-color)]/30 focus-visible:ring-1 focus-visible:border-[var(--theme-color)]"
            placeholder="Enter agenda details..."
            rows={3}
            value={activityStates.sitevisit.agenda}
            onChange={(e) =>
              updateActivityState("sitevisit", { agenda: e.target.value })
            }
            disabled={!isEditing || !canEditActivities}
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Schedule Followup</label>
          <Input
            type="datetime-local"
            value={activityStates.sitevisit.scheduleFollowup}
            onChange={(e) =>
              updateActivityState("sitevisit", {
                scheduleFollowup: e.target.value,
              })
            }
            className="w-full mt-1.5 text-xs h-9 focus-visible:ring-[var(--theme-color)]/30 focus-visible:ring-1 focus-visible:border-[var(--theme-color)]"
            disabled={!isEditing || !canEditActivities}
          />
        </div>
        <Button
          onClick={() => handleApply("sitevisit")}
          size="sm"
          className="w-full bg-[var(--theme-color)] hover:bg-[var(--theme-color-hover)] text-white font-bold h-9 rounded-lg transition-all"
          disabled={
            !isEditing ||
            !canEditActivities ||
            !activityStates.sitevisit.scheduleDate ||
            !activityStates.sitevisit.scheduleTime ||
            !activityStates.sitevisit.project ||
            activityStates.sitevisit.project === "selectproject" ||
            !activityStates.sitevisit.siteVisitType ||
            activityStates.sitevisit.siteVisitType === "selecttype"
          }
        >
          {editingActivityId ? "Update Site Visit" : "Schedule Site Visit"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SiteVisitForm;
