import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Save, X, RefreshCw } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import axiosInstance from "@/api/axiosInstance";
import NoteForm from "./ActivityAndHistory/NoteForm";
import NoteList from "./ActivityAndHistory/NoteList";
import FollowUpForm from "./ActivityAndHistory/FollowUpForm";
import FollowUpList from "./ActivityAndHistory/FollowUpList";
import SiteVisitForm from "./ActivityAndHistory/SiteVisitForm";
import SiteVisitList from "./ActivityAndHistory/SiteVisitList";
import DocumentsForm from "./ActivityAndHistory/DocumentsForm";
import DocumentsList from "./ActivityAndHistory/DocumentsList";
import { getTodayInTimeZone, stripHtml } from "@/utils/dateFormat";
import {
  buildFollowupDetails,
  buildSiteVisitDetails,
  normalizeFollowupForm,
  normalizeSiteVisitForm,
} from "@/utils/activityFormUtils";

export interface Activity {
  id: number;
  type: string;
  description: string;
  date: string;
  time: string;
  agent: string;
  details?: any;
}

export interface Document {
  id: number;
  name: string;
  type: string;
  document_name?: string;
}

export interface User {
  id: string;
  name: string;
}

export interface Project {
  id: number;
  name: string;
}

export interface ActivityStates {
  note: { notes: string };
  documents: { documents: Document[] };
  sitevisit: {
    project: string;
    siteVisitType: string;
    leadsTimezone: string;
    teams: string;
    scheduleDate: string;
    scheduleTime: string;
    endsDate: string;
    endsTime: string;
    siteVisitConfirmation: string;
    channelPartner: string;
    agenda: string;
    scheduleFollowup: string;
    status: string;
  };
  followup: {
    scheduleDate: string;
    scheduleTime: string;
    leadsTimezone: string;
    followupType: string;
    subject: string;
    agenda: string;
    status: string;
  };
}

interface ActivityHistoryProps {
  leadId: number;
  users: User[];
  projects: Project[];
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  onSave: () => Promise<void>;
  onActivityUpdate?: (data: { notes: string; documents: Document[] }) => void;
}

export const formatTime = (time24?: string): string => {
  if (!time24) return "";
  const [hours, minutes] = time24.split(":");
  const hourNum = parseInt(hours);
  const period = hourNum >= 12 ? "PM" : "AM";
  const hour12 = hourNum % 12 || 12;
  return `${hour12}:${minutes} ${period}`;
};

const ActivityHistory: React.FC<ActivityHistoryProps> = ({
  leadId,
  users = [],
  projects = [],
  isEditing,
  setIsEditing,
  onSave,
  onActivityUpdate,
}) => {
  const { user, token, hasPermission, isLoading: authLoading } = useAuth();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState("note");
  const [editingActivityId, setEditingActivityId] = useState<number | null>(
    null
  );
  const [activityStates, setActivityStates] = useState<ActivityStates>({
    note: { notes: "" },
    documents: { documents: [] },
    sitevisit: {
      project: "selectproject",
      siteVisitType: "selecttype",
      leadsTimezone: "asiakolkata",
      teams: "selectteam",
      scheduleDate: "",
      scheduleTime: "",
      endsDate: "",
      endsTime: "",
      siteVisitConfirmation: "true",
      channelPartner: "none",
      agenda: "",
      scheduleFollowup: "",
      status: "scheduled",
    },
    followup: {
      scheduleDate: "",
      scheduleTime: "",
      leadsTimezone: "asiakolkata",
      followupType: "call",
      subject: "",
      agenda: "",
      status: "scheduled",
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = getTodayInTimeZone();
  const currentTime = new Date().toTimeString().slice(0, 5);

  // Move this UP — before any useEffect that uses it!
  const SALES_ROLES = [
    "admin",
    "manager",
    "sales",
    "agent",
    "team leader",
    "tl",
  ];
  const userRole = user?.role?.toLowerCase() || "";

  const canViewActivities =
    SALES_ROLES.includes(userRole) || hasPermission("view_leads");
  const canEditActivities =
    SALES_ROLES.includes(userRole) || hasPermission("create_leads");

  // Now safe to use canEditActivities here
  useEffect(() => {
    if (!authLoading && canEditActivities && !isEditing) {
      setIsEditing(true);
    }
  }, [authLoading, canEditActivities, isEditing, setIsEditing]);

  const fetchActivityHistory = async () => {
    if (!token || authLoading) {
      setError("Authentication required.");
      // toast.error("Authentication required.");
      return;
    }

    if (!canViewActivities) {
      setError("You do not have permission to view activities.");
      // toast.error("You do not have permission to view activities.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get(`/leads/${leadId}/activities`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;

      setActivities(data.activities || []);

      // Fix: Properly type the map function
      const uniqueDocuments: Document[] = Array.from(
        new Map(
          (data.forms?.documents?.documents || []).map((doc: any) => [
            doc.id,
            {
              id: doc.id,
              name: doc.name,
              type: doc.type,
              document_name: doc.document_name || doc.name,
            } as Document,
          ])
        ).values()
      );

      setActivityStates({
        note: data.forms?.note || { notes: "" },
        documents: { documents: uniqueDocuments },
        sitevisit: normalizeSiteVisitForm(data.forms?.sitevisit),
        followup: normalizeFollowupForm(data.forms?.followup),
      });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to fetch activities. Please try again.";
      setError(errorMessage);
      // toast.error(errorMessage);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityHistory();
  }, [leadId, token]);

  const handleRetryFetch = () => {
    setError(null);
    fetchActivityHistory();
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivityId(activity.id);
    setIsEditing(true);
    if (activity.type === "note") {
      updateActivityState("note", { notes: activity.description || "" });
      setSelectedActivity("note");
    } else if (activity.type === "sitevisit" && activity.details) {
      updateActivityState(
        "sitevisit",
        normalizeSiteVisitForm(activity.details as Record<string, unknown>),
      );
      setSelectedActivity("sitevisit");
    } else if (activity.type === "followup" && activity.details) {
      updateActivityState(
        "followup",
        normalizeFollowupForm(activity.details as Record<string, unknown>),
      );
      setSelectedActivity("followup");
    }
  };

  const handleRemoveActivity = async (activityId: number) => {
    if (!canEditActivities) {
      // toast.error("You do not have permission to remove activities.");
      return;
    }

    try {
      await axiosInstance.delete(`/leads/${leadId}/activities/${activityId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // console.log(`Activity ${activityId} deleted from backend`);
      await fetchActivityHistory();
      // toast.success("Activity removed successfully!");
    } catch (err: any) {
      console.error(
        "Delete activity error:",
        err.response?.data || err.message
      );
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to delete activity. Please try again.";
      setError(errorMessage);
      // toast.error(errorMessage);
    }
  };

  const updateActivityState = <K extends keyof ActivityStates>(
    key: K,
    updates: Partial<ActivityStates[K]>
  ) => {
    setActivityStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...updates } as ActivityStates[K],
    }));
  };

  const handleApply = async (type: keyof ActivityStates) => {
    if (!canEditActivities) {
      // toast.error("You do not have permission to add activities.");
      return;
    }

    // console.log(`Applying ${type}...`, activityStates[type]);

    try {
      const state = activityStates[type];
      let payload: any = {};

      if (type === "followup") {
        const followupState = state as ActivityStates["followup"];
        if (
          !followupState.scheduleDate ||
          !followupState.scheduleTime ||
          !followupState.followupType
        ) {
          // toast.error("Schedule date, time, and followup type are required.");
          return;
        }
        const details = buildFollowupDetails(followupState);
        payload = {
          type: "followup",
          description: `${details.followupType} follow-up: ${details.subject}${
            details.agenda ? ` - ${details.agenda}` : ""
          }`.trim(),
          date: followupState.scheduleDate,
          time: followupState.scheduleTime,
          agent: user?.name || "Current Agent",
          details,
        };
      } else if (type === "sitevisit") {
        const sitevisitState = state as ActivityStates["sitevisit"];
        if (
          !sitevisitState.scheduleDate ||
          !sitevisitState.scheduleTime ||
          !sitevisitState.project ||
          sitevisitState.project === "selectproject" ||
          !sitevisitState.siteVisitType ||
          sitevisitState.siteVisitType === "selecttype"
        ) {
          // toast.error(
            // "Schedule date, time, project, and site visit type are required."
          // );
          return;
        }
        const details = buildSiteVisitDetails(sitevisitState);
        const projectName =
          projects.find((p) => p.id.toString() === details.project)?.name ||
          details.project;
        payload = {
          type: "sitevisit",
          description: `${details.siteVisitType} site visit for ${projectName}${
            details.channelPartner ? ` with ${details.channelPartner}` : ""
          }: ${details.agenda || ""}`.trim(),
          date: sitevisitState.scheduleDate,
          time: sitevisitState.scheduleTime,
          agent: user?.name || "Current Agent",
          details,
        };
      } else if (type === "note") {
        const noteState = state as ActivityStates["note"];
        const { notes } = noteState;
        if (!stripHtml(notes)) {
          // toast.error("Notes are required.");
          return;
        }
        payload = {
          type: "note",
          description: notes,
          date: getTodayInTimeZone(),
          time: new Date().toTimeString().slice(0, 5),
          agent: user?.name || "Current Agent",
        };
      }

      let response;
      if (editingActivityId) {
        response = await axiosInstance.put(
          `/leads/${leadId}/activities/${editingActivityId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // toast.success(
          // `${
            // type.charAt(0).toUpperCase() + type.slice(1)
          // } updated successfully!`
        // );
        setEditingActivityId(null);
      } else {
        response = await axiosInstance.post(
          `/leads/${leadId}/activities`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // toast.success(
          // `${type.charAt(0).toUpperCase() + type.slice(1)} added successfully!`
        // );
      }

      await fetchActivityHistory();

      if (type === "note") {
        updateActivityState("note", { notes: "" });
      } else if (type === "followup") {
        updateActivityState("followup", normalizeFollowupForm({}));
      } else if (type === "sitevisit") {
        updateActivityState("sitevisit", normalizeSiteVisitForm({}));
      }

      if (type === "note" && onActivityUpdate) {
        onActivityUpdate({
          notes: "",
          documents: activityStates.documents.documents,
        });
      }

      setError(null);
    } catch (err: any) {
      console.error(
        `Error applying ${type}:`,
        err.response?.data || err.message
      );
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        `Failed to save ${type}. Please try again.`;
      setError(errorMessage);
      // toast.error(errorMessage);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!canEditActivities) {
      // toast.error("You do not have permission to upload documents.");
      return;
    }

    const file = event.target.files?.[0];
    if (!file) {
      // toast.error("No file selected.");
      return;
    }

    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];
    if (!validTypes.includes(file.type)) {
      // toast.error(
        // "Invalid file type. Please upload a PDF, DOCX, PNG, JPEG, or JPG file."
      // );
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);
      formData.append(
        "type",
        file.type.replace("application/", "").replace("image/", "")
      );

      const response = await axiosInstance.post(
        `/leads/${leadId}/documents`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // console.log("Uploaded document response:", response.data);
      await fetchActivityHistory();
      event.target.value = "";
      setError(null);
      // toast.success("Document uploaded successfully!");
    } catch (err: any) {
      console.error(
        "Upload document error:",
        err.response?.data || err.message
      );
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to upload document. Please try again.";
      setError(errorMessage);
      // toast.error(errorMessage);
    }
  };

  const handleRemoveDocument = async (indexToRemove: number) => {
    if (!canEditActivities) {
      // toast.error("You do not have permission to remove documents.");
      return;
    }

    const document = activityStates.documents.documents[indexToRemove];
    if (!document.id) {
      console.error("Document ID missing for delete");
      // toast.error("Cannot delete: Document ID missing.");
      return;
    }

    try {
      await axiosInstance.delete(`/leads/${leadId}/documents/${document.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // console.log("Document deleted from backend");
      await fetchActivityHistory();
      // toast.success("Document removed successfully!");
    } catch (err: any) {
      console.error(
        "Delete document error:",
        err.response?.data || err.message
      );
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to delete document. Please try again.";
      setError(errorMessage);
      // toast.error(errorMessage);
    }
  };

  const handleNotesChange = (value: string) => {
    updateActivityState("note", { notes: value });
    if (onActivityUpdate) {
      onActivityUpdate({
        notes: value,
        documents: activityStates.documents.documents,
      });
    }
  };

  const handleSave = () => {
    if (!canEditActivities) {
      // toast.error("You do not have permission to save activities.");
      return;
    }
    setIsEditing(false);
    setEditingActivityId(null);
    onSave();
    // toast.success("Session saved! (Changes already applied individually)");
  };

  const noteActivities = activities.filter(
    (activity) => activity.type === "note"
  );
  const followupActivities = activities.filter(
    (activity) => activity.type === "followup"
  );
  const sitevisitActivities = activities.filter(
    (activity) => activity.type === "sitevisit"
  );

  const followupCount = activityStates.followup.scheduleDate
    ? activities.filter(
        (a) =>
          a.type === "followup" &&
          a.date === activityStates.followup.scheduleDate
      ).length
    : 0;

  const getMinTime = (date: string) => {
    return date === today ? currentTime : "00:00";
  };

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-red-500 text-sm mb-4">
          {error}
          <Button
            variant="link"
            size="sm"
            onClick={handleRetryFetch}
            className="p-0 h-auto text-blue-500 ml-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </p>
      )}
      <Tabs
        value={selectedActivity}
        onValueChange={setSelectedActivity}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 rounded-xl h-10 shadow-sm">
          <TabsTrigger value="note" className="text-xs font-bold rounded-lg transition-all data-[state=active]:bg-[var(--theme-color)] data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-500 hover:text-slate-800 py-1.5">Note</TabsTrigger>
          <TabsTrigger value="followup" className="text-xs font-bold rounded-lg transition-all data-[state=active]:bg-[var(--theme-color)] data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-500 hover:text-slate-800 py-1.5">FollowUp</TabsTrigger>
          <TabsTrigger value="sitevisit" className="text-xs font-bold rounded-lg transition-all data-[state=active]:bg-[var(--theme-color)] data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-500 hover:text-slate-800 py-1.5">Site Visit</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs font-bold rounded-lg transition-all data-[state=active]:bg-[var(--theme-color)] data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-500 hover:text-slate-800 py-1.5">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="note" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <NoteList
              // authLoading={authLoading}
              // loading={loading}
              // error={error}
              // hasPermission={hasPermission}
              // noteActivities={noteActivities}
              // handleRetryFetch={handleRetryFetch}
              // handleEditActivity={handleEditActivity}
              // handleRemoveActivity={handleRemoveActivity}
              // canViewActivities={canViewActivities} // ← ADD THIS
              // canEditActivities={canEditActivities}
              loading={loading}
              error={error}
              canViewActivities={canViewActivities}
              canEditActivities={canEditActivities}
              noteActivities={noteActivities}
              handleEditActivity={handleEditActivity}
              handleRemoveActivity={handleRemoveActivity}
            />
            <NoteForm
              isEditing={isEditing}
              canEditActivities={canEditActivities}
              activityStates={activityStates}
              editingActivityId={editingActivityId}
              updateActivityState={updateActivityState}
              handleApply={handleApply}
              handleNotesChange={handleNotesChange}
            />
          </div>
        </TabsContent>

        <TabsContent value="followup" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FollowUpList
              // authLoading={authLoading}
              // loading={loading}
              // error={error}
              // hasPermission={hasPermission}
              // canViewActivities={canViewActivities} // ← ADD THIS
              // canEditActivities={canEditActivities}
              // followupActivities={followupActivities}
              // handleRetryFetch={handleRetryFetch}
              // handleEditActivity={handleEditActivity}
              // handleRemoveActivity={handleRemoveActivity}
              loading={loading}
              error={error}
              canViewActivities={canViewActivities}
              canEditActivities={canEditActivities}
              followupActivities={followupActivities}
              handleEditActivity={handleEditActivity}
              handleRemoveActivity={handleRemoveActivity}
            />
            <FollowUpForm
              isEditing={isEditing}
              // hasPermission={hasPermission}
              canEditActivities={canEditActivities}
              activityStates={activityStates}
              editingActivityId={editingActivityId}
              today={today}
              followupCount={followupCount}
              updateActivityState={updateActivityState}
              handleApply={handleApply}
              getMinTime={getMinTime}
            />
          </div>
        </TabsContent>

        <TabsContent value="sitevisit" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SiteVisitList
              // authLoading={authLoading}
              // loading={loading}
              // error={error}
              // hasPermission={hasPermission}
              // canViewActivities={canViewActivities} // ← ADD THIS
              // canEditActivities={canEditActivities}
              // sitevisitActivities={sitevisitActivities}
              // handleRetryFetch={handleRetryFetch}
              // handleEditActivity={handleEditActivity}
              // handleRemoveActivity={handleRemoveActivity}
              loading={loading}
              error={error}
              canViewActivities={canViewActivities}
              canEditActivities={canEditActivities}
              sitevisitActivities={sitevisitActivities}
              handleEditActivity={handleEditActivity}
              handleRemoveActivity={handleRemoveActivity}
            />
            <SiteVisitForm
              isEditing={isEditing}
              // hasPermission={hasPermission}
              canEditActivities={canEditActivities}
              activityStates={activityStates}
              editingActivityId={editingActivityId}
              today={today}
              projects={projects}
              users={users}
              updateActivityState={updateActivityState}
              handleApply={handleApply}
              getMinTime={getMinTime}
            />
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* <DocumentsList
              // authLoading={authLoading}
              // loading={loading}
              error={error}
              hasPermission={hasPermission}
              activityStates={activityStates}
              isEditing={isEditing}
              leadId={leadId}
              handleRetryFetch={handleRetryFetch}
              handleRemoveDocument={handleRemoveDocument}
            /> */}
            <DocumentsList
              activityStates={activityStates}
              isEditing={isEditing}
              // hasPermission={hasPermission}
              canEditActivities={canEditActivities}
              handleRemoveDocument={handleRemoveDocument}
              leadId={leadId}
            />
            <DocumentsForm
              isEditing={isEditing}
              // hasPermission={hasPermission}
              canEditActivities={canEditActivities}
              handleFileUpload={handleFileUpload}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end pt-4">
        {!isEditing ? (
          <Button
            size="sm"
            onClick={() => {
              // console.log("Starting activity edit");
              setIsEditing(true);
            }}
            disabled={!canEditActivities}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Activities
          </Button>
        ) : (
          <div className="flex gap-2">
            {/* <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasPermission("create_leads")}
            >
              <Save className="h-4 w-4 mr-2" />
              Done Editing
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setEditingActivityId(null);
                fetchActivityHistory();
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button> */}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityHistory;
