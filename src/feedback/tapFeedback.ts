import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from "expo-audio";

const TAP_SOUND = require("../../assets/sounds/tap.wav");
const TAP_VOLUME = 0.08;
const MIN_INTERVAL_MS = 35;

let player: AudioPlayer | null = null;
let soundAvailable = true;
let lastPlayedAt = 0;

function resolvePlayer(): AudioPlayer | null {
  if (!soundAvailable) return null;
  if (player) return player;

  try {
    void setAudioModeAsync({
      playsInSilentMode: false,
      shouldPlayInBackground: false,
      interruptionMode: "mixWithOthers",
    });
    player = createAudioPlayer(TAP_SOUND);
    player.volume = TAP_VOLUME;
  } catch {
    soundAvailable = false;
    player = null;
  }

  return player;
}

export function playTapFeedback(): void {
  const now = Date.now();
  if (now - lastPlayedAt < MIN_INTERVAL_MS) return;
  lastPlayedAt = now;

  const current = resolvePlayer();
  if (!current) return;

  try {
    void current.seekTo(0);
    current.play();
  } catch {
    soundAvailable = false;
  }
}
