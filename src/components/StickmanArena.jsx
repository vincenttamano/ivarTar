import { useEffect, useState } from 'react';

export function StickmanArena({ _playerElement, _opponentElement, activeAction }) {
  const [playerPose, setPlayerPose] = useState('idle');
  const [opponentPose, setOpponentPose] = useState('idle');
  const [effectFx, setEffectFx] = useState(null); // { type: 'atk'|'def'|'atkS'|'defS'|'ss', direction: 'right'|'left' }

  // Listen to active action triggers
  useEffect(() => {
    if (!activeAction) return;

    const { actor, moveKey, element } = activeAction;
    const isPlayer = actor === 'player';

    if (isPlayer) {
      setPlayerPose(moveKey);
      setEffectFx({ type: moveKey, direction: 'right', element });
      // Opponent hit flinch if it's an attack
      if (['atk', 'atkS', 'ss'].includes(moveKey)) {
        setTimeout(() => setOpponentPose('hit'), 250);
      }
    } else {
      setOpponentPose(moveKey);
      setEffectFx({ type: moveKey, direction: 'left', element });
      if (['atk', 'atkS', 'ss'].includes(moveKey)) {
        setTimeout(() => setPlayerPose('hit'), 250);
      }
    }

    // Reset back to idle after animation finishes
    const timer = setTimeout(() => {
      setPlayerPose('idle');
      setOpponentPose('idle');
      setEffectFx(null);
    }, 1200);

    return () => clearTimeout(timer);
  }, [activeAction]);

  return (
    <div className="stickman-arena-card glass-panel">
      <div className="arena-title-bar">
        <span className="arena-label">2D ELEMENTAL STICKMAN DUEL</span>
        {activeAction && (
          <span className="active-action-banner rainbow-text">
            {activeAction.actor === 'player' ? 'USER' : 'NPC'} USED {activeAction.moveName?.toUpperCase()}!
          </span>
        )}
      </div>

      <div className="stickman-stage-viewport">
        {/* Environment Floor */}
        <div className="stage-floor-line" />

        {/* USER STICKMAN (LEFT) */}
        <div className={`stickman-wrapper player-stickman pose-${playerPose}`}>
          <div className="stickman-tag">USER</div>
          <svg className="stickman-svg" viewBox="0 0 100 120">
            {/* Head */}
            <circle cx="50" cy="25" r="12" className="stick-head" />

            {/* Torso */}
            <line x1="50" y1="37" x2="50" y2="75" className="stick-body" />

            {/* Arms based on Pose */}
            {playerPose === 'atk' ? (
              <>
                <line x1="50" y1="45" x2="85" y2="45" className="stick-arm punch" />
                <line x1="50" y1="45" x2="30" y2="60" className="stick-arm" />
                <circle cx="88" cy="45" r="5" className="fist-node" />
              </>
            ) : playerPose === 'def' ? (
              <>
                <line x1="50" y1="45" x2="70" y2="30" className="stick-arm" />
                <line x1="50" y1="45" x2="70" y2="55" className="stick-arm" />
                <path d="M 72 20 Q 85 42.5 72 65" className="shield-arc" />
              </>
            ) : playerPose === 'atkS' ? (
              <>
                <line x1="50" y1="45" x2="75" y2="35" className="stick-arm" />
                <line x1="50" y1="45" x2="75" y2="55" className="stick-arm" />
                <polygon points="75,30 90,45 75,60" className="triangle-gesture" />
              </>
            ) : playerPose === 'defS' ? (
              <>
                <line x1="50" y1="45" x2="70" y2="60" className="stick-arm" />
                <line x1="50" y1="45" x2="70" y2="30" className="stick-arm" />
                <line x1="60" y1="25" x2="80" y2="65" className="x-shield-line" />
                <line x1="60" y1="65" x2="80" y2="25" className="x-shield-line" />
              </>
            ) : playerPose === 'ss' ? (
              <>
                <line x1="50" y1="45" x2="25" y2="15" className="stick-arm" />
                <line x1="50" y1="45" x2="75" y2="15" className="stick-arm" />
                <circle cx="50" cy="50" r="35" className="ultimate-aura-ring" />
              </>
            ) : playerPose === 'hit' ? (
              <>
                <line x1="50" y1="45" x2="25" y2="35" className="stick-arm" />
                <line x1="50" y1="45" x2="30" y2="65" className="stick-arm" />
              </>
            ) : (
              /* Idle */
              <>
                <line x1="50" y1="45" x2="30" y2="65" className="stick-arm" />
                <line x1="50" y1="45" x2="70" y2="65" className="stick-arm" />
              </>
            )}

            {/* Legs */}
            <line x1="50" y1="75" x2="35" y2="110" className="stick-leg" />
            <line x1="50" y1="75" x2="65" y2="110" className="stick-leg" />
          </svg>
        </div>

        {/* ANIMATED PROJECTILE & FX MIDDLE ZONE */}
        <div className="fx-middle-zone">
          {effectFx && (
            <div className={`fx-beam-container fx-${effectFx.type} dir-${effectFx.direction}`}>
              {effectFx.type === 'atk' && <div className="fx-elemental-ball" />}
              {effectFx.type === 'atkS' && <div className="fx-laser-beam" />}
              {effectFx.type === 'ss' && <div className="fx-super-storm" />}
            </div>
          )}
        </div>

        {/* NPC STICKMAN (RIGHT) */}
        <div className={`stickman-wrapper npc-stickman pose-${opponentPose}`}>
          <div className="stickman-tag npc-tag">NPC</div>
          <svg className="stickman-svg" viewBox="0 0 100 120">
            {/* Head */}
            <circle cx="50" cy="25" r="12" className="stick-head npc-head" />

            {/* Torso */}
            <line x1="50" y1="37" x2="50" y2="75" className="stick-body" />

            {/* Arms based on Pose */}
            {opponentPose === 'atk' ? (
              <>
                <line x1="50" y1="45" x2="15" y2="45" className="stick-arm punch" />
                <line x1="50" y1="45" x2="70" y2="60" className="stick-arm" />
                <circle cx="12" cy="45" r="5" className="fist-node" />
              </>
            ) : opponentPose === 'def' ? (
              <>
                <line x1="50" y1="45" x2="30" y2="30" className="stick-arm" />
                <line x1="50" y1="45" x2="30" y2="55" className="stick-arm" />
                <path d="M 28 20 Q 15 42.5 28 65" className="shield-arc" />
              </>
            ) : opponentPose === 'atkS' ? (
              <>
                <line x1="50" y1="45" x2="25" y2="35" className="stick-arm" />
                <line x1="50" y1="45" x2="25" y2="55" className="stick-arm" />
                <polygon points="25,30 10,45 25,60" className="triangle-gesture" />
              </>
            ) : opponentPose === 'defS' ? (
              <>
                <line x1="50" y1="45" x2="30" y2="60" className="stick-arm" />
                <line x1="50" y1="45" x2="30" y2="30" className="stick-arm" />
                <line x1="40" y1="25" x2="20" y2="65" className="x-shield-line" />
                <line x1="40" y1="65" x2="20" y2="25" className="x-shield-line" />
              </>
            ) : opponentPose === 'ss' ? (
              <>
                <line x1="50" y1="45" x2="25" y2="15" className="stick-arm" />
                <line x1="50" y1="45" x2="75" y2="15" className="stick-arm" />
                <circle cx="50" cy="50" r="35" className="ultimate-aura-ring" />
              </>
            ) : opponentPose === 'hit' ? (
              <>
                <line x1="50" y1="45" x2="75" y2="35" className="stick-arm" />
                <line x1="50" y1="45" x2="70" y2="65" className="stick-arm" />
              </>
            ) : (
              /* Idle */
              <>
                <line x1="50" y1="45" x2="30" y2="65" className="stick-arm" />
                <line x1="50" y1="45" x2="70" y2="65" className="stick-arm" />
              </>
            )}

            {/* Legs */}
            <line x1="50" y1="75" x2="35" y2="110" className="stick-leg" />
            <line x1="50" y1="75" x2="65" y2="110" className="stick-leg" />
          </svg>
        </div>
      </div>
    </div>
  );
}
