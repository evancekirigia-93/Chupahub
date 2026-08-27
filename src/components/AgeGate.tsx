'use client';

import { useEffect, useState } from 'react';

const AGE_KEY = 'chupahub-age-confirmed';

export function AgeGate() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(AGE_KEY) !== 'yes');
    } catch {
      setVisible(true);
    }
  }, []);

  const confirmAge = () => {
    try { localStorage.setItem(AGE_KEY, 'yes'); } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return <div className="age-gate" role="dialog" aria-modal="true" aria-labelledby="age-gate-title">
    <div className="age-gate-card">
      <img src="/favicon.svg" alt="ChupaHub" className="age-gate-logo" />
      <p className="age-gate-kicker">Responsible shopping</p>
      <h2 id="age-gate-title">Are you 18 or older?</h2>
      <p className="age-gate-copy">You must be at least 18 years old to enter ChupaHub and purchase alcoholic beverages.</p>
      <div className="age-gate-actions">
        <button type="button" onClick={confirmAge} className="age-gate-confirm">Yes, I am 18+</button>
        <a href="https://www.google.com/" className="age-gate-exit">No, exit site</a>
      </div>
      <p className="age-gate-note">Please drink responsibly.</p>
    </div>
  </div>;
}
