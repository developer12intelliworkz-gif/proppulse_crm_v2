// controllers/reports.controller.js
import pool from "../../database/config.js";

// export const getReportsData = async (req, res) => {
//   const { period = "30" } = req.query;
//   const days = parseInt(period);

//   if (![7, 30, 90, 365].includes(days)) {
//     return res
//       .status(400)
//       .json({ error: "Invalid period. Use 7, 30, 90 or 365" });
//   }

//   const now = new Date();
//   const startDate = new Date(now.setDate(now.getDate() - days))
//     .toISOString()
//     .split("T")[0];

//   try {
//     const { rows: leads } = await pool.query(
//       `
//       SELECT
//         l.*,
//         p.name AS project_name,
//         u.name AS agent_name,
//         u.roles_permissions_id
//       FROM leads l
//       LEFT JOIN projects p ON l.interested_project_id = p.id
//       LEFT JOIN users u ON l.assigned_to = u.id
//       WHERE l.is_active = TRUE
//         AND l.created_at >= $1
//       `,
//       [startDate]
//     );

//     const totalLeads = leads.length;

//     // Helper to group & count converted leads
//     const groupAndCount = (key) => {
//       const map = {};
//       leads.forEach((lead) => {
//         const value = lead[key] || "Unknown";
//         if (!map[value]) map[value] = { total: 0, converted: 0 };
//         map[value].total++;
//         if ((lead.status || "").toLowerCase() === "converted") {
//           map[value].converted++;
//         }
//       });
//       return map;
//     };

//     // 1. Lead Source Wise
//     const sourceMap = groupAndCount("lead_type");
//     const leadSourceData = Object.entries(sourceMap)
//       .map(([name, { total, converted }]) => ({
//         name: name.trim() || "Unknown",
//         total,
//         converted,
//         conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
//       }))
//       .sort((a, b) => b.total - a.total);

//     // 2. Project Wise (top 10)
//     const projectMap = groupAndCount("project_name");
//     const projectInterestData = Object.entries(projectMap)
//       .filter(([name]) => name && name !== "null")
//       .map(([name, { total, converted }]) => ({
//         name,
//         total,
//         converted,
//         conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
//       }))
//       .sort((a, b) => b.total - a.total)
//       .slice(0, 10);

//     // 3. Agent Wise (only sales role)
//     const SALES_ROLE_ID = 3; // CHANGE IF YOUR SALES ROLE ID IS DIFFERENT
//     const agentMap = {};
//     leads.forEach((lead) => {
//       if (lead.roles_permissions_id !== SALES_ROLE_ID) return;
//       const name = lead.agent_name || "Unassigned";
//       if (!agentMap[name]) agentMap[name] = { total: 0, converted: 0 };
//       agentMap[name].total++;
//       if ((lead.status || "").toLowerCase() === "converted")
//         agentMap[name].converted++;
//     });

//     const agentPerformanceData = Object.entries(agentMap)
//       .map(([name, { total, converted }]) => ({
//         name,
//         total,
//         converted,
//         conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
//       }))
//       .sort((a, b) => b.total - a.total);

//     // 4. Lead Status Pie Chart
//     const statusCount = {};
//     leads.forEach((lead) => {
//       let status = (lead.status || "new").toLowerCase().trim();
//       const normalized =
//         {
//           "proposal sent": "Proposal Sent",
//           proposal_sent: "Proposal Sent",
//           contacted: "Contacted",
//           qualified: "Qualified",
//           working: "Working",
//           lost: "Lost",
//           converted: "Converted",
//           new: "New",
//           "site visit": "Site Visit",
//         }[status] || status.charAt(0).toUpperCase() + status.slice(1);
//       statusCount[normalized] = (statusCount[normalized] || 0) + 1;
//     });

//     const leadStatusData = Object.entries(statusCount)
//       .map(([name, value]) => ({
//         name,
//         value,
//         color:
//           {
//             New: "#8B5CF6",
//             Contacted: "#06B6D4",
//             Qualified: "#3B82F6",
//             Working: "#6366F1",
//             "Proposal Sent": "#F59E0B",
//             "Site Visit": "#F97316",
//             Converted: "#10B981",
//             Lost: "#EF4444",
//           }[name] || "#94A3B8",
//       }))
//       .sort((a, b) => {
//         const order = [
//           "New",
//           "Contacted",
//           "Qualified",
//           "Working",
//           "Proposal Sent",
//           "Site Visit",
//           "Converted",
//           "Lost",
//         ];
//         return order.indexOf(a.name) - order.indexOf(b.name);
//       });

//     // 5. City Wise
//     const cityMap = {};
//     leads.forEach((lead) => {
//       let city = "Unknown";
//       if (lead.address) {
//         const parts = lead.address.split(",").map((p) => p.trim());
//         city = parts[parts.length - 2] || parts[parts.length - 1] || "Unknown";
//       }
//       if (!cityMap[city]) cityMap[city] = { total: 0, converted: 0 };
//       cityMap[city].total++;
//       if ((lead.status || "").toLowerCase() === "converted")
//         cityMap[city].converted++;
//     });

//     const cityWiseData = Object.entries(cityMap)
//       .map(([name, { total, converted }]) => ({
//         name,
//         total,
//         converted,
//         conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
//       }))
//       .sort((a, b) => b.total - a.total);

//     // Weekly Trends
//     const trendsResult = await pool.query(
//       `SELECT DATE_TRUNC('week', created_at)::date AS week,
//               COUNT(*) AS leads,
//               COUNT(*) FILTER (WHERE status = 'converted') AS conversions
//        FROM leads
//        WHERE is_active = TRUE AND created_at >= $1
//        GROUP BY week ORDER BY week`,
//       [startDate]
//     );

//     const weeklyTrendsData = trendsResult.rows.map((r) => ({
//       week: new Date(r.week).toLocaleDateString("en-US", {
//         month: "short",
//         day: "numeric",
//       }),
//       leads: parseInt(r.leads),
//       conversions: parseInt(r.conversions) || 0,
//     }));

//     const convertedLeads = leads.filter(
//       (l) => (l.status || "").toLowerCase() === "converted"
//     ).length;
//     const conversionRate =
//       totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

//     res.json({
//       totalLeads,
//       conversionRate,
//       activeAgents: agentPerformanceData.length,
//       leadSourceData,
//       projectInterestData,
//       agentPerformanceData,
//       leadStatusData,
//       cityWiseData,
//       weeklyTrendsData,
//     });
//   } catch (error) {
//     console.error("Reports Error:", error);
//     res.status(500).json({ error: "Server error", details: error.message });
//   }
// };

// controllers/reports.controller.js → getReportsData
export const getReportsData = async (req, res) => {
  try {
    // REMOVED period logic → nownow returns LIFETIME data
    const { rows: leads } = await pool.query(
      `
      SELECT 
        l.*,
        p.name AS project_name,
        u.name AS agent_name,
        u.roles_permissions_id
      FROM leads l
      LEFT JOIN projects p ON l.interested_project_id = p.id
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE l.is_active = TRUE
      `
      // Removed: AND l.created_at >= $1
      // Removed: [startDate]
    );

    const totalLeads = leads.length;

    const groupAndCount = (key) => {
      const map = {};
      leads.forEach((lead) => {
        const value = lead[key] || "Unknown";
        if (!map[value]) map[value] = { total: 0, converted: 0 };
        map[value].total++;
        if ((lead.status || "").toLowerCase() === "converted") {
          map[value].converted++;
        }
      });
      return map;
    };

    const sourceMap = groupAndCount("lead_type");
    const leadSourceData = Object.entries(sourceMap)
      .map(([name, { total, converted }]) => ({
        name: name.trim() || "Unknown",
        total,
        converted,
        conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const projectMap = groupAndCount("project_name");
    const projectInterestData = Object.entries(projectMap)
      .filter(([name]) => name && name !== "null")
      .map(([name, { total, converted }]) => ({
        name,
        total,
        converted,
        conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const SALES_ROLE_ID = 3;
    const agentMap = {};
    leads.forEach((lead) => {
      if (lead.roles_permissions_id !== SALES_ROLE_ID) return;
      const name = lead.agent_name || "Unassigned";
      if (!agentMap[name]) agentMap[name] = { total: 0, converted: 0 };
      agentMap[name].total++;
      if ((lead.status || "").toLowerCase() === "converted")
        agentMap[name].converted++;
    });

    const agentPerformanceData = Object.entries(agentMap)
      .map(([name, { total, converted }]) => ({
        name,
        total,
        converted,
        conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const statusCount = {};
    leads.forEach((lead) => {
      let status = (lead.status || "new").toLowerCase().trim();
      const normalized =
        {
          "proposal sent": "Proposal Sent",
          proposal_sent: "Proposal Sent",
          contacted: "Contacted",
          qualified: "Qualified",
          working: "Working",
          lost: "Lost",
          converted: "Converted",
          new: "New",
          "site visit": "Site Visit",
        }[status] || status.charAt(0).toUpperCase() + status.slice(1);
      statusCount[normalized] = (statusCount[normalized] || 0) + 1;
    });

    const leadStatusData = Object.entries(statusCount)
      .map(([name, value]) => ({
        name,
        value,
        color:
          {
            New: "#8B5CF6",
            Contacted: "#06B6D4",
            Qualified: "#3B82F6",
            Working: "#6366F1",
            "Proposal Sent": "#F59E0B",
            "Site Visit": "#F97316",
            Converted: "#10B981",
            Lost: "#EF4444",
          }[name] || "#94A3B8",
      }))
      .sort((a, b) => {
        const order = [
          "New",
          "Contacted",
          "Qualified",
          "Working",
          "Proposal Sent",
          "Site Visit",
          "Converted",
          "Lost",
        ];
        return order.indexOf(a.name) - order.indexOf(b.name);
      });

    const cityMap = {};
    leads.forEach((lead) => {
      let city = "Unknown";
      if (lead.address) {
        const parts = lead.address.split(",").map((p) => p.trim());
        city = parts[parts.length - 2] || parts[parts.length - 1] || "Unknown";
      }
      if (!cityMap[city]) cityMap[city] = { total: 0, converted: 0 };
      cityMap[city].total++;
      if ((lead.status || "").toLowerCase() === "converted")
        cityMap[city].converted++;
    });

    const cityWiseData = Object.entries(cityMap)
      .map(([name, { total, converted }]) => ({
        name,
        total,
        converted,
        conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const convertedLeads = leads.filter(
      (l) => (l.status || "").toLowerCase() === "converted"
    ).length;
    const conversionRate =
      totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    res.json({
      totalLeads,
      conversionRate,
      activeAgents: agentPerformanceData.length,
      leadSourceData,
      projectInterestData,
      agentPerformanceData,
      leadStatusData,
      cityWiseData,
    });
  } catch (error) {
    console.error("Reports Error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const getCustomReport = async (req, res) => {
  const { startDate, endDate } = req.query;
  const endpoint = req.params.endpoint;

  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ error: "startDate and endDate are required" });
  }

  try {
    const { rows: leads } = await pool.query(
      `SELECT l.*, p.name AS project_name, u.name AS agent_name, u.roles_permissions_id
       FROM leads l
       LEFT JOIN projects p ON l.interested_project_id = p.id
       LEFT JOIN users u ON l.assigned_to = u.id
       WHERE l.is_active = TRUE
         AND DATE(l.created_at) BETWEEN $1 AND $2`,
      [startDate, endDate]
    );

    const groupCount = (key) => {
      const map = {};
      leads.forEach((l) => {
        const val = l[key] || "Unknown";
        if (!map[val]) map[val] = { total: 0, converted: 0 };
        map[val].total++;
        if ((l.status || "").toLowerCase() === "converted")
          map[val].converted++;
      });
      return Object.entries(map).map(([name, d]) => ({
        id: name,
        name: name.trim() || "Unknown",
        count: d.total,
        converted: d.converted,
        conversionRate:
          d.total > 0 ? Math.round((d.converted / d.total) * 100) : 0,
      }));
    };

    const cityExtract = () => {
      const map = {};
      leads.forEach((l) => {
        let city = "Unknown";
        if (l.address) {
          const parts = l.address.split(",").map((p) => p.trim());
          city =
            parts[parts.length - 2] || parts[parts.length - 1] || "Unknown";
        }
        if (!map[city]) map[city] = { total: 0, converted: 0 };
        map[city].total++;
        if ((l.status || "").toLowerCase() === "converted")
          map[city].converted++;
      });
      return Object.entries(map).map(([name, d]) => ({
        id: name,
        name,
        count: d.total,
        converted: d.converted,
        conversionRate:
          d.total > 0 ? Math.round((d.converted / d.total) * 100) : 0,
      }));
    };

    const statusMap = () => {
      const map = {};
      leads.forEach((l) => {
        let s = (l.status || "new").toLowerCase().trim();
        const norm =
          {
            "proposal sent": "Proposal Sent",
            proposal_sent: "Proposal Sent",
            "site visit": "Site Visit",
          }[s] || s.charAt(0).toUpperCase() + s.slice(1);
        map[norm] = (map[norm] || 0) + 1;
      });
      return Object.entries(map).map(([name, count]) => ({
        id: name,
        name,
        count,
        converted: name === "Converted" ? count : 0,
        conversionRate: name === "Converted" ? 100 : 0,
      }));
    };

    let tableData = [];
    if (endpoint === "by-source") tableData = groupCount("lead_type");
    else if (endpoint === "by-project")
      tableData = groupCount("project_name").slice(0, 10);
    else if (endpoint === "by-agent")
      tableData = groupCount("agent_name").filter((r) => r.name !== "Unknown");
    else if (endpoint === "by-city") tableData = cityExtract();
    else if (endpoint === "by-status") tableData = statusMap();

    const chartData = tableData.map((r) => ({ name: r.name, value: r.count }));

    res.json({ chartData, tableData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
