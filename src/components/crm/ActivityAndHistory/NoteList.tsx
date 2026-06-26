import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, Trash2, Edit } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Activity } from "../ActivityHistory";
import { formatTime } from "../ActivityHistory";
import {
  formatDisplayDate,
  notePreviewTitle,
} from "@/utils/dateFormat";
import { cn } from "@/lib/utils";

interface NoteListProps {
  loading: boolean;
  error: string | null;
  canViewActivities: boolean;
  canEditActivities: boolean;
  noteActivities: Activity[];
  handleEditActivity: (activity: Activity) => void;
  handleRemoveActivity: (activityId: number) => void;
}

const NoteList: React.FC<NoteListProps> = ({
  loading,
  error,
  canViewActivities,
  canEditActivities,
  noteActivities,
  handleEditActivity,
  handleRemoveActivity,
}) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const sortedNotes = useMemo(
    () =>
      [...noteActivities].sort((a, b) => {
        const da = `${a.date || ""}T${a.time || "00:00"}`;
        const db = `${b.date || ""}T${b.time || "00:00"}`;
        return db.localeCompare(da);
      }),
    [noteActivities],
  );

  useEffect(() => {
    if (sortedNotes.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !sortedNotes.some((n) => n.id === selectedId)) {
      setSelectedId(sortedNotes[0].id);
    }
  }, [sortedNotes, selectedId]);

  const selectedNote = sortedNotes.find((n) => n.id === selectedId) ?? null;

  const renderNoteBody = (html: string) => {
    const safe = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "em",
        "u",
        "ol",
        "ul",
        "li",
        "h1",
        "h2",
        "h3",
        "a",
        "span",
      ],
      ALLOWED_ATTR: ["href", "target", "rel"],
    });
    return (
      <div
        className="prose prose-sm max-w-none text-gray-800 [&_p]:my-2 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5"
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <div className="p-2 bg-orange-50 text-[var(--theme-color)] border border-orange-100/60 rounded-xl">
          <FileText className="h-4 w-4" />
        </div>
        <CardTitle className="text-base font-bold text-slate-800">Notes History</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : error ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : !canViewActivities ? (
          <p className="text-sm text-gray-500 italic">
            No permission to view notes.
          </p>
        ) : sortedNotes.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No notes recorded yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[minmax(200px,35%)_1fr] gap-4 min-h-[320px]">
            <ul className="border border-slate-150 rounded-xl divide-y divide-slate-100 max-h-[420px] overflow-y-auto shadow-[0_1px_3px_rgba(0,0,0,0.01)] bg-white">
              {sortedNotes.map((activity) => {
                const title = notePreviewTitle(activity.description);
                const isActive = activity.id === selectedId;
                return (
                  <li key={activity.id}>
                    <button
                      type="button"
                      className={cn(
                        "w-full text-left px-3.5 py-3.5 border-l-2 hover:bg-slate-50 transition-colors",
                        isActive ? "bg-orange-50/40 border-l-[var(--theme-color)] text-[var(--theme-color)] font-bold" : "border-l-transparent text-slate-700"
                      )}
                      onClick={() => setSelectedId(activity.id)}
                    >
                      <div className="text-xs line-clamp-2 leading-relaxed">{title}</div>
                      <div className="text-[10px] text-slate-400 mt-1.5 font-medium">
                        {formatDisplayDate(activity.date)}
                        {activity.time ? ` · ${formatTime(activity.time)}` : ""}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="border border-slate-150 rounded-xl p-5 flex flex-col min-h-[280px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
              {selectedNote ? (
                <>
                  <div className="flex justify-between items-start gap-2 mb-3 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm tracking-tight leading-tight">
                        {notePreviewTitle(selectedNote.description, 120)}
                      </h4>
                      <p className="text-[11px] font-medium text-slate-400 mt-1">
                        {formatDisplayDate(selectedNote.date)}
                        {selectedNote.time
                          ? ` at ${formatTime(selectedNote.time)}`
                          : ""}{" "}
                        · by {selectedNote.agent}
                      </p>
                    </div>
                    {canEditActivities && (
                      <div className="flex gap-1.5 shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditActivity(selectedNote)}
                          className="h-8 w-8 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                          title="Edit in form"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-lg border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the note.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <Button
                                variant="destructive"
                                onClick={() =>
                                  handleRemoveActivity(selectedNote.id)
                                }
                              >
                                Delete
                              </Button>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {renderNoteBody(selectedNote.description)}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a note to view its content.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NoteList;
