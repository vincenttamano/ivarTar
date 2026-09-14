import { useEffect, useState } from 'react';
import { CHARACTER_IMAGES } from '../data/characterImages.js';

function SummonIcon({ type }) {
  if (type === 'Water') {
    return (
      <svg className="orbit-icon-svg" viewBox="0 0 24 24">
        <path d="M12 2 C12 2 4 12 4 17 a8 8 0 0 0 16 0 C20 12 12 2 12 2 Z" className="water-drop-fill" />
      </svg>
    );
  }
  return (
    <svg className="orbit-icon-svg" viewBox="0 0 24 24">
      <polygon points="12,2 18,9 15,22 9,22 6,9" className="ice-shard-fill" />
    </svg>
  );
}

function OrbitingSummons({ spirits }) {
  const items = (spirits || []).map((sp, idx) => ({ key: `spirit-${idx}`, type: sp }));
  if (items.length === 0) return null;

  const radius = 130;
  const step = 360 / items.length;

  return (
    <div className="orbit-ring">
      {items.map((item, idx) => {
        const angle = idx * step - 90;
        return (
          <div
            key={item.key}
            className="orbit-slot"
            style={{ transform: `rotate(${angle}deg) translate(${radius}px) rotate(${-angle}deg)` }}
          >
            <div className="orbit-icon-counter">
              <SummonIcon type={item.type} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GolemCompanion({ hp, maxHp }) {
  if (!hp || hp <= 0) return null;
  return (
    <div className="golem-companion">
      <svg className="golem-svg" viewBox="0 0 40 56">
        <polygon points="12,2 28,2 32,12 24,18 16,18 8,12" className="golem-part golem-head" />
        <circle cx="16" cy="10" r="1.6" className="golem-eye" />
        <circle cx="24" cy="10" r="1.6" className="golem-eye" />
        <polygon points="6,20 34,20 32,38 8,38" className="golem-part golem-torso" />
        <path d="M14 24 L18 30 M26 23 L22 32" className="golem-crack" />
        <polygon points="0,22 6,20 8,34 2,36" className="golem-part golem-limb" />
        <polygon points="40,22 34,20 32,34 38,36" className="golem-part golem-limb" />
        <polygon points="8,38 16,38 15,52 9,52" className="golem-part golem-limb" />
        <polygon points="24,38 32,38 31,52 25,52" className="golem-part golem-limb" />
      </svg>
      <span className="orbit-hp-label">{hp}{maxHp ? `/${maxHp}` : ''}</span>
    </div>
  );
}

function StickmanPortrait({ element, pose, animKey }) {
  const src = CHARACTER_IMAGES[element] || CHARACTER_IMAGES.Fire;
  return (
    <div className="stickman-portrait-frame">
      {pose === 'ss' && (
        <svg className="portrait-aura-ring" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" />
        </svg>
      )}
      <img
        key={animKey}
        src={src}
        alt={element}
        className={`stickman-portrait pose-${pose}`}
      />
    </div>
  );
}

export function StickmanArena({
  playerElement,
  opponentElement,
  battleBackground,
  activeAction,
  playerSpirits,
  playerGolemHp,
  playerGolemMaxHp,
  opponentSpirits,
  opponentGolemHp,
  opponentGolemMaxHp
}) {
  const [playerPose, setPlayerPose] = useState('idle');
  const [opponentPose, setOpponentPose] = useState('idle');
  const [effectFx, setEffectFx] = useState(null);
  const [actionSeq, setActionSeq] = useState(0);

  useEffect(() => {
    if (!activeAction) return;

    setActionSeq((n) => n + 1);

    const { actor, moveKey, element } = activeAction;
    const isPlayer = actor === 'player';

    if (isPlayer) {
      setPlayerPose(moveKey);
      setEffectFx({ type: moveKey, direction: 'right', element });
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

    const timer = setTimeout(() => {
      setPlayerPose('idle');
      setOpponentPose('idle');
      setEffectFx(null);
    }, 1200);

    return () => clearTimeout(timer);
  }, [activeAction]);

  return (
    <div
      className="stickman-arena-card glass-panel"
      style={{
        backgroundImage: `linear-gradient(rgba(8, 13, 23, 0.34), rgba(8, 13, 23, 0.68)), url(${battleBackground})`
      }}
    >
      <div className="stickman-stage-viewport">
        <div className="stage-floor-line" />

        {/* PLAYER (LEFT) */}
        <div className={`stickman-wrapper player-stickman pose-${playerPose}`}>
          <div className="stickman-tag">YOU</div>
          <div className="stickman-body-wrap">
            <OrbitingSummons spirits={playerSpirits} />
            <StickmanPortrait element={playerElement} pose={playerPose} animKey={`p-${actionSeq}`} />
          </div>
          <GolemCompanion hp={playerGolemHp} maxHp={playerGolemMaxHp} />
        </div>

        {/* FX MIDDLE ZONE */}
        <div className="fx-middle-zone">
          {effectFx && (
            <div className={`fx-beam-container fx-${effectFx.type} dir-${effectFx.direction}`}>
              {effectFx.type === 'atk' && <div className="fx-elemental-ball" />}
              {effectFx.type === 'atkS' && <div className="fx-laser-beam" />}
              {effectFx.type === 'ss' && <div className="fx-super-storm" />}
            </div>
          )}
        </div>

        {/* ENEMY (RIGHT) */}
        <div className={`stickman-wrapper npc-stickman pose-${opponentPose}`}>
          <div className="stickman-tag npc-tag">ENEMY</div>
          <div className="stickman-body-wrap">
            <OrbitingSummons spirits={opponentSpirits} />
            <StickmanPortrait element={opponentElement} pose={opponentPose} animKey={`n-${actionSeq}`} />
          </div>
          <GolemCompanion hp={opponentGolemHp} maxHp={opponentGolemMaxHp} />
        </div>
      </div>
    </div>
  );
}