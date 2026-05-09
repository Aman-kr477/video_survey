import "./globals.css";
import AppLayout from "@/AppLayout";

export const metadata = {
  title: "Video Survey Platform",
  description: "Complete surveys with live camera feed",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
