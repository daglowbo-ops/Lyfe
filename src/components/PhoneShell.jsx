/**
 * On a phone the app is the whole viewport. On a wide screen it would stretch
 * into an unusable column, so it sits in a device-sized frame instead — the
 * same layout the design was drawn against. Both cases are one element; the
 * rounding, shadow and caption are switched on in CSS at the breakpoint.
 */
export default function PhoneShell({ children }) {
  return (
    <div className="shell">
      <section className="phone" aria-label="Fieldnote">
        {children}
      </section>
      <p
        className="shell-caption"
        aria-hidden="true"
        style={{ margin: 0 }}
      >
        FIELDNOTE · PRIVATE HEALTH & MONEY LOG
      </p>
    </div>
  );
}
