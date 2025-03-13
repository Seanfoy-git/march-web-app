// src/app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SOP } from '@/types/sop';

export default function Home() {
  const router = useRouter();
  const [sops, setSops] = useState<SOP[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch SOPs from Firestore
  const fetchSOPs = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'sops'));
      const sopList: SOP[] = [];
      
      querySnapshot.forEach((doc) => {
        sopList.push({
          id: doc.id,
          ...doc.data()
        } as SOP);
      });
      
      // Sort by creation date (newest first)
      sopList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setSops(sopList);
    } catch (error) {
      console.error('Error fetching SOPs:', error);
      alert('Failed to load SOPs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete an SOP
  const deleteSOP = async (id: string) => {
    if (confirm('Are you sure you want to delete this SOP?')) {
      try {
        await deleteDoc(doc(db, 'sops', id));
        setSops(sops.filter(sop => sop.id !== id));
        alert('SOP deleted successfully');
      } catch (error) {
        console.error('Error deleting SOP:', error);
        alert('Failed to delete SOP. Please try again.');
      }
    }
  };

  useEffect(() => {
    fetchSOPs();
  }, []);

  // Clone an existing SOP
  const cloneSOP = (sop: SOP) => {
    // Store SOP data in session storage
    sessionStorage.setItem('cloneSOP', JSON.stringify({
      metadata: {
        ...sop.metadata,
        title: `${sop.metadata.title} (Copy)`,
        createdDate: new Date().toISOString().split('T')[0],
        approvalDate: '',
        version: '1.0'
      },
      steps: sop.steps
    }));
    
    router.push('/sop/new');
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Standard Operating Procedures</h1>
            <button
              onClick={() => router.push('/sop/new')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Create New SOP
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-10">
            <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-gray-600">Loading SOPs...</p>
          </div>
        ) : sops.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-xl font-medium text-gray-900 mb-4">No SOPs Found</h2>
            <p className="text-gray-600 mb-6">Get started by creating your first SOP</p>
            <button
              onClick={() => router.push('/sop/new')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Create New SOP
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sops.map((sop) => (
              <div key={sop.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 truncate">
                    {sop.metadata.title}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Version {sop.metadata.version} • {new Date(sop.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="px-6 py-3">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Department:</span>
                      <span className="text-sm text-gray-600">{sop.metadata.department}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Author:</span>
                      <span className="text-sm text-gray-600">{sop.metadata.author}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Steps:</span>
                      <span className="text-sm text-gray-600">{sop.steps.length}</span>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-gray-50 flex justify-between">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/sop/view/${sop.id}`)}
                      className="px-3 py-1 text-sm bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100"
                    >
                      View
                    </button>
                    <button
                      onClick={() => router.push(`/sop/edit/${sop.id}`)}
                      className="px-3 py-1 text-sm bg-amber-50 text-amber-700 rounded hover:bg-amber-100"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => cloneSOP(sop)}
                      className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Clone
                    </button>
                    <button
                      onClick={() => deleteSOP(sop.id)}
                      className="px-3 py-1 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}