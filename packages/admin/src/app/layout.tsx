import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Chatroom - Admin Panel',
  description: 'Admin panel for The Chatroom',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
