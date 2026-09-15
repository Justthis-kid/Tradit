export const metadata = {
  title: "SoleSwap – Trade Your Kicks",
  description: "GameStop-style shoe resale with store credit for fresh pairs."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
