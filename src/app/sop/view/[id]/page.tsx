// src/app/sop/view/[id]/page.tsx
import ViewSOPPage from '../../../../components/ViewSOPPage';

export default function Page({ params }: { params: { id: string } }) {
  return <ViewSOPPage params={params} />;
}