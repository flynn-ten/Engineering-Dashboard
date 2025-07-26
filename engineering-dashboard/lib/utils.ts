import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

//export function generateWRNumber(): string {
  //const date = new Date();
  //const yyyyMMdd = date.toISOString().slice(0, 10).replace(/-/g, "");
  //const random = Math.floor(100 + Math.random() * 900);
  //return `WR-${yyyyMMdd}-${random}`;
//}
