import "./globals.css";
import "./lab.css";

export const metadata = {
  title: "Himanshu Bhardwaj — Senior Product Engineer",
  description:
    "Senior Product Engineer with 5+ years of experience building scalable full-stack products with React, Node.js, .NET, and MongoDB. Builder of Postline, a Claude connector for LinkedIn.",
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
      </head>
      <body>{children}</body>
    </html>
  );
}
