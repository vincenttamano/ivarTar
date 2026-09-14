import { useEffect, useRef, useState } from 'react';
import { ELEMENTS } from '../data/elements.js';

const WHEEL_SECTORS = [
  { id: 'Fire', label: 'Fire', color: '#f97316', weight: 0.2475 },
  { id: 'Water', label: 'Water', color: '#06b6d4', weight: 0.2475 },
  { id: 'Air', label: 'Air', color: '#38bdf8', weight: 0.2475 },
  { id: 'Earth', label: 'Earth', color: '#10b981', weight: 0.2475 },
  { id: 'IVARtar', label: 'IVARtar', color: '#a855f7', weight: 0.0100 }
];

export function rollWeightedElement() {
  const rand = Math.random();
  let cumulative = 0;
  for (const sector of WHEEL_SECTORS) {
    cumulative += sector.weight;
    if (rand <= cumulative) {
      return sector.id;
    }
  }
  return 'Fire';
}

export function WheelSpin({ onAttuned }) {
  const [playerName, setPlayerName] = useState('');
  const [playerAvatar, setPlayerAvatar] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [showJackpotEffect, setShowJackpotEffect] = useState(false);
  const [selectedMoves, setSelectedMoves] = useState({});

  const canvasRef = useRef(null);

  // Render wheel slices on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 10;

    ctx.clearRect(0, 0, width, height);

    const sliceAngle = (Math.PI * 2) / WHEEL_SECTORS.length;

    WHEEL_SECTORS.forEach((sector, idx) => {
      const startAngle = idx * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      // Slice background
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = sector.color;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.stroke();

      // Sector label
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(sector.label, radius - 20, 5);
      ctx.restore();
    });

    // Center hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 32, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌀', centerX, centerY);
  }, []);

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setShowJackpotEffect(false);

    const drawnId = rollWeightedElement();
    const sectorIndex = WHEEL_SECTORS.findIndex((s) => s.id === drawnId);

    // Calculate angle to stop indicator at top
    const sectorAngle = 360 / WHEEL_SECTORS.length;
    // Top pointer is 270 degrees in standard canvas coords
    const targetSectorCenter = sectorIndex * sectorAngle + sectorAngle / 2;

    const fullSpins = 5 + Math.floor(Math.random() * 3);
    const totalRotation = fullSpins * 360 + (360 - targetSectorCenter + 270) % 360;

    setRotationDegrees(totalRotation);

    setTimeout(() => {
      setSelectedElement(drawnId);
      setIsSpinning(false);

      if (drawnId === 'IVARtar') {
        setShowJackpotEffect(true);
        setSelectedMoves({
          atk: ELEMENTS.IVARtar.skills.atk,
          def: ELEMENTS.IVARtar.skills.def,
          atkS: ELEMENTS.IVARtar.skills.atkS,
          defS: ELEMENTS.IVARtar.skills.defS,
          ss: ELEMENTS.IVARtar.skills.ss
        });
      }
    }, 4000);
  };

  const handleElementSelect = (elementId) => {
    setSelectedElement(elementId || null);
    setShowJackpotEffect(elementId === 'IVARtar');

    if (elementId === 'IVARtar') {
      setSelectedMoves({
        atk: ELEMENTS.IVARtar.skills.atk,
        def: ELEMENTS.IVARtar.skills.def,
        atkS: ELEMENTS.IVARtar.skills.atkS,
        defS: ELEMENTS.IVARtar.skills.defS,
        ss: ELEMENTS.IVARtar.skills.ss
      });
    } else {
      setSelectedMoves({});
    }
  };

  const handleEnterArena = () => {
    if (!selectedElement) return;
    onAttuned({
      name: playerName.trim() || 'Astra',
      avatar: playerAvatar.trim().toUpperCase() || (playerName[0] ? playerName[0].toUpperCase() : 'A'),
      element: selectedElement,
      skills: selectedElement === 'IVARtar' ? selectedMoves : null
    });
  };

  const elementInfo = selectedElement ? ELEMENTS[selectedElement] : null;
  const moveSlots = [
    ['atk', 'Attack'],
    ['def', 'Defend'],
    ['atkS', 'Special Attack'],
    ['defS', 'Special Defend'],
    ['ss', 'Ultimate']
  ];
  const selectableSkills = Object.values(ELEMENTS).flatMap((element) => Object.values(element.skills));

  return (
    <div className="wheel-screen-wrapper">
      <div className="wheel-card glass-panel">
        <div className="brand-header">
          <span className="brand-badge">ELEMENTAL BATTLER</span>
          <h1>Attune Your Spirit</h1>
          <p className="subtext">Enter your avatar tag, choose an element, or spin the wheel to lock in your battle kit.</p>
        </div>

        <div className="profile-inputs">
          <div className="input-group">
            <label htmlFor="player-name-input">Callsign / Name</label>
            <input
              id="player-name-input"
              type="text"
              placeholder="e.g. Phoenix"
              maxLength={16}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              disabled={isSpinning}
            />
          </div>
          <div className="input-group short">
            <label htmlFor="player-avatar-input">Avatar Mark</label>
            <input
              id="player-avatar-input"
              type="text"
              placeholder="P"
              maxLength={2}
              value={playerAvatar}
              onChange={(e) => setPlayerAvatar(e.target.value)}
              disabled={isSpinning}
            />
          </div>
        </div>

        <div className="element-select-group">
          <label htmlFor="element-select">Choose your element</label>
          <select
            id="element-select"
            value={selectedElement || ''}
            onChange={(event) => handleElementSelect(event.target.value)}
            disabled={isSpinning}
          >
            <option value="">Select an element...</option>
            {WHEEL_SECTORS.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {sector.label}{sector.id === 'IVARtar' ? ' (Rare)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Wheel Graphic Container */}
        <div className="wheel-stage">
          <div className="wheel-pointer">▼</div>
          <div
            className={`wheel-canvas-container ${isSpinning ? 'spinning' : ''} ${showJackpotEffect ? 'jackpot-glow' : ''}`}
            style={{
              transform: `rotate(${rotationDegrees}deg)`,
              transition: isSpinning ? 'transform 4s cubic-bezier(0.15, 0.90, 0.20, 1.00)' : 'none'
            }}
          >
            <canvas ref={canvasRef} width={320} height={320} className="wheel-canvas" />
          </div>
        </div>

        {/* Wheel Odds Footer */}
        <div className="wheel-odds-bar">
          <span>Odds: Fire 24.75% · Water 24.75% · Air 24.75% · Earth 24.75% · <strong className="rainbow-text">IVARtar 1%</strong></span>
        </div>

        {/* Results Banner */}
        {selectedElement && elementInfo ? (
          <div className={`attunement-result glass-card ${showJackpotEffect ? 'jackpot-card' : ''}`}>
            {showJackpotEffect && <div className="jackpot-banner">✨ RARE 1% IVARTAR JACKPOT! ✨</div>}
            <div className="result-header">
              <span className="element-chip" style={{ background: elementInfo.color }}>{elementInfo.name}</span>
              <h2>{elementInfo.title}</h2>
            </div>
            <p className="passive-desc"><strong>Passive:</strong> {elementInfo.passiveDescription}</p>
            <div className="stat-summary">
              <span>❤️ Base HP: {elementInfo.baseHp}</span>
              <span>⚡ Base Energy: {elementInfo.baseEnergy + elementInfo.passiveEnergyBonus}</span>
            </div>

            {showJackpotEffect && (
              <div className="loadout-picker">
                <div className="loadout-heading">
                  <strong>Build your move set</strong>
                  <span>Choose one move for each gesture.</span>
                </div>
                <div className="loadout-grid">
                  {moveSlots.map(([slotKey, label]) => (
                    <label key={slotKey} className="loadout-field">
                      <span>{label}</span>
                      <select
                        value={selectedMoves[slotKey]?.id || ''}
                        onChange={(event) => {
                          const nextSkill = selectableSkills.find((skill) => skill.id === event.target.value);
                          setSelectedMoves((previous) => ({ ...previous, [slotKey]: nextSkill }));
                        }}
                      >
                        {selectableSkills
                          .filter((skill) => skill.slot.toLowerCase() === slotKey.toLowerCase())
                          .map((skill) => (
                            <option key={skill.id} value={skill.id}>
                              {skill.name} ({skill.cost} energy)
                            </option>
                          ))}
                      </select>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              id="enter-arena-btn"
              className={`action-btn primary-btn ${showJackpotEffect ? 'jackpot-btn' : ''}`}
              onClick={handleEnterArena}
            >
              Enter the Arena ➔
            </button>
          </div>
        ) : (
          <button
            id="spin-wheel-btn"
            className="action-btn spin-btn"
            onClick={handleSpin}
            disabled={isSpinning}
          >
            {isSpinning ? 'Reading the Wheel...' : 'Spin the Wheel ↻'}
          </button>
        )}
      </div>
    </div>
  );
}
