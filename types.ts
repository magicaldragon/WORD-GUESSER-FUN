export enum GamePhase {
  SETUP = 'setup',
  PLAYING = 'playing',
  RESULTS = 'results',
}

export interface GameSettings {
  words: string[];
  totalTimeLimit: number; // in seconds (changed from timePerWord)
}

export interface CustomSoundFile {
  name: string;
  data: string; // base64 data URL
}
