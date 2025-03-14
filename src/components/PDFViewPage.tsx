'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { SOPMetadata, Step } from '@/types/sop';

interface Symbol {
  type: 'hazard' | 'quality' | 'tip' | 'correctness';
  color: string;
}

export default function PDFViewPage() {
  const searchParams = useSearchParams();
  const [metadata, setMetadata] = useState<SOPMetadata | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      if (!searchParams) return;
      
      const metadataParam = searchParams.get('metadata');
      const stepsParam = searchParams.get('steps');
      
      if (metadataParam && stepsParam) {
        setMetadata(JSON.parse(decodeURIComponent(metadataParam)));
        setSteps(JSON.parse(decodeURIComponent(stepsParam)));
      }
    } catch (error) {
      console.error('Error parsing parameters:', error);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    // Set title for the PDF
    if (metadata?.title) {
      document.title = `${metadata.title} - SOP`;
    }
  }, [metadata]);

  const getStepSymbol = (index: number): Symbol => {
    const step = steps[index];
    if (step && step.symbolType) {
      return { type: step.symbolType, color: 'black' };
    }
    
    // Fallback to default symbols if not defined
    if (index % 3 === 0) {
      return { type: 'quality', color: 'red' };
    } else if (index % 3 === 1) {
      return { type: 'correctness', color: 'black' };
    } else {
      return { type: 'tip', color: 'black' };
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!metadata) {
    return <div className="flex items-center justify-center min-h-screen">No SOP data provided.</div>;
  }

  return (
    <div className="bg-white p-4 mx-auto max-w-[1000px] print:p-0">
      {/* Print button - only shows on screen, not in print */}
      <div className="print:hidden flex justify-end mb-4">
        <button 
          onClick={() => window.print()} 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create PDF
        </button>
      </div>
      
      {/* Main document that will be printed */}
      <div className="border border-gray-300 p-4 print:border-0">
        {/* Header with main SOP title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">{metadata.title}</h1>
          <h2 className="text-xl mt-2">Work Instruction</h2>
        </div>
        
        {/* Metadata section */}
        <div className="grid grid-cols-3 gap-0 mb-6 border border-gray-300">
          <div className="col-span-3 grid grid-cols-3 border-b border-gray-300">
            <div className="border-r border-gray-300 p-2">
              <p className="text-sm font-semibold">Department</p>
              <p className="text-sm">{metadata.department || 'Department'}</p>
            </div>
            <div className="border-r border-gray-300 p-2">
              <p className="text-sm font-semibold">Area</p>
              <p className="text-sm">Production</p>
            </div>
            <div className="p-2">
              <p className="text-sm font-semibold">Version</p>
              <p className="text-sm">{metadata.version || '1.0'}</p>
            </div>
          </div>
          
          <div className="col-span-3 grid grid-cols-1 border-b border-gray-300">
            <div className="p-2">
              <p className="text-sm font-semibold">Operation</p>
              <p className="text-sm">{metadata.title}</p>
            </div>
          </div>
          
          {/* PROFILES (PARTS) section removed as requested */}
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-4 mb-4">
          <span className="text-sm font-semibold">Legend:</span>
          
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 flex items-center justify-center mr-1">
              <span className="text-white text-xs">+</span>
            </div>
            <span className="text-sm">Hazard</span>
          </div>
          
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-1"></div>
            <span className="text-sm">Quality</span>
          </div>
          
          <div className="flex items-center">
            <span className="mr-1">✓</span>
            <span className="text-sm">Tip</span>
          </div>
          
          <div className="flex items-center">
            <div className="w-4 h-4 bg-black rounded-full mr-1"></div>
            <span className="text-sm">Correctness</span>
          </div>
        </div>
        
        {/* Main table */}
        <table className="w-full border-collapse mb-4">
          <thead>
            <tr>
              <th className="border border-gray-300 p-2 w-10 text-sm text-left bg-gray-100">No.</th>
              <th className="border border-gray-300 p-2 w-40 text-sm text-left bg-gray-100">Major steps (What)</th>
              <th className="border border-gray-300 p-2 w-60 text-sm text-left bg-gray-100">Key points (How)</th>
              <th className="border border-gray-300 p-2 w-12 text-sm text-center bg-gray-100">Symbol</th>
              <th className="border border-gray-300 p-2 text-sm text-left bg-gray-100">Reasons for key points (Why)</th>
              <th className="border border-gray-300 p-2 w-40 text-sm text-center bg-gray-100">Pictures</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step, index) => {
              const symbol = getStepSymbol(index);
              return (
                <tr key={index}>
                  <td className="border border-gray-300 p-2 text-center align-top">{index + 1}</td>
                  <td className="border border-gray-300 p-2 align-top">
                    <p className="font-medium">{step.title}</p>
                  </td>
                  <td className="border border-gray-300 p-2 align-top">
                    <p>1. {step.description || `description for ${step.title}`}</p>
                  </td>
                  <td className="border border-gray-300 p-2 text-center align-top">
                    {symbol.type === 'tip' ? (
                      <span className="text-black text-lg">✓</span>
                    ) : symbol.type === 'hazard' ? (
                      <div className="w-4 h-4 bg-green-500 flex items-center justify-center mx-auto">
                        <span className="text-white text-xs">+</span>
                      </div>
                    ) : (
                      <div 
                        className={`w-4 h-4 rounded-full mx-auto ${
                          symbol.type === 'quality' ? 'bg-red-500' : 'bg-black'
                        }`}
                      ></div>
                    )}
                  </td>
                  <td className="border border-gray-300 p-2 align-top">
                    <p>{step.reasonWhy || 'Ensure quality'}</p>
                  </td>
                  <td className="border border-gray-300 p-2 text-center align-top">
                    <p className="font-bold">{index + 1}.1</p>
                    {step.imageUrl ? (
                      <div className="w-32 h-24 mx-auto relative">
                        <img 
                          src={step.imageUrl} 
                          alt={`Step ${index + 1}`}
                          className="max-h-full max-w-full object-contain absolute top-0 left-0 right-0 bottom-0 m-auto"
                          onError={(e) => {
                            // Handle image loading errors
                            console.log(`Failed to load image for step ${index + 1}`);
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <p className="text-xs">[See step image in app]</p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {/* Footer */}
        <div className="grid grid-cols-4 gap-0 border border-gray-300">
          <div className="border-r border-gray-300 p-2">
            <p className="text-sm font-semibold">Approval Date</p>
          </div>
          <div className="border-r border-gray-300 p-2">
            <p className="text-sm">{metadata.approvalDate || new Date().toISOString().split('T')[0]}</p>
          </div>
          <div className="col-span-2 p-2">
            <p className="text-sm">Prepared by: {metadata.author || 'Author'}</p>
          </div>
          
          <div className="border-t border-r border-gray-300 p-2">
            <p className="text-sm font-semibold">Tools</p>
          </div>
          <div className="border-t col-span-3 p-2">
            <p className="text-sm">Required equipment: Standard safety equipment</p>
          </div>
        </div>
      </div>
    </div>
  );
}