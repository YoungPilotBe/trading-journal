import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  target?: string;
  children: React.ReactNode;
}

const NavbarPortal = ({ children, target = "navbar-items" }: Props) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const targetElement = document.getElementById(target);
    setContainer(targetElement);
  }, [target]);

  if (!container) return null;

  return createPortal(
    <div className="flex items-center space-x-2">{children}</div>,
    container
  );
};

export default NavbarPortal;
