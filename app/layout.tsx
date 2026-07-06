import type { Metadata } from "next";
import { Inter, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";
import { getLang } from "@/lib/lang";
import { getSession } from "@/lib/auth";
import { dir } from "@/lib/i18n";
import { LangProvider } from "@/components/LangProvider";
import { EditProvider } from "@/components/EditProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-latin",
  display: "swap",
});

const nastaliq = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
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
      className={`${inter.variable} ${nastaliq.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <LangProvider lang={lang}>
          <EditProvider canEdit={canEdit}>{children}</EditProvider>
        </LangProvider>
      </body>
    </html>
  );
}
