/**
 * Sound Effects System
 * Manages audio feedback for interactions
 */

import { Audio } from "expo-av";

type SoundType = "pop" | "success" | "ding";

// Sound cache
const sounds: Map<SoundType, Audio.Sound> = new Map();
let initialized = false;
let soundEnabled = true;

/**
 * Initialize the sound system
 * Call this on app startup
 */
export const initSounds = async () => {
  if (initialized) return;
  
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    initialized = true;
  } catch (error) {
    console.warn("Failed to initialize audio:", error);
  }
};

/**
 * Enable or disable sounds
 */
export const setSoundEnabled = (enabled: boolean) => {
  soundEnabled = enabled;
};

/**
 * Check if sounds are enabled
 */
export const isSoundEnabled = () => soundEnabled;

/**
 * Play a sound effect
 * Note: In production, you'd load actual sound files
 * For now, this is a placeholder that uses haptics as fallback
 */
export const playSound = async (type: SoundType) => {
  if (!soundEnabled) return;

  // TODO: Load actual sound files
  // For now, we rely on haptic feedback
  // To add sounds:
  // 1. Add sound files to assets/sounds/
  // 2. Load them here with Audio.Sound.createAsync
  // 3. Play them with sound.playAsync()

  /*
  Example implementation:
  
  const soundFiles: Record<SoundType, any> = {
    pop: require('@/assets/sounds/pop.mp3'),
    success: require('@/assets/sounds/success.mp3'),
    ding: require('@/assets/sounds/ding.mp3'),
  };

  try {
    let sound = sounds.get(type);
    
    if (!sound) {
      const { sound: newSound } = await Audio.Sound.createAsync(soundFiles[type]);
      sound = newSound;
      sounds.set(type, sound);
    }

    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch (error) {
    console.warn(`Failed to play sound ${type}:`, error);
  }
  */
};

/**
 * Play the set complete "pop" sound
 */
export const playPopSound = () => playSound("pop");

/**
 * Play the success sound (workout complete)
 */
export const playSuccessSound = () => playSound("success");

/**
 * Play the rest timer ding
 */
export const playDingSound = () => playSound("ding");

/**
 * Cleanup sounds on app close
 */
export const cleanupSounds = async () => {
  for (const sound of sounds.values()) {
    await sound.unloadAsync();
  }
  sounds.clear();
  initialized = false;
};
