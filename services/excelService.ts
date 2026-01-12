
import * as XLSX from 'xlsx';
import { AttendanceRecord } from '../types';

/**
 * Exports attendance records to an Excel (.xlsx) file
 */
export const exportToExcel = (records: AttendanceRecord[]) => {
  // Format data for Excel
  const formattedData = records.map(record => ({
    'ID': record.id,
    'Name': record.studentName,
    'Date': new Date(record.timestamp).toLocaleDateString(),
    'Time': new Date(record.timestamp).toLocaleTimeString(),
    'Status': record.status
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  
  // Set column widths
  const wscols = [
    { wch: 36 }, // ID
    { wch: 25 }, // Name
    { wch: 15 }, // Date
    { wch: 15 }, // Time
    { wch: 12 }  // Status
  ];
  worksheet['!cols'] = wscols;

  // Create workbook and append worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

  // Generate filename with current date
  const fileName = `Attendance_Report_${new Date().toISOString().split('T')[0]}.xlsx`;

  // Write and download
  XLSX.writeFile(workbook, fileName);
};
