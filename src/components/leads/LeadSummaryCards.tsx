import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axiosInstance from "@/api/axiosInstance";
import { formatPascalCaseDisplayName } from "@/utils/formatDisplayName";

interface LeadType {
  id: string;
  name: string;
  logo_image?: string | null;
  logo_name?: string | null;
  logo_url?: string | null;
}

interface LeadSummaryCardsProps {
  leadTypeCounts: { [key: string]: number };
  onCardClick: (type: string) => void;
  selectedLeadType?: string;
  isLoading?: boolean;
}

const LeadSummaryCards: React.FC<LeadSummaryCardsProps> = ({
  leadTypeCounts,
  onCardClick,
  selectedLeadType = "all",
  isLoading,
}) => {
  const { token } = useAuth();
  const [leadSummary, setLeadSummary] = useState<LeadType[]>([]);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!token) return;
    axiosInstance.get("/leadtype").then(r => setLeadSummary(r.data || [])).catch(() => {});
  }, [token]);

  const normalizeLogoUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.includes("/api/")) return url;
    return url.replace("public/lead_icons", "api/public/lead_icons");
  };

  const allItems = [
    { id: "all", name: "all", logo_name: "All Sources", logo_url: null, logo_image: null },
    ...leadSummary,
  ];

  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 14 }}>
      {allItems.map(card => {
        const isAll = card.id === "all";
        const count = isAll ? (leadTypeCounts.all || 0) : (leadTypeCounts[card.name] || 0);
        const active = selectedLeadType === card.name;
        const logoUrl = normalizeLogoUrl(card.logo_url);
        const hasFailed = failedImages[card.id];
        return (
          <button
            key={card.id}
            onClick={() => onCardClick(card.name)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 14px", borderRadius: 10, flexShrink: 0,
              border: `1.5px solid ${active ? "var(--theme-color)" : "hsl(var(--border))"}`,
              background: active ? "rgba(var(--theme-color-rgb), 0.1)" : "hsl(var(--card))",
              cursor: "pointer", transition: "all 0.12s",
              boxShadow: active ? "0 0 0 3px rgba(var(--theme-color-rgb), 0.15)" : "none",
            }}
          >
            {isAll ? (
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(var(--theme-color-rgb), 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--theme-color)" }}>All</div>
            ) : (logoUrl && !hasFailed) ? (
              <img
                src={logoUrl}
                alt={card.name}
                onError={() => setFailedImages(prev => ({ ...prev, [card.id]: true }))}
                style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 6 }}
              />
            ) : (
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(var(--theme-color-rgb), 0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--theme-color)" }}>
                {formatPascalCaseDisplayName(card.name).charAt(0)}
              </div>
            )}
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: active ? "var(--theme-color)" : "hsl(var(--foreground))", whiteSpace: "nowrap" }}>
                {formatPascalCaseDisplayName(card.logo_name || card.name)}
              </div>
              <div style={{ fontSize: 10, color: "hsl(var(--muted-foreground))" }}>{count} leads</div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default LeadSummaryCards;
