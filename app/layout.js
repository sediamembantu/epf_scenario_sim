import './globals.css';

export const metadata = {
  title: 'EPF Policy Lever Scorecard',
  description: 'Interactive simulation of EPF retirement savings trajectories under Malaysia\'s RIA Framework (2026)',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
