import './globals.css';

export const metadata = {
  title: 'Quản Lý Tiền Nhà 904B',
  description: 'Hệ thống tính toán và chốt sổ tiền nhà 904B hàng tháng',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className="antialiased bg-slate-900 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
