/**
 * Every screen scrolls under the floating module switch and over the tab bar,
 * so the padding that clears both lives here rather than in each screen.
 */
export default function Screen({ children }) {
  return (
    <div
      className="scroll screen-in"
      style={{
        flex: 1,
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 76px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 108px)',
      }}
    >
      {children}
    </div>
  );
}
