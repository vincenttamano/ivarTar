import { useCallback, useEffect, useState } from 'react';
import './App.css';
import { ELEMENTS } from './data/elements.js';
import { createFighterState, endTurnSpiritsEvoke, executeSkill, startTurn } from './systems/combatEngine.js';
import { WheelSpin } from './components/WheelSpin.jsx';
import { BattleScreen } from './components/BattleScreen.jsx';
import airMoveSfx from '../IvartarAssets/airMoveSFX.mp3';
import waterMoveSfx from '../IvartarAssets/waterMoveSFX.mp3';
import fireMoveSfx from '../IvartarAssets/fireMoveSFX.mp3';
import earthMoveSfx from '../IvartarAssets/earthMoveSFX.mp3';
import fatalitySfx from '../IvartarAssets/fatalitySFX.mp3';
import introCutscene from '../IvartarAssets/introCutscene.mp4';
import transitionBackground from '../IvartarAssets/transitionBG.jpg';
import ivarTarLogo from '../IvartarAssets/IVARtarLogo.jpg';

const MOVE_SFX = {
  Air: airMoveSfx,
  Water: waterMoveSfx,
  Fire: fireMoveSfx,
  Earth: earthMoveSfx,
  IVARtar: fireMoveSfx
};

const TRANSITION_DURATION = 2000;

let activeMoveAudio = null;

function playSound(source, volume = 0.7, durationMs = null) {
  const audio = new Audio(source);
  audio.volume = volume;
  audio.play().catch(() => {});
  if (durationMs) {
    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, durationMs);
  }
}

function playMoveSound(source) {
  if (activeMoveAudio) {
    activeMoveAudio.pause();
    activeMoveAudio.currentTime = 0;
  }

  activeMoveAudio = new Audio(source);
  activeMoveAudio.volume = 0.7;
  activeMoveAudio.play().catch(() => {});
  const moveAudio = activeMoveAudio;

  setTimeout(() => {
    if (activeMoveAudio === moveAudio) {
      moveAudio.pause();
      moveAudio.currentTime = 0;
      activeMoveAudio = null;
    }
  }, 3000);
}

export function App() {
  const [screen, setScreen] = useState('attunement'); // 'attunement' | 'battle' | 'result'
  const [introState, setIntroState] = useState('transition-in');
  const [showTransition, setShowTransition] = useState(introState === 'transition-in');
  const [introSoundBlocked, setIntroSoundBlocked] = useState(false);
  const [player, setPlayer] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [turn, setTurn] = useState('player'); // 'player' | 'opponent'
  const [phase, setPhase] = useState('reading'); // 'reading' | 'resolving'
  const [combatLogs, setCombatLogs] = useState([]);
  const [floaters, setFloaters] = useState([]);
  const [winner, setWinner] = useState(null);

  const [activeAction, setActiveAction] = useState(null); // { actor: 'player'|'opponent', moveKey: string, moveName: string }

  const opponentNames = ['Shadow Morrow', 'Ashen Veyra', 'Ruin Calder', 'Night Vale', 'Ember Wraith', 'Frost Harrow'];

  const finishIntro = useCallback(() => {
    setIntroState('transition-out');
    setShowTransition(true);
    setTimeout(() => {
      setIntroState('done');
      setShowTransition(false);
    }, TRANSITION_DURATION);
  }, []);

  useEffect(() => {
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) favicon.href = ivarTarLogo;
    const shortcutIcon = document.querySelector('link[rel="shortcut icon"]');
    if (shortcutIcon) shortcutIcon.href = ivarTarLogo;
  }, []);

  const enableIntroSound = (event) => {
    const video = event.currentTarget.previousElementSibling;
    video.muted = false;
    video.play().then(() => setIntroSoundBlocked(false)).catch(() => setIntroSoundBlocked(true));
  };

  useEffect(() => {
    if (introState !== 'transition-in') return undefined;
    const timer = setTimeout(() => {
      setShowTransition(false);
      setIntroState('intro');
    }, TRANSITION_DURATION);
    return () => clearTimeout(timer);
  }, [introState]);

  const transitionTo = useCallback((nextScreen) => {
    setShowTransition(true);
    setTimeout(() => {
      setScreen(nextScreen);
      setTimeout(() => setShowTransition(false), TRANSITION_DURATION / 2);
    }, TRANSITION_DURATION / 2);
  }, []);

  const appendLogs = useCallback((newLogs) => {
    if (!newLogs || newLogs.length === 0) return;
    const formatted = newLogs.map((item) => (typeof item === 'string' ? { text: item, type: 'info' } : item));
    setCombatLogs((prev) => [...prev, ...formatted]);
  }, []);

  const finishBattle = useCallback((winnerName) => {
    playSound(fatalitySfx, 0.85);
    setWinner(winnerName);
    transitionTo('result');
  }, [transitionTo]);

  // Initialize Battle after Element Attunement
  const handleAttuned = (profileData) => {
    const playerState = createFighterState(
      profileData.name,
      profileData.avatar,
      profileData.element,
      true,
      profileData.skills
    );

    // Pick random element for Opponent
    const availableElements = ['Fire', 'Water', 'Air', 'Earth'];
    const aiElement = availableElements[Math.floor(Math.random() * availableElements.length)];
    const opponentName = opponentNames[Math.floor(Math.random() * opponentNames.length)];
    const opponentState = createFighterState(opponentName, 'M', aiElement, false);

    setPlayer(playerState);
    setOpponent(opponentState);
    setTurn('player');
    setPhase('reading');
    setCombatLogs([
      { text: `✨ Battle initialized! ${profileData.name} (${profileData.element}) vs ${opponentName} (${aiElement}).`, type: 'special' }
    ]);
    transitionTo('battle');
  };

  // Player passes turn
  const handlePassTurnToOpponent = useCallback((activeP = player, activeOpp = opponent) => {
    // Run end-of-turn spirit evokes for Player
    const evokeRes = endTurnSpiritsEvoke(activeP, activeOpp);
    setPlayer(evokeRes.player);
    setOpponent(evokeRes.opponent);
    appendLogs(evokeRes.logs);
    if (evokeRes.floaters.length > 0) setFloaters(evokeRes.floaters);

    if (evokeRes.opponent.hp <= 0) {
      finishBattle(evokeRes.player.name);
      return;
    }

    setTurn('opponent');
    setPhase('resolving');
  }, [appendLogs, finishBattle, opponent, player]);

  // Execute confirmed skill gesture for Player
  const handlePlayerMove = useCallback((slotKey) => {
    if (turn !== 'player' || phase !== 'reading' || !player || !opponent) return;

    const skills = player.skills || (ELEMENTS[player.element] || ELEMENTS.Fire).skills;
    const skill = skills[slotKey];
    if (!skill) return;

    setPhase('resolving');
    setActiveAction({ actor: 'player', moveKey: slotKey, moveName: skill.name, element: player.element });
    playMoveSound(MOVE_SFX[player.element] || MOVE_SFX.Fire);

    const result = executeSkill(player, opponent, skill);
    if (result.success) {
      setPlayer(result.attacker);
      setOpponent(result.defender);
      appendLogs(result.combatLogs);
      setFloaters(result.floaters);

      // Check win condition
      if (result.defender.hp <= 0) {
        finishBattle(result.attacker.name);
        return;
      }

      if (skill.slot === 'SS') {
        appendLogs([{ text: `🌟 Ultimate complete. Passing turn to opponent...`, type: 'special' }]);
        setTimeout(() => {
          handlePassTurnToOpponent(result.attacker, result.defender);
        }, 800);
        return;
      }

      // Check if Player has energy left for any remaining skill
      const nextAttacker = result.attacker;
      const hasAffordableSkill = Object.values(skills).some((s) => {
        const isExhausted = nextAttacker.exhaustedSkills.includes(s.id);
        const isUltimateCoolingDown = s.slot === 'SS' && nextAttacker.ultimateCooldown > 0;
        return !isExhausted && !isUltimateCoolingDown && nextAttacker.energy >= s.cost;
      });

      if (hasAffordableSkill) {
        // Multi-action turn: keep playing!
        setPhase('reading');
      } else {
        // No legal skills affordable, pass turn to opponent
        appendLogs([{ text: `⚡ No remaining affordable skills. Passing turn to opponent...`, type: 'info' }]);
        setTimeout(() => {
          handlePassTurnToOpponent(nextAttacker, result.defender);
        }, 800);
      }
    } else {
      setPhase('reading');
    }
  }, [appendLogs, finishBattle, handlePassTurnToOpponent, opponent, phase, player, turn]);

  // AI Opponent Turn Logic
  useEffect(() => {
    if (screen !== 'battle' || turn !== 'opponent' || !opponent || !player) return;

    const aiTimer = setTimeout(() => {
      // Start AI turn: refill energy & decay statuses
      const startRes = startTurn(opponent);
      let activeAi = startRes.updated;
      let activeUser = player;
      appendLogs(startRes.logEntries);

      const aiSkills = Object.values(activeAi.skills || (ELEMENTS[activeAi.element] || ELEMENTS.Fire).skills);

      // AI multi-action loop: perform skills while energy permits
      let keepActing = true;
      const aiLogs = [];
      const aiFloaters = [];

      while (keepActing && activeAi.energy > 0 && activeUser.hp > 0) {
        const legalSkills = aiSkills.filter((s) => {
          const isUltimateCoolingDown = s.slot === 'SS' && activeAi.ultimateCooldown > 0;
          return !activeAi.exhaustedSkills.includes(s.id) && !isUltimateCoolingDown && s.cost <= activeAi.energy;
        });
        if (legalSkills.length === 0) {
          keepActing = false;
          break;
        }

        const chosenSkill = legalSkills[Math.floor(Math.random() * legalSkills.length)];
        setActiveAction({ actor: 'opponent', moveKey: chosenSkill.slot.toLowerCase(), moveName: chosenSkill.name, element: activeAi.element });
        playMoveSound(MOVE_SFX[activeAi.element] || MOVE_SFX.Fire);
        const res = executeSkill(activeAi, activeUser, chosenSkill);

        if (res.success) {
          activeAi = res.attacker;
          activeUser = res.defender;
          aiLogs.push(...res.combatLogs);
          aiFloaters.push(...res.floaters);
          if (chosenSkill.slot === 'SS') {
            aiLogs.push({ text: `🌟 Ultimate complete. Ending opponent turn.`, type: 'special' });
            keepActing = false;
          }
        } else {
          keepActing = false;
        }
      }

      setOpponent(activeAi);
      setPlayer(activeUser);
      appendLogs(aiLogs);
      if (aiFloaters.length > 0) setFloaters(aiFloaters);

      if (activeUser.hp <= 0) {
        finishBattle(activeAi.name);
        return;
      }

      // Run end-of-turn spirit evokes for AI
      const evokeRes = endTurnSpiritsEvoke(activeAi, activeUser);
      activeAi = evokeRes.player;
      activeUser = evokeRes.opponent;
      appendLogs(evokeRes.logs);

      if (activeUser.hp <= 0) {
        finishBattle(activeAi.name);
        return;
      }

      // Pass turn back to Player
      const pStartRes = startTurn(activeUser);
      setPlayer(pStartRes.updated);
      setOpponent(activeAi);
      appendLogs(pStartRes.logEntries);
      setTurn('player');
      setPhase('reading');
    }, 1200);

    return () => clearTimeout(aiTimer);
  }, [appendLogs, finishBattle, opponent, player, screen, turn]);

  return (
    <div className="app-main-wrapper">
      {introState === 'intro' && (
        <div className="intro-cutscene-screen">
          <video
            className="intro-cutscene-video"
            src={introCutscene}
            autoPlay
            playsInline
            onCanPlay={(event) => {
              event.currentTarget.muted = false;
              event.currentTarget.play().catch(() => setIntroSoundBlocked(true));
            }}
            onEnded={finishIntro}
          />
          {introSoundBlocked && (
            <button type="button" className="enable-intro-sound-btn" onClick={enableIntroSound}>
              Enable sound
            </button>
          )}
          <button type="button" className="skip-intro-btn" onClick={finishIntro}>
            Skip cutscene
          </button>
        </div>
      )}

      {introState === 'done' && screen === 'attunement' && <WheelSpin onAttuned={handleAttuned} />}

      {introState === 'done' && screen === 'battle' && player && opponent && (
        <BattleScreen
          player={player}
          opponent={opponent}
          turn={turn}
          phase={phase}
          combatLogs={combatLogs}
          floaters={floaters}
          activeAction={activeAction}
          onConfirmMove={handlePlayerMove}
          onEndTurn={() => handlePassTurnToOpponent(player, opponent)}
        />
      )}

      {introState === 'done' && screen === 'result' && (
        <div className="modal-overlay">
          <div className="modal-card glass-panel">
            <div className="result-icon">{winner === player?.name ? '🏆' : '💀'}</div>
            <h1>{winner === player?.name ? 'VICTORY!' : 'DEFEAT'}</h1>
            <p className="result-desc">
              {winner === player?.name
                ? `Congratulations ${player?.name}! Your ${player?.element} attunement proved superior.`
                : `${player?.name} was defeated in combat. Re-attune and try again!`}
            </p>
            <button
              className="action-btn primary-btn"
              onClick={() => {
                setPlayer(null);
                setOpponent(null);
                setWinner(null);
                transitionTo('attunement');
              }}
            >
              Play Again ↻
            </button>
          </div>
        </div>
      )}

      {showTransition && (
        <div
          className="page-transition-overlay"
          style={{ '--transition-background': `url(${transitionBackground})` }}
          aria-live="polite"
          aria-label="Loading"
        >
          <div className="transition-loader" />
        </div>
      )}
    </div>
  );
}

export default App;
