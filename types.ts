
export interface Enrollment {
  id: string;
  name: string;
  photoBase64: string;
  enrolledAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentName: string;
  timestamp: string;
  status: 'Present' | 'Late';
  confidence?: number;
}

export interface RecognitionResult {
  identifiedName: string | 'Unknown';
  confidence: number;
  detectedCount: number;
}
