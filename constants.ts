

import { CustomSoundFile } from './types';

export const DEFAULT_TOTAL_TIME_LIMIT = 180; // seconds (e.g., 3 minutes)
export const MIN_TOTAL_TIME_LIMIT = 60;    // seconds (e.g., 1 minute)
export const MAX_TOTAL_TIME_LIMIT = 600;   // seconds (e.g., 10 minutes)

// Combo Streak Feature Constants
export const COMBO_ACTIVATION_THRESHOLD = 3; // Min streak to activate combo point bonus
export const COMBO_POINT_BONUS = 50;         // Extra points awarded per word when combo is active
export const COMBO_TIME_BONUS_THRESHOLD = 5; // Streak needed to get a time bonus
export const COMBO_TIME_BONUS_SECONDS = 5;   // Seconds added to timer for time bonus
export const MAX_COMBO_TIME_BONUS_APPLICATIONS = 1; // How many times the time bonus can be applied per game

// Word Power Boosts (Power-Ups) Constants
export const POWERUP_TIME_FREEZE_SECONDS = 5;   // Seconds added by Time Freeze power-up


// Default Sounds - These now point to externally hosted audio files on GitHub.
// You can change these URLs to point to other hosted audio files if needed.

// ** 1. SETUP SCREEN MUSIC (Previously Background Music) **
// URL to your setup screen music file.
export const BACKGROUND_MUSIC_URL = 'https://raw.githubusercontent.com/magicaldragon/WORD-GUESSER-FUN/main/GAME%20SETUP.mp3';

// ** 2. GAME PLAY MUSIC **
// URL to your game play music file.
export const GAME_MUSIC_URL = 'https://raw.githubusercontent.com/magicaldragon/WORD-GUESSER-FUN/main/GAME%20MUSIC.mp3';

export const DEFAULT_MUSIC_VOLUME = 0.5; // 50%

// ** 3. CORRECT GUESS SOUNDS **
// This is an array of URLs. Add more URLs for multiple random correct sounds.
export const CORRECT_SOUNDS = [
  'https://raw.githubusercontent.com/magicaldragon/WORD-GUESSER-FUN/main/CORRECT%20SOUND.wav',
];

// ** 4. SKIP WORD SOUNDS **
// This is an array of URLs, similar to CORRECT_SOUNDS.
export const SKIP_SOUNDS = [
  'https://raw.githubusercontent.com/magicaldragon/WORD-GUESSER-FUN/main/SKIP%20SOUND.wav',
];

// ** 5. OTHER SINGLE SOUND EFFECTS **
// This is an object where each key has a URL to a specific sound effect.
export const SINGLE_SOUND_EFFECTS = {
  // ** 5a. TIME'S UP SOUND **
  TIMES_UP_WORD: 'https://raw.githubusercontent.com/magicaldragon/WORD-GUESSER-FUN/main/TIME%27S%20UP.wav',
  
  // ** 5b. GAME OVER SOUND (for when the game ends, typically a win/completion) **
  GAME_OVER: 'https://raw.githubusercontent.com/magicaldragon/WORD-GUESSER-FUN/main/RESULT.wav',
  
  // ** 5c. START GAME SOUND (for the button in setup screen) **
  START_GAME_SOUND: 'https://raw.githubusercontent.com/magicaldragon/WORD-GUESSER-FUN/main/START.wav',
  
  // ** 5d. PLAY AGAIN SOUND (for the button in results screen) **
  PLAY_AGAIN_SOUND: 'https://raw.githubusercontent.com/magicaldragon/WORD-GUESSER-FUN/main/TRY%20AGAIN.wav',
  
  // COUNTDOWN_TICK remains null. Provide via custom upload or new URL if needed.
  COUNTDOWN_TICK: null as string | null, 
  
  // ** 5e. COUNTDOWN GO SOUND (for the "GO!" in the countdown) **
  COUNTDOWN_GO: 'https://raw.githubusercontent.com/magicaldragon/WORD-GUESSER-FUN/main/3-2-1%20Go.mp3',

  // ** 5f. POWER-UP RELATED SOUNDS **
  // Updated to new GitHub URLs.
  POWERUP_COLLECTED: 'https://raw.githubusercontent.com/magicaldragon/WORD-GUESSER-FUN/main/Power-Up%20Collected%20Sound.mp3' as string | null, 
  POWERUP_TIME_FREEZE: 'https://raw.githubusercontent.com/magicaldragon/WORD-GUESSER-FUN/main/Time%20Freeze%20Sound.mp3' as string | null, 
  POWERUP_SKIP_FREEBIE_USED: 'https://raw.githubusercontent.com/magicaldragon/WORD-GUESSER-FUN/main/Skip%20Freebie%20Used%20Sound.mp3' as string | null, 
  POWERUP_POINTS_DOUBLER_APPLIED: 'https://raw.githubusercontent.com/magicaldragon/WORD-GUESSER-FUN/main/Points%20Doubler%20Applied%20Sound.mp3' as string | null, 
};

// --- Helper function to play sounds ---
// This function handles both URLs and Base64 data (from custom uploads).
export const playSound = (soundSource: string | string[] | CustomSoundFile | CustomSoundFile[] | null | undefined) => {
  let soundUrl: string | undefined;

  if (!soundSource) {
    return;
  }

  if (Array.isArray(soundSource)) {
    if (soundSource.length > 0) {
      const randomIndex = Math.floor(Math.random() * soundSource.length);
      const selectedItem = soundSource[randomIndex];
      if (typeof selectedItem === 'string') {
        soundUrl = selectedItem;
      } else if (selectedItem && typeof selectedItem === 'object' && 'data' in selectedItem && typeof (selectedItem as CustomSoundFile).data === 'string') {
        soundUrl = (selectedItem as CustomSoundFile).data;
      }
    }
  } else if (typeof soundSource === 'string') {
    soundUrl = soundSource;
  } else if (typeof soundSource === 'object' && 'data' in soundSource && typeof (soundSource as CustomSoundFile).data === 'string') {
    soundUrl = (soundSource as CustomSoundFile).data;
  }

  if (soundUrl) {
    if (!soundUrl.startsWith('data:audio') && !soundUrl.startsWith('http://') && !soundUrl.startsWith('https://')) {
        console.warn("playSound: Invalid sound URL format provided. URL must start with 'data:audio', 'http://', or 'https://'. Snippet:", soundUrl.substring(0, 100));
        return;
    }
    try {
        const audio = new Audio(soundUrl);
        audio.play().catch(error => {
          // Warnings for AbortError and NotAllowedError are often benign (e.g., sound interrupted by another)
          // and can be ignored if the game otherwise functions smoothly.
          if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
            console.warn("Error playing sound:", error.name, error.message, "URL snippet:", soundUrl.substring(0, 100));
          }
        });
    } catch (e: any) {
        console.error("Error creating Audio object with URL:", soundUrl.substring(0,100), e.name, e.message);
    }
  }
};