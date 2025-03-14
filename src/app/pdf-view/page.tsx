'use client';

import React, { Suspense } from 'react';
import PDFViewPage from '@/components/PDFViewPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading PDF view...</div>}>
      <PDFViewPage />
    </Suspense>
  );
}