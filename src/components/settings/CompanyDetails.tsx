// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { Checkbox } from "@/components/ui/checkbox";
// import { useToast } from "@/components/ui/use-toast";
// import { ArrowLeft, Home } from "lucide-react";
// import axiosInstance from "@/api/axiosInstance";
// import { SECURITY_CONFIG } from "@/config/security";
// import defaultLogo from "./logo.png"; // ← Your local fallback logo

// // Adjust this to your backend server root URL (without /api)
// const baseURL = SECURITY_CONFIG.ONLY_URL || SECURITY_CONFIG.BASE;
// const IMAGE_BASE_URL = baseURL.replace("/api", "") || `${SECURITY_CONFIG.BASE}`;

// // Define interfaces for the data structure
// interface Basics {
//   businessName: string;
//   description: string;
//   website: string;
//   logo: string;
//   timeZone: string;
//   currency: string;
//   customReportingEmail: string;
//   disclaimer: string;
// }

// interface Address {
//   address1: string;
//   address2: string;
//   city: string;
//   state: string;
//   country: string;
//   zip: string;
// }

// interface SocialUrls {
//   facebook: string;
//   twitter: string;
//   googlePlus: string;
//   linkedIn: string;
//   youtube: string;
//   instagram: string;
// }

// interface Contact {
//   salutation: string;
//   firstName: string;
//   lastName: string;
//   contactType: string;
//   email: string;
//   phone: string;
//   enableEmail: boolean;
//   enableSms: boolean;
//   isPrimary: boolean;
// }

// interface MarketingDomain {
//   domains: string;
// }

// interface EmailFooter {
//   footer: string;
// }

// interface DltDetails {
//   dltEntityId: string;
//   telemarketerId: string;
// }

// interface CompanyData {
//   basics: Basics;
//   address: Address;
//   socialUrls: SocialUrls;
//   contacts: Contact[];
//   marketingDomain: MarketingDomain;
//   emailFooter: EmailFooter;
//   dltDetails: DltDetails;
// }

// const CompanyDetails = ({
//   companyId = "60c06a65-d9cb-4df7-89fc-4a77004a353d",
// }) => {
//   const { toast } = useToast();
//   const navigate = useNavigate();
//   const [data, setData] = useState<CompanyData>({
//     basics: {
//       businessName: "",
//       description: "",
//       website: "",
//       logo: "",
//       timeZone: "Asia/Kolkata",
//       currency: "INR",
//       customReportingEmail: "",
//       disclaimer: "",
//     },
//     address: {
//       address1: "",
//       address2: "",
//       city: "",
//       state: "",
//       country: "",
//       zip: "",
//     },
//     socialUrls: {
//       facebook: "",
//       twitter: "",
//       googlePlus: "",
//       linkedIn: "",
//       youtube: "",
//       instagram: "",
//     },
//     contacts: [],
//     marketingDomain: {
//       domains: "",
//     },
//     emailFooter: {
//       footer: "",
//     },
//     dltDetails: {
//       dltEntityId: "",
//       telemarketerId: "",
//     },
//   });
//   const [logoFile, setLogoFile] = useState<File | null>(null);
//   const [logoPreview, setLogoPreview] = useState<string>("");

//   // Fetch company details on component mount
//   const fetchCompanyDetails = async () => {
//     try {
//       const response = await axiosInstance.get(`/companies/${companyId}`);
//       const rawData = response.data || {};

//       // Map API data to the component's state structure
//       const mappedData: CompanyData = {
//         basics: {
//           businessName: rawData.name || "",
//           description: rawData.description || "",
//           website: rawData.website_url || "",
//           logo: rawData.logo_url || "",
//           timeZone: rawData.time_zone || "Asia/Kolkata",
//           currency: rawData.currency || "INR",
//           customReportingEmail: rawData.custom_reporting_email || "",
//           disclaimer: rawData.disclaimer || "",
//         },
//         address: {
//           address1: rawData.address_line1 || "",
//           address2: rawData.address_line2 || "",
//           city: rawData.city || "",
//           state: rawData.state || "",
//           country: rawData.country || "",
//           zip: rawData.zip || "",
//         },
//         socialUrls: {
//           facebook: rawData.facebook_url || "",
//           twitter: rawData.twitter_url || "",
//           googlePlus: rawData.google_plus_url || "",
//           linkedIn: rawData.linkedin_url || "",
//           youtube: rawData.youtube_url || "",
//           instagram: rawData.instagram_url || "",
//         },
//         contacts:
//           rawData.contacts?.map((contact: any) => ({
//             salutation: contact.salutation || "",
//             firstName: contact.first_name || "",
//             lastName: contact.last_name || "",
//             contactType: contact.contact_type || "",
//             email: contact.email || "",
//             phone: contact.phone || "",
//             enableEmail: contact.enable_notification_email || false,
//             enableSms: contact.enable_notification_sms || false,
//             isPrimary: contact.is_primary || false,
//           })) || [],
//         marketingDomain: {
//           domains: rawData.domain || "",
//         },
//         emailFooter: {
//           footer: rawData.footer_text || "",
//         },
//         dltDetails: {
//           dltEntityId: rawData.dlt_entity_id || "",
//           telemarketerId: rawData.telemarketer_id || "",
//         },
//       };
//       setData(mappedData);
//       // Prepend the image base URL to the logo_url for preview
//       setLogoPreview(
//         rawData.logo_url ? `${IMAGE_BASE_URL}${rawData.logo_url}` : ""
//       );
//     } catch (error) {
//       console.error("Error fetching company details:", error);
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: "Failed to fetch company details.",
//       });
//     }
//   };

//   useEffect(() => {
//     if (companyId) {
//       fetchCompanyDetails();
//     }
//   }, [companyId]);

//   const handleChange = (
//     section: keyof CompanyData,
//     field: string,
//     value: any
//   ) => {
//     setData((prev) => ({
//       ...prev,
//       [section]: {
//         ...prev[section],
//         [field]: value,
//       },
//     }));
//   };

//   const handleContactChange = (index: number, field: string, value: any) => {
//     setData((prev) => {
//       const newContacts = [...prev.contacts];
//       newContacts[index] = { ...newContacts[index], [field]: value };
//       return { ...prev, contacts: newContacts };
//     });
//   };

//   const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       setLogoFile(file);
//       const previewUrl = URL.createObjectURL(file);
//       setLogoPreview(previewUrl); // Update preview with new file
//     }
//   };

//   const handleSave = async (section: keyof CompanyData) => {
//     try {
//       let payload: any = { [section]: data[section] };

//       if (section === "basics" && logoFile) {
//         const formData = new FormData();
//         formData.append("logo", logoFile);
//         // Set logo to empty in payload since server will handle it
//         payload.basics.logo = "";
//         formData.append("payload", JSON.stringify(payload));
//         await axiosInstance.put(`/companies/${companyId}`, formData, {
//           headers: { "Content-Type": "multipart/form-data" },
//         });
//         setLogoFile(null);
//       } else {
//         await axiosInstance.put(`/companies/${companyId}`, payload);
//       }

//       toast({
//         title: "Success",
//         description: "Company details updated.",
//       });
//       // Refetch to get updated data (e.g., new logo URL)
//       await fetchCompanyDetails();
//     } catch (error) {
//       console.error(`Error saving ${section}:`, error);
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: "Failed to update company details.",
//       });
//     }
//   };

//   const handleCancel = () => {
//     navigate("/settings");
//   };

//   return (
//     <div className="h-full bg-gradient-to-br from-gray-100 to-gray-200">
//       <div className="bg-card border-b shadow-sm flex-shrink-0">
//         <div className="px-6 py-4">
//           <div className="flex justify-between items-center">
//             <div>
//               <h1 className="text-2xl font-bold text-foreground">
//                 Company Details
//               </h1>
//               <p className="text-sm text-muted-foreground">
//                 Define and track your company's objectives and key results
//               </p>
//             </div>
//             <div className="flex gap-3">
//               <Button variant="outline" onClick={() => navigate("/dashboard")}>
//                 <Home className="w-4 h-4" />
//               </Button>
//               <Button variant="outline" onClick={handleCancel}>
//                 <ArrowLeft className="w-4 h-4 mr-2" />
//                 Back to Settings
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>
//       <div className="p-6 h-full">
//         <div className="mx-auto flex flex-col max-w bg-gray-100">
//           <div className="flex-1 min-h-0">
//             <Tabs defaultValue="basics" className="w-full">
//               <TabsList className="flex justify-start bg-gray-200 p-1 rounded-lg shadow-inner sticky top-0 z-10">
//                 <TabsTrigger
//                   value="basics"
//                   className="px-6 py-3 rounded-md font-medium transition-all hover:bg-gray-300 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-md"
//                 >
//                   Basics
//                 </TabsTrigger>
//                 <TabsTrigger
//                   value="address"
//                   className="px-6 py-3 rounded-md font-medium transition-all hover:bg-gray-300 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-md"
//                 >
//                   Address
//                 </TabsTrigger>
//                 <TabsTrigger
//                   value="socialUrls"
//                   className="px-6 py-3 rounded-md font-medium transition-all hover:bg-gray-300 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-md"
//                 >
//                   Social URLs
//                 </TabsTrigger>
//                 <TabsTrigger
//                   value="contacts"
//                   className="px-6 py-3 rounded-md font-medium transition-all hover:bg-gray-300 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-md"
//                 >
//                   Contacts
//                 </TabsTrigger>
//                 <TabsTrigger
//                   value="marketingDomain"
//                   className="px-6 py-3 rounded-md font-medium transition-all hover:bg-gray-300 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-md"
//                 >
//                   Marketing Domain
//                 </TabsTrigger>
//                 <TabsTrigger
//                   value="emailFooter"
//                   className="px-6 py-3 rounded-md font-medium transition-all hover:bg-gray-300 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-md"
//                 >
//                   Email Footer
//                 </TabsTrigger>
//                 <TabsTrigger
//                   value="dltDetails"
//                   className="px-6 py-3 rounded-md font-medium transition-all hover:bg-gray-300 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-md"
//                 >
//                   DLT Details
//                 </TabsTrigger>
//               </TabsList>
//               <TabsContent
//                 value="basics"
//                 className="p-6 bg-white rounded-lg shadow-lg mt-4"
//               >
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div>
//                     <Label>Business Name</Label>
//                     <Input
//                       value={data.basics.businessName}
//                       onChange={(e) =>
//                         handleChange("basics", "businessName", e.target.value)
//                       }
//                       className="mt-1"
//                     />
//                   </div>
//                   <div>
//                     <Label>Description</Label>
//                     <Textarea
//                       value={data.basics.description}
//                       onChange={(e) =>
//                         handleChange("basics", "description", e.target.value)
//                       }
//                       className="mt-1 h-24"
//                     />
//                   </div>
//                   <div>
//                     <Label>Website</Label>
//                     <Input
//                       value={data.basics.website}
//                       onChange={(e) =>
//                         handleChange("basics", "website", e.target.value)
//                       }
//                       className="mt-1"
//                     />
//                   </div>
//                   <div>
//                     <Label>Logo</Label>
//                     <div className="mt-1">
//                       {logoPreview && (
//                         <img
//                           src={logoPreview}
//                           alt="Company Logo"
//                           className="h-32 w-32 object-contain rounded-md border border-gray-300 mb-2"
//                           onError={(e) => {
//                             console.error("Error loading image:", logoPreview);
//                             e.currentTarget.src = "/placeholder.png"; // Fallback image
//                           }}
//                         />
//                       )}
//                       <Input
//                         type="file"
//                         accept="image/*"
//                         onChange={handleLogoChange}
//                         className="mt-1"
//                       />
//                       <p className="text-xs text-muted-foreground mt-1 mb-2">
//                         <strong>Note: </strong>Upload in{" "}
//                         <strong>.png, .jpg, .jpeg</strong> or{" "}
//                         <strong>.svg</strong> format only.
//                       </p>
//                     </div>
//                   </div>
//                   <div>
//                     <Label>Time Zone</Label>
//                     <Select
//                       value={data.basics.timeZone}
//                       onValueChange={(value) =>
//                         handleChange("basics", "timeZone", value)
//                       }
//                     >
//                       <SelectTrigger className="mt-1">
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="Asia/Kolkata">
//                           Asia/Kolkata
//                         </SelectItem>
//                         {/* Add more options as needed */}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div>
//                     <Label>Currency</Label>
//                     <Select
//                       value={data.basics.currency}
//                       onValueChange={(value) =>
//                         handleChange("basics", "currency", value)
//                       }
//                     >
//                       <SelectTrigger className="mt-1">
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="INR">₹ INR</SelectItem>
//                         {/* Add more */}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div>
//                     <Label>Custom Reporting Email</Label>
//                     <Input
//                       value={data.basics.customReportingEmail}
//                       onChange={(e) =>
//                         handleChange(
//                           "basics",
//                           "customReportingEmail",
//                           e.target.value
//                         )
//                       }
//                       className="mt-1"
//                     />
//                   </div>
//                   <div className="col-span-2">
//                     <Label>Disclaimer</Label>
//                     <Textarea
//                       value={data.basics.disclaimer}
//                       onChange={(e) =>
//                         handleChange("basics", "disclaimer", e.target.value)
//                       }
//                       className="mt-1 h-24"
//                     />
//                   </div>
//                   <div className="col-span-2">
//                     <Button
//                       onClick={() => handleSave("basics")}
//                       className="w-full mt-4"
//                     >
//                       Save
//                     </Button>
//                   </div>
//                 </div>
//               </TabsContent>
//               <TabsContent
//                 value="address"
//                 className="p-6 bg-white rounded-lg shadow-lg mt-4"
//               >
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div>
//                     <Label>Address 1</Label>
//                     <Input
//                       value={data.address.address1}
//                       onChange={(e) =>
//                         handleChange("address", "address1", e.target.value)
//                       }
//                       className="mt-1"
//                     />
//                   </div>
//                   <div>
//                     <Label>Address 2</Label>
//                     <Input
//                       value={data.address.address2}
//                       onChange={(e) =>
//                         handleChange("address", "address2", e.target.value)
//                       }
//                       className="mt-1"
//                     />
//                   </div>
//                   <div>
//                     <Label>Country</Label>
//                     <Input
//                       value={data.address.country}
//                       onChange={(e) =>
//                         handleChange("address", "country", e.target.value)
//                       }
//                       className="mt-1"
//                     />
//                   </div>
//                   <div>
//                     <Label>State</Label>
//                     <Input
//                       value={data.address.state}
//                       onChange={(e) =>
//                         handleChange("address", "state", e.target.value)
//                       }
//                       className="mt-1"
//                     />
//                   </div>
//                   <div>
//                     <Label>City</Label>
//                     <Input
//                       value={data.address.city}
//                       onChange={(e) =>
//                         handleChange("address", "city", e.target.value)
//                       }
//                       className="mt-1"
//                     />
//                   </div>
//                   <div>
//                     <Label>Zip</Label>
//                     <Input
//                       value={data.address.zip}
//                       onChange={(e) =>
//                         handleChange("address", "zip", e.target.value)
//                       }
//                       className="mt-1"
//                     />
//                   </div>
//                   <div className="col-span-2">
//                     <Button
//                       onClick={() => handleSave("address")}
//                       className="w-full mt-4"
//                     >
//                       Save
//                     </Button>
//                   </div>
//                 </div>
//               </TabsContent>
//               <TabsContent
//                 value="socialUrls"
//                 className="p-6 bg-white rounded-lg shadow-lg mt-4"
//               >
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div>
//                     <Label>Facebook</Label>
//                     <Input
//                       value={data.socialUrls.facebook}
//                       onChange={(e) =>
//                         handleChange("socialUrls", "facebook", e.target.value)
//                       }
//                       className="mt-1"
//                     />
//                   </div>
//                   <div>
//                     <Label>Twitter</Label>
//                     <Input
//                       value={data.socialUrls.twitter}
//                       onChange={(e) =>
//                         handleChange("socialUrls", "twitter", e.target.value)
//                       }
//                       className="mt-1"
//                     />
//                   </div>
//                   <div>
//                     <Label>Google Plus</Label>
//                     <Input
//                       value={data.socialUrls.googlePlus}
//                       onChange={(e) =>
//                         handleChange("socialUrls", "googlePlus", e.target.value)
//                       }
//                       className="mt-1"
//                     />
//                   </div>
//                   <div>
//                     <Label>LinkedIn</Label>
//                     <Input
//                       value={data.socialUrls.linkedIn}
//                       onChange={(e) =>
//                         handleChange("socialUrls", "linkedIn", e.target.value)
//                       }
//                       className="mt-1"
//                     />
//                   </div>
//                   <div>
//                     <Label>YouTube</Label>
//                     <Input
//                       value={data.socialUrls.youtube}
//                       onChange={(e) =>
//                         handleChange("socialUrls", "youtube", e.target.value)
//                       }
//                       className="mt-1"
//                     />
//                   </div>
//                   <div>
//                     <Label>Instagram</Label>
//                     <Input
//                       value={data.socialUrls.instagram}
//                       onChange={(e) =>
//                         handleChange("socialUrls", "instagram", e.target.value)
//                       }
//                       className="mt-1"
//                     />
//                   </div>
//                   <div className="col-span-2">
//                     <Button
//                       onClick={() => handleSave("socialUrls")}
//                       className="w-full mt-4"
//                     >
//                       Save
//                     </Button>
//                   </div>
//                 </div>
//               </TabsContent>
//               <TabsContent
//                 value="contacts"
//                 className="p-6 bg-white rounded-lg shadow-lg mt-4"
//               >
//                 <div className="space-y-6">
//                   {data.contacts.map((contact, index) => (
//                     <div
//                       key={index}
//                       className="border p-6 rounded-lg space-y-4 shadow-sm bg-gray-50"
//                     >
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                         <div>
//                           <Label>Salutation</Label>
//                           <Input
//                             value={contact.salutation}
//                             onChange={(e) =>
//                               handleContactChange(
//                                 index,
//                                 "salutation",
//                                 e.target.value
//                               )
//                             }
//                             className="mt-1"
//                           />
//                         </div>
//                         <div>
//                           <Label>First Name</Label>
//                           <Input
//                             value={contact.firstName}
//                             onChange={(e) =>
//                               handleContactChange(
//                                 index,
//                                 "firstName",
//                                 e.target.value
//                               )
//                             }
//                             className="mt-1"
//                           />
//                         </div>
//                         <div>
//                           <Label>Last Name</Label>
//                           <Input
//                             value={contact.lastName}
//                             onChange={(e) =>
//                               handleContactChange(
//                                 index,
//                                 "lastName",
//                                 e.target.value
//                               )
//                             }
//                             className="mt-1"
//                           />
//                         </div>
//                         <div>
//                           <Label>Contact Type</Label>
//                           <Input
//                             value={contact.contactType}
//                             onChange={(e) =>
//                               handleContactChange(
//                                 index,
//                                 "contactType",
//                                 e.target.value
//                               )
//                             }
//                             className="mt-1"
//                           />
//                         </div>
//                         <div>
//                           <Label>Phone</Label>
//                           <Input
//                             value={contact.phone}
//                             onChange={(e) =>
//                               handleContactChange(
//                                 index,
//                                 "phone",
//                                 e.target.value
//                               )
//                             }
//                             className="mt-1"
//                           />
//                         </div>
//                         <div>
//                           <Label>Email</Label>
//                           <Input
//                             value={contact.email}
//                             onChange={(e) =>
//                               handleContactChange(
//                                 index,
//                                 "email",
//                                 e.target.value
//                               )
//                             }
//                             className="mt-1"
//                           />
//                         </div>
//                         <div className="col-span-2 flex items-center space-x-2">
//                           <Checkbox
//                             checked={contact.enableEmail}
//                             onCheckedChange={(checked) =>
//                               handleContactChange(index, "enableEmail", checked)
//                             }
//                           />
//                           <Label>Email Notifications</Label>
//                         </div>
//                         <div className="col-span-2 flex items-center space-x-2">
//                           <Checkbox
//                             checked={contact.enableSms}
//                             onCheckedChange={(checked) =>
//                               handleContactChange(index, "enableSms", checked)
//                             }
//                           />
//                           <Label>SMS Notifications</Label>
//                         </div>
//                         <div className="col-span-2 flex items-center space-x-2">
//                           <Checkbox
//                             checked={contact.isPrimary}
//                             onCheckedChange={(checked) =>
//                               handleContactChange(index, "isPrimary", checked)
//                             }
//                           />
//                           <Label>Is Primary</Label>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                   <div className="col-span-2">
//                     <Button
//                       onClick={() => handleSave("contacts")}
//                       className="w-full mt-4"
//                     >
//                       Save
//                     </Button>
//                   </div>
//                 </div>
//               </TabsContent>
//               <TabsContent
//                 value="marketingDomain"
//                 className="p-6 bg-white rounded-lg shadow-lg mt-4"
//               >
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div>
//                     <Label>Domains</Label>
//                     <Input
//                       value={data.marketingDomain.domains}
//                       onChange={(e) =>
//                         handleChange(
//                           "marketingDomain",
//                           "domains",
//                           e.target.value
//                         )
//                       }
//                       className="mt-1"
//                     />
//                   </div>
//                   <div className="col-span-2 text-sm text-muted-foreground">
//                     <p>
//                       Domains will be selected from promotional email vendor.
//                     </p>
//                   </div>
//                   <div className="col-span-2">
//                     <Button
//                       onClick={() => handleSave("marketingDomain")}
//                       className="w-full mt-4"
//                     >
//                       Save
//                     </Button>
//                   </div>
//                 </div>
//               </TabsContent>
//               <TabsContent
//                 value="emailFooter"
//                 className="p-6 bg-white rounded-lg shadow-lg mt-4"
//               >
//                 <div className="grid grid-cols-1 gap-6">
//                   <div>
//                     <Label>Footer</Label>
//                     <Textarea
//                       className="mt-1 h-64"
//                       value={data.emailFooter.footer}
//                       onChange={(e) =>
//                         handleChange("emailFooter", "footer", e.target.value)
//                       }
//                     />
//                   </div>
//                   <div>
//                     <Button
//                       onClick={() => handleSave("emailFooter")}
//                       className="w-full mt-4"
//                     >
//                       Save
//                     </Button>
//                   </div>
//                 </div>
//               </TabsContent>
//               <TabsContent
//                 value="dltDetails"
//                 className="p-6 bg-white rounded-lg shadow-lg mt-4"
//               >
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div>
//                     <Label>DLT Entity ID</Label>
//                     <Input
//                       value={data.dltDetails.dltEntityId}
//                       onChange={(e) =>
//                         handleChange(
//                           "dltDetails",
//                           "dltEntityId",
//                           e.target.value
//                         )
//                       }
//                       className="mt-1"
//                     />
//                   </div>
//                   <div>
//                     <Label>Telemarketer ID</Label>
//                     <Input
//                       value={data.dltDetails.telemarketerId}
//                       onChange={(e) =>
//                         handleChange(
//                           "dltDetails",
//                           "telemarketerId",
//                           e.target.value
//                         )
//                       }
//                       className="mt-1"
//                     />
//                   </div>
//                   <div className="col-span-2">
//                     <Button
//                       onClick={() => handleSave("dltDetails")}
//                       className="w-full mt-4"
//                     >
//                       Save
//                     </Button>
//                   </div>
//                 </div>
//               </TabsContent>
//             </Tabs>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CompanyDetails;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Home } from "lucide-react";
import axiosInstance from "@/api/axiosInstance";
import { SECURITY_CONFIG } from "@/config/security";
import defaultLogo from "./logo.png"; // ← Tera local fallback logo

// Image base URL (without /api)
const IMAGE_BASE_URL =
  (SECURITY_CONFIG.ONLY_URL || SECURITY_CONFIG.BASE)?.replace("/api", "") || "";

// Interfaces
interface Basics {
  businessName: string;
  description: string;
  website: string;
  logo: string;
  timeZone: string;
  currency: string;
  customReportingEmail: string;
  disclaimer: string;
}

interface Address {
  address1: string;
  address2: string;
  city: string;
  state: string;
  country: string;
  zip: string;
}

interface SocialUrls {
  facebook: string;
  twitter: string;
  googlePlus: string;
  linkedIn: string;
  youtube: string;
  instagram: string;
}

interface Contact {
  salutation: string;
  firstName: string;
  lastName: string;
  contactType: string;
  email: string;
  phone: string;
  enableEmail: boolean;
  enableSms: boolean;
  isPrimary: boolean;
}

interface MarketingDomain {
  domains: string;
}

interface EmailFooter {
  footer: string;
}

interface DltDetails {
  dltEntityId: string;
  telemarketerId: string;
}

interface CompanyData {
  basics: Basics;
  address: Address;
  socialUrls: SocialUrls;
  contacts: Contact[];
  marketingDomain: MarketingDomain;
  emailFooter: EmailFooter;
  dltDetails: DltDetails;
}

const CompanyDetails = ({
  companyId = "60c06a65-d9cb-4df7-89fc-4a77004a353d",
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState<CompanyData>({
    basics: {
      businessName: "",
      description: "",
      website: "",
      logo: "",
      timeZone: "Asia/Kolkata",
      currency: "INR",
      customReportingEmail: "",
      disclaimer: "",
    },
    address: {
      address1: "",
      address2: "",
      city: "",
      state: "",
      country: "",
      zip: "",
    },
    socialUrls: {
      facebook: "",
      twitter: "",
      googlePlus: "",
      linkedIn: "",
      youtube: "",
      instagram: "",
    },
    contacts: [],
    marketingDomain: { domains: "" },
    emailFooter: { footer: "" },
    dltDetails: { dltEntityId: "", telemarketerId: "" },
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Fetch company details
  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/companies/${companyId}`);
      const rawData = response.data || {};

      const mappedData: CompanyData = {
        basics: {
          businessName: rawData.name || "",
          description: rawData.description || "",
          website: rawData.website_url || "",
          logo: rawData.logo_url || "",
          timeZone: rawData.time_zone || "Asia/Kolkata",
          currency: rawData.currency || "INR",
          customReportingEmail: rawData.custom_reporting_email || "",
          disclaimer: rawData.disclaimer || "",
        },
        address: {
          address1: rawData.address_line1 || "",
          address2: rawData.address_line2 || "",
          city: rawData.city || "",
          state: rawData.state || "",
          country: rawData.country || "",
          zip: rawData.zip || "",
        },
        socialUrls: {
          facebook: rawData.facebook_url || "",
          twitter: rawData.twitter_url || "",
          googlePlus: rawData.google_plus_url || "",
          linkedIn: rawData.linkedin_url || "",
          youtube: rawData.youtube_url || "",
          instagram: rawData.instagram_url || "",
        },
        contacts:
          rawData.contacts?.map((c: any) => ({
            salutation: c.salutation || "",
            firstName: c.first_name || "",
            lastName: c.last_name || "",
            contactType: c.contact_type || "",
            email: c.email || "",
            phone: c.phone || "",
            enableEmail: c.enable_notification_email || false,
            enableSms: c.enable_notification_sms || false,
            isPrimary: c.is_primary || false,
          })) || [],
        marketingDomain: { domains: rawData.domain || "" },
        emailFooter: { footer: rawData.footer_text || "" },
        dltDetails: {
          dltEntityId: rawData.dlt_entity_id || "",
          telemarketerId: rawData.telemarketer_id || "",
        },
      };

      setData(mappedData);

      // Set logo preview from API
      if (rawData.logo_url && rawData.logo_url.trim() !== "") {
        setLogoPreview(`${IMAGE_BASE_URL}${rawData.logo_url}`);
      } else {
        setLogoPreview(""); // Will fallback to defaultLogo
      }
    } catch (error) {
      console.error("Error fetching company details:", error);
      // toast({
        // variant: "destructive",
        // title: "Error",
        // description: "Failed to fetch company details.",
      // });
      setLogoPreview("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) fetchCompanyDetails();
  }, [companyId]);

  const handleChange = (
    section: keyof CompanyData,
    field: string,
    value: any
  ) => {
    setData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleContactChange = (index: number, field: string, value: any) => {
    setData((prev) => {
      const newContacts = [...prev.contacts];
      newContacts[index] = { ...newContacts[index], [field]: value };
      return { ...prev, contacts: newContacts };
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    }
  };

  const handleSave = async (section: keyof CompanyData) => {
    try {
      let payload: any = { [section]: data[section] };

      if (section === "basics" && logoFile) {
        const formData = new FormData();
        formData.append("logo", logoFile);
        payload.basics.logo = "";
        formData.append("payload", JSON.stringify(payload));

        await axiosInstance.put(`/companies/${companyId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setLogoFile(null);
      } else {
        await axiosInstance.put(`/companies/${companyId}`, payload);
      }

      // toast({
        // title: "Success",
        // description: "Company details updated successfully.",
      // });

      // Refresh data to get latest (especially new logo URL)
      await fetchCompanyDetails();
    } catch (error) {
      console.error(`Error saving ${section}:`, error);
      // toast({
        // variant: "destructive",
        // title: "Error",
        // description: "Failed to update company details.",
      // });
    }
  };

  // Final logo to display: uploaded preview > API logo > default local logo
  const displayLogoSrc = logoPreview || defaultLogo;

  return (
    <div className="h-full bg-gradient-to-br from-gray-100 to-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="bg-card border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Company Details
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your company information, branding, and settings
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                <Home className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate("/settings")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="mx-auto max-w-6xl">
          <Tabs defaultValue="basics" className="w-full">
            <TabsList className="grid grid-cols-3 md:grid-cols-7 gap-2 bg-gray-200 p-2 rounded-lg shadow-inner">
              <TabsTrigger value="basics">Basics</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="socialUrls">Social URLs</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="marketingDomain">
                Marketing Domain
              </TabsTrigger>
              <TabsTrigger value="emailFooter">Email Footer</TabsTrigger>
              <TabsTrigger value="dltDetails">DLT Details</TabsTrigger>
            </TabsList>

            {/* Basics Tab */}
            <TabsContent value="basics" className="mt-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Business Name</Label>
                    <Input
                      value={data.basics.businessName}
                      onChange={(e) =>
                        handleChange("basics", "businessName", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={data.basics.description}
                      onChange={(e) =>
                        handleChange("basics", "description", e.target.value)
                      }
                      className="mt-1 h-24"
                    />
                  </div>

                  <div>
                    <Label>Website</Label>
                    <Input
                      value={data.basics.website}
                      onChange={(e) =>
                        handleChange("basics", "website", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Logo</Label>
                    <div className="mt-2 space-y-4">
                      {loading ? (
                        <div className="h-32 w-32 bg-muted animate-pulse rounded-md" />
                      ) : (
                        <img
                          src={defaultLogo}
                          alt="Company Logo"
                          className="h-32 w-32 object-contain rounded-md border border-gray-300 shadow-sm"
                        />
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                      />
                      <p className="text-xs text-muted-foreground">
                        <strong>Note:</strong> Upload in .png, .jpg, .jpeg or
                        .svg format only.
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label>Time Zone</Label>
                    <Select
                      value={data.basics.timeZone}
                      onValueChange={(v) =>
                        handleChange("basics", "timeZone", v)
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">
                          Asia/Kolkata (IST)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Currency</Label>
                    <Select
                      value={data.basics.currency}
                      onValueChange={(v) =>
                        handleChange("basics", "currency", v)
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">₹ INR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Custom Reporting Email</Label>
                    <Input
                      value={data.basics.customReportingEmail}
                      onChange={(e) =>
                        handleChange(
                          "basics",
                          "customReportingEmail",
                          e.target.value
                        )
                      }
                      className="mt-1"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Disclaimer</Label>
                    <Textarea
                      value={data.basics.disclaimer}
                      onChange={(e) =>
                        handleChange("basics", "disclaimer", e.target.value)
                      }
                      className="mt-1 h-32"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Button
                      onClick={() => handleSave("basics")}
                      className="w-full"
                    >
                      Save Basics
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Address Tab */}
            <TabsContent value="address" className="mt-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Address 1</Label>
                    <Input
                      value={data.address.address1}
                      onChange={(e) =>
                        handleChange("address", "address1", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Address 2</Label>
                    <Input
                      value={data.address.address2}
                      onChange={(e) =>
                        handleChange("address", "address2", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input
                      value={data.address.city}
                      onChange={(e) =>
                        handleChange("address", "city", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input
                      value={data.address.state}
                      onChange={(e) =>
                        handleChange("address", "state", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Country</Label>
                    <Input
                      value={data.address.country}
                      onChange={(e) =>
                        handleChange("address", "country", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Zip</Label>
                    <Input
                      value={data.address.zip}
                      onChange={(e) =>
                        handleChange("address", "zip", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button
                      onClick={() => handleSave("address")}
                      className="w-full"
                    >
                      Save Address
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Social URLs Tab */}
            <TabsContent value="socialUrls" className="mt-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Facebook</Label>
                    <Input
                      value={data.socialUrls.facebook}
                      onChange={(e) =>
                        handleChange("socialUrls", "facebook", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Twitter</Label>
                    <Input
                      value={data.socialUrls.twitter}
                      onChange={(e) =>
                        handleChange("socialUrls", "twitter", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Google Plus</Label>
                    <Input
                      value={data.socialUrls.googlePlus}
                      onChange={(e) =>
                        handleChange("socialUrls", "googlePlus", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>LinkedIn</Label>
                    <Input
                      value={data.socialUrls.linkedIn}
                      onChange={(e) =>
                        handleChange("socialUrls", "linkedIn", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>YouTube</Label>
                    <Input
                      value={data.socialUrls.youtube}
                      onChange={(e) =>
                        handleChange("socialUrls", "youtube", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Instagram</Label>
                    <Input
                      value={data.socialUrls.instagram}
                      onChange={(e) =>
                        handleChange("socialUrls", "instagram", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button
                      onClick={() => handleSave("socialUrls")}
                      className="w-full"
                    >
                      Save Social URLs
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contacts" className="mt-6">
              <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
                {data.contacts.map((contact, index) => (
                  <div
                    key={index}
                    className="border p-6 rounded-lg bg-gray-50 shadow-sm"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>Salutation</Label>
                        <Input
                          value={contact.salutation}
                          onChange={(e) =>
                            handleContactChange(
                              index,
                              "salutation",
                              e.target.value
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>First Name</Label>
                        <Input
                          value={contact.firstName}
                          onChange={(e) =>
                            handleContactChange(
                              index,
                              "firstName",
                              e.target.value
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Last Name</Label>
                        <Input
                          value={contact.lastName}
                          onChange={(e) =>
                            handleContactChange(
                              index,
                              "lastName",
                              e.target.value
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Contact Type</Label>
                        <Input
                          value={contact.contactType}
                          onChange={(e) =>
                            handleContactChange(
                              index,
                              "contactType",
                              e.target.value
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input
                          value={contact.phone}
                          onChange={(e) =>
                            handleContactChange(index, "phone", e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          value={contact.email}
                          onChange={(e) =>
                            handleContactChange(index, "email", e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={contact.enableEmail}
                          onCheckedChange={(c) =>
                            handleContactChange(index, "enableEmail", c)
                          }
                        />
                        <Label>Email Notifications</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={contact.enableSms}
                          onCheckedChange={(c) =>
                            handleContactChange(index, "enableSms", c)
                          }
                        />
                        <Label>SMS Notifications</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={contact.isPrimary}
                          onCheckedChange={(c) =>
                            handleContactChange(index, "isPrimary", c)
                          }
                        />
                        <Label>Is Primary</Label>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  onClick={() => handleSave("contacts")}
                  className="w-full"
                >
                  Save Contacts
                </Button>
              </div>
            </TabsContent>

            {/* Marketing Domain Tab */}
            <TabsContent value="marketingDomain" className="mt-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <Label>Domains</Label>
                    <Input
                      value={data.marketingDomain.domains}
                      onChange={(e) =>
                        handleChange(
                          "marketingDomain",
                          "domains",
                          e.target.value
                        )
                      }
                      className="mt-1"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Domains will be selected from promotional email vendor.
                  </p>
                  <Button
                    onClick={() => handleSave("marketingDomain")}
                    className="w-full"
                  >
                    Save Marketing Domain
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Email Footer Tab */}
            <TabsContent value="emailFooter" className="mt-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <Label>Footer</Label>
                <Textarea
                  value={data.emailFooter.footer}
                  onChange={(e) =>
                    handleChange("emailFooter", "footer", e.target.value)
                  }
                  className="mt-2 h-64"
                />
                <Button
                  onClick={() => handleSave("emailFooter")}
                  className="w-full mt-4"
                >
                  Save Email Footer
                </Button>
              </div>
            </TabsContent>

            {/* DLT Details Tab */}
            <TabsContent value="dltDetails" className="mt-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>DLT Entity ID</Label>
                    <Input
                      value={data.dltDetails.dltEntityId}
                      onChange={(e) =>
                        handleChange(
                          "dltDetails",
                          "dltEntityId",
                          e.target.value
                        )
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Telemarketer ID</Label>
                    <Input
                      value={data.dltDetails.telemarketerId}
                      onChange={(e) =>
                        handleChange(
                          "dltDetails",
                          "telemarketerId",
                          e.target.value
                        )
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button
                      onClick={() => handleSave("dltDetails")}
                      className="w-full"
                    >
                      Save DLT Details
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetails;
