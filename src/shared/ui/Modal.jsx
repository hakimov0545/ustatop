import { useEffect } from "react";
export function Modal({ children, close }) {
  useEffect(() => {
    const listener = (event) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [close]);
  return (
    <div
      className="overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section className="detail-dialog" role="dialog" aria-modal="true">
        {children}
      </section>
    </div>
  );
}
