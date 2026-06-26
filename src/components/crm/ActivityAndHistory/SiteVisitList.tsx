// import { Button } from "@/components/ui/button";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { User, RefreshCw, Trash2, Edit } from "lucide-react";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
//   AlertDialogFooter,
// } from "@/components/ui/alert-dialog";
// import { Activity } from "../ActivityHistory";
// import { formatTime } from "../ActivityHistory";

// interface SiteVisitListProps {
//   authLoading: boolean;
//   loading: boolean;
//   error: string | null;
//   hasPermission: (permission: string) => boolean;
//   canViewActivities: boolean;
//   canEditActivities: boolean;
//   sitevisitActivities: Activity[];
//   handleRetryFetch: () => void;
//   handleEditActivity: (activity: Activity) => void;
//   handleRemoveActivity: (activityId: number) => void;
// }

// const SiteVisitList: React.FC<SiteVisitListProps> = ({
//   authLoading,
//   loading,
//   error,
//   hasPermission,
//   sitevisitActivities,
//   handleRetryFetch,
//   handleEditActivity,
//   handleRemoveActivity,
// }) => {
//   const activityDisplay = (activity: Activity) => (
//     <div key={activity.id} className="border-l-2 border-blue-200 pl-4 pb-4">
//       <div className="flex justify-between items-start">
//         <div>
//           <h4 className="font-medium capitalize">
//             {activity.type}: {activity.description}
//           </h4>
//           <p className="text-sm text-gray-600">by {activity.agent}</p>
//         </div>
//         <div className="text-right text-sm text-gray-500">
//           <div>{activity.date}</div>
//           <div>{formatTime(activity.time)}</div>
//           {hasPermission("create_leads") && (
//             <>
//               <Button
//                 variant="outline"
//                 size="icon"
//                 onClick={() => handleEditActivity(activity)}
//               >
//                 <Edit className="w-4 h-4" />
//               </Button>
//               <AlertDialog>
//                 <AlertDialogTrigger asChild>
//                   <Button
//                     variant="outline"
//                     size="icon"
//                     className="text-muted-foreground hover:text-destructive"
//                   >
//                     <Trash2 className="w-4 h-4" />
//                   </Button>
//                 </AlertDialogTrigger>
//                 <AlertDialogContent>
//                   <AlertDialogHeader>
//                     <AlertDialogTitle>
//                       Are you absolutely sure?
//                     </AlertDialogTitle>
//                     <AlertDialogDescription>
//                       This action cannot be undone. This will permanently delete
//                       the activity.
//                     </AlertDialogDescription>
//                   </AlertDialogHeader>
//                   <AlertDialogFooter>
//                     <AlertDialogCancel>Cancel</AlertDialogCancel>
//                     <Button
//                       variant="destructive"
//                       onClick={() => handleRemoveActivity(activity.id)}
//                     >
//                       Continue
//                     </Button>
//                   </AlertDialogFooter>
//                 </AlertDialogContent>
//               </AlertDialog>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <Card className="h-full">
//       <CardHeader className="flex flex-row items-center gap-2">
//         <div className="p-2 bg-blue-100 rounded-full">
//           <User className="h-4 w-4" />
//         </div>
//         <CardTitle className="text-lg">Site Visit History</CardTitle>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         {authLoading || loading ? (
//           <p className="text-sm text-gray-500">Loading...</p>
//         ) : error ? (
//           <div className="text-sm text-red-500">
//             {error}
//             <Button
//               variant="link"
//               size="sm"
//               onClick={handleRetryFetch}
//               className="p-0 h-auto text-blue-500 ml-2"
//             >
//               <RefreshCw className="h-3 w-3 mr-1" />
//               Retry
//             </Button>
//           </div>
//         ) : !hasPermission("view_leads") ? (
//           <p className="text-sm text-red-500">
//             You do not have permission to view site visit activities.
//           </p>
//         ) : sitevisitActivities.length > 0 ? (
//           sitevisitActivities.map(activityDisplay)
//         ) : (
//           <p className="text-sm text-gray-500 italic">
//             No site visit activities recorded yet.
//           </p>
//         )}
//       </CardContent>
//     </Card>
//   );
// };

// export default SiteVisitList;

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, Trash2, Edit } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Activity } from "../ActivityHistory";
import { formatTime } from "../ActivityHistory";
import {
  activityStatusBadgeClass,
  activityStatusLabel,
} from "@/utils/activityFormUtils";
import { formatDisplayDate } from "@/utils/dateFormat";
import { cn } from "@/lib/utils";

interface SiteVisitListProps {
  loading: boolean;
  error: string | null;
  canViewActivities: boolean;
  canEditActivities: boolean;
  sitevisitActivities: Activity[];
  handleEditActivity: (activity: Activity) => void;
  handleRemoveActivity: (activityId: number) => void;
}

const SiteVisitList: React.FC<SiteVisitListProps> = ({
  loading,
  error,
  canViewActivities,
  canEditActivities,
  sitevisitActivities,
  handleEditActivity,
  handleRemoveActivity,
}) => {
  const activityDisplay = (activity: Activity) => (
    <div key={activity.id} className="relative pl-6 pb-2 group">
      {/* Timeline Bullet Node */}
      <div className="absolute -left-[5px] top-4 w-2.5 h-2.5 rounded-full border border-white bg-[var(--theme-color)] shadow-[0_0_0_2px_rgba(234,76,42,0.15)] group-hover:scale-110 transition-transform duration-200" />
      
      {/* Card Detail block */}
      <div className="flex justify-between items-start gap-4 p-4 bg-slate-50/40 hover:bg-slate-50 border border-slate-150/60 rounded-2xl transition-all duration-200">
        <div className="space-y-1.5 flex-1 min-w-0">
          <h4 className="font-bold text-slate-800 text-xs leading-snug break-words capitalize">
            {activity.type}: {activity.description}
          </h4>
          
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("text-[9px] font-bold tracking-wider px-2 py-0 rounded border uppercase shadow-none", activityStatusBadgeClass(activity.details?.status))}>
              {activityStatusLabel(activity.details?.status)}
            </Badge>
            <span className="text-[10px] text-slate-400 font-medium select-none">by {activity.agent}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="text-right text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-none">
            <div>{formatDisplayDate(activity.date)}</div>
            <div className="text-slate-400 font-medium mt-1">{formatTime(activity.time)}</div>
          </div>
          
          {canEditActivities && (
            <div className="flex gap-1 mt-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleEditActivity(activity)}
                className="h-7 w-7 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                title="Edit Site Visit"
              >
                <Edit className="w-3.5 h-3.5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 rounded-lg border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Site Visit?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button
                      variant="destructive"
                      onClick={() => handleRemoveActivity(activity.id)}
                    >
                      Delete
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card className="h-full border border-slate-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.01)] rounded-2xl overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <div className="p-2 bg-orange-50 text-[var(--theme-color)] border border-orange-100/60 rounded-xl">
          <User className="h-4 w-4" />
        </div>
        <CardTitle className="text-base font-bold text-slate-800">Site Visit History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : !canViewActivities ? (
          <p className="text-sm text-gray-500 italic">
            No access to view site visits.
          </p>
        ) : sitevisitActivities.length > 0 ? (
          <div className="relative pl-0.5 border-l border-slate-100/80 ml-2 space-y-3 max-h-[420px] overflow-y-auto no-scrollbar pr-1 pt-1 pb-1">
            {sitevisitActivities.map(activityDisplay)}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">
            No site visits recorded yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default SiteVisitList;
