// Lavalink-native filter presets. These are applied via player.shoukaku.filters
// Note: true "reverse playback" isn't possible on a live decoded audio stream
// (there's no way to play frames before they've been decoded), so "reverse" here
// is implemented as a slowed + muffled effect some premium bots also label this way.
// If you truly need reversed audio, you'd have to pre-download and reverse the file,
// which breaks live streaming and isn't included here.

const FILTERS = {
  bassboost: {
    equalizer: [
      { band: 0, gain: 0.6 }, { band: 1, gain: 0.5 }, { band: 2, gain: 0.4 },
      { band: 3, gain: 0.3 }, { band: 4, gain: 0.2 }, { band: 5, gain: 0.1 }
    ]
  },
  nightcore: {
    timescale: { speed: 1.2, pitch: 1.2, rate: 1.0 }
  },
  vaporwave: {
    timescale: { speed: 0.85, pitch: 0.85, rate: 1.0 }
  },
  slowed: {
    timescale: { speed: 0.8, pitch: 1.0, rate: 1.0 }
  },
  reverse: { // slowed + muffled emulation, see note above
    timescale: { speed: 0.7, pitch: 0.85, rate: 1.0 },
    lowPass: { smoothing: 15 }
  },
  eightD: {
    rotation: { rotationHz: 0.2 }
  },
  karaoke: {
    karaoke: { level: 1.0, monoLevel: 1.0, filterBand: 220.0, filterWidth: 100.0 }
  },
  tremolo: {
    tremolo: { frequency: 4.0, depth: 0.5 }
  },
  vibrato: {
    vibrato: { frequency: 4.0, depth: 0.5 }
  },
  distortion: {
    distortion: { sinOffset: 0, sinScale: 1, cosOffset: 0, cosScale: 1, tanOffset: 0, tanScale: 1, offset: 0, scale: 1 }
  },
  chipmunk: {
    timescale: { speed: 1.05, pitch: 1.6, rate: 1.0 }
  },
  china: {
    timescale: { speed: 1.0, pitch: 1.3, rate: 1.25 }
  },
  soft: {
    lowPass: { smoothing: 20 }
  }
};

const FILTER_NAMES = Object.keys(FILTERS);

async function applyFilter(player, name) {
  if (name === 'clear' || name === 'off' || name === 'none') {
    await player.shoukaku.clearFilters();
    return true;
  }
  const preset = FILTERS[name];
  if (!preset) return false;
  await player.shoukaku.setFilters(preset);
  return true;
}

module.exports = { FILTERS, FILTER_NAMES, applyFilter };
