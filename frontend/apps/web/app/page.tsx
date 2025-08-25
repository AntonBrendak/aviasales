import Link from 'next/link';
import { Container, Button } from 'react-bootstrap';

export default function Home() {
  return (
    <Container className="py-5 text-center">
      <h1 className="mb-3">Авиабилеты онлайн</h1>
      <p className="text-muted mb-4">Ищем предложения из NDC/GDS/OTA в реальном времени</p>

      <Link href="/search">
        <Button size="lg" as="span">Найти билеты</Button>
      </Link>
    </Container>
  );
}