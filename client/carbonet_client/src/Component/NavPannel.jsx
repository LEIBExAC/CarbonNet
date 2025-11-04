import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { LinkContainer } from 'react-router-bootstrap';

function NavPannel() {
  return (
    <Navbar collapseOnSelect expand="lg" bg="dark" data-bs-theme="dark">
      <Container>
        <LinkContainer to="/">
          <Navbar.Brand>CarbonNet</Navbar.Brand>
        </LinkContainer>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="me-auto">
            <LinkContainer to="/features">
              <Nav.Link>Features</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/pricing">
              <Nav.Link>Pricing</Nav.Link>
            </LinkContainer>
            <NavDropdown title="Dropdown" id="collapsible-nav-dropdown">
              <LinkContainer to="/action1">
                <NavDropdown.Item>Action</NavDropdown.Item>
              </LinkContainer>
              <LinkContainer to="/action2">
                <NavDropdown.Item>Another action</NavDropdown.Item>
              </LinkContainer>
              <LinkContainer to="/something">
                <NavDropdown.Item>Something</NavDropdown.Item>
              </LinkContainer>
              <NavDropdown.Divider />
              <LinkContainer to="/separated">
                <NavDropdown.Item>Separated link</NavDropdown.Item>
              </LinkContainer>
            </NavDropdown>
          </Nav>

          {/* RIGHT SIDE LINKS */}
          <Nav>
            <LinkContainer to="/login">
              <Nav.Link>Login</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/signup">
              <Nav.Link>Sign Up</Nav.Link>
            </LinkContainer>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavPannel;
