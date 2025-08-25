import 'bootstrap/dist/css/bootstrap.min.css';
import '../src/styles/globals.scss';
import { AppShell } from '../src/app-shell/AppShell';

export const metadata = { title: 'Авиабилеті', description: 'Поиск авиабилетов' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body><AppShell>{children}</AppShell></body>
    </html>
  );
}
