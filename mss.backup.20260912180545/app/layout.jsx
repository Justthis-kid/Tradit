import './globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Tradits',
  description: 'Tradit — buy, sell, and AI-scan shoes'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="site noise">
        <div id="root">
          <Header />
          <div className="shell">
            <main className="container">{children}</main>
          </div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
