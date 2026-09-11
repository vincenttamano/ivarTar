export const STATUS_META = {
  Weak: { label: 'Weak', icon: '🌀', color: '#a855f7', desc: '-25% damage dealt. Decays 1 stack per turn.' },
  Vulnerable: { label: 'Vulnerable', icon: '💔', color: '#ef4444', desc: '+50% damage taken. Decays 1 stack per turn.' },
  Strength: { label: 'Strength', icon: '⚔️', color: '#f97316', desc: '+1 attack damage per stack.' },
  Dexterity: { label: 'Dexterity', icon: '🛡️', color: '#3b82f6', desc: '+1 Block gained per stack.' },
  Stun: { label: 'Stun', icon: '⚡', color: '#eab308', desc: 'Cannot execute ATTACK-tagged moves.' },
  BurnPotency: { label: 'Burn Potency', icon: '🔥', color: '#f97316', desc: 'Stored elemental heat stacks.' },
  Intangible: { label: 'Intangible', icon: '👻', color: '#06b6d4', desc: 'Reduces all incoming damage to 0.' },
  Exhaust: { label: 'Exhausted', icon: '🚫', color: '#64748b', desc: 'Ultimate move exhausted for remainder of combat.' },
  Replay: { label: 'Replay', icon: '🔄', color: '#ec4899', desc: 'Next skill triggers an extra time.' },
  Counter: { label: 'Flame Counter', icon: '💥', color: '#fb923c', desc: 'Deals retaliation damage when struck.' }
};

export function getStatusStacks(statuses = [], type) {
  const item = statuses.find((s) => s.type === type);
  return item ? item.stacks : 0;
}

export function applyStatus(statuses = [], type, stacks = 1, source = 'skill') {
  const existing = statuses.find((s) => s.type === type);
  if (existing) {
    return statuses.map((s) => (s.type === type ? { ...s, stacks: s.stacks + stacks } : s));
  }
  return [...statuses, { type, stacks, source }];
}

export function setStatusStacks(statuses = [], type, stacks) {
  if (stacks <= 0) {
    return statuses.filter((s) => s.type !== type);
  }
  const existing = statuses.find((s) => s.type === type);
  if (existing) {
    return statuses.map((s) => (s.type === type ? { ...s, stacks } : s));
  }
  return [...statuses, { type, stacks, source: 'system' }];
}

export function removeStatus(statuses = [], type) {
  return statuses.filter((s) => s.type !== type);
}

export function processStartOfTurnStatuses(fighter) {
  let updatedStatuses = [...(fighter.statuses || [])];
  let nextBlock = fighter.block || 0;
  const logs = [];

  // NextTurnBlock check
  const nextBlockStacks = getStatusStacks(updatedStatuses, 'NextTurnBlock');
  if (nextBlockStacks > 0) {
    nextBlock += nextBlockStacks;
    logs.push(`${fighter.name} gained ${nextBlockStacks} Block from Tailwind Guard!`);
    updatedStatuses = removeStatus(updatedStatuses, 'NextTurnBlock');
  }

  // Decay Weak, Vulnerable, Intangible
  updatedStatuses = updatedStatuses.map((st) => {
    if (['Weak', 'Vulnerable', 'Intangible'].includes(st.type)) {
      return { ...st, stacks: Math.max(0, st.stacks - 1) };
    }
    return st;
  }).filter((st) => st.stacks > 0);

  // Clear Stun at start of turn
  const stunStacks = getStatusStacks(updatedStatuses, 'Stun');
  if (stunStacks > 0) {
    logs.push(`${fighter.name} recovered from Stun.`);
    updatedStatuses = removeStatus(updatedStatuses, 'Stun');
  }

  return {
    ...fighter,
    statuses: updatedStatuses,
    block: nextBlock,
    logs
  };
}

export function calculateDamage(baseDmg, attackerStatuses = [], defenderStatuses = []) {
  if (baseDmg <= 0) return 0;
  let dmg = baseDmg;

  // Attacker Strength
  const strength = getStatusStacks(attackerStatuses, 'Strength');
  dmg += strength;

  // Attacker Weak (-25%)
  const weak = getStatusStacks(attackerStatuses, 'Weak');
  if (weak > 0) {
    dmg = Math.floor(dmg * 0.75);
  }

  // Defender Vulnerable (+50%)
  const vuln = getStatusStacks(defenderStatuses, 'Vulnerable');
  if (vuln > 0) {
    dmg = Math.floor(dmg * 1.5);
  }

  // Defender Intangible (0 damage)
  const intangible = getStatusStacks(defenderStatuses, 'Intangible');
  if (intangible > 0) {
    dmg = 0;
  }

  return Math.max(0, dmg);
}

export function calculateBlock(baseBlock, defenderStatuses = []) {
  if (baseBlock <= 0) return 0;
  const dex = getStatusStacks(defenderStatuses, 'Dexterity');
  return Math.max(0, baseBlock + dex);
}
