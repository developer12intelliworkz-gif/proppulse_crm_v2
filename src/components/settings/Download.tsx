import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axiosInstance from "@/api/axiosInstance";
import { useAuth } from "@/contexts/AuthContext";
import { SECURITY_CONFIG } from "@/config/security";

// ─────────────────────────────────────────────────────────────────────────────
//  Build image base URL (same logic as CompanyDetails)
// ─────────────────────────────────────────────────────────────────────────────
const baseURL = SECURITY_CONFIG.ONLY_URL || SECURITY_CONFIG.BASE;
const IMAGE_BASE_URL = baseURL.replace("/api", "") || `${SECURITY_CONFIG.BASE}`;

// ─────────────────────────────────────────────────────────────────────────────
//  Logo sizing constants – tweak only if needed
// ─────────────────────────────────────────────────────────────────────────────
const LOGO_MAX_WIDTH_MM = 45; // Top-right logo max width
const LOGO_MAX_HEIGHT_MM = 25; // Top-right logo max height
const WATERMARK_SIZE_MM = 70; // Watermark square size

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────
interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────────────────────
const Download = () => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("leads");
  const [leadsData, setLeadsData] = useState<Lead[]>([]);
  const [projectsData, setProjectsData] = useState<Project[]>([]);
  const [usersData, setUsersData] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ────────────────────────────────────────────────────────────────────────
  //  Dynamic logo state
  // ────────────────────────────────────────────────────────────────────────
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  // ────────────────────────────────────────────────────────────────────────
  //  Fetch company logo (only once)
  // ────────────────────────────────────────────────────────────────────────
  const fetchCompanyLogo = useCallback(async () => {
    try {
      const companyId = "60c06a65-d9cb-4df7-89fc-4a77004a353d"; // Update if dynamic
      const resp = await axiosInstance.get(`/companies/${companyId}`);
      const raw = resp.data || {};

      const rawLogo = raw.logo_url ?? "";
      if (rawLogo) {
        const fullUrl = `${IMAGE_BASE_URL}${rawLogo}`;
        setLogoUrl(fullUrl);
        setLogoError(false);
      } else {
        setLogoUrl(null);
      }
    } catch (err) {
      console.error("Failed to fetch company logo", err);
      setLogoError(true);
    }
  }, []);

  useEffect(() => {
    fetchCompanyLogo();
  }, [fetchCompanyLogo]);

  // ────────────────────────────────────────────────────────────────────────
  //  Fetch tab data
  // ────────────────────────────────────────────────────────────────────────
  const fetchData = async (tab: string) => {
    setIsLoading(true);
    try {
      if (tab === "leads") {
        let allLeads: Lead[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const {
            data: { data, pagination },
          } = await axiosInstance.get(`/${tab}`, {
            params: { page, limit: 10 },
          });
          allLeads = [
            ...allLeads,
            ...data.sort((a: Lead, b: Lead) => a.id - b.id),
          ];
          hasMore = page < pagination.pages;
          page++;
        }
        setLeadsData(allLeads);
      } else if (tab === "projects") {
        const { data } = await axiosInstance.get(`/${tab}`);
        const list = (data.data || data) as Project[];
        setProjectsData(
          list.map((p) => ({
            ...p,
            description: p.description.replace(/<[^>]+>/g, ""),
          }))
        );
      } else if (tab === "users") {
        const { data } = await axiosInstance.get(`/${tab}`);
        setUsersData(data.data || data);
      }
    } catch (e) {
      console.error(`Error fetching ${tab}:`, e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  // ────────────────────────────────────────────────────────────────────────
  //  PDF Generation
  // ────────────────────────────────────────────────────────────────────────
  const downloadPDF = (tab: string) => {
    const doc = new jsPDF();
    const title = tab.charAt(0).toUpperCase() + tab.slice(1);

    // Title
    doc.setFontSize(16);
    doc.text(`All ${title}`, 14, 20);

    if (logoUrl && !logoError) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = logoUrl;

      img.onload = () => addLogoAndGenerate(doc, img, tab);
      img.onerror = () => {
        console.warn("Logo failed to load – generating without logo");
        setLogoError(true);
        generateTableOnly(doc, tab);
      };
    } else {
      generateTableOnly(doc, tab);
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  //  Add logo + watermark + table
  // ────────────────────────────────────────────────────────────────────────
  const addLogoAndGenerate = (
    doc: jsPDF,
    img: HTMLImageElement,
    tab: string
  ) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const aspect = img.width / img.height;

    // 1. Top-right logo
    let logoW = LOGO_MAX_WIDTH_MM;
    let logoH = logoW / aspect;
    if (logoH > LOGO_MAX_HEIGHT_MM) {
      logoH = LOGO_MAX_HEIGHT_MM;
      logoW = logoH * aspect;
    }
    const logoX = pageWidth - logoW - 14;
    const logoY = 10;
    doc.addImage(img, "PNG", logoX, logoY, logoW, logoH);

    // 2. Watermark
    doc.setGState(doc.GState({ opacity: 0.15 }));
    const wmSize = WATERMARK_SIZE_MM;
    const wmW = wmSize;
    const wmH = wmSize / aspect;
    const wmX = (pageWidth - wmW) / 2;
    const wmY = (pageHeight - wmH) / 2;
    doc.addImage(img, "PNG", wmX, wmY, wmW, wmH);
    doc.setGState(doc.GState({ opacity: 1 }));

    // 3. Table
    generateTableOnly(doc, tab);
  };

  // ────────────────────────────────────────────────────────────────────────
  //  Table only (used when no logo or after logo)
  // ────────────────────────────────────────────────────────────────────────
  const generateTableOnly = (doc: jsPDF, tab: string) => {
    const tableData =
      tab === "leads"
        ? leadsData.map((l) => [l.id, l.name, l.email, l.phone, l.status])
        : tab === "projects"
        ? projectsData.map((p) => [p.id, p.name, p.description])
        : usersData.map((u, i) => [i + 1, u.name, u.email, u.role]);

    const headers =
      tab === "leads"
        ? ["ID", "Name", "Email", "Phone", "Status"]
        : tab === "projects"
        ? ["ID", "Name", "Description"]
        : ["S.No.", "Name", "Email", "Role"];

    const startY = logoUrl ? 40 : 30; // Push table down if logo exists

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [22, 160, 133], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
    });

    doc.save(`${tab}_data.pdf`);
  };

  // ────────────────────────────────────────────────────────────────────────
  //  Render table
  // ────────────────────────────────────────────────────────────────────────
  const renderTable = (tab: string) => {
    const data =
      tab === "leads"
        ? leadsData
        : tab === "projects"
        ? projectsData
        : usersData;

    const headers =
      tab === "leads"
        ? ["ID", "Name", "Email", "Phone", "Status"]
        : tab === "projects"
        ? ["ID", "Name", "Description"]
        : ["S.No.", "Name", "Email", "Role"];

    if (isLoading) return <div className="text-center py-4">Loading...</div>;
    if (!data.length)
      return <div className="text-center py-4">No data available</div>;

    return (
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((h, i) => (
              <TableHead key={i}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, idx) => (
            <TableRow key={idx}>
              {tab === "leads" && (
                <>
                  <TableCell>{(item as Lead).id}</TableCell>
                  <TableCell>{(item as Lead).name}</TableCell>
                  <TableCell>{(item as Lead).email}</TableCell>
                  <TableCell>{(item as Lead).phone}</TableCell>
                  <TableCell>{(item as Lead).status}</TableCell>
                </>
              )}
              {tab === "projects" && (
                <>
                  <TableCell>{(item as Project).id}</TableCell>
                  <TableCell>{(item as Project).name}</TableCell>
                  <TableCell>{(item as Project).description}</TableCell>
                </>
              )}
              {tab === "users" && (
                <>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{(item as User).name}</TableCell>
                  <TableCell>{(item as User).email}</TableCell>
                  <TableCell>{(item as User).role}</TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // ────────────────────────────────────────────────────────────────────────
  //  Permissions & Tabs
  // ────────────────────────────────────────────────────────────────────────
  const availableTabs = [
    { id: "leads", label: "Leads", permission: "export_leads" },
    { id: "projects", label: "Projects", permission: "export_projects" },
    { id: "users", label: "Users", permission: "export_users" },
  ].filter((t) => hasPermission(t.permission));

  const handleCancel = () => navigate("/settings");

  // ────────────────────────────────────────────────────────────────────────
  //  Render
  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-card border-b shadow-sm flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Download Data
              </h1>
              <p className="text-muted-foreground">
                Download your leads, projects, and users data
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                <Home className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="p-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          <TabsList
            className="grid w-full flex-shrink-0 bg-gray-300"
            style={{
              gridTemplateColumns: `repeat(${availableTabs.length || 1}, 1fr)`,
            }}
          >
            {availableTabs.length === 0 ? (
              <div className="p-2 text-muted-foreground">
                No download permissions available. Contact your administrator.
              </div>
            ) : (
              availableTabs.map((t) => (
                <TabsTrigger key={t.id} value={t.id}>
                  {t.label}
                </TabsTrigger>
              ))
            )}
          </TabsList>

          <div className="flex-1 min-h-0 mt-6">
            {/* Leads */}
            <TabsContent value="leads" className="h-full m-0">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Download Leads</CardTitle>
                      <CardDescription>
                        View and download leads data
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => downloadPDF("leads")}
                      disabled={isLoading || !leadsData.length}
                    >
                      Download PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>{renderTable("leads")}</CardContent>
              </Card>
            </TabsContent>

            {/* Projects */}
            <TabsContent value="projects" className="h-full m-0">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Download Projects</CardTitle>
                      <CardDescription>
                        View and download projects data
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => downloadPDF("projects")}
                      disabled={isLoading || !projectsData.length}
                    >
                      Download PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>{renderTable("projects")}</CardContent>
              </Card>
            </TabsContent>

            {/* Users */}
            <TabsContent value="users" className="h-full m-0">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Download Users</CardTitle>
                      <CardDescription>
                        View and download users data
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => downloadPDF("users")}
                      disabled={isLoading || !usersData.length}
                    >
                      Download PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>{renderTable("users")}</CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Download;
