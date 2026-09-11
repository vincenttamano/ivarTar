import { useCallback, useEffect, useState } from 'react';
import './App.css';
import { ELEMENTS } from './data/elements.js';
import { createFighterState, endTurnSpiritsEvoke, executeSkill, startTurn } from './systems/combatEngine.js';
import { WheelSpin } from './components/WheelSpin.jsx';
import { BattleScreen } from './components/BattleScreen.jsx';

export function App() {
  const [screen, setScreen] = useState('attunement'); // 'attunement' | 'battle' | 'result'
  const [player, setPlayer] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [turn, setTurn] = useState('player'); // 'player' | 'opponent'
  const [phase, setPhase] = useState('reading'); // 'reading' | 'resolving'
  const [combatLogs, setCombatLogs] = useState([]);
  const [floaters, setFloaters] = useState([]);
  const [winner, setWinner] = useState(null);

  const [activeAction, setActiveAction] = useState(null); // { actor: 'player'|'opponent', moveKey: string, moveName: string }

  const appendLogs = useCallback((newLogs) => {
    if (!newLogs || newLogs.length === 0) return;
    const formatted = newLogs.map((item) => (typeof item === 'string' ? { text: item, type: 'info' } : item));
    setCombatLogs((prev) => [...prev, ...formatted]);
  }, []);

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
    const opponentState = createFighterState('Shadow Morrow', 'M', aiElement, false);

    setPlayer(playerState);
    setOpponent(opponentState);
    setTurn('player');
    setPhase('reading');
    setCombatLogs([
      { text: `✨ Battle initialized! ${profileData.name} (${profileData.element}) vs Shadow Morrow (${aiElement}).`, type: 'special' }
    ]);
    setScreen('battle');
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
      setWinner(evokeRes.player.name);
      setScreen('result');
      return;
    }

    setTurn('opponent');
    setPhase('resolving');
  }, [appendLogs, opponent, player]);

  // Execute confirmed skill gesture for Player
  const handlePlayerMove = useCallback((slotKey) => {
    if (turn !== 'player' || phase !== 'reading' || !player || !opponent) return;

    const skills = player.skills || (ELEMENTS[player.element] || ELEMENTS.Fire).skills;
    const skill = skills[slotKey];
    if (!skill) return;

    setPhase('resolving');
    setActiveAction({ actor: 'player', moveKey: slotKey, moveName: skill.name, element: player.element });

    const result = executeSkill(player, opponent, skill);
    if (result.success) {
      setPlayer(result.attacker);
      setOpponent(result.defender);
      appendLogs(result.combatLogs);
      setFloaters(result.floaters);

      // Check win condition
      if (result.defender.hp <= 0) {
        setWinner(result.attacker.name);
        setScreen('result');
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
  }, [appendLogs, handlePassTurnToOpponent, opponent, phase, player, turn]);

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
        setWinner(activeAi.name);
        setScreen('result');
        return;
      }

      // Run end-of-turn spirit evokes for AI
      const evokeRes = endTurnSpiritsEvoke(activeAi, activeUser);
      activeAi = evokeRes.player;
      activeUser = evokeRes.opponent;
      appendLogs(evokeRes.logs);

      if (activeUser.hp <= 0) {
        setWinner(activeAi.name);
        setScreen('result');
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
  }, [appendLogs, opponent, player, screen, turn]);

  return (
    <div className="app-main-wrapper">
      {screen === 'attunement' && <WheelSpin onAttuned={handleAttuned} />}

      {screen === 'battle' && player && opponent && (
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

      {screen === 'result' && (
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
                setScreen('attunement');
                setPlayer(null);
                setOpponent(null);
                setWinner(null);
              }}
            >
              Play Again ↻
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
