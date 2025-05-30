import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateRoomId(): string {
  const charset = "abcdefghijklmnopqrstuvwxyz0123456789";
  const segmentLength = 3;

  const getSegment = () =>
    Array.from({ length: segmentLength }, () =>
      charset.charAt(Math.floor(Math.random() * charset.length))
    ).join("");

  return `${getSegment()}-${getSegment()}-${getSegment()}`; // e.g., "a1f-9kz-pq2"
}
