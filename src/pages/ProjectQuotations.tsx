import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  QUOTATION_CALC_TYPE_OPTIONS,
  normalizeCalculationType,
  computeParticularAmount,
  resolveUnitRatePerUnit,
  resolveUnitBasicPrice,
  type QuotationCalcType,
} from "@/utils/quotationCalculations";

type Particular = {
  id?: string;
  label: string;
  calculation_type: QuotationCalcType;
  value: number;
  include_in_subtotal: boolean;
  is_optional: boolean;
  sort_order: number;
};

type Template = {
  id: string;
  project_id: string;
  template_name: string;
  version: number;
  has_terrace_units: boolean;
  particulars: Array<{
    id: string;
    label: string;
    calculation_type: Particular["calculation_type"];
    value: string | number;
    include_in_subtotal: boolean;
    sort_order: number;
    is_optional: boolean;
  }>;
};

type UnitRow = {
  id: string;
  unit_number: string;
  status: string;
  carpet_area_sqft: number | null;
  super_builtup_area_sqft: number | null;
  base_rate?: number | null;
  total_price?: number | null;
  price: number | null;
  lead_id: string | null;
  lead_name: string | null;
  hierarchy_name: string;
  hierarchy_type_code: string;
  has_any_quotation: boolean;
};

type QuotationListItem = {
  id: string;
  quotation_number: string;
  quotation_date: string;
  status: string;
  total_amount: number;
  client_name: string | null;
  unit_number: string;
  lead_name: string | null;
  created_at: string;
};

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function computePreview({
  particulars,
  areas,
  unit,
  excludedOptionalIds,
}: {
  particulars: Array<Template["particulars"][number]>;
  areas: { superBuiltup: number; carpet: number; terrace: number };
  unit: Pick<
    UnitRow,
    | "base_rate"
    | "total_price"
    | "price"
    | "carpet_area_sqft"
    | "super_builtup_area_sqft"
  >;
  excludedOptionalIds: Set<string>;
}) {
  const totalArea = round2(areas.carpet + areas.superBuiltup);
  const pricePerUnit = resolveUnitRatePerUnit(unit);
  const basicPrice = resolveUnitBasicPrice({
    ...unit,
    carpet_area_sqft: areas.carpet,
    super_builtup_area_sqft: areas.superBuiltup,
  });
  let runningTotal = basicPrice;
  const items = [];

  items.push({
    id: "basic_price",
    label: "Total Basic Price",
    amount: basicPrice,
    total: basicPrice,
  });

  for (const p of particulars) {
    if (p.is_optional && excludedOptionalIds.has(p.id)) continue;

    const amount = computeParticularAmount({
      calcType: p.calculation_type,
      value: Number(p.value || 0),
      basicPrice,
      totalArea,
      runningTotal,
    });
    runningTotal = round2(runningTotal + amount);

    items.push({
      id: p.id,
      label: p.label,
      amount,
      total: runningTotal,
    });
  }

  return {
    items,
    grandTotal: runningTotal,
    basicPrice,
    totalArea,
  };
}

const ProjectQuotations = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [template, setTemplate] = useState<Template | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [templateName, setTemplateName] = useState("");
  const [hasTerrace, setHasTerrace] = useState(false);
  const [rows, setRows] = useState<Particular[]>([]);
  const [templates, setTemplates] = useState<Array<{ id: string; template_name: string; version: number }>>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const [units, setUnits] = useState<UnitRow[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [quotations, setQuotations] = useState<QuotationListItem[]>([]);
  const [loadingQuotations, setLoadingQuotations] = useState(false);

  // Generate drawer state
  const [selectedUnit, setSelectedUnit] = useState<UnitRow | null>(null);
  const [clientName, setClientName] = useState("");
  const [quotationDate, setQuotationDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [unitRate, setUnitRate] = useState<number>(0);
  const [terraceArea, setTerraceArea] = useState<number>(0);
  const [terraceRate, setTerraceRate] = useState<number>(0);
  const [excludedOptional, setExcludedOptional] = useState<Set<string>>(new Set());

  const loadTemplates = async () => {
    if (!projectId) return;
    try {
      setLoadingTemplate(true);
      const res = await axiosInstance.get(`/quotation-templates/by-project/${projectId}`);
      const list = res.data?.data || [];
      setTemplates(Array.isArray(list) ? list : []);
      if (!selectedTemplateId && Array.isArray(list) && list.length > 0) {
        const preferred =
          list.find((t: { is_active?: boolean }) => t.is_active) || list[0];
        setSelectedTemplateId(String(preferred.id));
      }
    } catch (e: any) {
      setTemplate(null);
      setRows([]);
      setTemplateName("");
      setHasTerrace(false);
      setTemplates([]);
      setSelectedTemplateId("");
    } finally {
      setLoadingTemplate(false);
    }
  };

  const loadSelectedTemplate = async (templateId: string) => {
    if (!templateId) {
      setTemplate(null);
      setRows([]);
      setTemplateName("");
      setHasTerrace(false);
      return;
    }
    try {
      setLoadingTemplate(true);
      const res = await axiosInstance.get(`/quotation-templates/${templateId}`);
      const tpl: Template | null = res.data?.data ?? null;
      if (!tpl) {
        setTemplate(null);
        setTemplateName("");
        setHasTerrace(false);
        setRows([]);
        return;
      }
      setTemplate(tpl);
      setTemplateName(tpl.template_name);
      setHasTerrace(!!tpl.has_terrace_units);
      setRows(
        (tpl.particulars || []).map((p, idx) => ({
          id: p.id,
          label: p.label,
          calculation_type: normalizeCalculationType(p.calculation_type),
          value: Number(p.value),
          include_in_subtotal: true,
          is_optional: !!p.is_optional,
          sort_order: Number.isFinite(Number(p.sort_order)) ? Number(p.sort_order) : idx,
        })),
      );
    } catch {
      setTemplate(null);
      setRows([]);
      setTemplateName("");
      setHasTerrace(false);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const loadUnits = async () => {
    if (!projectId) return;
    try {
      setLoadingUnits(true);
      const res = await axiosInstance.get(`/units/by-project/${projectId}`);
      setUnits(res.data?.data || []);
    } catch (e: any) {
      // toast({
        // title: "Error",
        // description: e?.response?.data?.error || "Failed to load units",
        // variant: "destructive",
      // });
    } finally {
      setLoadingUnits(false);
    }
  };

  const loadQuotations = async () => {
    if (!projectId) return;
    try {
      setLoadingQuotations(true);
      const res = await axiosInstance.get(`/quotations/by-project/${projectId}`);
      setQuotations(res.data?.data || []);
    } catch (e: any) {
      // toast({
        // title: "Error",
        // description: e?.response?.data?.error || "Failed to load quotations",
        // variant: "destructive",
      // });
    } finally {
      setLoadingQuotations(false);
    }
  };

  useEffect(() => {
    loadTemplates();
    loadUnits();
    loadQuotations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (!selectedTemplateId) return;
    void loadSelectedTemplate(selectedTemplateId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplateId]);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        label: "",
        calculation_type: "percent_of_basic_price",
        value: 0,
        include_in_subtotal: true,
        is_optional: false,
        sort_order: prev.length,
      },
    ]);
  };

  const moveRow = (index: number, dir: -1 | 1) => {
    setRows((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return next.map((r, i) => ({ ...r, sort_order: i }));
    });
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index).map((r, i) => ({ ...r, sort_order: i })));
  };

  const saveTemplate = async () => {
    if (!projectId) return;
    try {
      const particularsToSave = rows
        .filter((r) => String(r.label || "").trim())
        .map((r, idx) => ({
          label: String(r.label).trim(),
          calculation_type: normalizeCalculationType(r.calculation_type),
          value: r.value,
          applies_to: "unit",
          include_in_subtotal: true,
          is_optional: r.is_optional,
          sort_order: idx,
        }));

      if (particularsToSave.length === 0) {
        // toast({
          // title: "Validation",
          // description: "Add at least one particular with a label before saving.",
          // variant: "destructive",
        // });
        return;
      }

      const name = String(templateName || "").trim();
      if (!name) {
        // toast({
          // title: "Validation",
          // description: "Enter a template name before saving.",
          // variant: "destructive",
        // });
        return;
      }

      const payload = {
        project_id: projectId,
        template_name: name,
        is_active: true,
        has_terrace_units: hasTerrace,
        particulars: particularsToSave,
      };
      const res = await axiosInstance.post("/quotation-templates", payload);
      const savedId = res.data?.data?.id;
      // toast({ title: "Saved", description: "Quotation template saved." });
      if (savedId) {
        setSelectedTemplateId(String(savedId));
      }
      await loadTemplates();
      if (savedId) {
        await loadSelectedTemplate(String(savedId));
      }
    } catch (e: any) {
      // toast({
        // title: "Error",
        // description: e?.response?.data?.error || e.message || "Failed to save template",
        // variant: "destructive",
      // });
    }
  };

  const preview = useMemo(() => {
    const exampleSuper = 84.93;
    const exampleCarpet = 100;
    const exampleRate = 8500;
    const excluded = new Set<string>();
    return computePreview({
      particulars: (template?.particulars || []).length
        ? template!.particulars
        : (rows as any),
      areas: { superBuiltup: exampleSuper, carpet: exampleCarpet, terrace: 0 },
      unit: {
        base_rate: exampleRate,
        total_price: null,
        price: null,
        carpet_area_sqft: exampleCarpet,
        super_builtup_area_sqft: exampleSuper,
      },
      excludedOptionalIds: excluded,
    });
  }, [hasTerrace, rows, template]);

  const openGenerate = (u: UnitRow) => {
    setSelectedUnit(u);
    setExcludedOptional(new Set());
    setQuotationDate(new Date().toISOString().slice(0, 10));
    setClientName(u.lead_name || "");
  };

  const generate = async (downloadPdf: boolean) => {
    if (!projectId || !selectedUnit) return;
    if (!selectedTemplateId) {
      // toast({
        // title: "Validation",
        // description: "Select a template first.",
        // variant: "destructive",
      // });
      return;
    }
    try {
      const excluded = Array.from(excludedOptional);
      const res = await axiosInstance.post("/quotations/generate", {
        project_id: projectId,
        unit_id: selectedUnit.id,
        template_id: selectedTemplateId,
        lead_id: selectedUnit.lead_id,
        client_name: clientName,
        quotation_date: quotationDate,
        excluded_particular_ids: excluded,
        status: "draft",
      });

      const quotation = res.data?.data;
      // toast({ title: "Saved", description: "Quotation draft generated." });
      await loadUnits();

      if (downloadPdf && quotation?.id) {
        const pdfRes = await axiosInstance.post(
          `/quotations/${quotation.id}/pdf`,
          {},
          { responseType: "blob" },
        );
        const blob = new Blob([pdfRes.data], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${quotation.quotation_number || "quotation"}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e: any) {
      // toast({
        // title: "Error",
        // description: e?.response?.data?.error || "Failed to generate quotation",
        // variant: "destructive",
      // });
    }
  };

  const templateParticulars = template?.particulars || [];

  const liveBreakdown = useMemo(() => {
    if (!selectedUnit) return null;
    return computePreview({
      particulars: templateParticulars,
      areas: {
        superBuiltup: Number(selectedUnit.super_builtup_area_sqft || 0),
        carpet: Number(selectedUnit.carpet_area_sqft || 0),
        terrace: 0,
      },
      unit: selectedUnit,
      excludedOptionalIds: excludedOptional,
    });
  }, [
    excludedOptional,
    hasTerrace,
    selectedUnit,
    templateParticulars,
  ]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Project Quotations</h1>
          <p className="text-muted-foreground">
            Setup particulars and generate quotations for units.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/quotations")}>
          Back
        </Button>
      </div>

      <Tabs defaultValue="template">
        <TabsList>
          <TabsTrigger value="template">Particulars Setup</TabsTrigger>
          <TabsTrigger value="units">Units & Generate</TabsTrigger>
          <TabsTrigger value="generated">Generated Quotations</TabsTrigger>
        </TabsList>

        <TabsContent value="template" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Select Template</Label>
                  <Select
                    value={selectedTemplateId || ""}
                    onValueChange={(v) => setSelectedTemplateId(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.template_name} (v{t.version})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedTemplateId("");
                      setTemplate(null);
                      setRows([]);
                      setTemplateName("");
                    }}
                  >
                    New Template
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g. Standard Quotation - Tower A"
                  />
                </div>
                <div className="flex items-center gap-3 pt-6 text-sm text-muted-foreground">
                  Total Basic Price and Grand Total are auto-calculated.
                </div>
              </div>

              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">Label</th>
                      <th className="text-left p-2">Calculation Type</th>
                      <th className="text-left p-2">Value</th>
                      <th className="text-left p-2">Optional</th>
                      <th className="text-left p-2">Order</th>
                      <th className="text-left p-2">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2">
                          <Input
                            value={r.label}
                            onChange={(e) =>
                              setRows((prev) =>
                                prev.map((x, i) =>
                                  i === idx ? { ...x, label: e.target.value } : x,
                                ),
                              )
                            }
                            placeholder="GST"
                          />
                        </td>
                        <td className="p-2">
                          <Select
                            value={r.calculation_type}
                            onValueChange={(v: any) =>
                              setRows((prev) =>
                                prev.map((x, i) =>
                                  i === idx ? { ...x, calculation_type: v } : x,
                                ),
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {QUOTATION_CALC_TYPE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2 w-36">
                          <Input
                            type="number"
                            value={r.value}
                            onChange={(e) =>
                              setRows((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? { ...x, value: Number(e.target.value) }
                                    : x,
                                ),
                              )
                            }
                          />
                        </td>
                        <td className="p-2">
                          <Switch
                            checked={r.is_optional}
                            onCheckedChange={(v) =>
                              setRows((prev) =>
                                prev.map((x, i) =>
                                  i === idx ? { ...x, is_optional: v } : x,
                                ),
                              )
                            }
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => moveRow(idx, -1)}
                            >
                              ↑
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => moveRow(idx, 1)}
                            >
                              ↓
                            </Button>
                          </div>
                        </td>
                        <td className="p-2">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeRow(idx)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={addRow}>
                  Add Particular
                </Button>
                <Button type="button" onClick={saveTemplate} disabled={loadingTemplate}>
                  Save Template
                </Button>
                {template && (
                  <Badge variant="secondary">Active v{template.version}</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Live Preview (Example)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="text-muted-foreground">
                Example: Carpet = 100, Super = 84.93, Rate = ₹8,500
              </div>
              <div className="border rounded-md">
                <div className="flex justify-between p-2 border-b">
                  <span className="font-medium">Total Basic Price</span>
                  <span>₹ {preview.basicPrice.toLocaleString("en-IN")}</span>
                </div>
                {preview.items.map((it, idx) => (
                  <div
                    key={it.id || `${it.label}-${idx}`}
                    className="flex justify-between p-2 border-b"
                  >
                    <span>{it.label}</span>
                    <span>₹ {Number(it.total || 0).toLocaleString("en-IN")}</span>
                  </div>
                ))}
                <div className="flex justify-between p-2 font-semibold">
                  <span>Grand Total</span>
                  <span>₹ {preview.grandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quotation template</Label>
                  <Select
                    value={selectedTemplateId || ""}
                    onValueChange={(v) => setSelectedTemplateId(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template for generation" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.template_name} (v{t.version})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {template && (
                  <div className="flex items-end text-sm text-muted-foreground">
                    Using: <span className="ml-1 font-medium">{template.template_name}</span>
                    <Badge variant="secondary" className="ml-2">
                      v{template.version}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {!selectedTemplateId || !template ? (
            <Card>
              <CardContent className="p-6 text-muted-foreground">
                Select a quotation template above to generate quotations from its
                particulars.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Units</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingUnits ? (
                  <div className="text-muted-foreground">Loading units...</div>
                ) : (
                  <div className="border rounded-md overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2">Unit</th>
                          <th className="text-left p-2">Hierarchy</th>
                          <th className="text-left p-2">Carpet</th>
                          <th className="text-left p-2">Super</th>
                          <th className="text-left p-2">Base Price</th>
                          <th className="text-left p-2">Lead</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Quotation</th>
                          <th className="text-left p-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {units.map((u) => (
                          <tr key={u.id} className="border-t">
                            <td className="p-2 font-medium">{u.unit_number}</td>
                            <td className="p-2">
                              {u.hierarchy_type_code}: {u.hierarchy_name}
                            </td>
                            <td className="p-2">{u.carpet_area_sqft ?? "-"}</td>
                            <td className="p-2">
                              {u.super_builtup_area_sqft ?? "-"}
                            </td>
                            <td className="p-2">
                              ₹ {Number(u.price || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="p-2">{u.lead_name || "Unassigned"}</td>
                            <td className="p-2">
                              <Badge variant="outline">{u.status}</Badge>
                            </td>
                            <td className="p-2">
                              {u.has_any_quotation ? (
                                <Badge className="bg-emerald-600 hover:bg-emerald-600">
                                  Yes
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Not yet</Badge>
                              )}
                            </td>
                            <td className="p-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    onClick={() => openGenerate(u)}
                                  >
                                    Generate Quotation
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                  <DialogHeader>
                                    <DialogTitle>
                                      Generate for {u.unit_number}
                                      {template?.template_name
                                        ? ` — ${template.template_name}`
                                        : ""}
                                    </DialogTitle>
                                  </DialogHeader>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label>Client Name</Label>
                                      <Input
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        placeholder="Client name"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Quotation Date</Label>
                                      <Input
                                        type="date"
                                        value={quotationDate}
                                        onChange={(e) =>
                                          setQuotationDate(e.target.value)
                                        }
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Price per unit (₹)</Label>
                                      <Input value={Number(u.price || 0)} disabled />
                                    </div>
                                  </div>

                                  <div className="mt-4 space-y-2">
                                    <div className="font-semibold">
                                      Breakdown (Live)
                                    </div>
                                    <div className="border rounded-md overflow-x-auto">
                                      <table className="w-full text-sm">
                                        <thead className="bg-muted">
                                          <tr>
                                            <th className="text-left p-2">
                                              Include
                                            </th>
                                            <th className="text-left p-2">Particular</th>
                                            {hasTerrace && (
                                              <>
                                                <th className="text-right p-2">
                                                  Unit
                                                </th>
                                                <th className="text-right p-2">
                                                  Terrace
                                                </th>
                                              </>
                                            )}
                                            <th className="text-right p-2">Total</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {templateParticulars.map((p) => {
                                            const excluded =
                                              p.is_optional && excludedOptional.has(p.id);
                                            const it = liveBreakdown?.items.find(
                                              (x) => x.id === p.id,
                                            );
                                            const total = it?.total ?? 0;
                                            return (
                                              <tr key={p.id} className="border-t">
                                                <td className="p-2">
                                                  {p.is_optional ? (
                                                    <input
                                                      type="checkbox"
                                                      checked={!excluded}
                                                      onChange={(e) =>
                                                        setExcludedOptional((prev) => {
                                                          const next = new Set(prev);
                                                          if (!e.target.checked) {
                                                            next.add(p.id);
                                                          } else {
                                                            next.delete(p.id);
                                                          }
                                                          return next;
                                                        })
                                                      }
                                                    />
                                                  ) : (
                                                    <span className="text-muted-foreground">
                                                      —
                                                    </span>
                                                  )}
                                                </td>
                                                <td className="p-2">{p.label}</td>
                                                <td className="p-2 text-right">
                                                  ₹ {total.toLocaleString("en-IN")}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>

                                    <div className="flex justify-end font-semibold">
                                      Grand Total: ₹{" "}
                                      {Number(liveBreakdown?.grandTotal || 0).toLocaleString(
                                        "en-IN",
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex gap-2 justify-end mt-4">
                                    <Button
                                      variant="outline"
                                      onClick={() => generate(false)}
                                    >
                                      Save Draft
                                    </Button>
                                    <Button onClick={() => generate(true)}>
                                      Generate & Download PDF
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="generated" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Quotations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-3">
                <Button variant="outline" onClick={loadQuotations}>
                  Refresh
                </Button>
              </div>
              {loadingQuotations ? (
                <div className="text-muted-foreground">Loading quotations...</div>
              ) : quotations.length === 0 ? (
                <div className="text-muted-foreground">No quotations yet.</div>
              ) : (
                <div className="border rounded-md overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2">Quotation #</th>
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Unit</th>
                        <th className="text-left p-2">Client</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-right p-2">Total</th>
                        <th className="text-left p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotations.map((q) => (
                        <tr key={q.id} className="border-t">
                          <td className="p-2 font-medium">{q.quotation_number}</td>
                          <td className="p-2">{q.quotation_date}</td>
                          <td className="p-2">{q.unit_number}</td>
                          <td className="p-2">{q.client_name || q.lead_name || "-"}</td>
                          <td className="p-2">
                            <Badge variant="outline">{q.status}</Badge>
                          </td>
                          <td className="p-2 text-right">
                            ₹ {Number(q.total_amount || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="p-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                navigate(`/quotations/${projectId}/quotation/${q.id}`)
                              }
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectQuotations;

