import { useCallback, useEffect, useRef, useState } from 'react'
import * as tmImage from '@teachablemachine/image'
import './App.css'

const MODEL_URL = '/model/'
const CONFIDENCE_THRESHOLD = 0.85
const DEBOUNCE_MS = 1100

const elements = {
  Fire: { icon: 'F', color: '#ff6b4a', accent: '#ffc04d', image: '/model/fire.jpg' },
  Water: { icon: 'W', color: '#49a7e8', accent: '#b9edff', image: '/model/water.png' },
  Air: { icon: 'A', color: '#9b82f6', accent: '#d6caff', image: '/model/air.jpg' },
  Earth: { icon: 'E', color: '#6fba74', accent: '#c8e7a6', image: '/model/earth.png' },
  IVARtar: { icon: 'I', color: '#f4b942', accent: '#ffe49a', image: '/model/ivartar.jpg' },
}

const moves = [
  { id: 'attack', name: 'Basic attack', short: 'ATK', label: 'Attack', cost: 1, damage: 10, kind: 'attack' },
  { id: 'defend', name: 'Basic defend', short: 'DEF', label: 'Defend', cost: 1, kind: 'defend' },
  { id: 'specialAttack', name: 'Special attack', short: 'S-ATK', label: 'Special Attack', cost: 2, damage: 20, kind: 'attack' },
  { id: 'specialDefend', name: 'Special defend', short: 'S-DEF', label: 'Special Deffend', cost: 2, kind: 'specialDefend' },
  { id: 'ultimate', name: 'Ultimate', short: 'ULT', label: 'Ultimate', cost: 3, damage: 35, kind: 'ultimate' },
]

const matchup = { Fire: 'Earth', Earth: 'Air', Air: 'Water', Water: 'Fire' }

function rollElement() {
  const roll = Math.random()
  if (roll < 0.05) return 'IVARtar'
  return ['Fire', 'Water', 'Air', 'Earth'][Math.floor((roll - 0.05) * 4 / 0.95)]
}

function getEffectiveness(attacker, defender) {
  // IVARtar is neutral for now; this is the future wildcard rule switch.
  if (attacker === 'IVARtar' || defender === 'IVARtar' || attacker === defender) return 1
  if (matchup[attacker] === defender) return 1.5
  if (matchup[defender] === attacker) return 0.5
  return 1
}

function getMoveFromLabel(label) {
  const normalized = label.toLowerCase()
  return moves.find((move) => normalized === move.label.toLowerCase())
}

function Bar({ value, max, tone }) {
  return <div className="bar"><span className={`bar-fill ${tone}`} style={{ width: `${Math.max(0, (value / max) * 100)}%` }} /></div>
}

function Fighter({ fighter, isPlayer }) {
  const palette = elements[fighter.element]
  return (
    <article className={`fighter ${isPlayer ? 'player-fighter' : 'opponent-fighter'}`} style={{ '--fighter-color': palette.color, '--fighter-accent': palette.accent }}>
      <div className="fighter-topline"><span className="eyebrow">{isPlayer ? 'YOU' : 'OPPONENT'}</span><span className="level">LVL {fighter.level}</span></div>
      <div className="fighter-identity"><div className="avatar-mark"><img src={palette.image} alt={`${fighter.element} character`} /><span>{fighter.avatar || palette.icon}</span></div><div><h2>{fighter.name}</h2><p className="element-label">{fighter.element}</p></div></div>
      <div className="stat-row"><span>HP</span><strong>{fighter.hp}<small> / 100</small></strong></div><Bar value={fighter.hp} max={100} tone="hp" />
      <div className="stat-row energy-label"><span>ENERGY</span><strong>{fighter.energy}<small> / {fighter.maxEnergy}</small></strong></div><Bar value={fighter.energy} max={fighter.maxEnergy} tone="energy" />
    </article>
  )
}

function App() {
  const [screen, setScreen] = useState('profile')
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [element, setElement] = useState(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [player, setPlayer] = useState(null)
  const [opponent, setOpponent] = useState(null)
  const [turn, setTurn] = useState('player')
  const [phase, setPhase] = useState('reading')
  const [log, setLog] = useState([])
  const [lockedMove, setLockedMove] = useState(null)
  const [readerState, setReaderState] = useState({ label: 'Neutral / None', confidence: 0, ready: false, message: 'Waiting for a clear gesture' })
  const [modelStatus, setModelStatus] = useState('starting')
  const videoRef = useRef(null)
  const modelRef = useRef(null)
  const streamRef = useRef(null)
  const debounceRef = useRef({ label: '', startedAt: 0 })

  const appendLog = useCallback((message, type = '') => setLog((current) => [...current.slice(-7), { message, type, id: crypto.randomUUID() }]), [])

  const beginBattle = (drawnElement) => {
    const enemyElement = ['Fire', 'Water', 'Air', 'Earth'][Math.floor(Math.random() * 4)]
    setPlayer({ name: name.trim() || 'Astra', avatar: avatar || 'A', element: drawnElement, level: 1, hp: 100, energy: 3, maxEnergy: 3 })
    setOpponent({ name: 'Morrow', avatar: 'M', element: enemyElement, level: 1, hp: 100, energy: 3, maxEnergy: 3 })
    setLog([{ message: `${drawnElement} attunement confirmed. The arena is live.`, type: 'system', id: 'start' }])
    setScreen('battle')
  }

  const spin = () => {
    if (isSpinning) return
    setIsSpinning(true)
    const drawn = rollElement()
    setTimeout(() => { setElement(drawn); setIsSpinning(false) }, 1500)
  }

  const applyMove = useCallback((move, actor) => {
    const isPlayer = actor === 'player'
    const attacker = isPlayer ? player : opponent
    const defender = isPlayer ? opponent : player
    if (!attacker || !defender || attacker.energy < move.cost) return
    const effect = getEffectiveness(attacker.element, defender.element)
    const nextAttacker = { ...attacker, energy: Math.min(attacker.maxEnergy, attacker.energy - move.cost + 1) }
    const nextDefender = { ...defender, energy: Math.min(defender.maxEnergy, defender.energy + 1) }
    let damage = 0
    let message = `${attacker.name} used ${move.name}.`
    if (move.kind === 'attack' || move.kind === 'ultimate') {
      damage = move.damage * (move.kind === 'ultimate' ? 1 : effect)
      if (defender.guard === 'defend' && move.kind !== 'ultimate') damage *= 0.5
      // Special Defend uses the 80% damage reduction option for this build.
      if (defender.guard === 'specialDefend' && move.kind !== 'ultimate') damage *= 0.2
      damage = Math.round(damage)
      nextDefender.hp = Math.max(0, defender.hp - damage)
      message += ` ${damage} damage dealt${effect === 1.5 ? ' - super effective.' : effect === 0.5 ? ' - resisted.' : '.'}`
    } else {
      nextAttacker.guard = move.kind
      message += move.kind === 'specialDefend' ? ' Incoming damage will be reduced by 80%.' : ' Incoming damage will be reduced by 50%.'
    }
    nextAttacker.guard = move.kind === 'attack' || move.kind === 'ultimate' ? undefined : move.kind
    if (isPlayer) { setPlayer(nextAttacker); setOpponent(nextDefender) } else { setOpponent(nextAttacker); setPlayer(nextDefender) }
    appendLog(message, isPlayer ? 'player-log' : 'enemy-log')
    return nextDefender.hp <= 0
  }, [appendLog, opponent, player])

  const chooseAiMove = useCallback(() => {
    if (!opponent) return
    const legal = moves.filter((move) => move.cost <= opponent.energy)
    const chosen = legal[Math.floor(Math.random() * legal.length)] || moves[0]
    setPhase('resolving')
    setTimeout(() => {
      const defeated = applyMove(chosen, 'opponent')
      if (defeated) { setScreen('result'); setTurn('opponent'); return }
      setTurn('player'); setPhase('reading')
    }, 850)
  }, [applyMove, opponent])

  useEffect(() => {
    if (screen !== 'battle' || turn !== 'opponent' || !opponent) return undefined
    const timer = setTimeout(chooseAiMove, 650)
    return () => clearTimeout(timer)
  }, [chooseAiMove, opponent, screen, turn])

  useEffect(() => {
    if (screen !== 'battle') return undefined
    let active = true
    const startCamera = async () => {
      try {
        modelRef.current = await tmImage.load(`${MODEL_URL}model.json`, `${MODEL_URL}metadata.json`)
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640 }, audio: false })
        if (!active) return
        streamRef.current = stream
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setModelStatus('live')
      } catch (error) {
        console.warn('Camera/model unavailable:', error)
        setModelStatus('manual')
      }
    }
    startCamera()
    return () => { active = false; streamRef.current?.getTracks().forEach((track) => track.stop()) }
  }, [screen])

  useEffect(() => {
    if (screen !== 'battle' || turn !== 'player' || phase !== 'reading' || !modelRef.current || !videoRef.current) return undefined
    let active = true
    const readFrame = async () => {
      if (!active) return
      try {
        const predictions = await modelRef.current.predict(videoRef.current)
        const best = predictions.reduce((winner, current) => current.probability > winner.probability ? current : winner, predictions[0])
        const move = best.probability >= CONFIDENCE_THRESHOLD ? getMoveFromLabel(best.className) : null
        const now = performance.now()
        if (!move || best.className.toLowerCase().includes('none')) {
          debounceRef.current = { label: '', startedAt: 0 }
          setReaderState({ label: best.className, confidence: best.probability, ready: false, message: 'Hold a legal gesture to lock it' })
        } else if (debounceRef.current.label !== best.className) {
          debounceRef.current = { label: best.className, startedAt: now }
          setReaderState({ label: best.className, confidence: best.probability, ready: false, message: 'Keep holding...' })
        } else {
          const elapsed = now - debounceRef.current.startedAt
          setReaderState({ label: best.className, confidence: best.probability, ready: elapsed >= DEBOUNCE_MS, message: elapsed >= DEBOUNCE_MS ? 'Move locked' : `Hold ${Math.ceil((DEBOUNCE_MS - elapsed) / 1000)}s` })
          if (elapsed >= DEBOUNCE_MS && !lockedMove && move.cost <= player.energy) { setLockedMove(move); setPhase('resolving') }
        }
      } catch (error) {
        console.warn('Gesture prediction failed:', error)
      }
      requestAnimationFrame(readFrame)
    }
    readFrame()
    return () => { active = false }
  }, [lockedMove, modelStatus, phase, player, screen, turn])

  useEffect(() => {
    if (!lockedMove || phase !== 'resolving' || turn !== 'player') return undefined
    const timer = setTimeout(() => {
      const defeated = applyMove(lockedMove, 'player')
      setLockedMove(null)
      if (defeated) { setScreen('result'); return }
      setTurn('opponent')
    }, 500)
    return () => clearTimeout(timer)
  }, [applyMove, lockedMove, phase, turn])

  const selectManualMove = (move) => {
    if (turn !== 'player' || phase !== 'reading' || !player || player.energy < move.cost) return
    setLockedMove(move); setPhase('resolving')
  }

  if (screen === 'profile') return <main className="app-shell profile-screen"><div className="brand-lockup"><span className="brand-symbol">I</span><span>IVARtar</span></div><section className="profile-panel"><p className="kicker">ELEMENTAL GESTURE BATTLER</p><h1>Step into the<br /><em>signal.</em></h1><p className="intro">Your hands are the controller. Create your profile, discover your element, and make your first move.</p><form onSubmit={(event) => { event.preventDefault(); setScreen('wheel') }}><label>Call sign<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your name" maxLength="18" /></label><label>Avatar mark<input value={avatar} onChange={(event) => setAvatar(event.target.value.slice(0, 1).toUpperCase())} placeholder="One letter" maxLength="1" /></label><button className="primary-button" type="submit">Create profile <span>↗</span></button></form></section><p className="footer-note">LOCAL PROFILE · NO ACCOUNT REQUIRED</p></main>

  if (screen === 'wheel') return <main className="app-shell wheel-screen"><div className="brand-lockup"><span className="brand-symbol">I</span><span>IVARtar</span></div><section className="wheel-panel"><p className="kicker">YOUR FIRST ATTUNEMENT</p><h1>Find your<br /><em>element.</em></h1><div className={`element-wheel ${isSpinning ? 'spinning' : ''}`} style={{ '--wheel-color': element ? elements[element].color : '#f4b942' }}>{element && <img src={elements[element].image} alt={`${element} element`} />}<span className="wheel-center">{element ? elements[element].icon : '?'}</span></div>{element ? <><p className="draw-label">YOU ARE</p><h2 className="draw-result">{element}</h2><button className="primary-button" onClick={() => beginBattle(element)}>Enter the arena <span>↗</span></button></> : <button className="primary-button" onClick={spin} disabled={isSpinning}>{isSpinning ? 'Reading the wheel...' : 'Spin the wheel'} <span>↻</span></button>}<p className="wheel-note">Fire · Water · Air · Earth <span>·</span> IVARtar is rare</p></section></main>

  if (screen === 'result') { const won = player?.hp > 0; return <main className="app-shell result-screen"><div className="brand-lockup"><span className="brand-symbol">I</span><span>IVARtar</span></div><section className="result-panel"><p className="kicker">BATTLE COMPLETE</p><h1>{won ? <>Signal<br /><em>held.</em></> : <>Signal<br /><em>lost.</em></>}</h1><p>{won ? 'Your element answered. The arena is quiet.' : 'The arena went silent. Your next read starts here.'}</p><button className="primary-button" onClick={() => window.location.reload()}>Return to profile <span>↗</span></button></section></main> }

  const activeMoves = moves.map((move) => ({ ...move, disabled: player.energy < move.cost }))
  return <main className="app-shell battle-screen"><header className="battle-header"><div className="brand-lockup"><span className="brand-symbol">I</span><span>IVARtar</span></div><div className="turn-status"><span className={`status-dot ${turn === 'player' ? 'active' : ''}`} />{turn === 'player' ? phase === 'reading' ? 'Your turn · reading' : 'Your turn · resolving' : 'Opponent turn'}<small>ROUND {String(Math.max(1, log.length)).padStart(2, '0')}</small></div><span className={`camera-status ${modelStatus}`}>{modelStatus === 'live' ? '● CAMERA LIVE' : modelStatus === 'manual' ? '○ MANUAL MODE' : '○ CONNECTING'}</span></header><section className="arena"><Fighter fighter={player} isPlayer /><div className="versus"><span>VS</span><i /></div><Fighter fighter={opponent} /></section><section className="battle-grid"><div className="reader-panel"><div className="panel-heading"><div><p className="kicker">GESTURE READER</p><h2>{readerState.message}</h2></div><span className="reader-confidence">{Math.round(readerState.confidence * 100)}%</span></div><div className="camera-frame"><video ref={videoRef} muted playsInline /><div className="scan-line" /><span className="camera-corner top-left" /><span className="camera-corner top-right" /><span className="camera-corner bottom-left" /><span className="camera-corner bottom-right" /><div className="detected-chip">{readerState.label}</div></div><div className="confidence-track"><span style={{ width: `${readerState.confidence * 100}%` }} /></div><div className="move-grid">{activeMoves.map((move) => <button key={move.id} className={`move-button ${move.disabled ? 'disabled' : ''}`} onClick={() => selectManualMove(move)} disabled={move.disabled || turn !== 'player' || phase !== 'reading'}><span className="move-short">{move.short}</span><span>{move.name}</span><small>{move.cost} energy</small></button>)}</div></div><aside className="log-panel"><div className="panel-heading"><div><p className="kicker">COMBAT LOG</p><h2>Live feed</h2></div><span className="log-count">{String(log.length).padStart(2, '0')}</span></div><div className="log-list">{log.slice().reverse().map((entry) => <p key={entry.id} className={entry.type}><span>—</span>{entry.message}</p>)}</div><div className="matchup-note"><strong>{player.element} <span>→</span> {opponent.element}</strong><span>Elemental read</span></div></aside></section></main>
}

export default App
