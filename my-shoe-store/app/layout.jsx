import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata = {
  title: "Tradits",
  description: "Good shoes go places."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="site noise">
        <Header />
        <div className="shell">
          <main className="container">{children}</main>
        </div>
        <Footer />
      </body>
    </html>
  );
}
