import type { Metadata } from "next";
import { Crimson_Pro } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { getLang } from "@/lib/lang";
import { getSession } from "@/lib/auth";
import { dir } from "@/lib/i18n";
import { LangProvider } from "@/components/LangProvider";
import { EditProvider } from "@/components/EditProvider";

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-latin",
  display: "swap",
});

const urdType = localFont({
  src: "../public/fonts/UrdType.ttf",
  variable: "--font-urdu",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Quindeel Academy — Online Urdu Classes",
  description:
    "Online Urdu classes by Prof. Muhammad Zaheer Quindeel — O/A Level, IGCSE, board classes, cadet college & competitive exam preparation.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const lang = await getLang();
  const session = await getSession();
  const canEdit = session?.role === "TEACHER";

  return (
    <html
      lang={lang}
      dir={dir(lang)}
      className={`${crimsonPro.variable} ${urdType.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <LangProvider lang={lang}>
          <EditProvider canEdit={canEdit}>{children}</EditProvider>
        </LangProvider>
      </body>
    </html>
  );
}
