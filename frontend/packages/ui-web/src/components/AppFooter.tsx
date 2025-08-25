import Container from 'react-bootstrap/Container';
export const AppFooter = () => (
    <footer className="border-top py-3 mt-4">
    <Container>
    <small>© {new Date().getFullYear()} Авиабилеті</small>
    </Container>
    </footer>
);