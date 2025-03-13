// src/types/sop.ts
export interface SOPMetadata {
    title: string;
    author: string;
    department: string;
    approver: string;
    createdDate: string;
    approvalDate: string;
    version: string;
  }
  
  export interface Step {
    title: string;
    description: string;
    imageUrl: string;
    imageName: string;
  }
  
  export interface SOP {
    id: string;
    metadata: SOPMetadata;
    steps: Step[];
    createdAt: string;
  }