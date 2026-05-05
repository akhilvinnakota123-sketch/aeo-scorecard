import './globals.css'
export const metadata = {
  title: 'AI Visibility Scorecard — AEO Diagnostic for Amazon Sellers',
  description: 'See how GPT-4o, Claude & Gemini rank your product — and fix it in one click.',
}
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-gray-900 antialiased min-h-screen">{children}</body>
    </html>
  )
}
