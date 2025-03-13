'use client';

import React, { Suspense } from 'react';
import PDFViewPage from '@/components/PDFViewPage';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PDFViewPage />
    </Suspense>
  );
}