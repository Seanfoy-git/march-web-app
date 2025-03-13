'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SOP } from '@/types/sop';
import { createAndDownloadSopPdf } from '@/utils/pdfUtils';

export default function ViewSOPPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [sop, setSop] = useState<SOP | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Refresh data and export PDF
  const refreshAndExportPDF = async () => {
    try {
      // Show loading
      alert("Refreshing data before generating PDF...");
      
      // Explicitly fetch fresh data
      const docRef = doc(db, 'sops', params.id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const freshData = {
          id: docSnap.id,
          ...docSnap.data()
        } as SOP;
        
        // Update the local state
        setSop(freshData);
        
        // Generate PDF directly from the fresh data
        createAndDownloadSopPdf(freshData.metadata, freshData.steps);
      } else {
        alert("SOP not found!");
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
      alert("Failed to refresh data. Please try again.");
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
                onClick={refreshAndExportPDF}
                className="px-4 py-2 border border-indigo-300 rounded-md text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
              >
                Refresh & Export PDF
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
                  {step.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                      <p className="text-gray-800 whitespace-pre-line">{step.description}</p>
                    </div>
                  )}
                  
                  {step.imageUrl && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Reference Image</h4>
                      <img 
                        src={step.imageUrl} 
                        alt={`Step ${index + 1}`} 
                        className="w-full h-auto max-h-64 object-contain border border-gray-200 rounded-md p-1"
                      />
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