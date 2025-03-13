'use client';

import { useParams } from 'next/navigation';
import ViewSOPPage from '../../../../components/ViewSOPPage';

export default function Page() {
  const params = useParams();
  const id = params.id as string;
  
  return <ViewSOPPage params={{ id }} />;
}
