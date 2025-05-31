// src/types.ts

export interface Participant {
  id: string;
  name: string;
}

export interface Room {
  roomId: string;
  name?: string;
  participants: Participant[];
}
