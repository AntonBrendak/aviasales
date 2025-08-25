'use client';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';

export const AppShell: React.FC<React.PropsWithChildren> = ({ children }) => (
  <>
    <Navbar bg="light" expand="lg" className="border-bottom">
      <Container>
        <Navbar.Brand>Авиабилеті</Navbar.Brand>
        <Nav className="me-auto">
          <Nav.Link href="/">Home</Nav.Link>
          <Nav.Link href="/health">Health</Nav.Link>
        </Nav>
      </Container>
    </Navbar>
    <main className="py-3"><Container>{children}</Container></main>
    <footer className="border-top py-3 mt-4">
      <Container><small>© {new Date().getFullYear()} Авиабилеті</small></Container>
    </footer>
  </>
);
