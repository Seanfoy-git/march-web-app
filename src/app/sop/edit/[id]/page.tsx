// src/app/sop/edit/[id]/page.tsx
import EditSOPPage from '../../../../components/EditSOPPage';

export default function Page({ params }: { params: { id: string } }) {
  return <EditSOPPage params={params} />;
}