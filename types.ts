
export interface BiometricProfile {
  id: string;
  fullName: string;
  department: string;
  accessLevel: 'Restricted' | 'Standard' | 'Administrator';
  facialDescription: string;
  earStructure: string;
  irisPattern: string;
  eyeSpacing: string;
  timestamp: number;
  photoBase64: string;
}

export interface AnalysisResult {
  face: string;
  iris: string;
  ears: string;
  eyes: string;
}

export enum AppMode {
  REGISTRATION = 'REGISTRATION',
  IDENTIFICATION = 'IDENTIFICATION',
  DATABASE = 'DATABASE',
  ANALYTICS = 'ANALYTICS'
}
