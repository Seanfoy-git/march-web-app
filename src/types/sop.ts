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
  
  export type SymbolType = 'quality' | 'correctness' | 'tip' | 'hazard';
  
  export interface Step {
    title: string;           // Major step (What)
    description: string;     // Key points (How)
    symbolType?: SymbolType; // Symbol type
    reasonWhy?: string;      // Reasons for key points (Why)
    imageUrl: string;        // Picture URL
    imageName: string;       // For reference
  }
  
  export interface SOP {
    id: string;
    metadata: SOPMetadata;
    steps: Step[];
    createdAt: string;
  }