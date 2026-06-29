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
import {
  DISPOSITION_OPTIONS,
  FOLLOWUP_TYPES,
  NOT_INTERESTED_REASONS,
} from "./followUpConstants";

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
  const [leadSearch, setLeadSearch] = useState("");
  const [leadOptions, setLeadOptions] = useState<
    { id: string; name: string; phone?: string }[]
  >([]);
  const [leadId, setLeadId] = useState(presetLeadId || "");
  const [leadName, setLeadName] = useState(presetLeadName || "");
  const [followupType, setFollowupType] = useState("call");
  const [disposition, setDisposition] = useState("");
  const [notInterestedReason, setNotInterestedReason] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [nextTime, setNextTime] = useState("10:00");
  const [priority, setPriority] = useState("medium");
  const [notes, setNotes] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedDisposition = DISPOSITION_OPTIONS.find(
    (d) => d.value === disposition,
  );

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
    setDisposition("");
    setNotInterestedReason("");
    setNextDate("");
    setError("");
  };

  const handleSave = async () => {
    if (!leadId) return;
    if (!disposition) {
      setError("Disposition is required");
      return;
    }
    if (disposition === "not_interested" && !notInterestedReason) {
      setError("Please select a reason for Not Interested");
      return;
    }
    if (disposition === "call_back_later" && !nextDate) {
      setError("Call Back Later requires a next follow-up date");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const today = new Date().toISOString().slice(0, 10);
      const scheduleOn = `${today}T${new Date().toTimeString().slice(0, 5)}`;
      const nextScheduleOn = nextDate
        ? `${nextDate}T${nextTime || "10:00"}`
        : undefined;

      await axiosInstance.post(`/leads/${leadId}/activities`, {
        type: "followup",
        date: today,
        agent: users.find((u) => u.id === assignTo)?.name || null,
        details: {
          followupType,
          subject: selectedDisposition?.label || "Follow-up logged",
          agenda: notes || "Follow-up from management page",
          scheduleOn,
          disposition,
          notInterestedReason:
            disposition === "not_interested" ? notInterestedReason : undefined,
          nextScheduleOn:
            disposition === "call_back_later" ? nextScheduleOn : nextScheduleOn,
          priority,
          leadsTimezone: "asiakolkata",
        },
      });

      if (assignTo) {
        await axiosInstance.put(`/leads/${leadId}`, { assigned_to: assignTo });
      }

      resetForm();
      onOpenChange(false);
      onSaved();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Failed to save follow-up";
      setError(msg);
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
            Record what happened and select a disposition. Closing dispositions
            remove the lead from overdue lists.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {error && <p className="text-sm text-destructive">{error}</p>}

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
              <Label>Follow-up Type *</Label>
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
              <Label>Disposition *</Label>
              <Select value={disposition} onValueChange={setDisposition}>
                <SelectTrigger>
                  <SelectValue placeholder="Select disposition" />
                </SelectTrigger>
                <SelectContent>
                  {DISPOSITION_OPTIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {disposition === "not_interested" && (
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Select
                value={notInterestedReason}
                onValueChange={setNotInterestedReason}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {NOT_INTERESTED_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(disposition === "call_back_later" ||
            disposition === "interested_hot" ||
            disposition === "interested_warm") && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Next Follow-up Date
                  {disposition === "call_back_later" ? " *" : ""}
                </Label>
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
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Hot</SelectItem>
                  <SelectItem value="medium">Warm</SelectItem>
                  <SelectItem value="low">Cold</SelectItem>
                </SelectContent>
              </Select>
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
