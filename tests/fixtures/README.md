The voice fixture is synthetic English speech generated locally with FFmpeg's Flite filter (voice `slt`), with one second of silence at each end, mono PCM16 at 48 kHz. No person was recorded.

Text: “Your voice tells a story. Every recording deserves to be heard clearly. Take a breath and listen to the difference.”

The browser test adds seeded white noise, checks 0% bypass, measures noise suppression in known silent intervals, checks voiced energy, and preserves duration. This is a regression test, not a perceptual quality benchmark or an Adobe Podcast comparison.
