
import React, { useState, useCallback } from 'react';
import { GameSettings, CustomSoundFile } from '../types';
import { DEFAULT_TOTAL_TIME_LIMIT, MIN_TOTAL_TIME_LIMIT, MAX_TOTAL_TIME_LIMIT } from '../constants';
import { FileUploadButton } from './FileUploadButton'; 

interface SetupScreenProps {
  onGameStart: (settings: GameSettings) => void;
  customBackgroundMusic: CustomSoundFile | null; 
  setCustomBackgroundMusic: (file: CustomSoundFile | null) => void;
  customGameMusic: CustomSoundFile | null; 
  setCustomGameMusic: (file: CustomSoundFile | null) => void; 
  customCorrectSounds: CustomSoundFile[];
  setCustomCorrectSounds: (files: CustomSoundFile[]) => void;
  customSkipSounds: CustomSoundFile[];
  setCustomSkipSounds: (files: CustomSoundFile[]) => void;
  customStartGameSound: CustomSoundFile | null;
  setCustomStartGameSound: (file: CustomSoundFile | null) => void;
  customPlayAgainSound: CustomSoundFile | null;
  setCustomPlayAgainSound: (file: CustomSoundFile | null) => void;
  customTimesUpSound: CustomSoundFile | null;
  setCustomTimesUpSound: (file: CustomSoundFile | null) => void;
  customGameOverSound: CustomSoundFile | null;
  setCustomGameOverSound: (file: CustomSoundFile | null) => void;
  customCountdownGoSound: CustomSoundFile | null;
  setCustomCountdownGoSound: (file: CustomSoundFile | null) => void;
  // Power-up sounds
  customPowerupCollectedSound: CustomSoundFile | null;
  setCustomPowerupCollectedSound: (file: CustomSoundFile | null) => void;
  customPowerupTimeFreezeSound: CustomSoundFile | null;
  setCustomPowerupTimeFreezeSound: (file: CustomSoundFile | null) => void;
  customPowerupSkipFreebieUsedSound: CustomSoundFile | null;
  setCustomPowerupSkipFreebieUsedSound: (file: CustomSoundFile | null) => void;
  customPowerupPointsDoublerAppliedSound: CustomSoundFile | null;
  setCustomPowerupPointsDoublerAppliedSound: (file: CustomSoundFile | null) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ 
  onGameStart,
  customBackgroundMusic, setCustomBackgroundMusic,
  customGameMusic, setCustomGameMusic, 
  customCorrectSounds, setCustomCorrectSounds,
  customSkipSounds, setCustomSkipSounds,
  customStartGameSound, setCustomStartGameSound,
  customPlayAgainSound, setCustomPlayAgainSound,
  customTimesUpSound, setCustomTimesUpSound,
  customGameOverSound, setCustomGameOverSound,
  customCountdownGoSound, setCustomCountdownGoSound,
  customPowerupCollectedSound, setCustomPowerupCollectedSound,
  customPowerupTimeFreezeSound, setCustomPowerupTimeFreezeSound,
  customPowerupSkipFreebieUsedSound, setCustomPowerupSkipFreebieUsedSound,
  customPowerupPointsDoublerAppliedSound, setCustomPowerupPointsDoublerAppliedSound,
}) => {
  const [wordsInput, setWordsInput] = useState<string>('');
  const [totalTimeLimit, setTotalTimeLimit] = useState<number>(DEFAULT_TOTAL_TIME_LIMIT);
  const [error, setError] = useState<string>('');
  const [displaySoundSettingsSection, setDisplaySoundSettingsSection] = useState<boolean>(false);
  const [displayDevUtils, setDisplayDevUtils] = useState<boolean>(false);

  const handleStartGame = useCallback(() => {
    const parsedWords = wordsInput
      .split(/[\n,]+/)
      .map(word => word.trim())
      .filter(word => word.length > 0 && word.length < 50);

    if (parsedWords.length < 3) {
      setError('Please enter at least 3 valid words (max 50 characters each).');
      return;
    }
    if (totalTimeLimit < MIN_TOTAL_TIME_LIMIT || totalTimeLimit > MAX_TOTAL_TIME_LIMIT) {
      setError(`Game time must be between ${MIN_TOTAL_TIME_LIMIT / 60} and ${MAX_TOTAL_TIME_LIMIT / 60} minutes.`);
      return;
    }
    setError('');
    onGameStart({ words: parsedWords, totalTimeLimit });
  }, [wordsInput, totalTimeLimit, onGameStart]);

  const renderSoundUploader = (
    id: string,
    label: string,
    currentSound: CustomSoundFile | null,
    setSound: (file: CustomSoundFile | null) => void,
    buttonText: string = 'Upload Sound'
  ) => (
    <div className="mb-3 p-3 border border-cyber-purple/30 rounded-lg">
      <label className="block text-sm font-semibold text-electric-blue mb-1">{label}:</label>
      {currentSound ? (
        <div className="flex items-center justify-between text-xs bg-dark-metal p-2 rounded">
          <span className="truncate" title={currentSound.name}>{currentSound.name}</span>
          <button onClick={() => setSound(null)} className="ml-2 text-danger-red hover:text-red-400 text-xs p-1">Clear</button>
        </div>
      ) : (
         <p className="text-xs text-muted-text mb-1">Default sound will be used.</p>
      )}
      <FileUploadButton
        id={id}
        label={`Upload ${label}`}
        accept="audio/*"
        onFileUpload={(file) => setSound(file)}
        buttonText={buttonText}
      />
    </div>
  );

  const renderMultiSoundUploader = (
    idPrefix: string,
    label: string,
    currentSounds: CustomSoundFile[],
    setSounds: (files: CustomSoundFile[]) => void
  ) => (
    <div className="mb-3 p-3 border border-cyber-purple/30 rounded-lg">
      <label className="block text-sm font-semibold text-electric-blue mb-1">{label}:</label>
      {currentSounds.length > 0 ? (
        <ul className="list-disc list-inside text-xs mb-2 max-h-20 overflow-y-auto bg-dark-metal p-2 rounded">
          {currentSounds.map((sound, index) => (
            <li key={`${idPrefix}-${index}`} className="flex justify-between items-center mb-1">
              <span className="truncate" title={sound.name}>{sound.name}</span>
              <button 
                onClick={() => setSounds(currentSounds.filter((_, i) => i !== index))}
                className="ml-2 text-danger-red hover:text-red-400 text-xs p-1"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
         <p className="text-xs text-muted-text mb-1">Default sounds will be used.</p>
      )}
      <FileUploadButton
        id={`${idPrefix}-uploader`}
        label={`Add ${label}`}
        accept="audio/*"
        onFileUpload={(file) => setSounds([...currentSounds, file])}
        buttonText={`Add Custom ${label.replace(' Sounds', ' Sound')}`}
      />
    </div>
  );

  const handleCopyToClipboard = (data: string, soundName: string) => {
    navigator.clipboard.writeText(data)
      .then(() => alert(`${soundName} base64 data copied to clipboard!`))
      .catch(err => {
        console.error('Failed to copy base64 data: ', err);
        alert(`Failed to copy ${soundName} data. See console for details.`);
      });
  };

  const renderBase64Exporter = (soundFile: CustomSoundFile | null, name: string) => {
    if (!soundFile) return null;
    return (
      <div className="my-2 p-2 border border-muted-text/30 rounded text-left">
        <p className="text-xs text-light-text font-semibold">{name}: <span className="font-normal italic text-muted-text">{soundFile.name}</span></p>
        <button 
          onClick={() => handleCopyToClipboard(soundFile.data, name)}
          className="text-xs bg-electric-blue/70 hover:bg-electric-blue text-dark-metal py-1 px-2 rounded mt-1 futuristic-button"
        >
          Copy Base64 Data
        </button>
      </div>
    );
  };

  const renderMultiBase64Exporter = (soundFiles: CustomSoundFile[], namePrefix: string) => {
    return soundFiles.map((soundFile, index) => (
        <div key={`${namePrefix}-${index}`} className="my-2 p-2 border border-muted-text/30 rounded text-left">
            <p className="text-xs text-light-text font-semibold">{`${namePrefix} #${index + 1}`}: <span className="font-normal italic text-muted-text">{soundFile.name}</span></p>
            <button
            onClick={() => handleCopyToClipboard(soundFile.data, `${namePrefix} #${index + 1}`)}
            className="text-xs bg-electric-blue/70 hover:bg-electric-blue text-dark-metal py-1 px-2 rounded mt-1 futuristic-button"
            >
            Copy Base64 Data
            </button>
        </div>
    ));
  };


  return (
    <div className="flex flex-col space-y-6 items-center text-light-text">
      <h2 className="text-3xl font-heading font-semibold text-electric-blue mb-2">Game Setup</h2>

      <div className="w-full">
        <label htmlFor="wordsInput" className="block text-sm font-semibold text-electric-blue mb-1 text-left uppercase tracking-wider">
          Enter Your Words <span className="text-xs text-muted-text normal-case">(comma or new line separated, min 3 words)</span>:
        </label>
        <textarea
          id="wordsInput"
          value={wordsInput}
          onChange={(e) => setWordsInput(e.target.value)}
          rows={6}
          className="w-full p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-neon-green focus:border-neon-green transition duration-150 ease-in-out futuristic-input"
          placeholder="E.g., Apple, Banana, Cherry, Date, Elephant"
          aria-label="Enter words for the game"
        />
      </div>

      <div className="w-full">
        <label htmlFor="totalTimeLimit" className="block text-sm font-semibold text-electric-blue mb-1 text-left uppercase tracking-wider">
          Set Total Game Time (seconds):
        </label>
        <input
          id="totalTimeLimit"
          type="number"
          value={totalTimeLimit}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val)) {
              setTotalTimeLimit(val);
            } else if (e.target.value === '') {
              setTotalTimeLimit(MIN_TOTAL_TIME_LIMIT); 
            }
          }}
          min={MIN_TOTAL_TIME_LIMIT}
          max={MAX_TOTAL_TIME_LIMIT}
          step="30"
          className="w-full p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-neon-green focus:border-neon-green transition duration-150 ease-in-out futuristic-input"
          aria-label="Set total game time in seconds"
        />
        <p className="text-xs text-muted-text mt-1 text-left">
          Current Setting: {Math.floor(totalTimeLimit / 60)} min {totalTimeLimit % 60} sec.
          (Range: {MIN_TOTAL_TIME_LIMIT / 60}m - {MAX_TOTAL_TIME_LIMIT / 60}m)
        </p>
      </div>
      
      <div className="w-full border-t border-cyber-purple/20 pt-4 mt-2">
        <div className="flex flex-col sm:flex-row sm:space-x-2 mb-3 w-full">
          <button 
            onClick={() => setDisplaySoundSettingsSection(!displaySoundSettingsSection)}
            className="flex-grow futuristic-button bg-dark-metal hover:bg-cyber-purple/30 text-electric-blue py-2 px-4 rounded-md text-sm w-full mb-2 sm:mb-0"
            aria-expanded={displaySoundSettingsSection}
            aria-controls="custom-sound-settings-panel"
          >
            {displaySoundSettingsSection ? 'Hide' : 'Show'} Custom Sound Settings {displaySoundSettingsSection ? '▴' : '▾'}
          </button>
        </div>

        {displaySoundSettingsSection && (
          <div id="custom-sound-settings-panel" className="border border-electric-blue/30 p-4 rounded-lg animate-fadeInScaleUp">
            <p className="text-xs text-muted-text mb-3 italic">Upload your own audio files (e.g., MP3, WAV, OGG). Changes are saved automatically to your browser's storage. Use the 'Developer Utilities' to get Base64 data for embedding sounds in code.</p>
            {renderSoundUploader('setupMusicUpload', 'Setup Screen Music', customBackgroundMusic, setCustomBackgroundMusic, 'Upload Setup Music')}
            {renderSoundUploader('gameMusicUpload', 'Game Play Music', customGameMusic, setCustomGameMusic, 'Upload Game Music')}
            {renderSoundUploader('startGameSoundUpload', 'Start Game Sound', customStartGameSound, setCustomStartGameSound)}
            {renderSoundUploader('countdownGoSoundUpload', 'Countdown "GO!" Sound', customCountdownGoSound, setCustomCountdownGoSound)}
            {renderMultiSoundUploader('correctSoundsUpload', 'Correct Guess Sounds', customCorrectSounds, setCustomCorrectSounds)}
            {renderMultiSoundUploader('skipSoundsUpload', 'Skip Word Sounds', customSkipSounds, setCustomSkipSounds)}
            {renderSoundUploader('timesUpSoundUpload', 'Time\'s Up Sound', customTimesUpSound, setCustomTimesUpSound)}
            {renderSoundUploader('gameOverSoundUpload', 'Game Over (Win) Sound', customGameOverSound, setCustomGameOverSound)}
            {renderSoundUploader('playAgainSoundUpload', 'Play Again Sound', customPlayAgainSound, setCustomPlayAgainSound)}
            {/* Power-up sound uploaders */}
            <h4 className="text-md font-semibold text-neon-green mt-4 mb-2 border-t border-electric-blue/20 pt-3">Power-Up Sounds:</h4>
            {renderSoundUploader('powerupCollectedSoundUpload', 'Power-Up Collected Sound', customPowerupCollectedSound, setCustomPowerupCollectedSound)}
            {renderSoundUploader('powerupTimeFreezeSoundUpload', 'Time Freeze Sound', customPowerupTimeFreezeSound, setCustomPowerupTimeFreezeSound)}
            {renderSoundUploader('powerupSkipFreebieUsedSoundUpload', 'Skip Freebie Used Sound', customPowerupSkipFreebieUsedSound, setCustomPowerupSkipFreebieUsedSound)}
            {renderSoundUploader('powerupPointsDoublerAppliedSoundUpload', 'Points Doubler Applied Sound', customPowerupPointsDoublerAppliedSound, setCustomPowerupPointsDoublerAppliedSound)}


            <div className="mt-6 border-t border-electric-blue/20 pt-4">
                 <button 
                    onClick={() => setDisplayDevUtils(!displayDevUtils)}
                    className="futuristic-button bg-dark-metal hover:bg-cyber-purple/30 text-neon-green py-2 px-4 rounded-md text-sm w-full mb-2"
                    aria-expanded={displayDevUtils}
                    aria-controls="dev-utils-panel"
                >
                    {displayDevUtils ? 'Hide' : 'Show'} Developer Utilities: Export Base64 {displayDevUtils ? '▴' : '▾'}
                </button>
                {displayDevUtils && (
                    <div id="dev-utils-panel" className="mt-2 p-3 border border-neon-green/30 rounded-lg animate-fadeInScaleUp max-h-60 overflow-y-auto">
                        <h4 className="text-md font-semibold text-neon-green mb-2">Export Custom Sound Data</h4>
                        <p className="text-xs text-muted-text mb-3">Use these buttons to copy the Base64 data of your uploaded sounds. You can then paste this data into `constants.ts` to embed the sounds directly into the game.</p>
                        {renderBase64Exporter(customBackgroundMusic, 'Setup Screen Music')}
                        {renderBase64Exporter(customGameMusic, 'Game Play Music')}
                        {renderBase64Exporter(customStartGameSound, 'Start Game Sound')}
                        {renderBase64Exporter(customCountdownGoSound, 'Countdown "GO!" Sound')}
                        {renderMultiBase64Exporter(customCorrectSounds, 'Correct Guess Sound')}
                        {renderMultiBase64Exporter(customSkipSounds, 'Skip Word Sound')}
                        {renderBase64Exporter(customTimesUpSound, 'Time\'s Up Sound')}
                        {renderBase64Exporter(customGameOverSound, 'Game Over (Win) Sound')}
                        {renderBase64Exporter(customPlayAgainSound, 'Play Again Sound')}
                        {/* Power-up sound exporters */}
                        {renderBase64Exporter(customPowerupCollectedSound, 'Power-Up Collected Sound')}
                        {renderBase64Exporter(customPowerupTimeFreezeSound, 'Time Freeze Sound')}
                        {renderBase64Exporter(customPowerupSkipFreebieUsedSound, 'Skip Freebie Used Sound')}
                        {renderBase64Exporter(customPowerupPointsDoublerAppliedSound, 'Points Doubler Applied Sound')}
                        
                        {(
                            !customBackgroundMusic && !customGameMusic && !customStartGameSound && !customCountdownGoSound &&
                            customCorrectSounds.length === 0 && customSkipSounds.length === 0 &&
                            !customTimesUpSound && !customGameOverSound && !customPlayAgainSound &&
                            !customPowerupCollectedSound && !customPowerupTimeFreezeSound && 
                            !customPowerupSkipFreebieUsedSound && !customPowerupPointsDoublerAppliedSound
                         ) && <p className="text-xs text-muted-text">No custom sounds uploaded yet.</p>
                        }
                    </div>
                )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-danger-red text-sm bg-red-500/20 p-2 rounded-md border border-danger-red mt-4">{error}</p>}

      <div className="w-full flex flex-col items-center mt-4">
        <button
          onClick={handleStartGame}
          disabled={wordsInput.trim().length === 0}
          className="w-full bg-gradient-to-r from-cyber-purple to-electric-blue hover:from-electric-blue hover:to-neon-green text-dark-metal font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-neon-green focus:ring-opacity-75 futuristic-button text-lg"
          aria-label="Start game button"
        >
          Start Game!
        </button>
      </div>
    </div>
  );
};