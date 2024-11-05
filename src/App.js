import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Plus, Minus, Maximize, Minimize, Settings, X } from 'lucide-react';

// Composant Modal des paramètres
const SettingsModal = ({ isOpen, onClose, settings, onSave }) => {
  const [exerciseMin, setExerciseMin] = useState(settings.exerciseMinutes);
  const [pauseMin, setPauseMin] = useState(settings.pauseMinutes);

  const handleSave = () => {
    onSave({
      exerciseMinutes: exerciseMin,
      pauseMinutes: pauseMin
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Paramètres</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Durée exercice (minutes)
            </label>
            <div className="flex items-center">
              <button 
                onClick={() => setExerciseMin(Math.max(1, exerciseMin - 1))}
                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
              >
                <Minus size={20} />
              </button>
              <span className="mx-4 text-xl w-12 text-center">{exerciseMin}</span>
              <button 
                onClick={() => setExerciseMin(exerciseMin + 1)}
                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Durée pause (minutes)
            </label>
            <div className="flex items-center">
              <button 
                onClick={() => setPauseMin(Math.max(1, pauseMin - 1))}
                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
              >
                <Minus size={20} />
              </button>
              <span className="mx-4 text-xl w-12 text-center">{pauseMin}</span>
              <button 
                onClick={() => setPauseMin(pauseMin + 1)}
                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  // État principal
  const [seconds, setSeconds] = useState(240);
  const [isActive, setIsActive] = useState(false);
  const [isPause, setIsPause] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentSet, setCurrentSet] = useState(1);
  const [totalSets, setTotalSets] = useState(5);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // État des paramètres
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    exerciseMinutes: 4,
    pauseMinutes: 2
  });

  // Empêcher la mise en veille
  useEffect(() => {
    let wakeLock = null;
    
    const requestWakeLock = async () => {
      try {
        wakeLock = await navigator.wakeLock.request('screen');
      } catch (err) {
        console.log(`${err.name}, ${err.message}`);
      }
    };

    requestWakeLock();

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    });

    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, []);

  useEffect(() => {
    let interval = null;

    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(prev => prev - 1);
      }, 1000);
    } else if (seconds === 0) {
      if (soundEnabled) {
        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.frequency.value = 880;
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        oscillator.stop(context.currentTime + 0.2);
      }

      if (!isPause) {
        setSeconds(settings.pauseMinutes * 60);
        setIsPause(true);
        setIsActive(true);
      } else {
        if (currentSet < totalSets) {
          setSeconds(settings.exerciseMinutes * 60);
          setIsPause(false);
          setCurrentSet(prev => prev + 1);
          setIsActive(true);
        } else {
          setIsActive(false);
          setIsPause(false);
          setCurrentSet(1);
          setSeconds(settings.exerciseMinutes * 60);
        }
      }
    }

    return () => clearInterval(interval);
  }, [isActive, seconds, isPause, currentSet, totalSets, soundEnabled, settings]);

  const handleSettingsSave = (newSettings) => {
    setSettings(newSettings);
    if (!isActive) {
      setSeconds(newSettings.exerciseMinutes * 60);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setSeconds(settings.exerciseMinutes * 60);
    setIsPause(false);
    setCurrentSet(1);
  };

  const adjustTotalSets = (increment) => {
    setTotalSets(prev => Math.max(1, Math.min(20, prev + increment)));
  };

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <div className="bg-white rounded-lg shadow-xl p-4 md:p-6 w-full max-w-2xl">
        <div className="flex justify-between mb-4">
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <Settings size={24} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
          </button>
        </div>

        <div className="h-[15vh] md:h-[20vh] flex items-center justify-center mb-4">
          <img 
            src={process.env.PUBLIC_URL + '/images/logo.png'} 
            alt="Ping Pong Club Airvault" 
            className="h-full w-auto object-contain" 
          />
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            {isPause ? "Pause" : "Exercice"}
          </h2>
          
          <div className="flex items-center justify-center gap-4 mb-4">
            <button 
              onClick={() => adjustTotalSets(-1)}
              disabled={isActive || totalSets <= 1}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              <Minus size={20} />
            </button>
            <span className="text-lg md:text-xl">
              Série {currentSet}/{totalSets}
            </span>
            <button 
              onClick={() => adjustTotalSets(1)}
              disabled={isActive || totalSets >= 20}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="text-5xl md:text-7xl font-mono font-bold mb-6">
            {formatTime(seconds)}
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button 
            onClick={toggleTimer}
            className="p-4 md:p-6 rounded-full bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isActive ? <Pause size={28} /> : <Play size={28} />}
          </button>
          
          <button 
            onClick={resetTimer}
            className="p-4 md:p-6 rounded-full bg-gray-500 text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            <RotateCcw size={28} />
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-4 md:p-6 rounded-full bg-gray-500 text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            {soundEnabled ? <Volume2 size={28} /> : <VolumeX size={28} />}
          </button>
        </div>
      </div>

      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={handleSettingsSave}
      />
    </div>
  );
}

export default App;
