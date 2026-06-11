import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WEA-ther | Canal del Clima Retro",
  description: "Sistema de transmisión del clima retro no interactivo inspirado en WeatherStar 4000 e IntelliStar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
