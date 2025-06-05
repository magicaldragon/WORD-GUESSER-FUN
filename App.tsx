
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { SetupScreen } from './components/SetupScreen';
import { GameScreen } from './components/GameScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { BackgroundMusicPlayer } from './components/BackgroundMusicPlayer';
import { GamePhase, GameSettings, CustomSoundFile } from './types';
import { playSound, SINGLE_SOUND_EFFECTS, DEFAULT_MUSIC_VOLUME, CORRECT_SOUNDS, SKIP_SOUNDS, BACKGROUND_MUSIC_URL, GAME_MUSIC_URL } from './constants';

interface GameEndDetails {
  baseScore: number; // Score from gameplay (words + lucky stars)
  timeBonus: number;
  finalScore: number;
}

const App: React.FC = () => {
  const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.SETUP);
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [gameEndDetails, setGameEndDetails] = useState<GameEndDetails | null>(null);
  
  const [musicVolume, setMusicVolume] = useState<number>(() => {
    const storedVolume = localStorage.getItem('musicVolume');
    const numVolume = storedVolume ? parseFloat(storedVolume) : DEFAULT_MUSIC_VOLUME;
    return !isNaN(numVolume) && numVolume >= 0 && numVolume <=1 ? numVolume : DEFAULT_MUSIC_VOLUME;
  });

  const [customBackgroundMusic, setCustomBackgroundMusic] = useState<CustomSoundFile | null>(null);
  const [customGameMusic, setCustomGameMusic] = useState<CustomSoundFile | null>(null);
  const [customCorrectSounds, setCustomCorrectSounds] = useState<CustomSoundFile[]>([]);
  const [customSkipSounds, setCustomSkipSounds] = useState<CustomSoundFile[]>([]);
  const [customStartGameSound, setCustomStartGameSound] = useState<CustomSoundFile | null>(null);
  const [customPlayAgainSound, setCustomPlayAgainSound] = useState<CustomSoundFile | null>(null);
  const [customTimesUpSound, setCustomTimesUpSound] = useState<CustomSoundFile | null>(null);
  const [customGameOverSound, setCustomGameOverSound] = useState<CustomSoundFile | null>(null);
  const [customCountdownGoSound, setCustomCountdownGoSound] = useState<CustomSoundFile | null>(null);
  // Power-up sounds
  const [customPowerupCollectedSound, setCustomPowerupCollectedSound] = useState<CustomSoundFile | null>(null);
  const [customPowerupTimeFreezeSound, setCustomPowerupTimeFreezeSound] = useState<CustomSoundFile | null>(null);
  const [customPowerupSkipFreebieUsedSound, setCustomPowerupSkipFreebieUsedSound] = useState<CustomSoundFile | null>(null);
  const [customPowerupPointsDoublerAppliedSound, setCustomPowerupPointsDoublerAppliedSound] = useState<CustomSoundFile | null>(null);
  
  const [activeMusicUrl, setActiveMusicUrl] = useState<string | null>(null);
  const initialLoadDone = useRef(false);

  const isCustomSoundFile = (data: any): data is CustomSoundFile | null =>
    data === null || (typeof data === 'object' && data !== null && 'name' in data && typeof data.name === 'string' && 'data' in data && typeof data.data === 'string');
  
  const isCustomSoundFileArray = (data: any): data is CustomSoundFile[] =>
    Array.isArray(data) && data.every(item => item && typeof item === 'object' && 'name' in item && typeof item.name === 'string' && 'data' in item && typeof item.data === 'string');

  useEffect(() => {
    const loadJSON = <T,>(
        key: string, 
        setter: (value: T) => void, 
        defaultValue: T, 
        validator: (data: any) => data is T
    ): void => {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
            try {
                const parsed = JSON.parse(storedValue);
                if (validator(parsed)) {
                    setter(parsed);
                } else {
                    console.warn(`Invalid data structure for ${key} in localStorage. Resetting to default.`);
                    setter(defaultValue);
                    localStorage.removeItem(key);
                }
            } catch (e) {
                console.error(`Error parsing ${key} from localStorage:`, e);
                setter(defaultValue);
                localStorage.removeItem(key);
            }
        } else {
            if (typeof defaultValue !== 'undefined') {
                 setter(defaultValue);
            }
        }
    };

    const storedVolume = localStorage.getItem('musicVolume');
    if (storedVolume) {
        const numVolume = parseFloat(storedVolume);
        if (!isNaN(numVolume) && numVolume >= 0 && numVolume <= 1) {
            setMusicVolume(numVolume);
        } else {
            localStorage.removeItem('musicVolume'); 
            setMusicVolume(DEFAULT_MUSIC_VOLUME); 
        }
    }

    loadJSON<CustomSoundFile | null>('customBackgroundMusic', setCustomBackgroundMusic, null, isCustomSoundFile);
    loadJSON<CustomSoundFile | null>('customGameMusic', setCustomGameMusic, null, isCustomSoundFile); 
    loadJSON<CustomSoundFile[]>('customCorrectSounds', setCustomCorrectSounds, [], isCustomSoundFileArray);
    loadJSON<CustomSoundFile[]>('customSkipSounds', setCustomSkipSounds, [], isCustomSoundFileArray);
    loadJSON<CustomSoundFile | null>('customStartGameSound', setCustomStartGameSound, null, isCustomSoundFile);
    loadJSON<CustomSoundFile | null>('customPlayAgainSound', setCustomPlayAgainSound, null, isCustomSoundFile);
    loadJSON<CustomSoundFile | null>('customTimesUpSound', setCustomTimesUpSound, null, isCustomSoundFile);
    loadJSON<CustomSoundFile | null>('customGameOverSound', setCustomGameOverSound, null, isCustomSoundFile);
    loadJSON<CustomSoundFile | null>('customCountdownGoSound', setCustomCountdownGoSound, null, isCustomSoundFile);
    // Load power-up sounds
    loadJSON<CustomSoundFile | null>('customPowerupCollectedSound', setCustomPowerupCollectedSound, null, isCustomSoundFile);
    loadJSON<CustomSoundFile | null>('customPowerupTimeFreezeSound', setCustomPowerupTimeFreezeSound, null, isCustomSoundFile);
    loadJSON<CustomSoundFile | null>('customPowerupSkipFreebieUsedSound', setCustomPowerupSkipFreebieUsedSound, null, isCustomSoundFile);
    loadJSON<CustomSoundFile | null>('customPowerupPointsDoublerAppliedSound', setCustomPowerupPointsDoublerAppliedSound, null, isCustomSoundFile);


    initialLoadDone.current = true;
  }, []);
  
  useEffect(() => {
    if (gamePhase === GamePhase.PLAYING) {
      if (customGameMusic && customGameMusic.data) {
        setActiveMusicUrl(customGameMusic.data);
      } else {
        setActiveMusicUrl(GAME_MUSIC_URL); 
      }
    } else if (gamePhase === GamePhase.SETUP) {
      if (customBackgroundMusic && customBackgroundMusic.data) {
        setActiveMusicUrl(customBackgroundMusic.data);
      } else {
        setActiveMusicUrl(BACKGROUND_MUSIC_URL); 
      }
    } else {
      setActiveMusicUrl(null);
    }
  }, [gamePhase, customBackgroundMusic, customGameMusic]);

  const saveJSON = useCallback((key: string, value: any) => {
    if (!initialLoadDone.current) return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Error saving ${key} to localStorage:`, e);
    }
  }, []); 

  useEffect(() => {
    if (!initialLoadDone.current) return;
    localStorage.setItem('musicVolume', musicVolume.toString());
  }, [musicVolume]);

  useEffect(() => saveJSON('customBackgroundMusic', customBackgroundMusic), [customBackgroundMusic, saveJSON]);
  useEffect(() => saveJSON('customGameMusic', customGameMusic), [customGameMusic, saveJSON]); 
  useEffect(() => saveJSON('customCorrectSounds', customCorrectSounds), [customCorrectSounds, saveJSON]);
  useEffect(() => saveJSON('customSkipSounds', customSkipSounds), [customSkipSounds, saveJSON]);
  useEffect(() => saveJSON('customStartGameSound', customStartGameSound), [customStartGameSound, saveJSON]);
  useEffect(() => saveJSON('customPlayAgainSound', customPlayAgainSound), [customPlayAgainSound, saveJSON]);
  useEffect(() => saveJSON('customTimesUpSound', customTimesUpSound), [customTimesUpSound, saveJSON]);
  useEffect(() => saveJSON('customGameOverSound', customGameOverSound), [customGameOverSound, saveJSON]);
  useEffect(() => saveJSON('customCountdownGoSound', customCountdownGoSound), [customCountdownGoSound, saveJSON]);
  // Save power-up sounds
  useEffect(() => saveJSON('customPowerupCollectedSound', customPowerupCollectedSound), [customPowerupCollectedSound, saveJSON]);
  useEffect(() => saveJSON('customPowerupTimeFreezeSound', customPowerupTimeFreezeSound), [customPowerupTimeFreezeSound, saveJSON]);
  useEffect(() => saveJSON('customPowerupSkipFreebieUsedSound', customPowerupSkipFreebieUsedSound), [customPowerupSkipFreebieUsedSound, saveJSON]);
  useEffect(() => saveJSON('customPowerupPointsDoublerAppliedSound', customPowerupPointsDoublerAppliedSound), [customPowerupPointsDoublerAppliedSound, saveJSON]);


  const handleGameStart = useCallback((settings: GameSettings) => {
    setGameSettings(settings);
    setGameEndDetails(null); // Clear previous game end details
    
    playSound(customStartGameSound || SINGLE_SOUND_EFFECTS.START_GAME_SOUND);
    // The full countdown sound (e.g., "3-2-1-Go!") will be triggered by GameScreen 
    // when the countdown visually starts with "3".
    
    setGamePhase(GamePhase.PLAYING);
  }, [customStartGameSound]);

  const handleGameEnd = useCallback((achievedScore: number, timeLeftSeconds: number) => {
    // achievedScore already includes points from lucky stars
    const baseScore = achievedScore; 
    const timeBonusValue = Math.max(0, timeLeftSeconds * 10); // Ensure time bonus isn't negative. If timeLeftSeconds is 0 (e.g. early exit), bonus is 0.
    const calculatedFinalScore = baseScore + timeBonusValue;
    
    setGameEndDetails({
        baseScore, // This is the score from gameplay
        timeBonus: timeBonusValue,
        finalScore: calculatedFinalScore
    });
    setGamePhase(GamePhase.RESULTS);

    // Play sound based on whether time ran out or game ended otherwise (incl. early exit or all words guessed)
    if (timeLeftSeconds <= 0 && achievedScore > 0) { // Time ran out during play, or early exit.
      playSound(customTimesUpSound || SINGLE_SOUND_EFFECTS.TIMES_UP_WORD);
    } else if (timeLeftSeconds <=0 && achievedScore <= 0) { // Time ran out and no score or early exit with no score
      playSound(customTimesUpSound || SINGLE_SOUND_EFFECTS.TIMES_UP_WORD); // Or a different sound for zero score?
    }
    else { // Game completed with time remaining (all words guessed)
      playSound(customGameOverSound || SINGLE_SOUND_EFFECTS.GAME_OVER);
    }
  }, [customTimesUpSound, customGameOverSound]);

  const handlePlayAgain = useCallback(() => {
    setGameSettings(null);
    setGameEndDetails(null);
    setGamePhase(GamePhase.SETUP);
    playSound(customPlayAgainSound || SINGLE_SOUND_EFFECTS.PLAY_AGAIN_SOUND);
  }, [customPlayAgainSound]);

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
     if (!isNaN(newVolume) && newVolume >= 0 && newVolume <= 1) {
        setMusicVolume(newVolume);
    }
  };

  const renderScreen = () => {
    switch (gamePhase) {
      case GamePhase.SETUP:
        return <SetupScreen 
                  onGameStart={handleGameStart}
                  customBackgroundMusic={customBackgroundMusic}
                  setCustomBackgroundMusic={setCustomBackgroundMusic}
                  customGameMusic={customGameMusic} 
                  setCustomGameMusic={setCustomGameMusic} 
                  customCorrectSounds={customCorrectSounds}
                  setCustomCorrectSounds={setCustomCorrectSounds}
                  customSkipSounds={customSkipSounds}
                  setCustomSkipSounds={setCustomSkipSounds}
                  customStartGameSound={customStartGameSound}
                  setCustomStartGameSound={setCustomStartGameSound}
                  customPlayAgainSound={customPlayAgainSound}
                  setCustomPlayAgainSound={setCustomPlayAgainSound}
                  customTimesUpSound={customTimesUpSound}
                  setCustomTimesUpSound={setCustomTimesUpSound}
                  customGameOverSound={customGameOverSound}
                  setCustomGameOverSound={setCustomGameOverSound}
                  customCountdownGoSound={customCountdownGoSound}
                  setCustomCountdownGoSound={setCustomCountdownGoSound}
                  // Pass power-up sound setters
                  customPowerupCollectedSound={customPowerupCollectedSound}
                  setCustomPowerupCollectedSound={setCustomPowerupCollectedSound}
                  customPowerupTimeFreezeSound={customPowerupTimeFreezeSound}
                  setCustomPowerupTimeFreezeSound={setCustomPowerupTimeFreezeSound}
                  customPowerupSkipFreebieUsedSound={customPowerupSkipFreebieUsedSound}
                  setCustomPowerupSkipFreebieUsedSound={setCustomPowerupSkipFreebieUsedSound}
                  customPowerupPointsDoublerAppliedSound={customPowerupPointsDoublerAppliedSound}
                  setCustomPowerupPointsDoublerAppliedSound={setCustomPowerupPointsDoublerAppliedSound}
                />;
      case GamePhase.PLAYING:
        if (!gameSettings) {
            handlePlayAgain(); 
            return <p className="text-danger-red">Error: Game settings missing. Returning to setup...</p>;
        }
        return <GameScreen 
                  settings={gameSettings} 
                  onGameEnd={handleGameEnd} 
                  customCorrectSounds={customCorrectSounds}
                  customSkipSounds={customSkipSounds}
                  customCountdownGoSound={customCountdownGoSound}
                  // Pass power-up sounds to GameScreen
                  customPowerupCollectedSound={customPowerupCollectedSound}
                  customPowerupTimeFreezeSound={customPowerupTimeFreezeSound}
                  customPowerupSkipFreebieUsedSound={customPowerupSkipFreebieUsedSound}
                  customPowerupPointsDoublerAppliedSound={customPowerupPointsDoublerAppliedSound}
                />;
      case GamePhase.RESULTS:
        if (!gameEndDetails) {
            handlePlayAgain();
            return <p className="text-light-text animate-subtlePulse">Loading results...</p>;
        }
        return <ResultsScreen 
                  baseScore={gameEndDetails.baseScore} // Score from gameplay (words + lucky stars)
                  timeBonus={gameEndDetails.timeBonus}
                  finalScore={gameEndDetails.finalScore} // baseScore + timeBonus
                  onPlayAgain={handlePlayAgain}
                />;
      default:
        return <p className="text-light-text animate-subtlePulse">Initializing Interface...</p>;
    }
  };

  return (
    <div className="min-h-screen bg-dark-metal flex flex-col items-center justify-center p-4 text-light-text selection:bg-cyber-purple selection:text-white">
      <BackgroundMusicPlayer 
        volume={musicVolume} 
        musicUrl={activeMusicUrl}
      />
      <div className="container mx-auto max-w-2xl w-full text-center">
        <header className="mb-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-electric-blue via-cyber-purple to-neon-green animate-subtlePulse">
            Word Guesser Fun
          </h1>
          <p className="mt-3 text-lg sm:text-xl text-muted-text font-sans">
            Describe the word on screen to your partner before time runs out!
          </p>
        </header>
        <main 
          className={`futuristic-card shadow-2xl rounded-xl p-6 sm:p-8 md:p-10 w-full ${
            gamePhase === GamePhase.RESULTS ? 'results-card-animation' : '' 
          }`}
        >
          {renderScreen()}
        </main>
        <footer className="mt-10 text-sm text-muted-text flex flex-col sm:flex-row justify-between items-center w-full max-w-2xl px-2">
          <p>Made by Mr. C for awesome students</p>
          <div className="flex items-center mt-2 sm:mt-0">
            <label htmlFor="volumeControl" className="mr-2 text-xs">Music Volume:</label>
            <input
              type="range"
              id="volumeControl"
              min="0"
              max="1"
              step="0.01"
              value={musicVolume}
              onChange={handleVolumeChange}
              className="w-24 h-2 bg-cyber-purple rounded-lg appearance-none cursor-pointer accent-electric-blue"
              aria-label="Music volume"
            />
             <span className="ml-2 text-xs w-8 text-left">{(musicVolume * 100).toFixed(0)}%</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;