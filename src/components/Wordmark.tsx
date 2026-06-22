/** Wordmark central, cambiable en un solo lugar (§13.8): "Scan" en ink, "IT" en signal. */
export function Wordmark() {
  return (
    <div className="brand">
      <div className="mark" aria-hidden="true" />
      <div className="word">
        Scan <span className="word-it">IT</span>
      </div>
    </div>
  );
}
