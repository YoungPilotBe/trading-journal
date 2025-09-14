import { createPortal } from "react-dom";

interface Props {
  target?: string;
  children: React.ReactNode;
}

const NavbarPortal = ({ children, target = "navbar-items" }: Props) => {
  const actionsContainer = document.getElementById(target);
  if (!actionsContainer) return null;

  return createPortal(
    <div className="flex items-center space-x-2">{children}</div>,
    actionsContainer
  );
};

export default NavbarPortal;
