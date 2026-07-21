import { Metadata } from 'next';
import { LegalIndex } from './LegalIndex';

export const metadata: Metadata = {
  title: 'Pages légales',
};

export default function LegalIndexPage() {
  return <LegalIndex />;
}
