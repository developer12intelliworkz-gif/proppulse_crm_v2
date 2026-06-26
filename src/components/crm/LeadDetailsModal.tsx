 import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatPascalCaseDisplayName } from "@/utils/formatDisplayName";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Clock,
  Edit,
  Save,
  X,
} from "lucide-react";

const LeadDetailsModal = ({ lead, isOpen, onClose, onLeadUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState(lead);
  const [activities, setActivities] = useState([
    {
      id: 1,
      type: "call",
      description: "Initial consultation call",
      date: "2024-01-15",
      time: "10:30 AM",
      agent: "Sarah Johnson",
    },
    {
      id: 2,
      type: "email",
      description: "Sent property listings",
      date: "2024-01-14",
      time: "2:15 PM",
      agent: "Sarah Johnson",
    },
  ]);

  const handleSave = () => {
    onLeadUpdated(editedLead);
    setIsEditing(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      qualified: "bg-blue-100 text-blue-800",
      nurturing: "bg-yellow-100 text-yellow-800",
      cold: "bg-gray-100 text-gray-800",
      converted: "bg-purple-100 text-purple-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {lead.name}
              </DialogTitle>
              <DialogDescription>
                Lead details and activity history
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>


        <Tabs defaultValue="details" className="mt-6">
          <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 rounded-xl h-11 shadow-sm">
            <TabsTrigger value="details" className="text-xs font-bold rounded-lg transition-all py-2 data-[state=active]:bg-[var(--theme-color)] data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-500 hover:text-slate-800">Lead Details</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs font-bold rounded-lg transition-all py-2 data-[state=active]:bg-[var(--theme-color)] data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-500 hover:text-slate-800">Activity History</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs font-bold rounded-lg transition-all py-2 data-[state=active]:bg-[var(--theme-color)] data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-500 hover:text-slate-800">Notes & Files</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    {isEditing ? (
                      <Input
                        value={editedLead.email}
                        onChange={(e) =>
                          setEditedLead({
                            ...editedLead,
                            email: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <span>{lead.email}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    {isEditing ? (
                      <Input
                        value={editedLead.phone}
                        onChange={(e) =>
                          setEditedLead({
                            ...editedLead,
                            phone: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <span>{lead.phone}</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Lead Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lead Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium w-20">Status:</span>
                    {isEditing ? (
                      <Select
                        value={editedLead.status}
                        onValueChange={(value) =>
                          setEditedLead({ ...editedLead, status: value })
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="nurturing">Nurturing</SelectItem>
                          <SelectItem value="cold">Cold</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium w-20">Lead Source:</span>
                    <span>
                      {formatPascalCaseDisplayName(
                        lead.leadSource || lead.type || "unknown"
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium w-20">Score:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${lead.leadScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm">{lead.leadScore}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Requirements and Budget */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Requirements & Budget
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Budget Range:</label>
                  {isEditing ? (
                    <Input
                      value={editedLead.budget}
                      onChange={(e) =>
                        setEditedLead({ ...editedLead, budget: e.target.value })
                      }
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1">{lead.budget}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Timeline:</label>
                  {isEditing ? (
                    <Input
                      value={editedLead.timeline}
                      onChange={(e) =>
                        setEditedLead({
                          ...editedLead,
                          timeline: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1">{lead.timeline}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Requirements:</label>
                  {isEditing ? (
                    <Textarea
                      value={editedLead.requirements}
                      onChange={(e) =>
                        setEditedLead({
                          ...editedLead,
                          requirements: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1">{lead.requirements}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="border-l-2 border-blue-200 pl-4 pb-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium capitalize">
                            {activity.type}: {activity.description}
                          </h4>
                          <p className="text-sm text-gray-600">
                            by {activity.agent}
                          </p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div>{activity.date}</div>
                          <div>{activity.time}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notes & Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add notes about this lead..."
                  className="min-h-32"
                  defaultValue={lead.notes}
                />
                <div className="mt-4">
                  <Button variant="outline">Upload Document</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LeadDetailsModal;
