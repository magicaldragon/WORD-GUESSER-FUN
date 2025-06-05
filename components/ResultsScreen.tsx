
import React, { useCallback, useState, useEffect, useRef } from 'react';

interface ResultsScreenProps {
  baseScore: number;  // Score from gameplay (words + lucky stars)
  timeBonus: number;
  finalScore: number; // baseScore + timeBonus
  onPlayAgain: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ 
  baseScore,      // This is the score from words + lucky stars
  timeBonus,
  finalScore,     // This is baseScore + timeBonus
  onPlayAgain,
}) => {
  const [displayedScore, setDisplayedScore] = useState(baseScore);
  const [showTimeBonusText, setShowTimeBonusText] = useState(false);
  const [scoreAnimationKey, setScoreAnimationKey] = useState(0); 
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize displayed score to the score achieved in game (pre-bonus)
    setDisplayedScore(baseScore); 
    setShowTimeBonusText(false);
    
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }

    if (timeBonus > 0) {
      setScoreAnimationKey(0); // Reset pulse animation key
      const timer1 = setTimeout(() => {
        setShowTimeBonusText(true); // Show "+Time Bonus" text
      }, 700); 

      const timer2 = setTimeout(() => {
        const startScore = baseScore; // Start counting from game score
        const endScore = finalScore;  // Count up to game score + bonus
        const countUpDuration = 1000; 
        const startTime = Date.now();

        const animateScore = () => {
          const elapsedTime = Date.now() - startTime;
          
          if (elapsedTime >= countUpDuration) {
            setDisplayedScore(endScore);
            setScoreAnimationKey(key => key + 1); // Pulse the final total score
            animationFrameIdRef.current = null;
            return;
          }
          
          const progress = elapsedTime / countUpDuration;
          const currentAnimatedScore = startScore + Math.round((endScore - startScore) * progress);
          setDisplayedScore(currentAnimatedScore);
          
          animationFrameIdRef.current = requestAnimationFrame(animateScore);
        };
        animationFrameIdRef.current = requestAnimationFrame(animateScore);
      }, 1000); // Start count-up after bonus text appears

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
        }
      };
    } else {
      // No time bonus, final score is just the base score (gameplay score).
      // Display it directly and pulse.
      setDisplayedScore(finalScore); // finalScore will be equal to baseScore here
      setScoreAnimationKey(key => key + 1); 
    }
  }, [baseScore, timeBonus, finalScore]);

  const handlePlayAgainClick = useCallback(() => {
    onPlayAgain();
  }, [onPlayAgain]);
  
  let message = "";
  let emoji = "🤔"; 

  // Message based on finalScore (which includes any earned time bonus)
  if (finalScore <= 0 && baseScore <=0) { // If game ended with 0 points and no bonus
    message = "No words guessed correctly. Better luck next time!";
    emoji = "😔";
  } else if (finalScore < 500) {
    message = "Good effort! Keep practicing to improve your score.";
    emoji = "👍";
  } else if (finalScore < 1000) {
    message = "Nice job! You're getting good at this.";
    emoji = "😊";
  } else if (finalScore < 1500) {
    message = "Great score! You're a fantastic guesser!";
    emoji = "🎉";
  } else { 
    message = "Amazing! You're a Word Guesser champion!";
    emoji = "🏆✨";
  }

  return (
    <div className="flex flex-col items-center space-y-6 text-light-text">
      <h2 className="text-4xl font-heading font-bold text-electric-blue">Game Over! <span role="img" aria-label="result emoji">{emoji}</span></h2>
      
      <div className="text-center w-full">
        <p className="text-2xl text-muted-text">Your Score:</p>
        <p 
          key={scoreAnimationKey} 
          className={`text-7xl sm:text-8xl font-extrabold font-heading text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-electric-blue to-cyber-purple my-3 ${scoreAnimationKey > 0 ? 'animate-pulseOnce' : ''}`}
        >
          {displayedScore}
        </p>

        {showTimeBonusText && timeBonus > 0 && (
          <p className="text-xl text-neon-green animate-fadeInScaleUp">
            Time Bonus: +{timeBonus}
          </p>
        )}
        
        <p className="text-xl text-muted-text italic px-4 mt-3">{message}</p>
      </div>

      <button
        onClick={handlePlayAgainClick}
        className="bg-gradient-to-r from-cyber-purple to-electric-blue hover:from-electric-blue hover:to-neon-green text-dark-metal font-bold py-3 px-8 rounded-lg shadow-md hover:shadow-lg futuristic-button text-lg"
        aria-label="Play again button"
      >
        Play Again?
      </button>
    </div>
  );
};
