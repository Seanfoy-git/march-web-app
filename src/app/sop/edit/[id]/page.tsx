'use client';

import { useParams } from 'next/navigation';
import EditSOPPage from '../../../../components/EditSOPPage';

export default function Page() {
  const params = useParams();
  const id = params.id as string;
  
  return <EditSOPPage params={{ id }} />;
}
