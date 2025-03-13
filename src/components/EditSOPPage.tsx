'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { storage, db } from '@/lib/firebase';
import type { SOPMetadata, Step, SOP } from '@/types/sop';
import { createAndDownloadSopPdf } from '@/utils/pdfUtils';

export default function EditSOPPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [metadata, setMetadata] = useState<SOPMetadata>({
    title: '',
    author: '',
    department: '',
    approver: '',
    createdDate: '',
    approvalDate: '',
    version: ''
  });

  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState<Step>({
    title: '',
    description: '',
    imageUrl: '',
    imageName: ''
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Fetch SOP data
  useEffect(() => {
    const fetchSOP = async () => {
      try {
        const docRef = doc(db, 'sops', params.id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const sopData = docSnap.data() as Omit<SOP, 'id'>;
          setMetadata(sopData.metadata);
          setSteps(sopData.steps);
        } else {
          alert('SOP not found');
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching SOP:', error);
        alert('Failed to load SOP. Please try again.');
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSOP();
  }, [params.id, router]);

  // Function to compress images before upload
  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          }, file.type, 0.75);
        };
        img.onerror = () => {
          reject(new Error('Image loading failed'));
        };
      };
      reader.onerror = () => {
        reject(new Error('FileReader failed'));
      };
    });
  };

  // Initialize camera
  const initializeCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setIsCameraReady(true);
        }
      } else {
        alert('Your device does not support camera access');
        setShowCamera(false);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Failed to access camera. Please check permissions.');
      setShowCamera(false);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setIsCameraReady(false);
  };

  // Capture photo from camera
  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current && isCameraReady) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (blob) {
          setIsUploading(true);
          try {
            // Compress the image
            const compressedBlob = await compressImage(new File([blob], 'camera_capture.jpg', { type: 'image/jpeg' }));
            
            // Upload to Firebase Storage
            const filename = `sop_images/${Date.now()}_camera.jpg`;
            const storageRef = ref(storage, filename);
            
            await uploadBytes(storageRef, compressedBlob);
            const downloadUrl = await getDownloadURL(storageRef);
            
            setCurrentStep({
              ...currentStep,
              imageUrl: downloadUrl,
              imageName: filename
            });
            
            stopCamera();
          } catch (error) {
            console.error('Error uploading camera image:', error);
            alert('Failed to upload image. Please try again.');
          } finally {
            setIsUploading(false);
          }
        }
      }, 'image/jpeg', 0.8);
    }
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        // Compress the image
        const compressedBlob = await compressImage(file);
        
        // Upload to Firebase Storage
        const filename = `sop_images/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, filename);
        
        await uploadBytes(storageRef, compressedBlob);
        const downloadUrl = await getDownloadURL(storageRef);
        
        setCurrentStep({
          ...currentStep,
          imageUrl: downloadUrl,
          imageName: filename
        });
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Failed to upload image. Please try again.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Remove the current image
  const handleRemoveImage = () => {
    setCurrentStep({
      ...currentStep,
      imageUrl: '',
      imageName: ''
    });
  };

  // Add the current step to the steps array
  const addStep = () => {
    if (!currentStep.title) {
      alert('Please add a step title');
      return;
    }
    
    setSteps([...steps, { ...currentStep }]);
    setCurrentStep({
      title: '',
      description: '',
      imageUrl: '',
      imageName: ''
    });
  };

  // Edit an existing step
  const editStep = (index: number) => {
    setCurrentStep(steps[index]);
    
    // Remove the step from the array
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    setSteps(newSteps);
  };

  // Remove a step from the array
  const removeStep = (index: number) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    setSteps(newSteps);
  };

  // Move a step up or down
  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === steps.length - 1)
    ) {
      return;
    }
    
    const newSteps = [...steps];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
    setSteps(newSteps);
  };

  // Update the SOP in Firestore
  const updateSOP = async () => {
    if (!metadata.title) {
      alert('Please add a SOP title');
      return;
    }
    
    if (steps.length === 0) {
      alert('Please add at least one step');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const docRef = doc(db, 'sops', params.id);
      
      await updateDoc(docRef, {
        metadata,
        steps,
        updatedAt: new Date().toISOString()
      });
      
      alert('SOP updated successfully!');
      router.push('/');
    } catch (error) {
      console.error('Error updating SOP:', error);
      alert('Failed to update SOP. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate and download a PDF of the SOP
 
import { createAndDownloadSopPdf } from '@/utils/pdfUtils';


const exportToPDF = () => {
  if (!metadata.title) {
    alert('Please add a SOP title');
    return;
  }
  
  if (steps.length === 0) {
    alert('Please add at least one step');
    return;
  }
  
  createAndDownloadSopPdf(metadata, steps);
};

  // Initialize and cleanup camera
  useEffect(() => {
    if (showCamera) {
      initializeCamera();
    }
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [showCamera]);

  if (isLoading) {
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

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Edit SOP</h1>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={exportToPDF}
                className="px-4 py-2 border border-indigo-300 rounded-md text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
              >
                Export PDF
              </button>
              <button
                onClick={updateSOP}
                disabled={isSaving}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                  isSaving 
                    ? 'bg-indigo-400' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* SOP Metadata Section */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">SOP Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(metadata).map(([key, value]) => (
              <div key={key} className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <input 
                  type={key.includes('Date') ? 'date' : 'text'}
                  value={value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setMetadata({ ...metadata, [key]: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Step Creation Section */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">
            {currentStep.title ? 'Edit Step' : 'Add Step'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Step Title
                </label>
                <input
                  type="text"
                  value={currentStep.title}
                  onChange={(e) => setCurrentStep({ ...currentStep, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                  placeholder="Enter step title"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Step Description
                </label>
                <textarea
                  value={currentStep.description}
                  onChange={(e) => setCurrentStep({ ...currentStep, description: e.target.value })}
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                  placeholder="Enter step description"
                />
              </div>
            </div>
            
            <div>
              {showCamera ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Camera
                  </label>
                  <div className="border border-gray-300 rounded-md overflow-hidden relative">
                    <video 
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-64 object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 p-2 bg-gray-800 bg-opacity-50">
                      <button
                        onClick={capturePhoto}
                        disabled={!isCameraReady || isUploading}
                        className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                          !isCameraReady || isUploading
                            ? 'bg-gray-400'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {isUploading ? 'Processing...' : 'Capture'}
                      </button>
                      <button
                        onClick={stopCamera}
                        className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photo
                  </label>
                  {currentStep.imageUrl ? (
                    <div className="relative border border-gray-300 rounded-md overflow-hidden">
                      <img 
                        src={currentStep.imageUrl} 
                        alt="Step" 
                        className="w-full h-64 object-contain"
                      />
                      <button
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                        title="Remove image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      
                      {isUploading ? (
                        <p className="mt-2 text-gray-500">Processing image...</p>
                      ) : (
                        <div className="mt-4 flex flex-col items-center">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none mb-2"
                          >
                            Upload Photo
                          </button>
                          <button
                            onClick={() => setShowCamera(true)}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                          >
                            Take Photo
                          </button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={addStep}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              {currentStep.title ? 'Update Step' : 'Add Step'}
            </button>
          </div>
        </div>

        {/* Steps Preview Section */}
        {steps.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Steps ({steps.length})</h2>
            
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div 
                  key={index} 
                  className="border border-gray-200 rounded-md p-4 relative"
                >
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <button
                      onClick={() => moveStep(index, 'up')}
                      disabled={index === 0}
                      className={`p-1 rounded ${
                        index === 0 ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      title="Move up"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveStep(index, 'down')}
                      disabled={index === steps.length - 1}
                      className={`p-1 rounded ${
                        index === steps.length - 1 ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      title="Move down"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => editStep(index)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit step"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeStep(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Remove step"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  
                  <h3 className="text-lg font-medium mb-2">
                    Step {index + 1}: {step.title}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {step.description && (
                      <div>
                        <p className="text-gray-600 whitespace-pre-line">{step.description}</p>
                      </div>
                    )}
                    
                    {step.imageUrl && (
                      <div>
                        <img 
                          src={step.imageUrl} 
                          alt={`Step ${index + 1}`} 
                          className="w-full h-auto max-h-48 object-contain rounded-md"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}