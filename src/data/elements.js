export const GESTURE_SLOTS = {
  ATTACK: { label: 'Attack', gestureName: 'Fist', icon: '✊', key: 'atk' },
  DEFEND: { label: 'Defend', gestureName: 'Open Palm', icon: '✋', key: 'def' },
  SPECIAL_ATTACK: { label: 'Special Attack', gestureName: 'Triangle', icon: '🔺', key: 'atkS' },
  SPECIAL_DEFEND: { label: 'Special Deffend', gestureName: 'Crossed Arms (X)', icon: '⚔️', key: 'defS' },
  ULTIMATE: { label: 'Ultimate', gestureName: 'Rock-on Sign', icon: '🤘', key: 'ss' }
};

export const ELEMENTS = {
  Air: {
    id: 'Air',
    name: 'Air',
    title: 'Gale Attuned',
    baseHp: 65,
    baseEnergy: 3,
    passiveEnergyBonus: 1, // Energy pool is 4
    passiveDescription: 'Start each turn with +1 energy (4 total energy pool).',
    color: '#38bdf8',
    accent: '#7dd3fc',
    bgGradient: 'linear-gradient(135deg, #0284c7 0%, #0f172a 100%)',
    avatarImg: `${import.meta.env.BASE_URL}model/air.jpg`,
    skills: {
      atk: {
        id: 'air_atk',
        name: 'Wind Cutter',
        slot: 'Atk',
        tmLabel: 'Attack',
        cost: 1,
        kind: 'ATTACK',
        damage: 3,
        description: 'Deal 3 damage.'
      },
      def: {
        id: 'air_def',
        name: 'Zephyr Shield',
        slot: 'Def',
        tmLabel: 'Defend',
        cost: 1,
        kind: 'SKILL',
        block: 3,
        description: 'Gain 3 Block.'
      },
      atkS: {
        id: 'air_atkS',
        name: 'Cyclone Burst',
        slot: 'AtkS',
        tmLabel: 'Special Attack',
        cost: 2,
        kind: 'ATTACK',
        damage: 7,
        statusApplied: [{ type: 'Weak', stacks: 2, target: 'enemy' }],
        description: 'Deal 7 damage and apply 2 Weak.'
      },
      defS: {
        id: 'air_defS',
        name: 'Tailwind Guard',
        slot: 'DefS',
        tmLabel: 'Special Deffend',
        cost: 2,
        kind: 'SKILL',
        block: 8,
        statusApplied: [{ type: 'NextTurnBlock', stacks: 5, target: 'self' }],
        description: 'Gain 8 Block, plus 5 additional Block next turn.'
      },
      ss: {
        id: 'air_ss',
        name: 'Astral Slipstream',
        slot: 'SS',
        tmLabel: 'Ultimate',
        cost: 3,
        kind: 'SKILL',
        exhaust: true,
        statusApplied: [
          { type: 'Intangible', stacks: 2, target: 'self' },
          { type: 'Dexterity', stacks: 1, target: 'self' }
        ],
        description: 'Gain Intangible 2 and +1 Dexterity. (Exhaust)'
      }
    }
  },

  Fire: {
    id: 'Fire',
    name: 'Fire',
    title: 'Infernal Attuned',
    baseHp: 80,
    baseEnergy: 3,
    passiveEnergyBonus: 0,
    passiveDescription: 'All attacks apply 3 Burn Potency to enemy.',
    color: '#f97316',
    accent: '#fdba74',
    bgGradient: 'linear-gradient(135deg, #c2410c 0%, #180905 100%)',
    avatarImg: `${import.meta.env.BASE_URL}model/fire.jpg`,
    skills: {
      atk: {
        id: 'fire_atk',
        name: 'Flame Slash',
        slot: 'Atk',
        tmLabel: 'Attack',
        cost: 1,
        kind: 'ATTACK',
        damage: 3,
        description: 'Deal 3 damage (+3 Burn Potency).'
      },
      def: {
        id: 'fire_def',
        name: 'Cinder Barrier',
        slot: 'Def',
        tmLabel: 'Defend',
        cost: 1,
        kind: 'SKILL',
        block: 3,
        description: 'Gain 3 Block.'
      },
      atkS: {
        id: 'fire_atkS',
        name: 'Scorching Blast',
        slot: 'AtkS',
        tmLabel: 'Special Attack',
        cost: 2,
        kind: 'ATTACK',
        damage: 10,
        statusApplied: [{ type: 'Vulnerable', stacks: 2, target: 'enemy' }],
        description: 'Deal 10 damage (+3 Burn Potency) and apply 2 Vulnerable.'
      },
      defS: {
        id: 'fire_defS',
        name: 'Flame Guard',
        slot: 'DefS',
        tmLabel: 'Special Deffend',
        cost: 2,
        kind: 'SKILL',
        block: 10,
        statusApplied: [{ type: 'Counter', stacks: 5, target: 'self' }],
        description: 'Gain 10 Block. Deals 5 retaliation damage if attacked this turn.'
      },
      ss: {
        id: 'fire_ss',
        name: 'Ignition Overdrive',
        slot: 'SS',
        tmLabel: 'Ultimate',
        cost: 3,
        kind: 'SKILL',
        exhaust: true,
        consumeBurn: true,
        statusApplied: [{ type: 'Strength', stacks: 3, target: 'self' }],
        description: 'Detonate all current Burn Potency for instant damage, then gain 3 Strength. (Exhaust)'
      }
    }
  },

  Earth: {
    id: 'Earth',
    name: 'Earth',
    title: 'Titan Attuned',
    baseHp: 70,
    baseEnergy: 3,
    passiveEnergyBonus: 0,
    passiveDescription: 'Summon/reinforce a Rock Golem (+1 HP/maxHP) at the start of every turn.',
    color: '#10b981',
    accent: '#6ee7b7',
    bgGradient: 'linear-gradient(135deg, #047857 0%, #064e3b 100%)',
    avatarImg: `${import.meta.env.BASE_URL}model/earth.png`,
    skills: {
      atk: {
        id: 'earth_atk',
        name: 'Stone Strike',
        slot: 'Atk',
        tmLabel: 'Attack',
        cost: 1,
        kind: 'ATTACK',
        damage: 3,
        description: 'Deal 3 damage.'
      },
      def: {
        id: 'earth_def',
        name: 'Granite Wall',
        slot: 'Def',
        tmLabel: 'Defend',
        cost: 1,
        kind: 'SKILL',
        block: 3,
        description: 'Gain 3 Block.'
      },
      atkS: {
        id: 'earth_atkS',
        name: 'Golem Slam',
        slot: 'AtkS',
        tmLabel: 'Special Attack',
        cost: 1,
        kind: 'SKILL',
        damage: 5,
        scaleWithGolem: true,
        description: 'Deal 5 damage + bonus damage equal to current Rock Golem HP.'
      },
      defS: {
        id: 'earth_defS',
        name: 'Terran Fortress',
        slot: 'DefS',
        tmLabel: 'Special Deffend',
        cost: 2,
        kind: 'SKILL',
        block: 7,
        golemHpAdd: 6,
        description: 'Gain 7 Block and reinforce Rock Golem by +6 HP.'
      },
      ss: {
        id: 'earth_ss',
        name: 'Tectonic Cataclysm',
        slot: 'SS',
        tmLabel: 'Ultimate',
        cost: 3,
        kind: 'SKILL',
        exhaust: true,
        golemHpAdd: 15,
        statusApplied: [{ type: 'Stun', stacks: 1, target: 'enemy' }],
        description: 'Reinforce Rock Golem by +15 HP and Stun the enemy for 1 turn. (Exhaust)'
      }
    }
  },

  Water: {
    id: 'Water',
    name: 'Water',
    title: 'Tide Attuned',
    baseHp: 75,
    baseEnergy: 3,
    passiveEnergyBonus: 0,
    passiveDescription: 'Start combat with 1 Water Spirit. Evoke all held spirits at the end of each turn.',
    color: '#06b6d4',
    accent: '#67e8f9',
    bgGradient: 'linear-gradient(135deg, #0e7490 0%, #032b37 100%)',
    avatarImg: `${import.meta.env.BASE_URL}model/water.png`,
    skills: {
      atk: {
        id: 'water_atk',
        name: 'Aqua Dart',
        slot: 'Atk',
        tmLabel: 'Attack',
        cost: 1,
        kind: 'ATTACK',
        damage: 3,
        description: 'Deal 3 damage.'
      },
      def: {
        id: 'water_def',
        name: 'Tidal Shield',
        slot: 'Def',
        tmLabel: 'Defend',
        cost: 1,
        kind: 'SKILL',
        block: 3,
        description: 'Gain 3 Block.'
      },
      atkS: {
        id: 'water_atkS',
        name: 'Spirit Cascade',
        slot: 'AtkS',
        tmLabel: 'Special Attack',
        cost: 1,
        kind: 'ATTACK',
        damage: 5,
        summonSpirit: 'Water',
        description: 'Deal 5 damage and Summon 1 Water Spirit.'
      },
      defS: {
        id: 'water_defS',
        name: 'Glacial Aegis',
        slot: 'DefS',
        tmLabel: 'Special Deffend',
        cost: 2,
        kind: 'SKILL',
        block: 10,
        summonSpirit: 'Ice',
        description: 'Gain 10 Block and Summon 1 Ice Spirit.'
      },
      ss: {
        id: 'water_ss',
        name: 'QuadCast Surge',
        slot: 'SS',
        tmLabel: 'Ultimate',
        cost: 3,
        kind: 'SKILL',
        exhaust: true,
        quadCast: true,
        description: 'Evoke rightmost spirit 4 times, remove it, and permanently +1 Spirit Container size. (Exhaust)'
      }
    }
  },

  IVARtar: {
    id: 'IVARtar',
    name: 'IVARtar',
    title: 'The Master of Elements',
    baseHp: 100,
    baseEnergy: 3,
    passiveEnergyBonus: 1,
    passiveDescription: 'Embodies ALL 4 element passives simultaneously (Air +1 Energy, Fire Burn attacks, Earth Golem summon, Water Spirit evocation).',
    color: '#a855f7',
    accent: '#f43f5e',
    bgGradient: 'linear-gradient(135deg, #7e22ce 0%, #431407 50%, #064e3b 100%)',
    isJackpot: true,
    avatarImg: `${import.meta.env.BASE_URL}model/ivartar.jpg`,
    skills: {
      atk: {
        id: 'ivar_atk',
        name: 'Elemental Strike',
        slot: 'Atk',
        tmLabel: 'Attack',
        cost: 1,
        kind: 'ATTACK',
        damage: 3,
        description: 'Deal 3 damage.'
      },
      def: {
        id: 'ivar_def',
        name: 'Prismatic Barrier',
        slot: 'Def',
        tmLabel: 'Defend',
        cost: 1,
        kind: 'SKILL',
        block: 3,
        description: 'Gain 3 Block.'
      },
      atkS: {
        id: 'ivar_atkS',
        name: 'Elemental Burst',
        slot: 'AtkS',
        tmLabel: 'Special Attack',
        cost: 2,
        kind: 'ATTACK',
        damage: 8,
        statusApplied: [{ type: 'Weak', stacks: 1, target: 'enemy' }],
        description: 'Deal 8 damage and apply 1 Weak.'
      },
      defS: {
        id: 'ivar_defS',
        name: 'Aegis Shield',
        slot: 'DefS',
        tmLabel: 'Special Deffend',
        cost: 2,
        kind: 'SKILL',
        block: 10,
        golemHpAdd: 3,
        description: 'Gain 10 Block and reinforce Golem by +3 HP.'
      },
      ss: {
        id: 'ivar_ss',
        name: 'Avatar Overdrive',
        slot: 'SS',
        tmLabel: 'Ultimate',
        cost: 3,
        kind: 'SKILL',
        exhaust: true,
        damage: 5,
        block: 5,
        summonSpirit: 'Water',
        statusApplied: [{ type: 'Replay', stacks: 1, target: 'self' }],
        description: 'Deal 5 damage, gain 5 Block, summon Water Spirit, and gain Ult Replay 1. (Exhaust)'
      }
    }
  }
};
