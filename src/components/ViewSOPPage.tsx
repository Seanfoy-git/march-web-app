// src/components/ViewSOPPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SOP } from '@/types/sop';
// Import from JavaScript file
import { createAndDownloadSopPdf } from '@/utils/pdfUtils';

export default function ViewSOPPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [sop, setSop] = useState<SOP | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    const fetchSOP = async () => {
      try {
        const docRef = doc(db, 'sops', params.id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSop({
            id: docSnap.id,
            ...docSnap.data()
          } as SOP);
        } else {
          alert('SOP not found');
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching SOP:', error);
        alert('Failed to load SOP. Please try again.');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSOP();
  }, [params.id, router]);

  // Export PDF
  const handleExportPDF = async () => {
    if (!sop) return;
    
    try {
      setExportingPdf(true);
      
      // Generate PDF from current SOP data
      // Cast the function to avoid TypeScript errors
      await createAndDownloadSopPdf(sop.metadata, sop.steps);
      console.log("PDF generated successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-gray-600">Loading SOP...</p>
        </div>
      </div>
    );
  }

  if (!sop) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">{sop.metadata.title}</h1>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to List
              </button>
              <button
                onClick={handleExportPDF}
                disabled={exportingPdf}
                className={`px-4 py-2 border border-indigo-300 rounded-md text-sm font-medium ${
                  exportingPdf 
                    ? "bg-indigo-100 text-indigo-400 cursor-not-allowed" 
                    : "text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                }`}
              >
                {exportingPdf ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating PDF...
                  </span>
                ) : "Export PDF"}
              </button>
              <button
                onClick={() => router.push(`/sop/edit/${sop.id}`)}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Edit SOP
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* SOP Metadata Section */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">SOP Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Department</p>
              <p className="text-base font-medium">{sop.metadata.department}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Author</p>
              <p className="text-base font-medium">{sop.metadata.author}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Approver</p>
              <p className="text-base font-medium">{sop.metadata.approver}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Created Date</p>
              <p className="text-base font-medium">{sop.metadata.createdDate}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Approval Date</p>
              <p className="text-base font-medium">{sop.metadata.approvalDate || 'Pending'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Version</p>
              <p className="text-base font-medium">{sop.metadata.version}</p>
            </div>
          </div>
        </div>
        {/* Steps Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Steps ({sop.steps.length})</h2>
          
          <div className="space-y-6">
            {sop.steps.map((step, index) => (
              <div 
                key={index} 
                className="border border-gray-200 rounded-md p-6"
              >
                <h3 className="text-lg font-medium mb-4">
                  Step {index + 1}: {step.title}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    {step.description && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                        <p className="text-gray-800 whitespace-pre-line">{step.description}</p>
                      </div>
                    )}
                    
                    {step.reasonWhy && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Reason Why</h4>
                        <p className="text-gray-800 whitespace-pre-line">{step.reasonWhy}</p>
                      </div>
                    )}
                    
                    {step.symbolType && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Symbol Type</h4>
                        <div className="flex items-center">
                          <span className="text-gray-800 capitalize">{step.symbolType}</span>
                          {step.symbolType === 'hazard' && (
                            <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">⚠️ Hazard</span>
                          )}
                          {step.symbolType === 'tip' && (
                            <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">💡 Tip</span>
                          )}
                          {step.symbolType === 'quality' && (
                            <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">✓ Quality</span>
                          )}
                          {step.symbolType === 'correctness' && (
                            <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">✓ Correctness</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {step.imageUrl && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Reference Image</h4>
                      <div className="relative border border-gray-200 rounded-md p-1 min-h-[200px] flex items-center justify-center">
                        {/* Use our image proxy API to avoid CORS issues */}
                        <img 
                          src={`/api/image-proxy?url=${encodeURIComponent(step.imageUrl)}`}
                          alt={`Step ${index + 1}`}
                          className="max-w-full max-h-64 object-contain"
                          onError={(e) => {
                            console.error(`Error loading image for step ${index + 1}`);
                            // Using type assertion to access src property
                            (e.currentTarget as HTMLImageElement).src = '/placeholder-image.svg';
                            (e.currentTarget as HTMLImageElement).alt = 'Image not available';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}