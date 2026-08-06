export const dynamic = 'force-static';

import PublicFormPage from './ClientPage';

export async function generateStaticParams() {
  return [];
}

export default function Page() {
  return <PublicFormPage />;
}
