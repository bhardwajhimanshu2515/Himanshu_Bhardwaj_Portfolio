import "./globals.css";
import "./lab.css";
import { PortfolioEntrance } from "./portfolio-entrance";

const siteUrl = "https://himanshubhardwaj.com";
const title = "Himanshu Bhardwaj — Senior Product Engineer";
const description = "Senior Product Engineer with 5+ years building full-stack products across utilities, healthcare, and HR technology. Creator of Postline, a Claude connector for LinkedIn.";
const shareImage = {
  url: "/portfolio-share-v2.jpg",
  width: 1200,
  height: 630,
  alt: "Portfolio of Himanshu Bhardwaj, Senior Product Engineer, with an orange holographic sphere",
};

export const metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Himanshu Bhardwaj",
    title,
    description,
    images: [shareImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [shareImage],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(!t)t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(location.pathname!=="/"||location.hash||matchMedia("(prefers-reduced-motion: reduce)").matches)return;try{if(localStorage.getItem("portfolio-entrance-seen"))return}catch(e){}try{if(sessionStorage.getItem("portfolio-entrance-seen"))return}catch(e){}var r=document.documentElement;r.setAttribute("data-portfolio-entrance","");setTimeout(function(){if(!r.hasAttribute("data-portfolio-entrance-active"))r.removeAttribute("data-portfolio-entrance")},4000)})()`,
          }}
        />
      </head>
      <body><PortfolioEntrance>{children}</PortfolioEntrance></body>
    </html>
  );
}
