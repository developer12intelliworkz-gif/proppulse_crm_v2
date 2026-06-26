
export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const cell = row[header];
        // Handle cells that contain commas or quotes
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = async (data: any[], filename: string, sheetName: string = 'Sheet1') => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // For now, we'll use CSV format as a fallback since we don't have xlsx library
  // In a real implementation, you would use a library like 'xlsx' or 'exceljs'
  exportToCSV(data, filename);
};

export const generateLeadReport = (leads: any[]) => {
  return leads.map(lead => ({
    'Lead ID': lead.id,
    'Name': lead.name,
    'Email': lead.email,
    'Phone': lead.phone,
    'Status': lead.status,
    'Source': lead.source,
    'Score': lead.score,
    'Assigned Agent': lead.assignedAgent,
    'Created Date': new Date(lead.createdAt).toLocaleDateString(),
    'Last Contact': lead.lastContact || 'Never',
    'Budget': lead.budget || 'Not specified',
    'Requirements': lead.requirements || 'None'
  }));
};

export const generatePropertyReport = (properties: any[]) => {
  return properties.map(property => ({
    'Property ID': property.id,
    'Address': property.address,
    'City': property.city,
    'Type': property.type,
    'Price': property.price,
    'Bedrooms': property.beds,
    'Bathrooms': property.baths,
    'Square Feet': property.sqft,
    'Status': property.status,
    'Agent': property.agent,
    'Listed Date': new Date(property.listedDate).toLocaleDateString()
  }));
};

export const generateFollowUpReport = (followUps: any[]) => {
  return followUps.map(followUp => ({
    'Follow-up ID': followUp.id,
    'Title': followUp.title,
    'Contact': followUp.contact,
    'Property': followUp.property || 'N/A',
    'Type': followUp.type,
    'Priority': followUp.priority,
    'Status': followUp.status,
    'Due Date': followUp.dueDate,
    'Due Time': followUp.dueTime || 'N/A',
    'Assigned Agent': followUp.assignedAgent,
    'Created Date': new Date(followUp.createdAt).toLocaleDateString()
  }));
};
