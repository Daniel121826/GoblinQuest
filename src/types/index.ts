export type GameClass = 'Guerrero' | 'Mago' | 'Pícaro' | 'Clérigo';
export type Race = 'Humano' | 'Elfo' | 'Enano' | 'Orco';

export interface Stats {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface Character {
  id: string;
  name: string;
  class: GameClass;
  race: Race;
  background: string;
  stats: Stats;
  hp: number;
  maxHp: number;
  level: number;
  imageUrl?: string;
}