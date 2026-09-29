/**
 * Title + subtitle at the top of a page.
 * Anything passed as children (e.g. a "New Task" button) sits on the right.
 */
export default function PageHeader({ title, subtitle, children }) {
  return (
    <header className="vhead">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      {children}
    </header>
  );
}
