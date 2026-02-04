import * as XLSX from 'xlsx';

interface Patient {
  id: string;
  full_name: string;
  phone: string;
  age: number | null;
  consent_given: boolean | null;
  created_at: string | null;
}

export const exportPatientsToExcel = (patients: Patient[], filename: string = 'patient-list') => {
  // Transform data for Excel
  const excelData = patients.map((patient, index) => ({
    'S/N': index + 1,
    'Full Name': patient.full_name,
    'Phone Number': patient.phone,
    'Age': patient.age || 'N/A',
    'Consent Given': patient.consent_given ? 'Yes' : 'No',
    'Registration Date': patient.created_at 
      ? new Date(patient.created_at).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      : 'N/A',
  }));

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },   // S/N
    { wch: 25 },  // Full Name
    { wch: 15 },  // Phone Number
    { wch: 8 },   // Age
    { wch: 15 }, // Consent Given
    { wch: 18 },  // Registration Date
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Patients');

  // Generate filename with date
  const date = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}-${date}.xlsx`;

  // Download file
  XLSX.writeFile(workbook, fullFilename);
};
