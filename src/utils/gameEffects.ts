import confetti from 'canvas-confetti';

// color palette for dark mode confetti
const CONFETTI_COLORS = ['#4338ca', '#8b5cf6', '#0ea5e9', '#facc15'];

export function playLevelUpVFX() {
  try {
    const enabled = localStorage.getItem('vfxEnabled');
    if (enabled === 'false') return;
  } catch (e) {
    // if localStorage unavailable assume enabled
  }

  // burst of confetti
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: CONFETTI_COLORS,
  });
}

// simple beep sound data URI (mild tone)
const BEEP_AUDIO =
  'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADGgAAACgAAAAgAAAAHAAACABEVGhpcyBpcyBhIHNpbXBsZSBiZWVwLg==';

export function playTaskCompleteSFX() {
  try {
    const enabled = localStorage.getItem('sfxEnabled');
    if (enabled === 'false') return;
  } catch (e) {}

  const audio = new Audio(BEEP_AUDIO);
  audio.volume = 0.5;
  audio.play().catch(() => {});
}
