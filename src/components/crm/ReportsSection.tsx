import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/api/axiosInstance";
import { format, subDays, isValid } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  PhoneIncoming, CheckCircle2, TrendingUp, UserCheck,
  Download, CalendarIcon,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// ── Types ────────────────────────────────────────────────────────────────────
type DateRange = { startDate: string; endDate: string };

interface Row { id?: string | number; name: string; count: number; converted: number; conversionRate: number; }
interface StatusItem { name: string; value: number; color: string; }

// ── Theme helpers ────────────────────────────────────────────────────────────
const getThemeColor = () => {
  if (typeof window !== "undefined") {
    const val = getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim();
    if (val) return val;
  }
  return "#6366F1";
};

const getThemeColorRgb = (): [number, number, number] => {
  if (typeof window !== "undefined") {
    const val = getComputedStyle(document.documentElement).getPropertyValue('--theme-color-rgb').trim();
    if (val) {
      const parts = val.split(',').map(n => parseInt(n.trim(), 10));
      if (parts.length === 3 && !parts.some(isNaN)) {
        return [parts[0], parts[1], parts[2]];
      }
    }
  }
  return [99, 102, 241];
};

const getBrandColors = () => {
  const themeHex = getThemeColor();
  return [themeHex, "#F97316", "#059669", "#0EA5E9", "#EC4899", "#D97706", "#7C3AED", "#DC2626"];
};

const getStatusColorsMap = () => {
  const themeHex = getThemeColor();
  return {
    New: "#8B5CF6", Contacted: "#06B6D4", Qualified: "#3B82F6",
    Working: themeHex, "Proposal Sent": "#F59E0B", "Site Visit": "#F97316",
    Converted: "#10B981", Lost: "#EF4444",
  };
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (d: string) => (d && isValid(new Date(d)) ? format(new Date(d), "dd MMM yyyy") : "");
const fmtRange = (r: DateRange) => r.startDate && r.endDate ? `${fmt(r.startDate)} – ${fmt(r.endDate)}` : "All time";
const pct = (n: number) => `${n.toFixed(1)}%`;

const defaultRange = (): DateRange => ({
  startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
  endDate:   format(new Date(), "yyyy-MM-dd"),
});

// ── Hooks ─────────────────────────────────────────────────────────────────────
const useSummary = () =>
  useQuery({ queryKey: ["reports-summary"], queryFn: () => axiosInstance.get("/reports/").then(r => r.data), staleTime: 300_000 });

const useReport = (endpoint: string, range: DateRange) =>
  useQuery({
    queryKey: ["report", endpoint, range.startDate, range.endDate],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (range.startDate) params.startDate = range.startDate;
      if (range.endDate)   params.endDate   = range.endDate;
      return axiosInstance.get(`/reports/${endpoint}`, { params }).then(r => r.data);
    },
    staleTime: 300_000,
  });

// ── PDF Export (per-panel) ────────────────────────────────────────────────────
const exportPDF = async (opts: {
  title: string; subtitle: string;
  kpis: { label: string; value: string | number }[];
  columns: string[]; rows: (string | number)[][];
}) => {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  const themeRgb = getThemeColorRgb();
  const washRgb: [number, number, number] = [
    Math.round(themeRgb[0] + (255 - themeRgb[0]) * 0.9),
    Math.round(themeRgb[1] + (255 - themeRgb[1]) * 0.9),
    Math.round(themeRgb[2] + (255 - themeRgb[2]) * 0.9),
  ];

  doc.setFillColor(...themeRgb);
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16); doc.setFont("helvetica", "bold");
  doc.text("PropPulse CRM", 12, 11);
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text(opts.title, 12, 19);
  doc.setFontSize(8); doc.text(opts.subtitle, 12, 25);
  doc.text(`Generated: ${format(new Date(), "dd MMM yyyy, hh:mm a")}`, W - 12, 25, { align: "right" });
  let y = 36;
  const kpiW = (W - 24) / opts.kpis.length;
  opts.kpis.forEach((k, i) => {
    const x = 12 + i * kpiW;
    doc.setFillColor(...washRgb); doc.roundedRect(x, y, kpiW - 4, 16, 2, 2, "F");
    doc.setTextColor(...themeRgb); doc.setFontSize(13); doc.setFont("helvetica", "bold");
    doc.text(String(k.value), x + (kpiW - 4) / 2, y + 7, { align: "center" });
    doc.setTextColor(138, 146, 178); doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text(k.label, x + (kpiW - 4) / 2, y + 13, { align: "center" });
  });
  y += 24;
  autoTable(doc, {
    startY: y, head: [opts.columns], body: opts.rows,
    styles: { fontSize: 8, cellPadding: 3, textColor: [26, 31, 54] },
    headStyles: { fillColor: themeRgb, textColor: 255, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 249, 252] },
    columnStyles: { 0: { fontStyle: "bold" } }, margin: { left: 12, right: 12 },
  });
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p); doc.setFillColor(...washRgb); doc.rect(0, 287, W, 10, "F");
    doc.setTextColor(138, 146, 178); doc.setFontSize(7);
    doc.text("PropPulse CRM  •  Confidential", 12, 293);
    doc.text(`Page ${p} of ${pages}`, W - 12, 293, { align: "right" });
  }
  doc.save(`${opts.title.replace(/\s+/g, "_")}.pdf`);
};

// ── Single-page Infographic PDF ───────────────────────────────────────────────
const exportFullReportPDF = async (range: DateRange, _summary: any) => {
  const { jsPDF } = await import("jspdf");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const params: Record<string, string> = {};
  if (range.startDate) params.startDate = range.startDate;
  if (range.endDate)   params.endDate   = range.endDate;
  const [srcRes, agentRes, statusRes, projRes] = await Promise.all([
    axiosInstance.get("/reports/by-source",  { params }),
    axiosInstance.get("/reports/by-agent",   { params }),
    axiosInstance.get("/reports/by-status",  { params }),
    axiosInstance.get("/reports/by-project", { params }),
  ]);
  const SD: Row[] = srcRes.data?.tableData   || [];
  const AD: Row[] = agentRes.data?.tableData  || [];
  const XD: Row[] = statusRes.data?.tableData || [];
  const PD: Row[] = projRes.data?.tableData   || [];

  const srcTot  = SD.reduce((s,r) => s+r.count, 0);
  const stTot   = XD.reduce((s,r) => s+r.count, 0);
  const total   = stTot || srcTot || 0;
  const conv    = AD.reduce((s,r) => s+r.converted, 0);
  const lost    = XD.find(r=>r.name.toLowerCase()==="lost")?.count ?? 0;
  const visits  = XD.find(r=>r.name.toLowerCase().includes("site"))?.count ?? 0;
  const newL    = XD.find(r=>r.name.toLowerCase()==="new")?.count ?? 0;
  const qual    = XD.find(r=>r.name.toLowerCase().includes("qualif"))?.count ?? 0;
  const cr      = total>0 ? ((conv/total)*100).toFixed(1) : "0.0";
  const period  = fmtRange(range);
  const today   = format(new Date(), "dd-MMM-yyyy hh:mm a");

  const themeHex = getThemeColor();
  const themeRgb = getThemeColorRgb();
  const washRgb: [number, number, number] = [
    Math.round(themeRgb[0] + (255 - themeRgb[0]) * 0.9),
    Math.round(themeRgb[1] + (255 - themeRgb[1]) * 0.9),
    Math.round(themeRgb[2] + (255 - themeRgb[2]) * 0.9),
  ];
  const washHex = "#" + washRgb.map(x => x.toString(16).padStart(2, "0")).join("");

  const PAL = [themeHex, "#F97316", "#059669", "#0EA5E9", "#EC4899", "#D97706", "#7C3AED", "#DC2626", "#14B8A6", "#F59E0B"];
  const SCLR: Record<string,string> = {
    "New":"#8B5CF6","Contacted":"#06B6D4","Working":themeHex,"Follow-up":themeHex,
    "Interested":"#3B82F6","Site Visit":"#F97316","Proposal Sent":"#F59E0B",
    "Qualified":"#7C3AED","Converted":"#059669","Won":"#059669","Lost":"#EF4444","Closed Lost":"#EF4444",
  };

  // ── Canvas helpers ─────────────────────────────────────────────────────────
  const rr = (ctx: CanvasRenderingContext2D, x:number,y:number,w:number,h:number,r:number) => {
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
  };

  // Horizontal bar chart
  const makeBar = (items:{label:string;value:number;color:string;sub?:string}[], cW=520, cH=240, lblW=130, valW=65): string => {
    const c = document.createElement("canvas"); c.width=cW; c.height=cH;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0,0,cW,cH);
    if (!items.length) return c.toDataURL();
    const n = items.length;
    const barH = Math.min(32, (cH - 16) / n - 6);
    const gap  = Math.min(10, (cH - 16 - n*barH) / Math.max(n-1,1));
    const barW = cW - lblW - valW - 6;
    const maxV = Math.max(...items.map(d=>d.value), 1);
    items.forEach((item,i) => {
      const y2 = 8 + i*(barH+gap);
      const bw = Math.max((item.value/maxV)*barW, item.value>0?3:0);
      const fs = Math.min(13, barH*0.48);
      ctx.fillStyle="#1A1F36"; ctx.font=`600 ${fs}px Arial`; ctx.textAlign="right"; ctx.textBaseline="middle";
      ctx.fillText((item.label.length>16?item.label.slice(0,16)+"…":item.label), lblW-8, y2+barH/2);
      ctx.fillStyle=washHex; rr(ctx,lblW,y2,barW,barH,5); ctx.fill();
      if (bw>0) { ctx.fillStyle=item.color; rr(ctx,lblW,y2,bw,barH,5); ctx.fill(); }
      ctx.fillStyle=item.color; ctx.font=`bold ${fs}px Arial`; ctx.textAlign="left";
      ctx.fillText(String(item.value), lblW+barW+5, y2+barH*0.42);
      if (item.sub) { ctx.fillStyle="#8A92B2"; ctx.font=`${fs*0.82}px Arial`; ctx.fillText(item.sub, lblW+barW+5, y2+barH*0.78); }
    });
    return c.toDataURL("image/png");
  };

  // Donut chart
  const makeDonut = (items:{label:string;value:number;color:string}[], sz=300): string => {
    const c = document.createElement("canvas"); c.width=sz; c.height=sz;
    const ctx = c.getContext("2d")!; ctx.clearRect(0,0,sz,sz);
    const cx=sz/2,cy=sz/2,outerR=sz*0.43,innerR=sz*0.26;
    const tot = items.reduce((s,d)=>s+d.value,0)||1;
    let ang=-Math.PI/2;
    items.forEach(item => {
      const sw=(item.value/tot)*Math.PI*2;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,outerR,ang,ang+sw); ctx.closePath();
      ctx.fillStyle=item.color; ctx.fill();
      ctx.strokeStyle="#fff"; ctx.lineWidth=2; ctx.stroke();
      ang+=sw;
    });
    ctx.beginPath(); ctx.arc(cx,cy,innerR,0,Math.PI*2); ctx.fillStyle="#fff"; ctx.fill();
    ctx.fillStyle="#1A1F36"; ctx.font=`bold ${sz*0.13}px Arial`; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(String(tot), cx, cy-sz*0.05);
    ctx.fillStyle="#8A92B2"; ctx.font=`${sz*0.075}px Arial`; ctx.fillText("Total", cx, cy+sz*0.09);
    return c.toDataURL("image/png");
  };

  // Trapezoid funnel
  const makeFunnel = (items:{label:string;value:number;color:string}[], cW=640, cH=200): string => {
    const c = document.createElement("canvas"); c.width=cW; c.height=cH;
    const ctx = c.getContext("2d")!; ctx.clearRect(0,0,cW,cH);
    const n=items.length||1;
    const segH = (cH-4)/n;
    items.forEach((item,i)=>{
      const taper=0.62/n;
      const topW=cW*(1-i*taper), botW=cW*(1-(i+1)*taper);
      const topX=(cW-topW)/2, botX=(cW-botW)/2, y2=i*segH+2;
      const g=ctx.createLinearGradient(topX,0,topX+topW,0);
      g.addColorStop(0,item.color+"BB"); g.addColorStop(0.5,item.color); g.addColorStop(1,item.color+"BB");
      ctx.beginPath(); ctx.moveTo(topX,y2); ctx.lineTo(topX+topW,y2);
      ctx.lineTo(botX+botW,y2+segH-2); ctx.lineTo(botX,y2+segH-2); ctx.closePath();
      ctx.fillStyle=g; ctx.fill();
      if(i>0){ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(topX,y2);ctx.lineTo(topX+topW,y2);ctx.stroke();}
      const fs=Math.min(14,segH*0.32);
      ctx.fillStyle="#fff"; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.font=`${fs}px Arial`; ctx.fillText(item.label, cW/2, y2+segH*0.35);
      ctx.font=`bold ${fs*1.15}px Arial`; ctx.fillText(String(item.value), cW/2, y2+segH*0.72);
    });
    return c.toDataURL("image/png");
  };

  const doc2 = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W=210, M=13;
  const HW=(W-M*2-5)/2;  // half-column width
  const C2=M+HW+5;       // right column x

  type RGB=[number,number,number];
  const BL:RGB=themeRgb, DK:RGB=[26,31,54], MU:RGB=[138,146,178],
        BD:RGB=[226,229,240], LB:RGB=washRgb;

  const sf=(sz:number,st:"bold"|"normal"="normal",c:RGB=DK)=>{
    doc2.setFontSize(sz); doc2.setFont("helvetica",st); doc2.setTextColor(...c);
  };
  const ai=(url:string,x:number,y:number,w:number,h:number)=>{
    try{doc2.addImage(url,"PNG",x,y,w,h);}catch(_){}
  };
  const sh=(lbl:string,x:number,y:number,x2:number)=>{
    sf(7.5,"bold",BL); doc2.text(lbl,x,y);
    doc2.setDrawColor(...BL); doc2.setLineWidth(0.3); doc2.line(x,y+1.5,x2,y+1.5);
    return y+5.5;
  };
  const dv=(y:number)=>{doc2.setDrawColor(...BD);doc2.setLineWidth(0.3);doc2.line(M,y,W-M,y);};

  // ── HEADER
  doc2.setFillColor(...BL); doc2.rect(0,0,W,26,"F");
  doc2.setFillColor(255,255,255); doc2.roundedRect(M,4.5,20,17,2,2,"F");
  doc2.setFillColor(...BL); doc2.circle(M+10,11,4.5,"F");
  doc2.setFillColor(255,255,255); doc2.circle(M+10,11,3,"F"); doc2.rect(M+7.5,15,5,3,"F");
  sf(10,"bold",[255,255,255]); doc2.text("PropPulse CRM",M+23,10);
  sf(6.5,"normal",[200,210,255]); doc2.text("Building Dreams. Building Trust.",M+23,16);
  sf(16,"bold",[255,255,255]); doc2.text("LEAD PERFORMANCE REPORT",W-M,10,{align:"right"});
  sf(6.5,"normal",[210,220,255]);
  doc2.text(`Period: ${period}`,W-M,18,{align:"right"});
  doc2.text(`Generated: ${today}`,W-M,23,{align:"right"});

  // ── 1. KPI CARDS
  let ky=28;
  ky=sh("1. EXECUTIVE SUMMARY",M,ky,W-M);
  const kpiRows: [string,string|number,RGB,RGB][] = [
    ["Total Leads",total,[37,99,235],[237,242,255]],
    ["New Leads",newL,[14,165,233],[236,254,255]],
    ["Qualified",qual,[124,58,237],[245,240,255]],
    ["Site Visits",visits,[249,115,22],[255,247,237]],
    ["Converted",conv,[5,150,105],[236,253,245]],
    ["Lost Leads",lost,[239,68,68],[254,242,242]],
    ["Conv. Rate",`${cr}%`,BL,LB],
  ];
  const cw2=(W-M*2-6*2)/7;
  kpiRows.forEach(([lbl,val,color,bg],i)=>{
    const cx=M+i*(cw2+2);
    doc2.setFillColor(...bg); doc2.setDrawColor(...BD); doc2.setLineWidth(0.2);
    doc2.roundedRect(cx,ky,cw2,17,2,2,"FD");
    doc2.setFillColor(...color); doc2.roundedRect(cx,ky,cw2,2.5,1,1,"F");
    sf(10,"bold",color); doc2.text(String(val),cx+cw2/2,ky+9.5,{align:"center"});
    sf(5,"normal",MU);   doc2.text(lbl,         cx+cw2/2,ky+14.5,{align:"center"});
  });

  dv(50);

  // ── 2. SOURCE BARS + 3. STATUS DONUT
  const srcY=52;
  sh("2. LEAD SOURCE PERFORMANCE",M,srcY,M+HW);
  sh("3. LEAD STATUS DISTRIBUTION",C2,srcY,W-M);
  const chartY=srcY+5.5;
  const bandH=48;

  const srcPxW=Math.round(HW*5.5), srcPxH=Math.round(bandH*5.5);
  if(SD.length>0){
    const img=makeBar(SD.map((r,i)=>({label:r.name,value:r.count,color:PAL[i%PAL.length],sub:`${srcTot>0?((r.count/srcTot)*100).toFixed(1):0}%`})),srcPxW,srcPxH,Math.round(0.28*srcPxW),Math.round(0.14*srcPxW));
    ai(img,M,chartY,HW,bandH);
  } else { sf(7.5,"normal",MU); doc2.text("No source data",M+HW/2,chartY+bandH/2,{align:"center"}); }

  const donutSz=Math.round(bandH*5.5);
  const donutMm=bandH*0.82;
  if(XD.length>0){
    const dImg=makeDonut(XD.map(r=>({label:r.name,value:r.count,color:SCLR[r.name]||"#8A92B2"})),donutSz);
    ai(dImg,C2,chartY,donutMm,donutMm);
    const lx=C2+donutMm+3, lw=HW-donutMm-3;
    let ly=chartY+2;
    XD.slice(0,8).forEach(r=>{
      const col=SCLR[r.name]||"#8A92B2";
      const pv=stTot>0?((r.count/stTot)*100).toFixed(0):"0";
      doc2.setFillColor(col); doc2.circle(lx+2,ly+2,1.6,"F");
      sf(6,"normal",DK); doc2.text(r.name,lx+5.5,ly+3);
      sf(6,"bold",DK);   doc2.text(`${r.count} (${pv}%)`,lx+lw,ly+3,{align:"right"});
      ly+=5;
    });
  } else { sf(7.5,"normal",MU); doc2.text("No status data",C2+HW/2,chartY+bandH/2,{align:"center"}); }

  dv(102);

  // ── 4. FUNNEL
  const fnY=104;
  sh("4. SALES FUNNEL ANALYSIS",M,fnY,W-M);
  const fnChartY=fnY+5.5, fnH=34;
  if(XD.length>0){
    const funnelItems=XD.slice(0,8).map((r,i)=>({label:r.name,value:r.count,color:PAL[i%PAL.length]}));
    const fImg=makeFunnel(funnelItems, Math.round((W-M*2)*5.5), Math.round(fnH*5.5));
    ai(fImg,M,fnChartY,W-M*2,fnH);
  } else { sf(7.5,"normal",MU); doc2.text("No funnel data",W/2,fnChartY+fnH/2,{align:"center"}); }

  dv(141);

  // ── 5. AGENT + 6. PROJECT
  const agY=143;
  sh("5. AGENT PERFORMANCE",M,agY,M+HW);
  sh("6. PROJECT PERFORMANCE",C2,agY,W-M);
  const agChartY=agY+5.5, agBandH=40;
  const agPxW=Math.round(HW*5.5), agPxH=Math.round(agBandH*5.5);

  if(AD.length>0){
    const img=makeBar(AD.map((r,i)=>({label:r.name,value:r.count,color:PAL[i%PAL.length],sub:`Conv: ${r.conversionRate.toFixed(1)}%`})),agPxW,agPxH,Math.round(0.28*agPxW),Math.round(0.14*agPxW));
    ai(img,M,agChartY,HW,agBandH);
  } else { sf(7.5,"normal",MU); doc2.text("No agent data",M+HW/2,agChartY+agBandH/2,{align:"center"}); }

  if(PD.length>0){
    const img=makeBar(PD.map((r,i)=>({label:r.name,value:r.count,color:PAL[(i+3)%PAL.length],sub:`Conv: ${r.conversionRate.toFixed(1)}%`})),agPxW,agPxH,Math.round(0.28*agPxW),Math.round(0.14*agPxW));
    ai(img,C2,agChartY,HW,agBandH);
  } else { sf(7.5,"normal",MU); doc2.text("No project data",C2+HW/2,agChartY+agBandH/2,{align:"center"}); }

  dv(186);

  // ── 7. KEY INSIGHTS
  const insY=188;
  sh("7. KEY INSIGHTS & RECOMMENDATIONS",M,insY,W-M);
  const insChartY=insY+5.5;
  const topSrc=SD[0], topAg=AD[0], topPrj=PD[0];
  const ins3:[string,string,RGB][]=[
    ["🏆 Top Source",   topSrc?`${topSrc.name}: ${topSrc.count} leads (${srcTot>0?((topSrc.count/srcTot)*100).toFixed(1):0}% share)`:"No data", BL],
    ["⭐ Top Agent",    topAg?`${topAg.name}: ${topAg.converted} conversions at ${topAg.conversionRate.toFixed(1)}%`:"No agent data",[5,150,105]],
    ["🏗️ Best Project", topPrj?`${topPrj.name}: ${topPrj.count} leads, ${topPrj.conversionRate.toFixed(1)}% conversion`:"No project data",[249,115,22]],
  ];
  const icw=(W-M*2-4*2)/3;
  ins3.forEach(([lbl,txt,col],i)=>{
    const ix=M+i*(icw+4);
    doc2.setFillColor(255,255,255); doc2.setDrawColor(...col); doc2.setLineWidth(0.5);
    doc2.roundedRect(ix,insChartY,icw,19,2,2,"FD");
    doc2.setFillColor(...col); doc2.rect(ix,insChartY,3,19,"F");
    sf(6.5,"bold",col); doc2.text(lbl,ix+5,insChartY+6.5);
    sf(6,"normal",DK); doc2.text(doc2.splitTextToSize(txt,icw-8).slice(0,3),ix+5,insChartY+12);
  });

  const recY=insChartY+23;
  doc2.setFillColor(...LB); doc2.setDrawColor(...BL); doc2.setLineWidth(0.4);
  doc2.roundedRect(M,recY,W-M*2,22,2,2,"FD");
  doc2.setFillColor(...BL); doc2.rect(M,recY,3.5,22,"F");
  sf(7.5,"bold",BL); doc2.text("Recommendations",M+6,recY+6);
  sf(6.5,"normal",DK);
  doc2.text([
    `•  Increase budget on ${topSrc?.name??"top source"} to maximise lead volume.`,
    `•  Improve follow-up response time — speed is the #1 conversion factor.`,
    `•  Focus site-visit-to-booking pipeline for ${topPrj?.name??"top project"}.`,
  ],M+6,recY+12,{lineHeightFactor:1.75});

  // ── FOOTER
  doc2.setDrawColor(...BD); doc2.setLineWidth(0.3); doc2.line(M,284,W-M,284);
  sf(6.5,"normal",MU);
  doc2.text("PropPulse CRM",M,289);
  doc2.text("Confidential Report",W/2,289,{align:"center"});
  doc2.text("Page 1 of 1",W-M,289,{align:"right"});

  const lbl=range.startDate&&range.endDate?`${range.startDate}_to_${range.endDate}`:"All_time";
  doc2.save(`Lead_Performance_Report_${lbl}.pdf`);
};

// ── Reusable table component ──────────────────────────────────────────────────
const ReportTable = ({ data, loading }: { data: Row[]; loading: boolean }) => (
  <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ background: "hsl(var(--muted))" }}>
          {["Name","Total Leads","Converted","Conversion Rate"].map(h => (
            <th key={h} style={{ padding: "10px 14px", textAlign: "left" as const, fontSize: 10, fontWeight: 700, color: "hsl(var(--muted-foreground))", textTransform: "uppercase" as const, letterSpacing: "0.06em", borderBottom: "1px solid hsl(var(--border))" }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr><td colSpan={4} style={{ textAlign: "center", padding: "40px 0", color: "hsl(var(--muted-foreground))", fontSize: 13 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderBottomColor: "var(--theme-color)" }} /> Loading…
            </div>
          </td></tr>
        ) : data.length === 0 ? (
          <tr><td colSpan={4} style={{ textAlign: "center", padding: "40px 0", color: "hsl(var(--muted-foreground))", fontSize: 13 }}>No data for this period</td></tr>
        ) : data.map((row, i) => (
          <tr key={row.id ?? row.name} style={{ borderBottom: "1px solid hsl(var(--border))", background: i % 2 === 0 ? "hsl(var(--card))" : "hsl(var(--background))" }}>
            <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: "hsl(var(--foreground))" }}>{row.name}</td>
            <td style={{ padding: "10px 14px", fontSize: 13, color: "hsl(var(--muted-foreground))" }}>{row.count}</td>
            <td style={{ padding: "10px 14px", fontSize: 13, color: "hsl(var(--muted-foreground))" }}>{row.converted}</td>
            <td style={{ padding: "10px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, height: 6, background: "hsl(var(--secondary))", borderRadius: 3, overflow: "hidden", minWidth: 60 }}>
                  <div style={{ height: "100%", width: `${Math.min(row.conversionRate, 100)}%`, background: row.conversionRate >= 50 ? "#059669" : row.conversionRate >= 20 ? "#D97706" : "var(--theme-color)", borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: row.conversionRate >= 50 ? "#059669" : row.conversionRate >= 20 ? "#D97706" : "var(--theme-color)", minWidth: 38, textAlign: "right" as const }}>
                  {pct(row.conversionRate)}
                </span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ── Date range picker ─────────────────────────────────────────────────────────
const DateRangeBar = ({ range, onChange }: { range: DateRange; onChange: (r: DateRange) => void }) => {
  const isAllTime = !range.startDate && !range.endDate;
  const presets = [
    { label: "All", days: 0 },
    { label: "7d",  days: 7 },
    { label: "30d", days: 30 },
    { label: "90d", days: 90 },
    { label: "1y",  days: 365 },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {presets.map(p => {
        const s = p.days === 0 ? "" : format(subDays(new Date(), p.days), "yyyy-MM-dd");
        const active = p.days === 0 ? isAllTime : range.startDate === s;
        return (
          <button key={p.label}
            onClick={() => p.days === 0
              ? onChange({ startDate: "", endDate: "" })
              : onChange({ startDate: s, endDate: format(new Date(), "yyyy-MM-dd") })
            }
            style={{ padding: "5px 11px", borderRadius: 20, border: "1px solid", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.12s",
              borderColor: active ? "var(--theme-color)" : "hsl(var(--border))", background: active ? "rgba(var(--theme-color-rgb), 0.1)" : "hsl(var(--card))", color: active ? "var(--theme-color)" : "hsl(var(--muted-foreground))" }}>
            {p.label}
          </button>
        );
      })}
      {!isAllTime && (
        <Popover>
          <PopoverTrigger asChild>
            <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 20, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--muted-foreground))", fontSize: 11, cursor: "pointer" }}>
              <CalendarIcon size={11} /> {fmt(range.startDate)} – {fmt(range.endDate)}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="range"
              selected={{ from: range.startDate ? new Date(range.startDate) : undefined, to: range.endDate ? new Date(range.endDate) : undefined }}
              onSelect={(r: any) => { if (r?.from && r?.to) onChange({ startDate: format(r.from, "yyyy-MM-dd"), endDate: format(r.to, "yyyy-MM-dd") }); }}
              numberOfMonths={2} initialFocus />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

// ── REPORT PANELS ─────────────────────────────────────────────────────────────

// 1. Lead Funnel
const LeadFunnelPanel = ({ range }: { range: DateRange }) => {
  const { data, isLoading } = useReport("by-status", range);
  const rawRows: Row[] = data?.tableData || [];
  const statusColors = getStatusColorsMap();
  const statusData: StatusItem[] = rawRows.map((r: Row) => ({
    name: r.name,
    value: r.count,
    color: statusColors[r.name as keyof typeof statusColors] || "#8A92B2",
  }));
  const total = statusData.reduce((s: number, d: StatusItem) => s + d.value, 0);
  const funnelData = statusData.map((d: StatusItem) => ({ name: d.name, value: d.value, fill: d.color }));

  const handleExport = async () => {
    await exportPDF({
      title: "Lead Funnel Report",
      subtitle: fmtRange(range),
      kpis: [
        { label: "Total Leads", value: total },
        { label: "Converted", value: statusData.find((d: StatusItem) => d.name === "Converted")?.value ?? 0 },
        { label: "Lost", value: statusData.find((d: StatusItem) => d.name === "Lost")?.value ?? 0 },
        { label: "In Pipeline", value: statusData.filter((d: StatusItem) => !["Converted","Lost"].includes(d.name)).reduce((s: number, d: StatusItem) => s + d.value, 0) },
      ],
      columns: ["Stage", "Count", "% of Total"],
      rows: statusData.map((d: StatusItem) => [d.name, d.value, `${total > 0 ? ((d.value/total)*100).toFixed(1) : 0}%`]),
    });
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "hsl(var(--foreground))" }}>Lead Funnel Analysis</div>
          <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginTop: 2 }}>How leads progress through your sales pipeline</div>
        </div>
        <button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--muted-foreground))", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
          <Download size={13} /> Export PDF
        </button>
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "hsl(var(--muted-foreground))", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderBottomColor: "var(--theme-color)" }} /> Loading…
        </div>
      )}

      {!isLoading && statusData.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "hsl(var(--muted-foreground))", fontSize: 13 }}>No data for this period</div>
      )}

      {!isLoading && statusData.length > 0 && (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Funnel bars */}
        <div>
          {statusData.map((stage: StatusItem) => {
            const pctVal = total > 0 ? (stage.value / total) * 100 : 0;
            return (
              <div key={stage.name} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: stage.color }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: "hsl(var(--foreground))" }}>{stage.name}</span>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--foreground))" }}>{stage.value}</span>
                    <span style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", minWidth: 36, textAlign: "right" as const }}>{pctVal.toFixed(1)}%</span>
                  </div>
                </div>
                <div style={{ height: 8, background: "hsl(var(--secondary))", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pctVal}%`, background: stage.color, borderRadius: 4, transition: "width 0.5s ease" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Pie */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={funnelData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}
                label={({ name, percent }) => percent > 0.05 ? `${(percent*100).toFixed(0)}%` : ""} labelLine={false}>
                {funnelData.map((entry: any, i: number) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [`${v} leads`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", justifyContent: "center", marginTop: 4 }}>
            {statusData.map((d: StatusItem) => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} />
                <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

// 2. Source Performance
const SourcePanel = ({ range }: { range: DateRange }) => {
  const { data, isLoading } = useReport("by-source", range);
  const rows: Row[] = data?.tableData || [];
  const brandColors = getBrandColors();
  const chartData = rows.slice(0, 8).map((r: Row, i: number) => ({ name: r.name, Leads: r.count, Converted: r.converted, fill: brandColors[i % brandColors.length] }));

  const handleExport = async () => {
    await exportPDF({
      title: "Source Performance Report",
      subtitle: fmtRange(range),
      kpis: [
        { label: "Total Sources", value: rows.length },
        { label: "Total Leads", value: rows.reduce((s: number, r: Row) => s + r.count, 0) },
        { label: "Total Converted", value: rows.reduce((s: number, r: Row) => s + r.converted, 0) },
        { label: "Best Source", value: rows[0]?.name ?? "—" },
      ],
      columns: ["Source", "Total Leads", "Converted", "Conversion %"],
      rows: rows.map((r: Row) => [r.name, r.count, r.converted, `${r.conversionRate.toFixed(1)}%`]),
    });
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "hsl(var(--foreground))" }}>Lead Source Performance</div>
          <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginTop: 2 }}>Which portals & channels bring the best quality leads</div>
        </div>
        <button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--muted-foreground))", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
          <Download size={13} /> Export PDF
        </button>
      </div>
      {chartData.length > 0 && (
        <div style={{ marginBottom: 20, background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 10, padding: "16px 10px 8px" }}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))", fontSize: 12 }} />
              <Bar dataKey="Leads" fill="var(--theme-color, #6366F1)" radius={[4,4,0,0]} maxBarSize={32} />
              <Bar dataKey="Converted" fill="#059669" radius={[4,4,0,0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <ReportTable data={rows} loading={isLoading} />
    </div>
  );
};

// 3. Agent Performance
const AgentPanel = ({ range }: { range: DateRange }) => {
  const { data, isLoading } = useReport("by-agent", range);
  const rows: Row[] = data?.tableData || [];

  const handleExport = async () => {
    await exportPDF({
      title: "Agent Performance Report",
      subtitle: fmtRange(range),
      kpis: [
        { label: "Active Agents", value: rows.length },
        { label: "Total Leads", value: rows.reduce((s: number, r: Row) => s + r.count, 0) },
        { label: "Total Converted", value: rows.reduce((s: number, r: Row) => s + r.converted, 0) },
        { label: "Top Agent", value: rows[0]?.name ?? "—" },
      ],
      columns: ["Agent", "Assigned Leads", "Converted", "Conversion %", "Rank"],
      rows: rows.map((r: Row, i: number) => [r.name, r.count, r.converted, `${r.conversionRate.toFixed(1)}%`, i + 1]),
    });
  };

  const chartData = rows.slice(0, 8).map((r: Row) => ({ name: r.name.split(" ")[0], Leads: r.count, Converted: r.converted }));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "hsl(var(--foreground))" }}>Agent Performance</div>
          <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginTop: 2 }}>Compare agent-wise lead assignments and conversions</div>
        </div>
        <button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--muted-foreground))", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
          <Download size={13} /> Export PDF
        </button>
      </div>

      {/* Agent leaderboard cards */}
      {!isLoading && rows.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
          {rows.slice(0, 3).map((r: Row, i: number) => {
            const medals = ["🥇","🥈","🥉"];
            return (
              <div key={r.name} style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, padding: "14px 16px", textAlign: "center" as const }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{medals[i]}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--foreground))", marginBottom: 2 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>{r.count} leads · {r.converted} converted</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--theme-color)", marginTop: 6 }}>{pct(r.conversionRate)}</div>
              </div>
            );
          })}
        </div>
      )}

      {chartData.length > 0 && (
        <div style={{ marginBottom: 20, background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 10, padding: "16px 10px 8px" }}>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))", fontSize: 12 }} />
              <Bar dataKey="Leads" fill="var(--theme-color, #6366F1)" radius={[4,4,0,0]} maxBarSize={28} />
              <Bar dataKey="Converted" fill="#059669" radius={[4,4,0,0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <ReportTable data={rows} loading={isLoading} />
    </div>
  );
};

// 4. Project Report
const ProjectPanel = ({ range }: { range: DateRange }) => {
  const { data, isLoading } = useReport("by-project", range);
  const rows: Row[] = data?.tableData || [];
  const brandColors = getBrandColors();
  const chartData = rows.slice(0, 8).map((r: Row, i: number) => ({ name: r.name.length > 14 ? r.name.slice(0,14)+"…" : r.name, Leads: r.count, fill: brandColors[i % brandColors.length] }));

  const handleExport = async () => {
    await exportPDF({
      title: "Project Interest Report",
      subtitle: fmtRange(range),
      kpis: [
        { label: "Projects", value: rows.length },
        { label: "Total Leads", value: rows.reduce((s: number, r: Row) => s + r.count, 0) },
        { label: "Total Converted", value: rows.reduce((s: number, r: Row) => s + r.converted, 0) },
        { label: "Top Project", value: rows[0]?.name ?? "—" },
      ],
      columns: ["Project", "Interested Leads", "Converted", "Conversion %"],
      rows: rows.map((r: Row) => [r.name, r.count, r.converted, `${r.conversionRate.toFixed(1)}%`]),
    });
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "hsl(var(--foreground))" }}>Project Interest Report</div>
          <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginTop: 2 }}>Which projects attract the most leads and conversions</div>
        </div>
        <button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--muted-foreground))", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
          <Download size={13} /> Export PDF
        </button>
      </div>
      {chartData.length > 0 && (
        <div style={{ marginBottom: 20, background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 10, padding: "16px 10px 8px" }}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} layout="vertical" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))", fontSize: 12 }} />
              <Bar dataKey="Leads" radius={[0,4,4,0]} maxBarSize={18}>
                {chartData.map((entry: any, i: number) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <ReportTable data={rows} loading={isLoading} />
    </div>
  );
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, icon: Icon, color, bg }: any) => (
  <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon size={20} color={color} />
    </div>
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "hsl(var(--foreground))", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginTop: 3, fontWeight: 500 }}>{label}</div>
    </div>
  </div>
);

// ── TABS ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "funnel",   label: "Lead Funnel",         icon: "📊" },
  { key: "source",   label: "Source Performance",  icon: "📡" },
  { key: "agent",    label: "Agent Performance",   icon: "👤" },
  { key: "project",  label: "Project Report",      icon: "🏗️" },
];

// ── Main component ────────────────────────────────────────────────────────────
const ReportsSection: React.FC = () => {
  const [activeTab, setActiveTab]   = useState("funnel");
  const [range, setRange]           = useState<DateRange>(defaultRange);
  const [exporting, setExporting]   = useState(false);
  const { data: summary, isLoading: summaryLoading } = useSummary();

  const totalLeads     = summary?.totalLeads ?? 0;
  const conversionRate = summary?.conversionRate ?? 0;
  const activeAgents   = summary?.activeAgents ?? 0;
  const converted      = summary?.leadSourceData?.reduce((s: number, d: any) => s + d.converted, 0) ?? 0;

  const handleFullExport = async () => {
    setExporting(true);
    try { await exportFullReportPDF(range, summary); }
    catch (e) { console.error("PDF export failed", e); }
    finally { setExporting(false); }
  };

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "hsl(var(--background))", padding: "22px 24px", borderRadius: 14 }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--theme-color)", fontWeight: 600, marginBottom: 3 }}>ANALYTICS</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "hsl(var(--foreground))" }}>Reports Dashboard</div>
          <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginTop: 2 }}>Lifetime KPIs · filter reports by date range below</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <DateRangeBar range={range} onChange={setRange} />
          <button
            onClick={handleFullExport}
            disabled={exporting}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 8,
              background: "var(--theme-color)",
              opacity: exporting ? 0.6 : 1,
              color: "#fff", border: "none", fontSize: 12,
              fontWeight: 600, cursor: exporting ? "not-allowed" : "pointer",
              whiteSpace: "nowrap" as const, transition: "background 0.15s",
            }}
          >
            <Download size={13} />
            {exporting ? "Generating…" : "Download Full Report"}
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
        <KpiCard label="Total Leads"     value={summaryLoading ? "—" : totalLeads.toLocaleString()} icon={PhoneIncoming} color="#2563EB" bg="rgba(37,99,235,0.15)" />
        <KpiCard label="Converted"       value={summaryLoading ? "—" : converted}                   icon={CheckCircle2}  color="#059669" bg="rgba(5,150,105,0.15)" />
        <KpiCard label="Conversion Rate" value={summaryLoading ? "—" : `${conversionRate}%`}         icon={TrendingUp}    color="#7C3AED" bg="rgba(124,58,237,0.15)" />
        <KpiCard label="Active Agents"   value={summaryLoading ? "—" : activeAgents}                 icon={UserCheck}     color="var(--theme-color)" bg="rgba(var(--theme-color-rgb), 0.15)" />
      </div>

      {/* ── Report card ── */}
      <div style={{ background: "hsl(var(--card))", borderRadius: 14, border: "1px solid hsl(var(--border))", overflow: "hidden" }}>

        {/* Tab strip */}
        <div style={{ display: "flex", borderBottom: "1px solid hsl(var(--border))", overflowX: "auto" }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{
                display: "flex", alignItems: "center", gap: 7, padding: "14px 20px", fontSize: 12, fontWeight: 500,
                background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" as const,
                color: activeTab === tab.key ? "var(--theme-color)" : "hsl(var(--muted-foreground))",
                borderBottom: activeTab === tab.key ? "2px solid var(--theme-color)" : "2px solid transparent",
                marginBottom: -1, transition: "color 0.12s",
              }}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* Panel body */}
        <div style={{ padding: "24px 28px" }}>
          {activeTab === "funnel"  && <LeadFunnelPanel range={range} />}
          {activeTab === "source"  && <SourcePanel range={range} />}
          {activeTab === "agent"   && <AgentPanel range={range} />}
          {activeTab === "project" && <ProjectPanel range={range} />}
        </div>
      </div>
    </div>
  );
};

export default ReportsSection;
