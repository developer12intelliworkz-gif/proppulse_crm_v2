import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

type QuotationRecord = {
  id: string;
  quotation_number: string | null;
  quotation_date: string;
  status: string;
  total_amount: number;
  client_name: string | null;
  particulars_snapshot: any;
  project_name: string;
  unit_number: string;
};

const QuotationView = () => {
  const { id, projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<QuotationRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/quotations/${id}`);
        setData(res.data?.data || null);
      } catch (e: any) {
        // toast({
          // title: "Error",
          // description: e?.response?.data?.error || "Failed to load quotation",
          // variant: "destructive",
        // });
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id, toast]);

  const downloadPdf = async () => {
    try {
      const res = await axiosInstance.post(`/quotations/${id}/pdf`, {}, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data?.quotation_number || "quotation"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      // toast({
        // title: "Error",
        // description: e?.response?.data?.error || "Failed to download PDF",
        // variant: "destructive",
      // });
    }
  };

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;
  if (!data) return <div className="p-6 text-muted-foreground">Not found.</div>;

  const snapshot = data.particulars_snapshot || {};
  const items: any[] = Array.isArray(snapshot.items) ? snapshot.items : [];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {data.quotation_number || "Quotation"}
          </h1>
          <div className="text-muted-foreground text-sm">
            {data.project_name} • Unit {data.unit_number}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/quotations/${projectId}`)}>
            Back
          </Button>
          <Button onClick={downloadPdf}>Download PDF</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Status</span>
            <Badge variant="outline">{data.status}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Date</span>
            <span>{data.quotation_date}</span>
          </div>
          <div className="flex justify-between">
            <span>Client</span>
            <span>{data.client_name || "-"}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>₹ {Number(data.total_amount || 0).toLocaleString("en-IN")}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Particulars</CardTitle>
        </CardHeader>
        <CardContent className="border rounded-md overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2">#</th>
                <th className="text-left p-2">Description</th>
                <th className="text-right p-2">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2">{idx + 1}</td>
                  <td className="p-2">{it.label}</td>
                  <td className="p-2 text-right">
                    ₹ {Number(it.total_amount || 0).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
              <tr className="border-t font-semibold">
                <td className="p-2" />
                <td className="p-2 text-right">Grand Total</td>
                <td className="p-2 text-right">
                  ₹{" "}
                  {Number(snapshot?.totals?.grand_total || data.total_amount || 0).toLocaleString(
                    "en-IN",
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuotationView;

