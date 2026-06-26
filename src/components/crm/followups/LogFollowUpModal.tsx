import { useEffect, useState } from "react";
import axiosInstance from "@/api/axiosInstance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  FOLLOWUP_TYPES,
  LEAD_STATUS_OPTIONS,
  OUTCOME_OPTIONS,
} from "./followUpConstants";
import { ACTIVITY_STATUS_OPTIONS } from "@/utils/activityFormUtils";

interface UserOption {
  id: string;
  name: string;
}

interface LogFollowUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: string | null;
  leadName?: string;
  users: UserOption[];
  onSaved: () => void;
}

const LogFollowUpModal = ({
  open,
  onOpenChange,
  leadId: presetLeadId,
  leadName: presetLeadName,
  users,
  onSaved,
}: LogFollowUpModalProps) => {
  const { toast } = useToast();
  const [leadSearch, setLeadSearch] = useState("");
  const [leadOptions, setLeadOptions] = useState<
    { id: string; name: string; phone?: string }[]
  >([]);
  const [leadId, setLeadId] = useState(presetLeadId || "");
  const [leadName, setLeadName] = useState(presetLeadName || "");
  const [followupType, setFollowupType] = useState("call");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("10:00");
  const [nextDate, setNextDate] = useState("");
  const [nextTime, setNextTime] = useState("10:00");
  const [stage, setStage] = useState("contacted");
  const [outcome, setOutcome] = useState("");
  const [priority, setPriority] = useState("medium");
  const [notes, setNotes] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [activityStatus, setActivityStatus] = useState("scheduled");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (presetLeadId) setLeadId(presetLeadId);
    if (presetLeadName) setLeadName(presetLeadName);
  }, [presetLeadId, presetLeadName, open]);

  useEffect(() => {
    if (!open || leadSearch.length < 2) {
      setLeadOptions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await axiosInstance.get("/leads", {
          params: { search: leadSearch, limit: 10, page: 1 },
        });
        const rows = res.data?.data || res.data?.leads || [];
        setLeadOptions(
          rows.map((l: { id: string; name: string; phone?: string }) => ({
            id: l.id,
            name: l.name,
            phone: l.phone,
          })),
        );
      } catch {
        setLeadOptions([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [leadSearch, open]);

  const resetForm = () => {
    if (!presetLeadId) {
      setLeadId("");
      setLeadName("");
    }
    setNotes("");
    setOutcome("");
    setScheduleDate("");
    setNextDate("");
  };

  const handleSave = async () => {
    if (!leadId) return;
    setSaving(true);
    try {
      const scheduleOn =
        scheduleDate && scheduleTime
          ? `${scheduleDate}T${scheduleTime}`
          : `${new Date().toISOString().slice(0, 10)}T${scheduleTime || "10:00"}`;

      await axiosInstance.post(`/leads/${leadId}/activities`, {
        type: "followup",
        agent: users.find((u) => u.id === assignTo)?.name || null,
        date: scheduleOn.slice(0, 10),
        time: scheduleOn.slice(11, 16),
        details: {
          followupType,
          subject: outcome || "Follow-up logged",
          agenda: notes || "Follow-up from management page",
          scheduleOn,
          priority,
          outcome: outcome || null,
          leadsTimezone: "asiakolkata",
        },
      });

      if (nextDate) {
        const nextOn = `${nextDate}T${nextTime || "10:00"}`;
        await axiosInstance.post(`/leads/${leadId}/activities`, {
          type: "followup",
          date: nextDate,
          time: nextTime,
          details: {
            followupType: "call",
            subject: "Next follow-up scheduled",
            agenda: notes || "Scheduled next action",
            scheduleOn: nextOn,
            priority,
            leadsTimezone: "asiakolkata",
          },
        });
      }

      if (stage) {
        await axiosInstance.put(`/leads/${leadId}`, { status: stage });
      }
      if (assignTo) {
        await axiosInstance.put(`/leads/${leadId}`, { assigned_to: assignTo });
      }

      resetForm();
      onOpenChange(false);
      onSaved();
    } catch (err) {
      console.error(err);
      // toast({
        // title: "Failed to save follow-up",
        // description: "Please check required fields and try again.",
        // variant: "destructive",
      // });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Follow-up</DialogTitle>
          <DialogDescription>
            Record a touchpoint and schedule the next action.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {!presetLeadId && (
            <div className="space-y-2">
              <Label>Search Lead</Label>
              <Input
                placeholder="Type lead name or phone..."
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
              />
              {leadOptions.length > 0 && (
                <div className="border rounded-md max-h-32 overflow-y-auto">
                  {leadOptions.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                      onClick={() => {
                        setLeadId(l.id);
                        setLeadName(l.name);
                        setLeadSearch(l.name);
                        setLeadOptions([]);
                      }}
                    >
                      {l.name} {l.phone ? `· ${l.phone}` : ""}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-1">
            <Label>Lead</Label>
            <Input value={leadName || "Select a lead"} readOnly disabled />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Follow-up Type</Label>
              <Select value={followupType} onValueChange={setFollowupType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOLLOWUP_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Follow-up Status</Label>
              <Select value={activityStatus} onValueChange={setActivityStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Follow-up Date</Label>
              <Input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Update Stage</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Outcome</Label>
              <Select value={outcome} onValueChange={setOutcome}>
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  {OUTCOME_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Next Follow-up Date</Label>
              <Input
                type="date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Next Time</Label>
              <Input
                type="time"
                value={nextTime}
                onChange={(e) => setNextTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assign To</Label>
            <Select value={assignTo} onValueChange={setAssignTo}>
              <SelectTrigger>
                <SelectValue placeholder="Salesperson" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes / Remarks</Label>
            <Textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Conversation summary, objections, next steps..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!leadId || saving}>
            {saving ? "Saving..." : "Save Follow-up"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LogFollowUpModal;
