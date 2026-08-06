import StableProfilePage from './ClientPage';

export async function generateStaticParams() {
  return [];
}

export default function Page() {
  return <StableProfilePage />;
}
