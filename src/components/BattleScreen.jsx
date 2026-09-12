import { useEffect, useState } from 'react';
import { ELEMENTS } from '../data/elements.js';
import { STATUS_META } from '../systems/statusSystem.js';
import { GestureReader, SkillControls } from './GestureReader.jsx';
import { StickmanArena } from './StickmanArena.jsx';

export function BattleScreen({
  player,
  opponent,
  turn,
  phase,
  combatLogs,
  floaters,
  activeAction,
  onConfirmMove,
  onEndTurn
}) {
  const [activeFloaters, setActiveFloaters] = useState([]);
  const [playerHitAnim, setPlayerHitAnim] = useState(false);
  const [opponentHitAnim, setOpponentHitAnim] = useState(false);

  // Floating text animation handler
  useEffect(() => {
    if (floaters && floaters.length > 0) {
      const newItems = floaters.map((f, i) => ({
        ...f,
        id: `${Date.now()}-${i}-${Math.random()}`
      }));

      setActiveFloaters((prev) => [...prev, ...newItems]);

      // Check hit animations
      floaters.forEach((f) => {
        if (f.type === 'damage') {
          if (f.target === 'player') setPlayerHitAnim(true);
          if (f.target === 'opponent') setOpponentHitAnim(true);
        }
      });

      const timer = setTimeout(() => {
        setActiveFloaters([]);
        setPlayerHitAnim(false);
        setOpponentHitAnim(false);
      }, 1400);

      return () => clearTimeout(timer);
    }
  }, [floaters]);

  const playerElData = ELEMENTS[player.element] || ELEMENTS.Fire;
  const opponentElData = ELEMENTS[opponent.element] || ELEMENTS.Fire;

  const playerSkills = player.skills || playerElData.skills || {};

  const activePlayerObj = {
    ...player,
    skills: playerSkills
  };

  return (
    <div
      className="battle-screen-container"
      style={{
        '--player-color': playerElData.color,
        '--opponent-color': opponentElData.color,
        '--battle-bg': playerElData.bgGradient
      }}
    >
      {/* SECTION 1: TOP CHARACTER PORTRAITS & STATS */}
      <main className="arena-stage">
        <div className="camera-column">
          <GestureReader
            activePlayer={activePlayerObj}
            turn={turn}
            phase={phase}
            onConfirmMove={onConfirmMove}
            onEndTurn={onEndTurn}
          />
        </div>

        <div className="fighter-stack">
        {/* PLAYER SIDE */}
        <section className={`fighter-card player-stage ${playerHitAnim ? 'shake-hit' : ''}`}>
          <div className="floating-text-container">
            {activeFloaters
              .filter((f) => f.target === player.id)
              .map((f) => (
                <div key={f.id} className={`floater-item ${f.type}`}>
                  {f.text}
                </div>
              ))}
          </div>

          <div className="portrait-frame" style={{ boxShadow: `0 0 25px ${playerElData.color}66` }}>
            <img src={playerElData.avatarImg} alt={player.name} className="fighter-portrait" />
            <div className="avatar-mark-badge">{player.avatar}</div>
          </div>

          <div className="fighter-details">
            <div className="fighter-name-row">
              <h3>{player.name}</h3>
              <span className="element-tag" style={{ background: playerElData.color }}>
                {player.element}
              </span>
            </div>

            <div className="stat-bar-group">
              <div className="stat-label-row">
                <span>HP</span>
                <span>{player.hp} / {player.maxHp}</span>
              </div>
              <div className="bar-track hp-track">
                <div
                  className="bar-fill hp-fill"
                  style={{ width: `${Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100))}%` }}
                />
              </div>
            </div>

            <div className="energy-pips-row">
              <span className="energy-title">Energy:</span>
              <div className="pips-container">
                {Array.from({ length: player.maxEnergy }).map((_, i) => (
                  <span key={i} className={`energy-pip ${i < player.energy ? 'charged' : 'empty'}`} />
                ))}
              </div>
            </div>

            {player.block > 0 && (
              <div className="block-shield-badge">🛡️ {player.block} Block</div>
            )}

            <div className="status-badges-grid">
              {player.statuses.map((st) => {
                const meta = STATUS_META[st.type] || { label: st.type, icon: '✨', color: '#94a3b8' };
                return (
                  <span key={st.type} className="status-badge-chip" style={{ borderColor: meta.color }} title={meta.desc}>
                    {meta.icon} {meta.label} x{st.stacks}
                  </span>
                );
              })}
            </div>

            <div className="companion-board-state">
              {player.golemHp > 0 && (
                <div className="companion-sprite golem-sprite">🗿 Golem HP: {player.golemHp}</div>
              )}
              {player.spirits && player.spirits.length > 0 && (
                <div className="companion-sprite spirits-queue">
                  <span className="queue-label">Spirits ({player.spirits.length}/{player.spiritCapacity}):</span>
                  {player.spirits.map((sp, idx) => (
                    <span key={idx} className={`spirit-orb ${sp.toLowerCase()}-orb`}>
                      {sp === 'Water' ? '💧' : '🧊'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="arena-center-vs">
          <div className="vs-emblem">VS</div>
        </div>

        {/* OPPONENT SIDE */}
        <section className={`fighter-card opponent-stage ${opponentHitAnim ? 'shake-hit' : ''}`}>
          <div className="floating-text-container">
            {activeFloaters
              .filter((f) => f.target === opponent.id)
              .map((f) => (
                <div key={f.id} className={`floater-item ${f.type}`}>
                  {f.text}
                </div>
              ))}
          </div>

          <div className="portrait-frame" style={{ boxShadow: `0 0 25px ${opponentElData.color}66` }}>
            <img src={opponentElData.avatarImg} alt={opponent.name} className="fighter-portrait" />
            <div className="avatar-mark-badge">{opponent.avatar}</div>
          </div>

          <div className="fighter-details">
            <div className="fighter-name-row">
              <h3>{opponent.name}</h3>
              <span className="element-tag" style={{ background: opponentElData.color }}>
                {opponent.element}
              </span>
            </div>

            <div className="stat-bar-group">
              <div className="stat-label-row">
                <span>HP</span>
                <span>{opponent.hp} / {opponent.maxHp}</span>
              </div>
              <div className="bar-track hp-track">
                <div
                  className="bar-fill hp-fill opponent-hp"
                  style={{ width: `${Math.max(0, Math.min(100, (opponent.hp / opponent.maxHp) * 100))}%` }}
                />
              </div>
            </div>

            <div className="energy-pips-row">
              <span className="energy-title">Energy:</span>
              <div className="pips-container">
                {Array.from({ length: opponent.maxEnergy }).map((_, i) => (
                  <span key={i} className={`energy-pip ${i < opponent.energy ? 'charged' : 'empty'}`} />
                ))}
              </div>
            </div>

            {opponent.block > 0 && (
              <div className="block-shield-badge">🛡️ {opponent.block} Block</div>
            )}

            <div className="status-badges-grid">
              {opponent.statuses.map((st) => {
                const meta = STATUS_META[st.type] || { label: st.type, icon: '✨', color: '#94a3b8' };
                return (
                  <span key={st.type} className="status-badge-chip" style={{ borderColor: meta.color }} title={meta.desc}>
                    {meta.icon} {meta.label} x{st.stacks}
                  </span>
                );
              })}
            </div>

            <div className="companion-board-state">
              {opponent.golemHp > 0 && (
                <div className="companion-sprite golem-sprite">🗿 Golem HP: {opponent.golemHp}</div>
              )}
              {opponent.spirits && opponent.spirits.length > 0 && (
                <div className="companion-sprite spirits-queue">
                  <span className="queue-label">Spirits ({opponent.spirits.length}/{opponent.spiritCapacity}):</span>
                  {opponent.spirits.map((sp, idx) => (
                    <span key={idx} className={`spirit-orb ${sp.toLowerCase()}-orb`}>
                      {sp === 'Water' ? '💧' : '🧊'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <SkillControls
          activePlayer={activePlayerObj}
          turn={turn}
          phase={phase}
          readerState={{ predictedLabel: 'None' }}
          onConfirmMove={onConfirmMove}
          onEndTurn={onEndTurn}
        />
        </div>
      </main>

      {/* SECTION 3: STICKMAN ARENA & COMBAT LOG */}
      <section className="stickman-and-log-row">
        <StickmanArena
          playerElement={player.element}
          opponentElement={opponent.element}
          activeAction={activeAction}
          playerSpirits={player.spirits}
          playerGolemHp={player.golemHp}
          playerGolemMaxHp={player.maxGolemHp}
          opponentSpirits={opponent.spirits}
          opponentGolemHp={opponent.golemHp}
          opponentGolemMaxHp={opponent.maxGolemHp}

        />

        <div className="combat-log-container glass-panel">
          <div className="log-header">
            <h4>Combat Log Feed</h4>
            <span className="log-badge">{combatLogs.length} events</span>
          </div>
          <div className="log-scroll-feed">
            {combatLogs.slice().reverse().map((entry, idx) => (
              <div key={idx} className={`log-item log-${entry.type || 'info'}`}>
                <span className="log-bullet">•</span>
                <span className="log-text">{entry.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
