import dynamic from 'next/dynamic';

const Block = dynamic(() => import('@/components/Block'), { ssr: false });

export default function Home() {
  return <Block />;
}
