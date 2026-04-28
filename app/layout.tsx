import "./globals.css";

export const metadata = {
  title: "Founder AI Builder",
  description: "Generate, preview, and repair product-ready projects.",
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