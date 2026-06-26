import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import axiosInstance from "@/api/axiosInstance";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AssignLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: number;
  onLeadAssigned: () => void;
}

const AssignLeadModal: React.FC<AssignLeadModalProps> = ({
  isOpen,
  onClose,
  leadId,
  onLeadAssigned,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        setIsLoading(true);
        try {
          const response = await axiosInstance.get("/users");
          setUsers(response.data);
          setFilteredUsers(response.data);
        } catch (err) {
          console.error("Failed to fetch users:", err);
          // toast({
            // title: "Error",
            // description: "Failed to fetch users. Please try again.",
            // variant: "destructive",
          // });
        } finally {
          setIsLoading(false);
        }
      };
      fetchUsers();
    }
  }, [isOpen, toast]);

  useEffect(() => {
    setFilteredUsers(
      users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, users]);

  const handleAssign = async () => {
    if (!selectedUserId) {
      // toast({
        // title: "Error",
        // description: "Please select a user to assign the lead to.",
        // variant: "destructive",
      // });
      return;
    }
    setIsLoading(true);
    try {
      await axiosInstance.put(`/leads/${leadId}`, {
        assigned_to: selectedUserId,
      });
      // toast({
        // title: "Success",
        // description: "Lead assigned successfully.",
      // });
      onLeadAssigned();
      onClose();
    } catch (err: any) {
      console.error("Failed to assign lead:", err);
      const message =
        err.response?.data?.error || "Failed to assign lead. Please try again.";
      // toast({
        // title: "Error",
        // description: message,
        // variant: "destructive",
      // });
    } finally {
      setIsLoading(false);
    }
  };

  // Focus the search input when the dropdown opens
  const handleSelectOpen = () => {
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent aria-describedby="assign-lead-description">
        <DialogHeader>
          <DialogTitle>Assign Lead</DialogTitle>
          <p id="assign-lead-description" className="sr-only">
            Select a user to assign the lead to by searching and choosing from
            the list.
          </p>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="user-select">Select User</Label>
            <Select
              value={selectedUserId || ""}
              onValueChange={setSelectedUserId}
              disabled={isLoading}
              onOpenChange={handleSelectOpen}
            >
              <SelectTrigger id="user-select">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-3 py-2 sticky top-0 bg-white z-10">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      ref={searchInputRef}
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      onClick={(e) => e.stopPropagation()} // Prevent dropdown from closing
                    />
                  </div>
                </div>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500">No users found</div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={isLoading || !selectedUserId}
          >
            {isLoading ? "Assigning..." : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignLeadModal;

// Revised Code for (with email notification feature)

// import { useState, useEffect, useRef } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Search } from "lucide-react";
// import axiosInstance from "@/api/axiosInstance";
// import { useToast } from "@/hooks/use-toast";

// interface User {
//   id: string;
//   name: string;
//   email: string;
// }

// interface AssignLeadModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   leadId: number;
//   onLeadAssigned: () => void;
// }

// const AssignLeadModal: React.FC<AssignLeadModalProps> = ({
//   isOpen,
//   onClose,
//   leadId,
//   onLeadAssigned,
// }) => {
//   const [users, setUsers] = useState<User[]>([]);
//   const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const { toast } = useToast();
//   const searchInputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     if (isOpen) {
//       const fetchUsers = async () => {
//         setIsLoading(true);
//         try {
//           const response = await axiosInstance.get("/users");
//           setUsers(response.data);
//           setFilteredUsers(response.data);
//         } catch (err) {
//           console.error("Failed to fetch users:", err);
//           toast({
//             title: "Error",
//             description: "Failed to fetch users. Please try again.",
//             variant: "destructive",
//           });
//         } finally {
//           setIsLoading(false);
//         }
//       };
//       fetchUsers();
//     }
//   }, [isOpen, toast]);

//   useEffect(() => {
//     setFilteredUsers(
//       users.filter(
//         (user) =>
//           user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           user.email.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//     );
//   }, [searchTerm, users]);

//   const handleAssign = async () => {
//     if (!selectedUserId) {
//       toast({
//         title: "Error",
//         description: "Please select a user to assign the lead to.",
//         variant: "destructive",
//       });
//       return;
//     }
//     setIsLoading(true);
//     try {
//       const response = await axiosInstance.put(`/leads/${leadId}`, {
//         assigned_to: selectedUserId,
//       });
//       toast({
//         title: "Success",
//         description: `Lead assigned successfully${
//           response.data.emailSent ? " and emails sent." : "."
//         }`,
//       });
//       onLeadAssigned();
//       onClose();
//     } catch (err: any) {
//       console.error("Failed to assign lead:", err);
//       const message =
//         err.response?.data?.error || "Failed to assign lead. Please try again.";
//       toast({
//         title: "Error",
//         description: message,
//         variant: "destructive",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Focus the search input when the dropdown opens
//   const handleSelectOpen = () => {
//     setTimeout(() => {
//       searchInputRef.current?.focus();
//     }, 100);
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent aria-describedby="assign-lead-description">
//         <DialogHeader>
//           <DialogTitle>Assign Lead</DialogTitle>
//           <p id="assign-lead-description" className="sr-only">
//             Select a user to assign the lead to by searching and choosing from
//             the list.
//           </p>
//         </DialogHeader>
//         <div className="space-y-4">
//           <div>
//             <Label htmlFor="user-select">Select User</Label>
//             <Select
//               value={selectedUserId || ""}
//               onValueChange={setSelectedUserId}
//               disabled={isLoading}
//               onOpenChange={handleSelectOpen}
//             >
//               <SelectTrigger id="user-select">
//                 <SelectValue placeholder="Select a user" />
//               </SelectTrigger>
//               <SelectContent>
//                 <div className="px-3 py-2 sticky top-0 bg-white z-10">
//                   <div className="relative">
//                     <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                     <Input
//                       ref={searchInputRef}
//                       placeholder="Search by name or email..."
//                       value={searchTerm}
//                       onChange={(e) => setSearchTerm(e.target.value)}
//                       className="pl-10"
//                       onClick={(e) => e.stopPropagation()} // Prevent dropdown from closing
//                     />
//                   </div>
//                 </div>
//                 {filteredUsers.length > 0 ? (
//                   filteredUsers.map((user) => (
//                     <SelectItem key={user.id} value={user.id}>
//                       {user.name} ({user.email})
//                     </SelectItem>
//                   ))
//                 ) : (
//                   <div className="px-3 py-2 text-gray-500">No users found</div>
//                 )}
//               </SelectContent>
//             </Select>
//           </div>
//         </div>
//         <DialogFooter>
//           <Button variant="outline" onClick={onClose} disabled={isLoading}>
//             Cancel
//           </Button>
//           <Button
//             onClick={handleAssign}
//             disabled={isLoading || !selectedUserId}
//           >
//             {isLoading ? "Assigning..." : "Assign"}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default AssignLeadModal;
