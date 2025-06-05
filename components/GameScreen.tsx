
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameSettings, CustomSoundFile } from '../types';
import { 
    playSound, CORRECT_SOUNDS, SKIP_SOUNDS, SINGLE_SOUND_EFFECTS,
    COMBO_ACTIVATION_THRESHOLD, COMBO_POINT_BONUS, 
    COMBO_TIME_BONUS_THRESHOLD, COMBO_TIME_BONUS_SECONDS, MAX_COMBO_TIME_BONUS_APPLICATIONS,
    POWERUP_TIME_FREEZE_SECONDS
} from '../constants';

type WordDisplayStatus = 'default' | 'correct' | 'skipped';

interface WordCardProps {
  word: string;
  keyProp: number;
  animationClass?: string;
  status: WordDisplayStatus;
}

const WordCard: React.FC<WordCardProps> = ({ word, keyProp, animationClass, status }) => {
  const getWordStyling = () => {
    switch (status) {
      case 'correct':
        return { colorClass: 'text-neon-green', shadow: '0 0 10px rgba(57, 255, 20, 0.8)' };
      case 'skipped':
        return { colorClass: 'text-danger-red', shadow: '0 0 10px rgba(255, 65, 54, 0.8)' };
      default:
        return { colorClass: 'text-light-text', shadow: '0 0 12px rgba(234, 234, 234, 0.6)' };
    }
  };

  const { colorClass, shadow } = getWordStyling();

  return (
    <div
      key={keyProp}
      className={`futuristic-card text-light-text p-6 sm:p-8 rounded-xl shadow-xl w-full h-full flex items-center justify-center border-2 border-electric-blue/50 animate-fadeInScaleUp ${animationClass || ''}`}
    >
      <p
        className={`text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-center break-all ${colorClass}`}
        style={{ textShadow: shadow }}
      >
        {word}
      </p>
    </div>
  );
};

interface GameScreenProps {
  settings: GameSettings;
  onGameEnd: (currentScore: number, timeLeftSeconds: number) => void;
  customCorrectSounds: CustomSoundFile[];
  customSkipSounds: CustomSoundFile[];
  customCountdownGoSound: CustomSoundFile | null; 
  // Power-up sounds (ensure these are passed from App.tsx)
  customPowerupCollectedSound?: CustomSoundFile | null;
  customPowerupTimeFreezeSound?: CustomSoundFile | null;
  customPowerupSkipFreebieUsedSound?: CustomSoundFile | null;
  customPowerupPointsDoublerAppliedSound?: CustomSoundFile | null;
}

const COUNTDOWN_STEPS = ["3", "2", "1", "GO!"];
const LUCKY_STAR_MULTIPLIERS = [2, 3]; 
const TARGET_LUCKY_STARS = 4;

const getCountdownAnimationClass = (text: string): string => {
    const mainNumericStyle = "text-7xl sm:text-8xl md:text-9xl font-extrabold font-heading";
    if (["3", "2", "1"].includes(text)) {
      return `animate-countdownPulse ${mainNumericStyle} text-cyber-purple`;
    }
    if (text === "GO!") {
      return `animate-goEffect ${mainNumericStyle} text-neon-green`;
    }
    return ''; 
  };

interface StarEffect {
  id: number;
  x: string; 
  y: string; 
  delay: string;
}

interface CatAnimationPosition {
  top: number; 
  left: number; 
}

interface PointsAwardedAnimation {
    points: number;
    isLucky: boolean;
    isCombo: boolean;
    isDoubled: boolean; 
}

interface GameMessage {
    text: string;
    key: number;
    type: 'comboActivate' | 'timeBonus' | 'powerUpFeedback';
}

export const GameScreen: React.FC<GameScreenProps> = ({ 
    settings, 
    onGameEnd,
    customCorrectSounds,
    customSkipSounds,
    customCountdownGoSound, 
    customPowerupCollectedSound,
    customPowerupTimeFreezeSound,
    customPowerupSkipFreebieUsedSound,
    customPowerupPointsDoublerAppliedSound,
}) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [wordKey, setWordKey] = useState(0);
  const [gameTimeLeft, setGameTimeLeft] = useState(settings.totalTimeLimit);
  const [cardAnimation, setCardAnimation] = useState<string | null>(null);
  const [wordStatus, setWordStatus] = useState<WordDisplayStatus>('default');
  const [isProcessingWord, setIsProcessingWord] = useState(false);

  const [countdownStepIndex, setCountdownStepIndex] = useState(0);
  const [showGameUI, setShowGameUI] = useState(false);
  
  const [pointsAwardedAnim, setPointsAwardedAnim] = useState<PointsAwardedAnimation | null>(null);
  const [pointAnimationKey, setPointAnimationKey] = useState(0);

  const [catAnimationType, setCatAnimationType] = useState<'happy' | 'sad' | null>(null);
  const [catAnimPosition, setCatAnimPosition] = useState<CatAnimationPosition | null>(null);
  const catAnimationTimerRef = useRef<number | null>(null);
  
  const [starEffects, setStarEffects] = useState<StarEffect[]>([]);
  const starEffectTimerRef = useRef<number | null>(null);

  const [luckyWordMultipliers, setLuckyWordMultipliers] = useState<Map<number, number>>(new Map());
  const countdownAudioRef = useRef<HTMLAudioElement | null>(null);

  // Combo Streak State
  const [currentComboStreak, setCurrentComboStreak] = useState(0);
  const [isComboActive, setIsComboActive] = useState(false);
  const [comboTimeBonusesAppliedThisGame, setComboTimeBonusesAppliedThisGame] = useState(0);
  const [gameMessage, setGameMessage] = useState<GameMessage | null>(null);
  const gameMessageTimerRef = useRef<number | null>(null);

  // Power-Up State
  const [isTimerFrozen, setIsTimerFrozen] = useState(false); 
  const [skipFreebiesAvailable, setSkipFreebiesAvailable] = useState(0); // Changed from isNextSkipFree
  const [isNextWordPointsDoubled, setIsNextWordPointsDoubled] = useState(false);
  const [lastTimeFreezeComboMilestone, setLastTimeFreezeComboMilestone] = useState(0);
  const [lastSkipFreebieComboMilestone, setLastSkipFreebieComboMilestone] = useState(0);
  const [lastPointsDoublerScoreMilestone, setLastPointsDoublerScoreMilestone] = useState(0);


  const gameTimerIdRef = useRef<number | null>(null);
  const countdownTimerIdRef = useRef<number | null>(null);
  const cardAnimationTimerIdRef = useRef<number | null>(null);
  const wordProcessingTimerIdRef = useRef<number | null>(null);
  const onGameEndRef = useRef(onGameEnd);

  const gameScreenRootRef = useRef<HTMLDivElement>(null);
  const correctButtonRef = useRef<HTMLButtonElement>(null);
  const skipButtonRef = useRef<HTMLButtonElement>(null);


  useEffect(() => {
    onGameEndRef.current = onGameEnd;
  }, [onGameEnd]);

  // Game Initialization and Reset Logic
  useEffect(() => {
    const array = [...settings.words];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    setShuffledWords(array);

    const numWords = array.length;
    const targetLuckyCount = Math.min(TARGET_LUCKY_STARS, numWords);
    const newLuckyMultipliers = new Map<number, number>();
    const availableIndices = Array.from({ length: numWords }, (_, i) => i);

    const shuffledForPhase1 = [...availableIndices].sort(() => 0.5 - Math.random());
    for (const index of shuffledForPhase1) {
        if (newLuckyMultipliers.size >= targetLuckyCount) break;
        const isConsecutive = newLuckyMultipliers.has(index - 1) || newLuckyMultipliers.has(index + 1);
        if (!newLuckyMultipliers.has(index) && !isConsecutive) {
            const multiplier = LUCKY_STAR_MULTIPLIERS[Math.floor(Math.random() * LUCKY_STAR_MULTIPLIERS.length)];
            newLuckyMultipliers.set(index, multiplier);
        }
    }

    if (newLuckyMultipliers.size < targetLuckyCount) {
        const remainingNeeded = targetLuckyCount - newLuckyMultipliers.size;
        const stillAvailableForPicking = availableIndices.filter(i => !newLuckyMultipliers.has(i));
        const shuffledForPhase2 = stillAvailableForPicking.sort(() => 0.5 - Math.random());
        
        for (let i = 0; i < Math.min(remainingNeeded, shuffledForPhase2.length); i++) {
            const indexToSet = shuffledForPhase2[i];
            const multiplier = LUCKY_STAR_MULTIPLIERS[Math.floor(Math.random() * LUCKY_STAR_MULTIPLIERS.length)];
            newLuckyMultipliers.set(indexToSet, multiplier);
            if (newLuckyMultipliers.size >= targetLuckyCount) break;
        }
    }
    setLuckyWordMultipliers(newLuckyMultipliers);

    setCurrentWordIndex(0);
    setCurrentScore(0);
    setGameTimeLeft(settings.totalTimeLimit);
    setWordKey(k => k + 1);
    setWordStatus('default');
    setIsProcessingWord(false);
    setCountdownStepIndex(0); 
    setShowGameUI(false);
    setCatAnimationType(null);
    setCatAnimPosition(null);
    setStarEffects([]);
    setPointsAwardedAnim(null);
    setCurrentComboStreak(0);
    setIsComboActive(false);
    setComboTimeBonusesAppliedThisGame(0);
    setGameMessage(null);

    // Reset Power-Up state
    setIsTimerFrozen(false);
    setSkipFreebiesAvailable(0); // Reset stackable freebies
    setIsNextWordPointsDoubled(false);
    setLastTimeFreezeComboMilestone(0);
    setLastSkipFreebieComboMilestone(0);
    setLastPointsDoublerScoreMilestone(0);

    const soundUrl = customCountdownGoSound?.data || SINGLE_SOUND_EFFECTS.COUNTDOWN_GO;
    if (soundUrl) {
      // If audio element exists and its src is already correct, ensure it's loaded if needed, but don't re-create.
      if (countdownAudioRef.current && countdownAudioRef.current.src === soundUrl) {
        if (countdownAudioRef.current.paused && countdownAudioRef.current.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
            countdownAudioRef.current.load(); // Ensure it's loaded if it was somehow reset or not fully loaded
        }
      } else {
        // Audio element doesn't exist, or src is different (e.g., custom sound changed or first load)
        if (countdownAudioRef.current) {
          countdownAudioRef.current.pause(); // Pause old audio if any
        }
        countdownAudioRef.current = new Audio(soundUrl);
        countdownAudioRef.current.preload = 'auto';
        countdownAudioRef.current.load(); // Explicitly load new/changed source
      }
    } else {
      // No soundUrl provided, ensure any existing audio is cleared
      if (countdownAudioRef.current) {
        countdownAudioRef.current.pause();
        countdownAudioRef.current.src = ''; // Clear src
      }
    }

    return () => {
      if (gameTimerIdRef.current) window.clearInterval(gameTimerIdRef.current);
      if (countdownTimerIdRef.current) window.clearTimeout(countdownTimerIdRef.current);
      if (cardAnimationTimerIdRef.current) window.clearTimeout(cardAnimationTimerIdRef.current);
      if (wordProcessingTimerIdRef.current) window.clearTimeout(wordProcessingTimerIdRef.current);
      if (catAnimationTimerRef.current) window.clearTimeout(catAnimationTimerRef.current);
      if (starEffectTimerRef.current) window.clearTimeout(starEffectTimerRef.current);
      if (gameMessageTimerRef.current) window.clearTimeout(gameMessageTimerRef.current);
      // Do not clear countdownAudioRef.current.src here to allow it to be reused if soundUrl is the same next time
    };
  }, [settings.words, settings.totalTimeLimit, customCountdownGoSound]); 

  // Countdown Logic
  useEffect(() => {
    if (countdownTimerIdRef.current) window.clearTimeout(countdownTimerIdRef.current);
    if (countdownStepIndex >= COUNTDOWN_STEPS.length) { 
      setShowGameUI(true);
      return; 
    }
    
    if (countdownStepIndex === 0) { // Play full sound sequence at "3"
      const currentSoundUrl = customCountdownGoSound?.data || SINGLE_SOUND_EFFECTS.COUNTDOWN_GO;
      // Check if the audio ref is properly initialized and its src matches the expected sound
      if (countdownAudioRef.current && countdownAudioRef.current.src && countdownAudioRef.current.src === currentSoundUrl) {
        countdownAudioRef.current.currentTime = 0; 
        const playPromise = countdownAudioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // Benign errors like AbortError (sound interrupted) or NotAllowedError (browser policy)
                // For NotAllowedError, it implies an issue with autoplay policies not met by user interaction.
                // The global BackgroundMusicPlayer interaction listener should generally cover this.
                if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
                  // console.warn("Countdown audio play error:", error.name, error.message);
                }
            });
        }
      } else if (currentSoundUrl) { 
        // Fallback if countdownAudioRef wasn't ready (e.g., src mismatch or not created)
        // This might happen if customCountdownGoSound changed and the setup effect didn't run yet, or an error.
        // console.warn("Countdown audio ref not ready or src mismatch, using playSound for countdown.");
        playSound(currentSoundUrl);
      }
    }

    countdownTimerIdRef.current = window.setTimeout(() => {
      setCountdownStepIndex(prev => prev + 1);
    }, 1000); 

    return () => {
      if (countdownTimerIdRef.current) window.clearTimeout(countdownTimerIdRef.current);
    };
  }, [countdownStepIndex, customCountdownGoSound]); 

  // Game Timer Logic
  useEffect(() => {
    if (!showGameUI || isProcessingWord || isTimerFrozen) return; // Pause timer if frozen
    if (gameTimeLeft <= 0) {
      if (gameTimerIdRef.current) window.clearInterval(gameTimerIdRef.current);
      onGameEndRef.current(currentScore, 0);
      return;
    }
    if (gameTimerIdRef.current) window.clearInterval(gameTimerIdRef.current); 
    gameTimerIdRef.current = window.setInterval(() => {
      setGameTimeLeft(prevTime => Math.max(0, prevTime - 1)); 
    }, 1000);
    return () => {
      if (gameTimerIdRef.current) window.clearInterval(gameTimerIdRef.current);
    };
  }, [gameTimeLeft, currentScore, showGameUI, isProcessingWord, isTimerFrozen]); // Added isTimerFrozen

  const triggerGameMessage = (text: string, type: GameMessage['type'], duration: number = 1500) => {
    setGameMessage({ text, key: Date.now(), type });
    if (gameMessageTimerRef.current) window.clearTimeout(gameMessageTimerRef.current);
    gameMessageTimerRef.current = window.setTimeout(() => setGameMessage(null), duration);
  };

  const triggerCardAnimation = (type: 'correct' | 'skip') => {
    if (cardAnimationTimerIdRef.current) window.clearTimeout(cardAnimationTimerIdRef.current);
    setCardAnimation(type === 'correct' ? 'animate-correctFlash' : 'animate-skipFlash');
    cardAnimationTimerIdRef.current = window.setTimeout(() => setCardAnimation(null), 600);
  };

  const triggerHappyAnimations = () => {
    if (!correctButtonRef.current || !gameScreenRootRef.current) return;
    const buttonRect = correctButtonRef.current.getBoundingClientRect();
    const gameAreaRect = gameScreenRootRef.current.getBoundingClientRect();
    const catEmojiHeight = 60; 
    const catEmojiWidth = 80; 
    setCatAnimPosition({
      top: buttonRect.top - gameAreaRect.top - catEmojiHeight, 
      left: buttonRect.left - gameAreaRect.left + (buttonRect.width / 2) - (catEmojiWidth / 2),
    });
    setCatAnimationType('happy');
    if (catAnimationTimerRef.current) window.clearTimeout(catAnimationTimerRef.current);
    catAnimationTimerRef.current = window.setTimeout(() => {
      setCatAnimationType(null);
      setCatAnimPosition(null);
    }, 800);

    const buttonCenterXRel = buttonRect.left - gameAreaRect.left + buttonRect.width / 2;
    const buttonTopRel = buttonRect.top - gameAreaRect.top;
    const numStars = 5;
    const starBaseSpread = 40;
    const newStarsArray: StarEffect[] = Array.from({ length: numStars }).map((_, i) => ({
      id: Date.now() + i,
      x: `${((buttonCenterXRel + (Math.random() * starBaseSpread) - (starBaseSpread / 2)) / gameAreaRect.width) * 100}%`,
      y: `${((buttonTopRel - (Math.random() * starBaseSpread * 0.2)) / gameAreaRect.height) * 100}%`,
      delay: `${Math.random() * 0.3}s`,
    }));
    setStarEffects(newStarsArray);
    if (starEffectTimerRef.current) window.clearTimeout(starEffectTimerRef.current);
    starEffectTimerRef.current = window.setTimeout(() => setStarEffects([]), 1000);
  };

  const triggerSadAnimation = () => {
     if (!skipButtonRef.current || !gameScreenRootRef.current) return;
    const buttonRect = skipButtonRef.current.getBoundingClientRect();
    const gameAreaRect = gameScreenRootRef.current.getBoundingClientRect();
    const sadEmojiHeight = 60; 
    const sadEmojiWidth = 80; 
    setCatAnimPosition({
      top: buttonRect.top - gameAreaRect.top - sadEmojiHeight,
      left: buttonRect.left - gameAreaRect.left + (buttonRect.width / 2) - (sadEmojiWidth / 2),
    });
    setCatAnimationType('sad');
    if (catAnimationTimerRef.current) window.clearTimeout(catAnimationTimerRef.current);
    catAnimationTimerRef.current = window.setTimeout(() => {
        setCatAnimationType(null);
        setCatAnimPosition(null);
    }, 800);
  };

  const advanceWord = useCallback((isCorrectGuess: boolean) => {
    if (isProcessingWord || gameTimeLeft <= 0 || !showGameUI) return;
    setIsProcessingWord(true);
    
    let newScore = currentScore;
    let awardedPointsThisTurn = 0;
    let wasLucky = false;
    let wasComboBonus = false;
    let wasDoubledThisTurn = false;

    const scoreBeforeThisWord = currentScore; 

    if (isCorrectGuess) {
      let basePointsForWord = 100;
      
      if (luckyWordMultipliers.has(currentWordIndex)) {
        wasLucky = true;
        const multiplier = luckyWordMultipliers.get(currentWordIndex) || 1;
        basePointsForWord = 100 * multiplier;
      }
      awardedPointsThisTurn += basePointsForWord;

      const newStreak = currentComboStreak + 1;
      setCurrentComboStreak(newStreak);

      if (newStreak >= COMBO_ACTIVATION_THRESHOLD) {
        if (!isComboActive) {
             playSound(customPowerupCollectedSound || SINGLE_SOUND_EFFECTS.POWERUP_COLLECTED); 
             triggerGameMessage(`COMBO ${newStreak}x ACTIVE!`, 'comboActivate', 1200);
        }
        setIsComboActive(true);
        awardedPointsThisTurn += COMBO_POINT_BONUS;
        wasComboBonus = true;

        if (newStreak === COMBO_TIME_BONUS_THRESHOLD && comboTimeBonusesAppliedThisGame < MAX_COMBO_TIME_BONUS_APPLICATIONS) {
          const newTime = Math.min(settings.totalTimeLimit, gameTimeLeft + COMBO_TIME_BONUS_SECONDS);
          setGameTimeLeft(newTime);
          setComboTimeBonusesAppliedThisGame(prev => prev + 1);
          playSound(customPowerupTimeFreezeSound || SINGLE_SOUND_EFFECTS.POWERUP_TIME_FREEZE); 
          triggerGameMessage(`+${COMBO_TIME_BONUS_SECONDS} SECONDS!`, 'timeBonus', 1500);
        }
      }
      
      if (isNextWordPointsDoubled) {
        awardedPointsThisTurn *= 2;
        wasDoubledThisTurn = true;
        setIsNextWordPointsDoubled(false); 
        playSound(customPowerupPointsDoublerAppliedSound || SINGLE_SOUND_EFFECTS.POWERUP_POINTS_DOUBLER_APPLIED);
      }
      
      newScore += awardedPointsThisTurn;
      setCurrentScore(newScore); 
      triggerCardAnimation('correct');
      setWordStatus('correct');
      
      setPointAnimationKey(prevKey => prevKey + 1); 
      setPointsAwardedAnim({ points: awardedPointsThisTurn, isLucky: wasLucky, isCombo: wasComboBonus, isDoubled: wasDoubledThisTurn });
      window.setTimeout(() => setPointsAwardedAnim(null), 1500); 
      triggerHappyAnimations();

      // Check for Milestone-Based Power-Up Earnings AFTER score and combo are updated
      if (newStreak >= 10 && newStreak % 10 === 0 && newStreak > lastTimeFreezeComboMilestone) {
        setGameTimeLeft(prev => Math.min(settings.totalTimeLimit, prev + POWERUP_TIME_FREEZE_SECONDS));
        setLastTimeFreezeComboMilestone(newStreak);
        setIsTimerFrozen(true); // Activate freeze
        window.setTimeout(() => setIsTimerFrozen(false), POWERUP_TIME_FREEZE_SECONDS * 1000); // Deactivate after duration
        playSound(customPowerupTimeFreezeSound || SINGLE_SOUND_EFFECTS.POWERUP_TIME_FREEZE);
        triggerGameMessage(`❄️ TIME FREEZE! +${POWERUP_TIME_FREEZE_SECONDS}s`, 'powerUpFeedback', 2000);
      }

      if (newStreak >= 5 && newStreak % 10 === 5 && newStreak > lastSkipFreebieComboMilestone) {
        setSkipFreebiesAvailable(prev => prev + 1); // Increment stack
        setLastSkipFreebieComboMilestone(newStreak);
        playSound(customPowerupCollectedSound || SINGLE_SOUND_EFFECTS.POWERUP_COLLECTED);
        triggerGameMessage("↪️ SKIP FREEBIE EARNED!", 'powerUpFeedback', 1500);
      }
      
      const nextScoreMilestone = (Math.floor(lastPointsDoublerScoreMilestone / 1000) + 1) * 1000;
      if (newScore >= nextScoreMilestone && scoreBeforeThisWord < nextScoreMilestone && !isNextWordPointsDoubled) {
          setIsNextWordPointsDoubled(true);
          setLastPointsDoublerScoreMilestone(nextScoreMilestone);
          playSound(customPowerupCollectedSound || SINGLE_SOUND_EFFECTS.POWERUP_COLLECTED);
          triggerGameMessage("✨ POINTS DOUBLER ACTIVE!", 'powerUpFeedback', 1500);
      }

    } else { // Skipped word
      if (skipFreebiesAvailable > 0) {
        setSkipFreebiesAvailable(prev => prev - 1); // Consume a freebie from stack
        playSound(customPowerupSkipFreebieUsedSound || SINGLE_SOUND_EFFECTS.POWERUP_SKIP_FREEBIE_USED);
        triggerGameMessage("↪️ SKIP FREEBIE USED!", 'powerUpFeedback', 1500);
        // Combo streak is NOT reset
      } else {
        setCurrentComboStreak(0); 
        setIsComboActive(false);
      }
      triggerCardAnimation('skip');
      setWordStatus('skipped');
      triggerSadAnimation();
    }

    if (wordProcessingTimerIdRef.current) window.clearTimeout(wordProcessingTimerIdRef.current);
    wordProcessingTimerIdRef.current = window.setTimeout(() => {
      if (currentWordIndex + 1 >= shuffledWords.length) {
        if (gameTimerIdRef.current) window.clearInterval(gameTimerIdRef.current);
        onGameEndRef.current(newScore, gameTimeLeft);
      } else {
        setCurrentWordIndex(prevIndex => prevIndex + 1);
        setWordKey(prevKey => prevKey + 1);
        setWordStatus('default');
      }
      setIsProcessingWord(false);
    }, 500); 
  }, [
    currentWordIndex, shuffledWords.length, gameTimeLeft, currentScore, isProcessingWord, showGameUI, 
    luckyWordMultipliers, currentComboStreak, isComboActive, comboTimeBonusesAppliedThisGame, settings.totalTimeLimit,
    skipFreebiesAvailable, isNextWordPointsDoubled, 
    lastTimeFreezeComboMilestone, lastSkipFreebieComboMilestone, lastPointsDoublerScoreMilestone,
    customPowerupCollectedSound, customPowerupTimeFreezeSound, customPowerupSkipFreebieUsedSound, customPowerupPointsDoublerAppliedSound
  ]);

  const handleCorrect = useCallback(() => {
    if (isProcessingWord || gameTimeLeft <= 0 || !showGameUI) return;
    playSound(customCorrectSounds.length > 0 ? customCorrectSounds : CORRECT_SOUNDS);
    advanceWord(true);
  }, [advanceWord, isProcessingWord, gameTimeLeft, customCorrectSounds, showGameUI]);

  const handleSkip = useCallback(() => {
    if (isProcessingWord || gameTimeLeft <= 0 || !showGameUI) return;
    if (skipFreebiesAvailable <= 0) { // Play regular skip sound only if not using a freebie
        playSound(customSkipSounds.length > 0 ? customSkipSounds : SKIP_SOUNDS);
    }
    advanceWord(false);
  }, [advanceWord, isProcessingWord, gameTimeLeft, customSkipSounds, showGameUI, skipFreebiesAvailable]);

  const handleEndGameEarly = useCallback(() => {
    if (!showGameUI || isProcessingWord || gameTimeLeft <= 0) return;
    if (gameTimerIdRef.current) window.clearInterval(gameTimerIdRef.current);
    onGameEndRef.current(currentScore, 0); 
  }, [currentScore, showGameUI, isProcessingWord, gameTimeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  const currentWord = shuffledWords[currentWordIndex];
  const currentCountdownText = COUNTDOWN_STEPS[countdownStepIndex];
  const activeLuckyMultiplier = luckyWordMultipliers.get(currentWordIndex);

  const getPointsAnimationEmoji = () => {
    if (!pointsAwardedAnim) return "";
    let emoji = "";
    if (pointsAwardedAnim.isLucky) emoji += "🌟";
    if (pointsAwardedAnim.isCombo) emoji += "🔥";
    if (pointsAwardedAnim.isDoubled) emoji += "✨";
    if (!emoji && pointsAwardedAnim.points > 0) emoji = "👍";
    return emoji;
  };


  return (
    <div ref={gameScreenRootRef} className="relative flex flex-col items-center space-y-2 text-light-text w-full">
      <div className="w-full flex justify-between items-center px-1 sm:px-2 gap-2 mb-1">
        <div className="text-lg sm:text-xl font-semibold text-neon-green text-left relative">
          POINTS: <span className="text-2xl sm:text-3xl font-bold">{currentScore}</span>
          {pointsAwardedAnim && (
            <span 
              key={pointAnimationKey}
              className={`absolute left-1/2 -translate-x-1/2 -top-8 sm:-top-10 animate-floatUpFadeOut ${
                (pointsAwardedAnim.isLucky || pointsAwardedAnim.isCombo || pointsAwardedAnim.isDoubled) 
                ? 'text-yellow-400 font-extrabold text-2xl sm:text-3xl' 
                : 'text-neon-green font-bold text-xl sm:text-2xl'
              }`}
              aria-hidden="true"
            >
              {getPointsAnimationEmoji()}
              {pointsAwardedAnim.points > 0 ? "+" : ""}
              {pointsAwardedAnim.points}
            </span>
          )}
        </div>
        <div className={`text-lg sm:text-xl font-semibold text-electric-blue text-right ${isTimerFrozen ? 'animate-timerFreezeEffect' : ''}`}>
          TIME: <span className={`text-2xl sm:text-3xl font-bold ${gameTimeLeft <= 10 && gameTimeLeft > 0 && showGameUI ? 'text-danger-red animate-pingOnce' : gameTimeLeft === 0 && showGameUI ? 'text-danger-red font-extrabold' : 'text-electric-blue'}`}>{formatTime(gameTimeLeft)}</span>
        </div>
      </div>
      
      {showGameUI && (
         <div className="flex justify-between items-center w-full text-sm sm:text-base text-muted-text mb-2 px-1 sm:px-2">
            <span>Word {Math.min(currentWordIndex + 1, shuffledWords.length)} of {shuffledWords.length}</span>
            <div className="flex items-center space-x-2">
                {skipFreebiesAvailable > 0 && (
                  <span className="text-xl text-yellow-400" title={`Skip Freebies: ${skipFreebiesAvailable}`}>
                    ↪️ x{skipFreebiesAvailable}
                  </span>
                )}
                {isNextWordPointsDoubled && <span className="text-xl text-yellow-300" title="Points Doubler Active">✨</span>}
                {currentComboStreak > 0 && (
                    <span className={`font-bold ${isComboActive ? 'text-orange-400' : 'text-muted-text'}`}>
                        🔥 Combo: x{currentComboStreak}
                    </span>
                )}
            </div>
        </div>
      )}
      
      {gameMessage && (
        <div 
          key={gameMessage.key} 
          className={`absolute top-1/3 left-1/2 -translate-x-1/2 z-50 p-3 sm:p-4 rounded-lg shadow-xl text-center
            ${gameMessage.type === 'comboActivate' ? 'bg-orange-500/90 text-white animate-comboActivatePop text-xl sm:text-2xl md:text-3xl font-bold' 
            : gameMessage.type === 'timeBonus' ? 'bg-blue-500/90 text-white animate-timeBonusFloatUp text-lg sm:text-xl md:text-2xl font-semibold' 
            : gameMessage.type === 'powerUpFeedback' ? 'bg-purple-600/90 text-white animate-powerUpAppear text-lg sm:text-xl font-semibold'
            : 'bg-gray-700/90 text-white animate-fadeInScaleUp'} `}
          role="alert"
        >
          {gameMessage.text}
        </div>
      )}


      <div className="w-full min-h-[150px] sm:min-h-[200px] md:min-h-[250px] flex items-center justify-center relative">
        {!showGameUI && currentCountdownText ? (
            <div className="countdown-text"> 
                <span className={`${getCountdownAnimationClass(currentCountdownText)}`}>
                  {currentCountdownText}
                </span>
            </div>
        ) : showGameUI && currentWord ? (
          <>
            <WordCard word={currentWord} keyProp={wordKey} animationClass={cardAnimation || ''} status={wordStatus} />
            {activeLuckyMultiplier && !isProcessingWord && (
              <div 
                className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 bg-black bg-opacity-50 p-2 rounded-lg shadow-lg z-10 animate-flash flex items-center"
                aria-live="polite"
                role="status"
              >
                <span className="text-yellow-300 text-lg sm:text-xl md:text-2xl drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" aria-hidden="true">🌟</span>
                <span className="ml-1 sm:ml-2 text-sm sm:text-md md:text-lg font-bold text-yellow-300 uppercase tracking-wider drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                  Lucky Bonus x{activeLuckyMultiplier}!
                </span>
              </div>
            )}
          </>
        ) : showGameUI && !currentWord ? ( 
          <p className="text-center text-xl text-muted-text animate-subtlePulse">Calculating Score...</p>
        ) : null }
      </div>
      
      {catAnimationType && catAnimPosition && (
        <div
          className={`cat-animation-container animate-${catAnimationType === 'happy' ? 'catHappyJump' : 'catSadAppear'}`}
          style={{
            position: 'absolute',
            top: `${catAnimPosition.top}px`,
            left: `${catAnimPosition.left}px`,
          }}
          aria-hidden="true"
        >
          {catAnimationType === 'happy' ? (
            <div className="text-5xl sm:text-6xl p-2 bg-green-500/80 rounded-full shadow-lg transform scale-75 sm:scale-100">
              <span role="img" aria-label="Happy cheering emoji">🥳</span><span className="inline-block transform translate-y-[-2px] ml-1">👍</span>
            </div>
          ) : (
            <div className="text-5xl sm:text-6xl p-2 bg-red-500/80 rounded-full shadow-lg transform scale-75 sm:scale-100">
              <span role="img" aria-label="Sad emoji">😥</span>
              <span className="inline-block py-1 px-2 text-2xl sm:text-3xl bg-white text-danger-red border-2 border-danger-red ml-1 rounded font-bold align-middle">X</span>
            </div>
          )}
        </div>
      )}

      {starEffects.length > 0 && starEffects.map(star => (
        <div
          key={star.id}
          className="absolute text-yellow-300 text-2xl sm:text-3xl animate-starPop pointer-events-none"
          style={{ top: star.y, left: star.x, animationDelay: star.delay, zIndex: 35 }}
          aria-hidden="true"
        >
          ★
        </div>
      ))}

      {showGameUI && (
        <>
            <p className="text-sm sm:text-base text-muted-text italic text-center mt-2">Player 1: Describe the word! Player 2: Guess the word!</p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full mt-2">
            <div className="flex flex-col items-center">
                <button
                ref={correctButtonRef}
                onClick={handleCorrect}
                disabled={!currentWord || gameTimeLeft <= 0 || isProcessingWord}
                className="w-full bg-gradient-to-r from-neon-green to-green-500 hover:from-green-400 hover:to-neon-green text-dark-metal font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg shadow-md hover:shadow-lg futuristic-button text-lg sm:text-xl"
                aria-label="Correct guess"
                >
                CORRECT <span role="img" aria-label="correct">✔️</span>
                </button>
            </div>
            <div className="flex flex-col items-center">
                <button
                ref={skipButtonRef}
                onClick={handleSkip}
                disabled={!currentWord || gameTimeLeft <= 0 || isProcessingWord}
                className="w-full bg-gradient-to-r from-warning-yellow to-amber-500 hover:from-amber-400 hover:to-warning-yellow text-dark-metal font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg shadow-md hover:shadow-lg futuristic-button text-lg sm:text-xl"
                aria-label="Pass word"
                >
                SKIP <span role="img" aria-label="skip">✖️</span>
                </button>
            </div>
            </div>
            <div className="w-full mt-3">
                <button
                    onClick={handleEndGameEarly}
                    disabled={!currentWord || gameTimeLeft <= 0 || isProcessingWord}
                    className="w-full bg-cyber-purple/60 hover:bg-cyber-purple/80 border border-cyber-purple/80 text-light-text/90 font-semibold py-3 sm:py-4 px-5 rounded-lg shadow futuristic-button text-lg sm:text-xl"
                    aria-label="End game and see score"
                >
                    End Game & See Score
                </button>
            </div>
        </>
      )}
    </div>
  );
};
