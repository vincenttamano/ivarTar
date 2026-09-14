import { useEffect, useRef, useState } from 'react';
import * as tmImage from '@teachablemachine/image';
import { GESTURE_SLOTS } from '../data/elements.js';

const MODEL_URL = `${import.meta.env.BASE_URL}model/`;
const CONFIDENCE_THRESHOLD = 0.85;
const DEBOUNCE_MS = 1100; // 1.1s hold time required

const TM_LABEL_TO_SLOT = {
  'Attack': 'atk',
  'Defend': 'def',
  'Special Attack': 'atkS',
  'Special Deffend': 'defS',
  'Ultimate': 'ss'
};

export function SkillControls({ activePlayer, turn, phase, readerState, onConfirmMove, onEndTurn, onInsufficientEnergy }) {
  const skillSlotsList = [
    { key: 'atk', slot: GESTURE_SLOTS.ATTACK },
    { key: 'def', slot: GESTURE_SLOTS.DEFEND },
    { key: 'atkS', slot: GESTURE_SLOTS.SPECIAL_ATTACK },
    { key: 'defS', slot: GESTURE_SLOTS.SPECIAL_DEFEND },
    { key: 'ss', slot: GESTURE_SLOTS.ULTIMATE }
  ];

  return (
    <div className="skill-controls-panel">
      <div className="skill-buttons-grid">
        {skillSlotsList.map(({ key, slot }) => {
          const skill = activePlayer.skills ? activePlayer.skills[key] : null;
          if (!skill) return null;

          const isAffordable = activePlayer.energy >= skill.cost;
          const isExhausted = activePlayer.exhaustedSkills && activePlayer.exhaustedSkills.includes(skill.id);
          const isUltimateCoolingDown = skill.slot === 'SS' && activePlayer.ultimateCooldown > 0;
          const isDisabled = turn !== 'player' || phase !== 'reading' || !isAffordable || isExhausted || isUltimateCoolingDown;

          const handleSkillClick = () => {
            if (!isAffordable) {
              onInsufficientEnergy();
              return;
            }
            onConfirmMove(key);
          };

          return (
            <button
              key={key}
              className={`skill-btn ${isDisabled || !isAffordable ? 'disabled' : ''} ${readerState.predictedLabel === skill.tmLabel ? 'active-gesture' : ''}`}
              onClick={handleSkillClick}
              disabled={turn !== 'player' || phase !== 'reading' || isExhausted || isUltimateCoolingDown}
              title={skill.description}
            >
              <div className="btn-top">
                <span className="gesture-icon">{slot.icon}</span>
                <span className="slot-name">{slot.label}</span>
              </div>
              <div className="btn-title">{skill.name}</div>
              <div className="btn-bottom">
                <span className="cost-tag">⚡ {skill.cost} Energy</span>
                <span className="gesture-hint">{slot.gestureName}</span>
              </div>
            </button>
          );
        })}
      </div>
      <button
        id="end-turn-btn"
        className="end-turn-btn action-btn secondary-btn"
        onClick={onEndTurn}
        disabled={turn !== 'player' || phase !== 'reading'}
      >
        End Turn ➔
      </button>
    </div>
  );
}

export function GestureReader({ activePlayer, turn, phase, onConfirmMove, onEndTurn, onInsufficientEnergy }) {
  const [modelStatus, setModelStatus] = useState('loading'); // 'loading' | 'live' | 'manual'
  const [readerState, setReaderState] = useState({
    predictedLabel: 'None',
    confidence: 0,
    progress: 0, // 0 to 1
    statusMsg: 'Initializing camera & gesture model...'
  });

  const videoRef = useRef(null);
  const modelRef = useRef(null);
  const streamRef = useRef(null);
  const debounceRef = useRef({ label: '', startedAt: 0 });
  const isExecutingRef = useRef(false);

  const resetCamera = async () => {
    debounceRef.current = { label: '', startedAt: 0 };
    isExecutingRef.current = false;
    setReaderState({
      predictedLabel: 'None',
      confidence: 0,
      progress: 0,
      statusMsg: 'Camera reset. Hold a valid combat gesture...'
    });

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setModelStatus('live');
    } catch (err) {
      console.warn('Camera reset failed:', err);
      setModelStatus('manual');
      setReaderState((prev) => ({ ...prev, statusMsg: 'Camera unavailable. Manual controls active.' }));
    }
  };

  // Initialize camera and model
  useEffect(() => {
    let isSubscribed = true;

    async function initCameraAndModel() {
      try {
        const loadedModel = await tmImage.load(`${MODEL_URL}model.json`, `${MODEL_URL}metadata.json`);
        if (!isSubscribed) return;
        modelRef.current = loadedModel;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
          audio: false
        });

        if (!isSubscribed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setModelStatus('live');
        setReaderState((prev) => ({ ...prev, statusMsg: 'Hold gesture in camera frame' }));
      } catch (err) {
        console.warn('Camera/Model initialization fallback to manual:', err);
        if (isSubscribed) {
          setModelStatus('manual');
          setReaderState((prev) => ({ ...prev, statusMsg: 'Manual controls active' }));
        }
      }
    }

    initCameraAndModel();

    return () => {
      isSubscribed = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Frame prediction loop during reading phase
  useEffect(() => {
    if (turn !== 'player' || phase !== 'reading' || modelStatus !== 'live' || !modelRef.current || !videoRef.current) {
      return;
    }

    let animationFrameId;
    let isActive = true;

    const predictLoop = async () => {
      if (!isActive) return;
      if (isExecutingRef.current) {
        animationFrameId = requestAnimationFrame(predictLoop);
        return;
      }

      try {
        if (videoRef.current && videoRef.current.readyState === 4) {
          const predictions = await modelRef.current.predict(videoRef.current);
          const topPrediction = predictions.reduce((best, curr) => (curr.probability > best.probability ? curr : best), predictions[0]);

          const label = topPrediction.className;
          const prob = topPrediction.probability;
          const now = performance.now();

          const slotKey = TM_LABEL_TO_SLOT[label];
          const isNeutral = !slotKey || label === 'None' || prob < CONFIDENCE_THRESHOLD;

          if (isNeutral) {
            debounceRef.current = { label: '', startedAt: 0 };
            setReaderState({
              predictedLabel: label,
              confidence: prob,
              progress: 0,
              statusMsg: 'Hold a valid combat gesture...'
            });
          } else {
            // Valid move prediction
            if (debounceRef.current.label !== label) {
              debounceRef.current = { label, startedAt: now };
              setReaderState({
                predictedLabel: label,
                confidence: prob,
                progress: 0.1,
                statusMsg: `Holding ${label}...`
              });
            } else {
              const elapsed = now - debounceRef.current.startedAt;
              const progressRatio = Math.min(1, elapsed / DEBOUNCE_MS);

              setReaderState({
                predictedLabel: label,
                confidence: prob,
                progress: progressRatio,
                statusMsg: progressRatio >= 1 ? 'GESTURE CONFIRMED!' : `Holding ${label} (${(DEBOUNCE_MS - elapsed).toFixed(0)}ms)`
              });

              if (progressRatio >= 1 && !isExecutingRef.current) {
                isExecutingRef.current = true;
                const targetSkill = activePlayer.skills ? activePlayer.skills[slotKey] : null;

                const ultimateCoolingDown = targetSkill?.slot === 'SS' && activePlayer.ultimateCooldown > 0;
                if (targetSkill && activePlayer.energy >= targetSkill.cost && !ultimateCoolingDown) {
                  onConfirmMove(slotKey);
                } else {
                  onInsufficientEnergy();
                  setReaderState((prev) => ({ ...prev, statusMsg: 'Not enough energy for this move!' }));
                }

                setTimeout(() => {
                  isExecutingRef.current = false;
                  debounceRef.current = { label: '', startedAt: 0 };
                }, 800);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Prediction error:', err);
      }

      if (isActive) {
        animationFrameId = requestAnimationFrame(predictLoop);
      }
    };

    predictLoop();

    return () => {
      isActive = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [activePlayer, modelStatus, onConfirmMove, onInsufficientEnergy, phase, turn]);

  return (
    <aside className="gesture-reader-container glass-panel">
      <div className="reader-header">
        <div className="status-badge-row">
          <span className={`live-dot ${modelStatus === 'live' ? 'online' : 'offline'}`} />
          <span className="mode-label">
            {modelStatus === 'live' ? 'CAMERA ONLINE' : modelStatus === 'manual' ? 'MANUAL CONTROLS' : 'CONNECTING...'}
          </span>
        </div>
        <div className="reader-header-actions">
          <div className="confidence-chip">{Math.round(readerState.confidence * 100)}% Match</div>
          <button type="button" className="reset-camera-btn" onClick={resetCamera} title="Reset camera and gesture detection">
            ↻ Reset
          </button>
        </div>
      </div>

      {/* Video Viewport / Camera Box */}
      <div className="webcam-viewport large-camera">
        <video ref={videoRef} className="webcam-video" muted playsInline />
        <div className="viewport-overlay">
          <div className="scanline" />
          <div className="camera-corners">
            <span className="corner top-l" />
            <span className="corner top-r" />
            <span className="corner bot-l" />
            <span className="corner bot-r" />
          </div>
          <div className="detected-label-banner">
            <span className="gesture-icon">
              {readerState.predictedLabel in TM_LABEL_TO_SLOT ? '✋' : '🔍'}
            </span>
            <span className="gesture-text">{readerState.predictedLabel === 'None' ? 'Show a gesture' : readerState.predictedLabel}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar for Hold Time */}
      <div className="debounce-progress-container">
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${Math.round(readerState.progress * 100)}%` }}
          />
        </div>
        <p className="status-msg-text">{readerState.statusMsg}</p>
      </div>

    </aside>
  );
}
