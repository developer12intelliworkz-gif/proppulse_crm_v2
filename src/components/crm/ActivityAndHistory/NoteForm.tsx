import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import QuillEditor from "@/components/ui/QuillEditor";
import { ActivityStates } from "../ActivityHistory";
import { stripHtml } from "@/utils/dateFormat";

interface NoteFormProps {
  isEditing: boolean;
  canEditActivities: boolean;
  activityStates: ActivityStates;
  editingActivityId: number | null;
  updateActivityState: <K extends keyof ActivityStates>(
    key: K,
    updates: Partial<ActivityStates[K]>,
  ) => void;
  handleApply: (type: keyof ActivityStates) => void;
  handleNotesChange: (value: string) => void;
}

const NoteForm: React.FC<NoteFormProps> = ({
  isEditing,
  canEditActivities,
  activityStates,
  editingActivityId,
  handleApply,
  handleNotesChange,
}) => {
  const hasContent = useMemo(
    () => stripHtml(activityStates.note.notes).length > 0,
    [activityStates.note.notes],
  );

  return (
    <Card className="h-full border border-slate-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.01)] rounded-2xl overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <div className="p-2 bg-orange-50 text-[var(--theme-color)] border border-orange-100/60 rounded-xl">
          <FileText className="h-4 w-4" />
        </div>
        <CardTitle className="text-base font-bold text-slate-800">
          {editingActivityId ? "Edit Note" : "Add Note"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</label>
          <div className="mt-2 rounded-xl border border-slate-200 bg-white [&_.ql-container]:min-h-[180px] [&_.ql-editor]:min-h-[160px] overflow-hidden focus-within:ring-1 focus-within:ring-[var(--theme-color)]/30 focus-within:border-[var(--theme-color)]">
            <QuillEditor
              value={activityStates.note.notes}
              onChange={handleNotesChange}
              readOnly={!isEditing || !canEditActivities}
              placeholder="Add notes (line breaks and formatting are preserved)..."
            />
          </div>
        </div>
        <Button
          onClick={() => handleApply("note")}
          size="sm"
          className="w-full bg-[var(--theme-color)] hover:bg-[var(--theme-color-hover)] text-white font-bold h-9 rounded-lg transition-all"
          disabled={!isEditing || !canEditActivities || !hasContent}
        >
          {editingActivityId ? "Update Note" : "Add Note"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default NoteForm;
