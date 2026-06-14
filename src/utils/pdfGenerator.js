import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DEFECT_SECTIONS } from './aqlCalculator';

export async function generateAQLReportPDF(inspection, userName) {
  const {
    product_name,
    batch_no,
    batch_size,
    total_production,
    sample_size,
    sku,
    mfd_date,
    exp_date,
    status,
    overall_decision,
    critical_defects = [],
    major_defects = [],
    minor_defects = [],
    defect_pct_critical = 0,
    defect_pct_major = 0,
    defect_pct_minor = 0,
    submitted_at,
    created_at,
    override_reason
  } = inspection;

  const dateStr = submitted_at 
    ? new Date(submitted_at).toLocaleDateString('en-GB') 
    : new Date(created_at).toLocaleDateString('en-GB');

  const formattedMfd = mfd_date ? new Date(mfd_date).toLocaleDateString('en-GB', { month: '2-digit', year: 'numeric' }) : 'N/A';
  const formattedExp = exp_date ? new Date(exp_date).toLocaleDateString('en-GB', { month: '2-digit', year: 'numeric' }) : 'N/A';

  // Format defect entries for lookup in standard table
  const renderDefectRows = (sectionKey, masterList, userList) => {
    return masterList.map((mDef, index) => {
      const uDef = userList.find(d => d.id === mDef.id) || { count: 0, observation: '' };
      return `
        <tr style="border-bottom: 1px solid #000;">
          <td style="border-right: 1px solid #000; padding: 6px; font-size: 9px; text-align: center;">${index + 1}</td>
          <td style="border-right: 1px solid #000; padding: 6px; font-size: 9px;"><strong>${mDef.label}</strong><br/><span style="color: #444;">${mDef.description}</span></td>
          <td style="border-right: 1px solid #000; padding: 6px; font-size: 10px; font-weight: bold; text-align: center;">${uDef.count > 0 ? uDef.count : '-'}</td>
          <td style="padding: 6px; font-size: 9px;">${uDef.observation || '-'}</td>
        </tr>
      `;
    }).join('');
  };

  const decisionBadgeStyle = {
    ACCEPT: 'background-color: #d1fae5; color: #065f46; border: 1px solid #047857;',
    HOLD: 'background-color: #fef3c7; color: #92400e; border: 1px solid #b45309;',
    REJECT: 'background-color: #fee2e2; color: #991b1b; border: 1px solid #b91c1c;'
  }[overall_decision.toUpperCase()] || 'background-color: #f3f4f6; color: #1f2937; border: 1px solid #4b5563;';

  // Create temporary container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '790px'; // standard A4 width at 96 DPI
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#000000';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.padding = '30px';
  container.style.boxSizing = 'border-box';

  // Construct HTML matching paper SOP ESME-QA-SOP-22-F-02
  container.innerHTML = `
    <!-- HEADER BOX -->
    <div style="border: 2px solid #000; display: flex; align-items: stretch; margin-bottom: 15px;">
      <div style="border-right: 2px solid #000; width: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px; text-align: center;">
        <span style="font-size: 14px; font-weight: bold; letter-spacing: 1px; color: #1e3a8a;">ESME CONSUMER</span>
        <span style="font-size: 9px; font-weight: bold; color: #666; margin-top: 2px;">PVT. LTD. BADDI</span>
      </div>
      <div style="border-right: 2px solid #000; flex: 1; display: flex; align-items: center; justify-content: center; padding: 10px; text-align: center;">
        <h2 style="margin: 0; font-size: 14px; font-weight: bold; text-transform: uppercase;">Finished Goods Inspection Report (AQL)</h2>
      </div>
      <div style="width: 200px; font-size: 8px; padding: 6px; display: flex; flex-direction: column; justify-content: space-between; line-height: 1.4;">
        <div><strong>Format No:</strong> ESME-QA-SOP-22-F-02</div>
        <div><strong>SOP No:</strong> ESME-QA-SOP-22</div>
        <div><strong>Rev No:</strong> 00</div>
        <div><strong>Effective Date:</strong> 01/04/2026</div>
      </div>
    </div>

    <!-- BATCH DETAILS TABLE -->
    <h3 style="font-size: 10px; margin: 10px 0 5px 0; text-transform: uppercase; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 2px;">1. Batch Details</h3>
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 15px;">
      <tr style="border-bottom: 1px solid #000; background-color: #f3f4f6;">
        <th style="border-right: 1px solid #000; padding: 6px; font-size: 9px; text-align: left; width: 25%;">Product Name</th>
        <td style="border-right: 1px solid #000; padding: 6px; font-size: 9px; width: 25%; font-weight: bold;">${product_name}</td>
        <th style="border-right: 1px solid #000; padding: 6px; font-size: 9px; text-align: left; width: 25%;">SKU Code</th>
        <td style="padding: 6px; font-size: 9px; width: 25%;">${sku || 'N/A'}</td>
      </tr>
      <tr style="border-bottom: 1px solid #000;">
        <th style="border-right: 1px solid #000; padding: 6px; font-size: 9px; text-align: left;">Batch Number</th>
        <td style="border-right: 1px solid #000; padding: 6px; font-size: 9px; font-weight: bold; font-family: monospace;">${batch_no}</td>
        <th style="border-right: 1px solid #000; padding: 6px; font-size: 9px; text-align: left;">Batch Size (Shippers/Pcs)</th>
        <td style="padding: 6px; font-size: 9px; font-weight: bold;">${Number(batch_size).toLocaleString()}</td>
      </tr>
      <tr style="border-bottom: 1px solid #000; background-color: #f3f4f6;">
        <th style="border-right: 1px solid #000; padding: 6px; font-size: 9px; text-align: left;">Total Production</th>
        <td style="border-right: 1px solid #000; padding: 6px; font-size: 9px;">${Number(total_production).toLocaleString()}</td>
        <th style="border-right: 1px solid #000; padding: 6px; font-size: 9px; text-align: left;">Sample Size (ISO 2859-1 II)</th>
        <td style="padding: 6px; font-size: 9px; font-weight: bold;">
          ${sample_size} ${override_reason ? `<span style="font-size: 7px; color: #b45309; font-weight: normal;">(Overridden)</span>` : ''}
        </td>
      </tr>
      <tr>
        <th style="border-right: 1px solid #000; padding: 6px; font-size: 9px; text-align: left;">Manufacturing Date</th>
        <td style="border-right: 1px solid #000; padding: 6px; font-size: 9px;">${formattedMfd}</td>
        <th style="border-right: 1px solid #000; padding: 6px; font-size: 9px; text-align: left;">Expiry Date</th>
        <td style="padding: 6px; font-size: 9px;">${formattedExp}</td>
      </tr>
    </table>

    ${override_reason ? `
      <div style="border: 1px dashed #b45309; background-color: #fffbeb; padding: 6px; font-size: 8px; margin-bottom: 15px; border-radius: 4px; line-height: 1.3;">
        <strong style="color: #b45309;">Sample Size Override Justification:</strong> ${override_reason}
      </div>
    ` : ''}

    <!-- DEFECTS INSPECTION DETAIL TABLES -->
    <h3 style="font-size: 10px; margin: 15px 0 5px 0; text-transform: uppercase; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 2px;">2. Inspection Details</h3>
    
    <!-- SECTION A: CRITICAL -->
    <div style="margin-top: 10px; margin-bottom: 10px;">
      <h4 style="font-size: 9px; font-weight: bold; background-color: #fee2e2; color: #991b1b; padding: 4px; margin: 0; border: 1px solid #000; border-bottom: none; text-transform: uppercase;">
        Section A: Critical Defects (AQL = 0%)
      </h4>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
        <tr style="border-bottom: 1px solid #000; background-color: #f9fafb; font-weight: bold;">
          <th style="border-right: 1px solid #000; padding: 4px; font-size: 8px; text-align: center; width: 5%;">S.No</th>
          <th style="border-right: 1px solid #000; padding: 4px; font-size: 8px; text-align: left; width: 45%;">Defect Parameters</th>
          <th style="border-right: 1px solid #000; padding: 4px; font-size: 8px; text-align: center; width: 15%;">Defects Found</th>
          <th style="padding: 4px; font-size: 8px; text-align: left; width: 35%;">Observations / Remarks</th>
        </tr>
        ${renderDefectRows('critical', DEFECT_SECTIONS.critical, critical_defects)}
      </table>
    </div>

    <!-- SECTION B: MAJOR -->
    <div style="margin-top: 15px; margin-bottom: 10px;">
      <h4 style="font-size: 9px; font-weight: bold; background-color: #fef3c7; color: #92400e; padding: 4px; margin: 0; border: 1px solid #000; border-bottom: none; text-transform: uppercase;">
        Section B: Major Defects (AQL = 1.0%)
      </h4>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
        <tr style="border-bottom: 1px solid #000; background-color: #f9fafb; font-weight: bold;">
          <th style="border-right: 1px solid #000; padding: 4px; font-size: 8px; text-align: center; width: 5%;">S.No</th>
          <th style="border-right: 1px solid #000; padding: 4px; font-size: 8px; text-align: left; width: 45%;">Defect Parameters</th>
          <th style="border-right: 1px solid #000; padding: 4px; font-size: 8px; text-align: center; width: 15%;">Defects Found</th>
          <th style="padding: 4px; font-size: 8px; text-align: left; width: 35%;">Observations / Remarks</th>
        </tr>
        ${renderDefectRows('major', DEFECT_SECTIONS.major, major_defects)}
      </table>
    </div>

    <!-- SECTION C: MINOR -->
    <div style="margin-top: 15px; margin-bottom: 15px;">
      <h4 style="font-size: 9px; font-weight: bold; background-color: #dbeafe; color: #1e40af; padding: 4px; margin: 0; border: 1px solid #000; border-bottom: none; text-transform: uppercase;">
        Section C: Minor Defects (AQL = 4.0%)
      </h4>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
        <tr style="border-bottom: 1px solid #000; background-color: #f9fafb; font-weight: bold;">
          <th style="border-right: 1px solid #000; padding: 4px; font-size: 8px; text-align: center; width: 5%;">S.No</th>
          <th style="border-right: 1px solid #000; padding: 4px; font-size: 8px; text-align: left; width: 45%;">Defect Parameters</th>
          <th style="border-right: 1px solid #000; padding: 4px; font-size: 8px; text-align: center; width: 15%;">Defects Found</th>
          <th style="padding: 4px; font-size: 8px; text-align: left; width: 35%;">Observations / Remarks</th>
        </tr>
        ${renderDefectRows('minor', DEFECT_SECTIONS.minor, minor_defects)}
      </table>
    </div>

    <!-- FINAL DECISION SUMMARY -->
    <h3 style="font-size: 10px; margin: 15px 0 5px 0; text-transform: uppercase; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 2px;">3. Decision & Calculations</h3>
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 25px;">
      <tr style="border-bottom: 1px solid #000; background-color: #f9fafb;">
        <th style="border-right: 1px solid #000; padding: 6px; font-size: 9px; text-align: left; width: 25%;">Defect Category</th>
        <th style="border-right: 1px solid #000; padding: 6px; font-size: 9px; text-align: center; width: 25%;">Total Found</th>
        <th style="border-right: 1px solid #000; padding: 6px; font-size: 9px; text-align: center; width: 25%;">Calculated Defect %</th>
        <th style="padding: 6px; font-size: 9px; text-align: center; width: 25%;">AQL Limit</th>
      </tr>
      <tr style="border-bottom: 1px solid #000;">
        <td style="border-right: 1px solid #000; padding: 5px; font-size: 9px;">Critical Defects</td>
        <td style="border-right: 1px solid #000; padding: 5px; font-size: 9px; text-align: center;">${critical_defects.reduce((sum, d) => sum + (Number(d.count) || 0), 0)}</td>
        <td style="border-right: 1px solid #000; padding: 5px; font-size: 9px; text-align: center; font-weight: bold;">-</td>
        <td style="padding: 5px; font-size: 9px; text-align: center;">0 Defects allowed</td>
      </tr>
      <tr style="border-bottom: 1px solid #000;">
        <td style="border-right: 1px solid #000; padding: 5px; font-size: 9px;">Major Defects</td>
        <td style="border-right: 1px solid #000; padding: 5px; font-size: 9px; text-align: center;">${major_defects.reduce((sum, d) => sum + (Number(d.count) || 0), 0)}</td>
        <td style="border-right: 1px solid #000; padding: 5px; font-size: 9px; text-align: center; font-weight: bold; color: ${defect_pct_major > 1 ? '#b45309' : '#000'};">${defect_pct_major.toFixed(2)}%</td>
        <td style="padding: 5px; font-size: 9px; text-align: center;">Max 1.00%</td>
      </tr>
      <tr style="border-bottom: 2px solid #000;">
        <td style="border-right: 1px solid #000; padding: 5px; font-size: 9px;">Minor Defects</td>
        <td style="border-right: 1px solid #000; padding: 5px; font-size: 9px; text-align: center;">${minor_defects.reduce((sum, d) => sum + (Number(d.count) || 0), 0)}</td>
        <td style="border-right: 1px solid #000; padding: 5px; font-size: 9px; text-align: center; font-weight: bold; color: ${defect_pct_minor > 4 ? '#b45309' : '#000'};">${defect_pct_minor.toFixed(2)}%</td>
        <td style="padding: 5px; font-size: 9px; text-align: center;">Max 4.00%</td>
      </tr>
      <tr style="background-color: #f9fafb;">
        <td colspan="2" style="border-right: 1px solid #000; padding: 8px; font-size: 10px; font-weight: bold; text-align: right; text-transform: uppercase;">
          Evaluation Decision:
        </td>
        <td colspan="2" style="padding: 8px; font-size: 11px; font-weight: bold; text-align: center; ${decisionBadgeStyle}">
          ${overall_decision.toUpperCase()}
        </td>
      </tr>
    </table>

    <!-- SIGN-OFF BLOCK -->
    <div style="margin-top: 40px; display: flex; justify-content: space-between;">
      <div style="width: 250px; text-align: center;">
        <div style="border-bottom: 1px solid #000; font-size: 9px; font-weight: bold; padding-bottom: 30px; font-family: monospace;">
          ${userName}
        </div>
        <div style="font-size: 8px; margin-top: 5px; text-transform: uppercase; color: #444;">
          <strong>Done By (QA Executive)</strong>
          <br/>Date/Time: ${dateStr}
        </div>
      </div>
      <div style="width: 250px; text-align: center;">
        <div style="border-bottom: 1px solid #000; font-size: 9px; padding-bottom: 30px; min-height: 14px;">
          &nbsp;
        </div>
        <div style="font-size: 8px; margin-top: 5px; text-transform: uppercase; color: #444;">
          <strong>Approved By (QA Manager)</strong>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2, // 2x scale for sharp results
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 size page width in mm
    const pageHeight = 297; // A4 size page height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const cleanBatchNo = batch_no.replace(/[^a-zA-Z0-9-_]/g, '_');
    const cleanDate = dateStr.replace(/\//g, '-');
    pdf.save(`AQL_${cleanBatchNo}_${cleanDate}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    document.body.removeChild(container);
  }
}
