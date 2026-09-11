import { ELEMENTS } from '../data/elements.js';
import {
  applyStatus,
  calculateBlock,
  calculateDamage,
  getStatusStacks,
  processStartOfTurnStatuses,
  removeStatus
} from './statusSystem.js';

export function createFighterState(name, avatar, elementId, isPlayer = true, selectedSkills = null) {
  const elementData = ELEMENTS[elementId] || ELEMENTS.Fire;
  const baseEnergy = elementData.baseEnergy + (elementData.passiveEnergyBonus || 0);
  const skills = selectedSkills || elementData.skills;

  const initialStatuses = [];
  let golemHp = 0;
  let golemMaxHp = 0;
  let spirits = [];

  // Initial passives on combat start
  if (elementId === 'Water' || elementId === 'IVARtar') {
    spirits = ['Water'];
  }
  if (elementId === 'Earth' || elementId === 'IVARtar') {
    golemHp = 1;
    golemMaxHp = 1;
  }

  return {
    id: isPlayer ? 'player' : 'opponent',
    name: name || (isPlayer ? 'Player' : 'Opponent'),
    avatar: avatar || (isPlayer ? 'P' : 'AI'),
    element: elementId,
    hp: elementData.baseHp,
    maxHp: elementData.baseHp,
    energy: baseEnergy,
    maxEnergy: baseEnergy,
    block: 0,
    statuses: initialStatuses,
    golemHp,
    golemMaxHp,
    spirits,
    spiritCapacity: 3,
    exhaustedSkills: [],
    ultimateCooldown: 0,
    skills
  };
}

export function startTurn(fighterState) {
  const elementData = ELEMENTS[fighterState.element] || ELEMENTS.Fire;
  const targetEnergy = elementData.baseEnergy + (elementData.passiveEnergyBonus || 0);

  let updated = {
    ...fighterState,
    energy: targetEnergy,
    block: 0,
    ultimateCooldown: Math.max(0, (fighterState.ultimateCooldown || 0) - 1)
  };

  const logEntries = [];

  // Start-of-turn status processing
  updated = processStartOfTurnStatuses(updated);

  // Earth / IVARtar passive golem reinforcement
  if (fighterState.element === 'Earth' || fighterState.element === 'IVARtar') {
    const nextGolemHp = updated.golemHp + 1;
    const nextGolemMax = updated.golemMaxHp + 1;
    updated.golemHp = nextGolemHp;
    updated.golemMaxHp = nextGolemMax;
    logEntries.push(`${updated.name}'s Rock Golem reinforced (+1 HP / Max HP: ${nextGolemHp})`);
  }

  return { updated, logEntries };
}

export function executeSkill(attacker, defender, skill) {
  let activeAttacker = { ...attacker };
  let activeDefender = { ...defender };
  const combatLogs = [];
  const floaters = []; // For floating numbers: { target: 'player'|'opponent', text: string, type: 'damage'|'block'|'status' }

  if (activeAttacker.energy < skill.cost) {
    return { attacker: activeAttacker, defender: activeDefender, combatLogs, floaters, success: false };
  }

  const isUltimate = skill.slot === 'SS';

  if (activeAttacker.exhaustedSkills.includes(skill.id)) {
    combatLogs.push({ text: `${skill.name} is exhausted and cannot be used again!`, type: 'warning' });
    return { attacker: activeAttacker, defender: activeDefender, combatLogs, floaters, success: false };
  }

  if (isUltimate && activeAttacker.ultimateCooldown > 0) {
    combatLogs.push({ text: `${skill.name} recharges in ${activeAttacker.ultimateCooldown} turn${activeAttacker.ultimateCooldown === 1 ? '' : 's'}.`, type: 'warning' });
    return { attacker: activeAttacker, defender: activeDefender, combatLogs, floaters, success: false };
  }

  // Check Stun on ATTACK skills
  const isStunned = getStatusStacks(activeAttacker.statuses, 'Stun') > 0;
  if (isStunned && skill.kind === 'ATTACK') {
    combatLogs.push({ text: `${activeAttacker.name} is Stunned and cannot execute ATTACK moves!`, type: 'warning' });
    return { attacker: activeAttacker, defender: activeDefender, combatLogs, floaters, success: false };
  }

  // Deduct energy
  activeAttacker.energy -= skill.cost;

  // Handle Exhaust tag
  if (skill.exhaust) {
    if (isUltimate) {
      activeAttacker.ultimateCooldown = 3;
    } else {
      activeAttacker.exhaustedSkills = [...activeAttacker.exhaustedSkills, skill.id];
    }
    activeAttacker.statuses = applyStatus(activeAttacker.statuses, 'Exhaust', 1);
  }

  // Replay status check
  const replayStacks = getStatusStacks(activeAttacker.statuses, 'Replay');
  const executions = replayStacks > 0 ? 2 : 1;
  if (replayStacks > 0) {
    activeAttacker.statuses = removeStatus(activeAttacker.statuses, 'Replay');
    combatLogs.push({ text: `⚡ ULTRA REPLAY PROC! ${skill.name} triggers twice!`, type: 'special' });
  }

  for (let step = 0; step < executions; step++) {
    const stepTag = executions > 1 ? ` (Proc ${step + 1})` : '';

    // Handle Fire SS (Consume Burn)
    if (skill.consumeBurn) {
      const burnStacks = getStatusStacks(activeDefender.statuses, 'BurnPotency');
      if (burnStacks > 0) {
        activeDefender.statuses = removeStatus(activeDefender.statuses, 'BurnPotency');
        const burnDmg = calculateDamage(burnStacks, activeAttacker.statuses, activeDefender.statuses);
        activeDefender.hp = Math.max(0, activeDefender.hp - burnDmg);
        combatLogs.push({ text: `🔥 ${activeAttacker.name} detonated ${burnStacks} Burn Potency for ${burnDmg} direct damage!${stepTag}`, type: 'damage' });
        floaters.push({ target: activeDefender.id, text: `-${burnDmg} HP`, type: 'damage' });
      }
    }

    // Base damage calculation
    let baseDmg = skill.damage || 0;
    if (skill.scaleWithGolem) {
      baseDmg += activeAttacker.golemHp;
    }

    if (baseDmg > 0) {
      const finalDmg = calculateDamage(baseDmg, activeAttacker.statuses, activeDefender.statuses);

      // Resolve damage against block first
      let currentBlock = activeDefender.block || 0;
      let hpDamage = finalDmg;

      if (currentBlock > 0) {
        if (currentBlock >= hpDamage) {
          currentBlock -= hpDamage;
          hpDamage = 0;
        } else {
          hpDamage -= currentBlock;
          currentBlock = 0;
        }
        activeDefender.block = currentBlock;
      }

      activeDefender.hp = Math.max(0, activeDefender.hp - hpDamage);

      combatLogs.push({
        text: `${activeAttacker.name} used ${skill.name}${stepTag}, dealing ${finalDmg} damage!`,
        type: 'damage'
      });

      if (hpDamage > 0) {
        floaters.push({ target: activeDefender.id, text: `-${hpDamage} HP`, type: 'damage' });
      } else {
        floaters.push({ target: activeDefender.id, text: `BLOCKED!`, type: 'block' });
      }

      // Fire passive: All attacks apply +3 Burn Potency
      const hasFirePassive = activeAttacker.element === 'Fire' || activeAttacker.element === 'IVARtar';
      if (hasFirePassive && skill.kind === 'ATTACK') {
        activeDefender.statuses = applyStatus(activeDefender.statuses, 'BurnPotency', 3);
        combatLogs.push({ text: `🔥 Applied +3 Burn Potency to ${activeDefender.name}`, type: 'status' });
        floaters.push({ target: activeDefender.id, text: `+3 Burn`, type: 'status' });
      }

      // Counter status check on defender (Fire DefS)
      const counterStacks = getStatusStacks(activeDefender.statuses, 'Counter');
      if (counterStacks > 0 && finalDmg > 0) {
        const counterDmg = calculateDamage(counterStacks, activeDefender.statuses, activeAttacker.statuses);
        activeAttacker.hp = Math.max(0, activeAttacker.hp - counterDmg);
        combatLogs.push({ text: `💥 Retaliation! ${activeDefender.name}'s Flame Guard counter-struck for ${counterDmg} damage!`, type: 'warning' });
        floaters.push({ target: activeAttacker.id, text: `-${counterDmg} Retaliate`, type: 'damage' });
      }
    }

    // Block gain
    if (skill.block) {
      const addedBlock = calculateBlock(skill.block, activeAttacker.statuses);
      activeAttacker.block += addedBlock;
      combatLogs.push({ text: `${activeAttacker.name} gained ${addedBlock} Block.${stepTag}`, type: 'block' });
      floaters.push({ target: activeAttacker.id, text: `+${addedBlock} Block`, type: 'block' });
    }

    // Status Applications
    if (skill.statusApplied && skill.statusApplied.length > 0) {
      skill.statusApplied.forEach((st) => {
        const isSelf = st.target === 'self';
        const targetRef = isSelf ? activeAttacker : activeDefender;
        targetRef.statuses = applyStatus(targetRef.statuses, st.type, st.stacks);

        combatLogs.push({
          text: `Applied ${st.type} x${st.stacks} to ${targetRef.name}${stepTag}`,
          type: 'status'
        });
        floaters.push({ target: targetRef.id, text: `+${st.stacks} ${st.type}`, type: 'status' });
      });
    }

    // Golem HP Reinforcement
    if (skill.golemHpAdd) {
      activeAttacker.golemHp += skill.golemHpAdd;
      activeAttacker.golemMaxHp += skill.golemHpAdd;
      combatLogs.push({ text: `🗿 Rock Golem reinforced (+${skill.golemHpAdd} HP)${stepTag}`, type: 'special' });
      floaters.push({ target: activeAttacker.id, text: `+${skill.golemHpAdd} Golem HP`, type: 'special' });
    }

    // Spirit Summons
    if (skill.summonSpirit) {
      if (activeAttacker.spirits.length < activeAttacker.spiritCapacity) {
        activeAttacker.spirits = [...activeAttacker.spirits, skill.summonSpirit];
        combatLogs.push({ text: `💧 Summoned 1 ${skill.summonSpirit} Spirit!${stepTag}`, type: 'special' });
        floaters.push({ target: activeAttacker.id, text: `+1 ${skill.summonSpirit} Spirit`, type: 'special' });
      } else {
        combatLogs.push({ text: `⚠️ Spirit container full! Summon failed.`, type: 'warning' });
      }
    }

    // QuadCast (Water SS)
    if (skill.quadCast) {
      if (activeAttacker.spirits.length > 0) {
        const rightmostIndex = activeAttacker.spirits.length - 1;
        const spiritType = activeAttacker.spirits[rightmostIndex];

        combatLogs.push({ text: `🌀 QuadCast on ${spiritType} Spirit! (Evoking 4x)`, type: 'special' });

        for (let q = 0; q < 4; q++) {
          if (spiritType === 'Water') {
            const evDmg = calculateDamage(3, activeAttacker.statuses, activeDefender.statuses);
            activeDefender.hp = Math.max(0, activeDefender.hp - evDmg);
            combatLogs.push({ text: `🌊 QuadCast Water Evoke #${q + 1}: ${evDmg} damage!`, type: 'damage' });
            floaters.push({ target: activeDefender.id, text: `-${evDmg} HP`, type: 'damage' });
          } else if (spiritType === 'Ice') {
            const evBlock = calculateBlock(3, activeAttacker.statuses);
            activeAttacker.block += evBlock;
            combatLogs.push({ text: `🧊 QuadCast Ice Evoke #${q + 1}: +${evBlock} Block!`, type: 'block' });
            floaters.push({ target: activeAttacker.id, text: `+${evBlock} Block`, type: 'block' });
          }
        }

        // Remove rightmost spirit and expand container capacity by +1
        activeAttacker.spirits = activeAttacker.spirits.slice(0, rightmostIndex);
        activeAttacker.spiritCapacity += 1;
        combatLogs.push({ text: `✨ Evoked spirit consumed. Spirit Container expanded to ${activeAttacker.spiritCapacity}!`, type: 'special' });
      } else {
        combatLogs.push({ text: `⚠️ No spirits in queue to QuadCast! Container expanded anyway.`, type: 'warning' });
        activeAttacker.spiritCapacity += 1;
      }
    }
  }

  return { attacker: activeAttacker, defender: activeDefender, combatLogs, floaters, success: true };
}

export function endTurnSpiritsEvoke(activePlayer, inactivePlayer) {
  let player = { ...activePlayer };
  let opponent = { ...inactivePlayer };
  const logs = [];
  const floaters = [];

  const hasWaterPassive = player.element === 'Water' || player.element === 'IVARtar';
  if (hasWaterPassive && player.spirits.length > 0) {
    logs.push({ text: `💧 End of Turn Water Passive: Evoking ${player.spirits.length} spirits in queue...`, type: 'special' });

    player.spirits.forEach((spirit, idx) => {
      if (spirit === 'Water') {
        const dmg = calculateDamage(3, player.statuses, opponent.statuses);
        opponent.hp = Math.max(0, opponent.hp - dmg);
        logs.push({ text: `🌊 Spirit #${idx + 1} (Water Evoke): ${dmg} damage to ${opponent.name}`, type: 'damage' });
        floaters.push({ target: opponent.id, text: `-${dmg} HP`, type: 'damage' });
      } else if (spirit === 'Ice') {
        const blk = calculateBlock(3, player.statuses);
        player.block += blk;
        logs.push({ text: `🧊 Spirit #${idx + 1} (Ice Evoke): +${blk} Block to ${player.name}`, type: 'block' });
        floaters.push({ target: player.id, text: `+${blk} Block`, type: 'block' });
      }
    });
  }

  return { player, opponent, logs, floaters };
}
