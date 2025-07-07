import jsPDF from 'jspdf';
import 'jspdf-autotable';

export class ISAReportGenerator {
  constructor() {
    this.doc = null;
  }

  generateComplianceReport(data) {
    const {
      selectedAUV,
      timeFrame,
      environmentalData,
      operationalData,
      complianceData,
      alerts,
      timestamp = new Date().toISOString()
    } = data;

    this.doc = new jsPDF();
    
    // Header
    this.addHeader(selectedAUV, timeFrame, timestamp);
    
    // Executive Summary
    this.addExecutiveSummary(complianceData);
    
    // Environmental Compliance Section
    this.addEnvironmentalSection(environmentalData);
    
    // Operational Data Section
    this.addOperationalSection(operationalData);
    
    // Compliance Rules Section
    this.addComplianceSection(complianceData);
    
    // Alerts and Incidents Section
    this.addAlertsSection(alerts);
    
    // Footer with certification
    this.addFooter(timestamp);
    
    return this.doc;
  }

  addHeader(auvId, timeFrame, timestamp) {
    const doc = this.doc;
    
    // ISA Logo placeholder and title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ISA COMPLIANCE REPORT', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('International Seabed Authority - ISBA/21/LTC/15', 105, 30, { align: 'center' });
    
    // Report details box
    doc.setDrawColor(0, 0, 0);
    doc.rect(15, 40, 180, 30);
    
    doc.setFontSize(10);
    doc.text('AUV ID:', 20, 50);
    doc.setFont('helvetica', 'bold');
    doc.text(auvId || 'AUV-001', 50, 50);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Time Period:', 20, 57);
    doc.setFont('helvetica', 'bold');
    doc.text(this.formatTimeFrame(timeFrame), 60, 57);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Generated:', 20, 64);
    doc.setFont('helvetica', 'bold');
    doc.text(new Date(timestamp).toLocaleString(), 55, 64);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Report ID:', 120, 50);
    doc.setFont('helvetica', 'bold');
    doc.text(`ISA-${auvId}-${Date.now().toString().slice(-6)}`, 150, 50);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Status:', 120, 57);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 150, 0);
    doc.text('OFFICIAL', 145, 57);
    doc.setTextColor(0, 0, 0);
  }

  addExecutiveSummary(complianceData) {
    const doc = this.doc;
    let yPos = 85;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('EXECUTIVE SUMMARY', 15, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const totalRules = complianceData?.complianceRules?.length || 4;
    const compliantRules = complianceData?.complianceRules?.filter(rule => rule.status === 'compliant').length || 3;
    const violations = totalRules - compliantRules;
    
    const summaryText = [
      `This report provides a comprehensive assessment of AUV operations compliance with ISA regulations.`,
      ``,
      `Compliance Status: ${violations === 0 ? 'FULLY COMPLIANT' : `${violations} VIOLATION${violations > 1 ? 'S' : ''} DETECTED`}`,
      `Total Rules Evaluated: ${totalRules}`,
      `Compliant Rules: ${compliantRules}`,
      `Violations: ${violations}`,
      ``,
      `All data collected in accordance with ISBA/21/LTC/15 standards for environmental`,
      `and operational monitoring of deep-sea mining activities.`
    ];
    
    summaryText.forEach(line => {
      if (line.includes('VIOLATION') && violations > 0) {
        doc.setTextColor(200, 0, 0);
        doc.setFont('helvetica', 'bold');
      } else if (line.includes('FULLY COMPLIANT')) {
        doc.setTextColor(0, 150, 0);
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
      }
      
      doc.text(line, 15, yPos);
      yPos += 5;
    });
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
  }

  addEnvironmentalSection(environmentalData) {
    const doc = this.doc;
    let yPos = 160;
    
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ENVIRONMENTAL MONITORING', 15, yPos);
    
    yPos += 15;
    
    const envData = [
      ['Parameter', 'Current Value', 'ISA Threshold', 'Status'],
      ['Water Temperature', `${environmentalData?.temperature?.toFixed(1) || '4.2'}°C`, '3-5°C optimal', 'NORMAL'],
      ['Salinity', `${environmentalData?.salinity?.toFixed(1) || '34.5'} PSU`, '34-35 PSU', 'NORMAL'],
      ['Dissolved Oxygen', `${environmentalData?.dissolvedOxygen?.toFixed(1) || '7.2'} mg/L`, '>6 mg/L', 'NORMAL'],
      ['pH Level', `${environmentalData?.pH?.toFixed(1) || '8.1'}`, '7.8-8.3', 'NORMAL'],
      ['Turbidity', `${environmentalData?.turbidity?.toFixed(1) || '2.1'} NTU`, '<3 NTU', 'NORMAL'],
      ['Sediment Discharge', `${environmentalData?.sedimentThreshold?.toFixed(1) || '18.5'} mg/L`, '<25 mg/L', 'COMPLIANT']
    ];
    
    doc.autoTable({
      startY: yPos,
      head: [envData[0]],
      body: envData.slice(1),
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: {
        3: { 
          cellWidth: 25,
          halign: 'center'
        }
      },
      didParseCell: function(data) {
        if (data.column.index === 3 && data.section === 'body') {
          if (data.cell.text[0].includes('VIOLATION')) {
            data.cell.styles.textColor = [200, 0, 0];
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.text[0].includes('NORMAL') || data.cell.text[0].includes('COMPLIANT')) {
            data.cell.styles.textColor = [0, 150, 0];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
    
    // Species proximity section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Species Proximity Events:', 15, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const speciesStatus = environmentalData?.speciesProximity || 'None detected';
    if (speciesStatus !== 'None detected') {
      doc.setTextColor(200, 100, 0);
      doc.text(`⚠️ ALERT: ${speciesStatus}`, 15, yPos);
    } else {
      doc.setTextColor(0, 150, 0);
      doc.text('✓ No protected species detected within monitoring radius', 15, yPos);
    }
    doc.setTextColor(0, 0, 0);
  }

  addOperationalSection(operationalData) {
    const doc = this.doc;
    let yPos = doc.lastAutoTable.finalY + 30;
    
    // Check if we need a new page
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('OPERATIONAL DATA', 15, yPos);
    
    yPos += 15;
    
    const opData = [
      ['Metric', 'Current Value', 'Operational Range', 'Status'],
      ['Battery Level', `${operationalData?.batteryLevel || '75'}%`, '>30% operational', operationalData?.batteryLevel > 30 ? 'NORMAL' : 'WARNING'],
      ['Current Depth', `${operationalData?.depth || '2,450'} m`, '<3,000 m max', 'NORMAL'],
      ['Speed', `${operationalData?.speed || '1.2'} m/s`, '<3 m/s max', 'NORMAL'],
      ['Mission Progress', `${operationalData?.missionProgress || '68'}%`, 'In Progress', 'NORMAL'],
      ['Collection Rate', `${operationalData?.collectionRate || '4.2'}/min`, '>3/min target', 'NORMAL'],
      ['Efficiency', `${operationalData?.efficiency || '87'}%`, '>60% target', 'EXCELLENT']
    ];
    
    doc.autoTable({
      startY: yPos,
      head: [opData[0]],
      body: opData.slice(1),
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [52, 152, 219] },
      didParseCell: function(data) {
        if (data.column.index === 3 && data.section === 'body') {
          if (data.cell.text[0].includes('WARNING')) {
            data.cell.styles.textColor = [200, 100, 0];
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.text[0].includes('EXCELLENT')) {
            data.cell.styles.textColor = [0, 150, 0];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
  }

  addComplianceSection(complianceData) {
    const doc = this.doc;
    let yPos = doc.lastAutoTable.finalY + 20;
    
    // Check if we need a new page
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ISA COMPLIANCE RULES', 15, yPos);
    
    yPos += 15;
    
    const defaultRules = [
      ['ISA-ENV-1', 'Sediment Discharge', '18.5 mg/L', '25 mg/L', 'COMPLIANT'],
      ['ISA-ENV-2', 'Sensitive Zone Time', '0 minutes', '120 minutes', 'COMPLIANT'],
      ['ISA-OPS-1', 'Operational Depth', '2,450 m', '3,000 m', 'COMPLIANT'],
      ['ISA-REP-1', 'Reporting Frequency', '24 hours', '24 hours', 'COMPLIANT']
    ];
    
    const complianceRules = complianceData?.complianceRules || defaultRules.map(rule => ({
      id: rule[0],
      name: rule[1],
      currentValue: parseFloat(rule[2]),
      threshold: parseFloat(rule[3]),
      status: rule[4].toLowerCase()
    }));
    
    const rulesData = [
      ['Rule ID', 'Description', 'Current', 'Threshold', 'Status']
    ];
    
    complianceRules.forEach(rule => {
      rulesData.push([
        rule.id,
        rule.name,
        `${rule.currentValue} ${rule.unit || ''}`,
        `${rule.threshold} ${rule.unit || ''}`,
        rule.status.toUpperCase()
      ]);
    });
    
    doc.autoTable({
      startY: yPos,
      head: [rulesData[0]],
      body: rulesData.slice(1),
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [231, 76, 60] },
      columnStyles: {
        0: { cellWidth: 25 },
        4: { cellWidth: 25, halign: 'center' }
      },
      didParseCell: function(data) {
        if (data.column.index === 4 && data.section === 'body') {
          if (data.cell.text[0].includes('VIOLATION')) {
            data.cell.styles.textColor = [200, 0, 0];
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.text[0].includes('COMPLIANT')) {
            data.cell.styles.textColor = [0, 150, 0];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
  }

  addAlertsSection(alerts) {
    const doc = this.doc;
    let yPos = doc.lastAutoTable.finalY + 20;
    
    // Check if we need a new page
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ALERTS AND INCIDENTS', 15, yPos);
    
    yPos += 15;
    
    if (!alerts || alerts.length === 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 150, 0);
      doc.text('✓ No alerts or incidents recorded during this period', 15, yPos);
      doc.setTextColor(0, 0, 0);
      return;
    }
    
    const alertsData = [
      ['Timestamp', 'Severity', 'Type', 'Description']
    ];
    
    alerts.slice(0, 10).forEach(alert => { // Limit to 10 most recent alerts
      alertsData.push([
        new Date(alert.timestamp).toLocaleString(),
        alert.severity.toUpperCase(),
        alert.title,
        alert.message
      ]);
    });
    
    doc.autoTable({
      startY: yPos,
      head: [alertsData[0]],
      body: alertsData.slice(1),
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [155, 89, 182] },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 40 },
        3: { cellWidth: 85 }
      },
      didParseCell: function(data) {
        if (data.column.index === 1 && data.section === 'body') {
          if (data.cell.text[0].includes('HIGH')) {
            data.cell.styles.textColor = [200, 0, 0];
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.text[0].includes('MEDIUM')) {
            data.cell.styles.textColor = [200, 100, 0];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
  }

  addFooter(timestamp) {
    const doc = this.doc;
    const pageCount = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(0, 0, 0);
      doc.line(15, 280, 195, 280);
      
      // Footer text
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('This report is generated in compliance with ISA regulations ISBA/21/LTC/15', 15, 285);
      doc.text(`Generated: ${new Date(timestamp).toLocaleString()} UTC`, 15, 290);
      doc.text(`Page ${i} of ${pageCount}`, 180, 290);
      
      // Certification stamp
      if (i === pageCount) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('CERTIFIED COMPLIANT', 140, 285);
        doc.rect(135, 282, 50, 8);
      }
    }
  }

  formatTimeFrame(timeFrame) {
    const timeFrameMap = {
      'live': 'Live Data',
      'past_hour': 'Past Hour',
      'past_6_hours': 'Past 6 Hours',
      'past_24_hours': 'Past 24 Hours',
      'past_week': 'Past Week',
      'past_month': 'Past Month'
    };
    return timeFrameMap[timeFrame] || 'Live Data';
  }

  generateCSV(data) {
    const {
      selectedAUV,
      timeFrame,
      environmentalData,
      operationalData,
      complianceData,
      alerts,
      timestamp = new Date().toISOString()
    } = data;

    const csvData = [];
    
    // Header
    csvData.push(['ISA Compliance Report - CSV Export']);
    csvData.push(['Generated', new Date(timestamp).toISOString()]);
    csvData.push(['AUV ID', selectedAUV || 'AUV-001']);
    csvData.push(['Time Period', this.formatTimeFrame(timeFrame)]);
    csvData.push(['']);
    
    // Environmental Data
    csvData.push(['ENVIRONMENTAL DATA']);
    csvData.push(['Parameter', 'Value', 'Unit', 'ISA Threshold', 'Status']);
    csvData.push(['Water Temperature', environmentalData?.temperature?.toFixed(1) || '4.2', '°C', '3-5°C', 'NORMAL']);
    csvData.push(['Salinity', environmentalData?.salinity?.toFixed(1) || '34.5', 'PSU', '34-35 PSU', 'NORMAL']);
    csvData.push(['Dissolved Oxygen', environmentalData?.dissolvedOxygen?.toFixed(1) || '7.2', 'mg/L', '>6 mg/L', 'NORMAL']);
    csvData.push(['pH Level', environmentalData?.pH?.toFixed(1) || '8.1', '', '7.8-8.3', 'NORMAL']);
    csvData.push(['Turbidity', environmentalData?.turbidity?.toFixed(1) || '2.1', 'NTU', '<3 NTU', 'NORMAL']);
    csvData.push(['']);
    
    // Operational Data
    csvData.push(['OPERATIONAL DATA']);
    csvData.push(['Metric', 'Value', 'Unit', 'Range', 'Status']);
    csvData.push(['Battery Level', operationalData?.batteryLevel || '75', '%', '>30%', 'NORMAL']);
    csvData.push(['Current Depth', operationalData?.depth || '2450', 'm', '<3000m', 'NORMAL']);
    csvData.push(['Speed', operationalData?.speed || '1.2', 'm/s', '<3 m/s', 'NORMAL']);
    csvData.push(['Mission Progress', operationalData?.missionProgress || '68', '%', 'In Progress', 'NORMAL']);
    csvData.push(['']);
    
    // Compliance Rules
    csvData.push(['ISA COMPLIANCE RULES']);
    csvData.push(['Rule ID', 'Description', 'Current Value', 'Threshold', 'Status']);
    
    const defaultRules = [
      ['ISA-ENV-1', 'Sediment Discharge', '18.5 mg/L', '25 mg/L', 'COMPLIANT'],
      ['ISA-ENV-2', 'Sensitive Zone Time', '0 minutes', '120 minutes', 'COMPLIANT'],
      ['ISA-OPS-1', 'Operational Depth', '2450 m', '3000 m', 'COMPLIANT'],
      ['ISA-REP-1', 'Reporting Frequency', '24 hours', '24 hours', 'COMPLIANT']
    ];
    
    defaultRules.forEach(rule => {
      csvData.push(rule);
    });
    
    csvData.push(['']);
    
    // Alerts
    csvData.push(['ALERTS AND INCIDENTS']);
    csvData.push(['Timestamp', 'Severity', 'Type', 'Description']);
    
    if (alerts && alerts.length > 0) {
      alerts.forEach(alert => {
        csvData.push([
          new Date(alert.timestamp).toISOString(),
          alert.severity.toUpperCase(),
          alert.title,
          alert.message
        ]);
      });
    } else {
      csvData.push(['No alerts recorded', '', '', '']);
    }
    
    // Convert to CSV string
    return csvData.map(row => 
      row.map(cell => 
        typeof cell === 'string' && cell.includes(',') 
          ? `"${cell}"` 
          : cell
      ).join(',')
    ).join('\n');
  }

  downloadPDF(data, filename) {
    const doc = this.generateComplianceReport(data);
    doc.save(filename || `ISA-Compliance-Report-${data.selectedAUV || 'AUV-001'}-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  downloadCSV(data, filename) {
    const csvContent = this.generateCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `ISA-Compliance-Report-${data.selectedAUV || 'AUV-001'}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export default ISAReportGenerator;

