import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function slugify(text: string) {
  return text.toLowerCase().replace(/ /g, "-");
}

export function formatIndianNumber(num: number): string {
  if (num === 0) return "0";

  const absNum = Math.abs(num);
  const sign = num < 0 ? "-" : "";

  // For numbers less than 1000, return as is
  if (absNum < 1000) {
    return sign + absNum.toString();
  }

  // For numbers 1000 to 99999, format as K
  if (absNum < 100000) {
    const kValue = absNum / 1000;
    return sign + (kValue % 1 === 0 ? kValue.toFixed(0) : kValue.toFixed(1)) + " K";
  }

  // For numbers 100000 to 9999999, format as Lakh
  if (absNum < 10000000) {
    const lakhValue = absNum / 100000;
    return sign + (lakhValue % 1 === 0 ? lakhValue.toFixed(0) : lakhValue.toFixed(1)) + " Lac";
  }

  // For numbers 10000000 and above, format as Cr
  const crValue = absNum / 10000000;
  return sign + (crValue % 1 === 0 ? crValue.toFixed(0) : crValue.toFixed(1)) + " Cr";
}
