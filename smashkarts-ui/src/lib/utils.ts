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

// Tournament role and permission types
export type TournamentRole = "organizer" | "admin" | "maintainer" | "auctioneer";
export type Permission = "all" | "dashboard" | "auction";

// Role hierarchy and permissions (same as server-side)
const ROLE_PERMISSIONS = {
  organizer: {
    level: 3,
    permissions: ["all"] as Permission[]
  },
  admin: {
    level: 2,
    permissions: ["dashboard", "auction"] as Permission[]
  },
  maintainer: {
    level: 1,
    permissions: ["dashboard"] as Permission[]
  },
  auctioneer: {
    level: 1,
    permissions: ["auction"] as Permission[]
  }
} as const;

/**
 * Check if user has specific roles
 * @param userRoles - Array of user's tournament roles
 * @param requiredRoles - Array of required roles (any of these will grant access)
 * @returns boolean indicating if user has any of the required roles
 */
export function hasTournamentRoles(userRoles: TournamentRole[], requiredRoles: TournamentRole[]): boolean {
  return requiredRoles.some(role => userRoles.includes(role));
}

/**
 * Check if user has permission for specific action
 * @param userRoles - Array of user's tournament roles
 * @param permission - Required permission
 * @returns boolean indicating if user has the required permission
 */
export function hasTournamentPermission(userRoles: TournamentRole[], permission: Permission): boolean {
  // Check if user has any role with the required permission
  for (const role of userRoles) {
    const roleConfig = ROLE_PERMISSIONS[role];
    if (roleConfig.permissions.includes("all") || roleConfig.permissions.includes(permission)) {
      return true;
    }
  }

  return false;
}

/**
 * Get user's highest role level
 * @param userRoles - Array of user's tournament roles
 * @returns number representing the highest role level (0 if no roles)
 */
export function getHighestRoleLevel(userRoles: TournamentRole[]): number {
  if (userRoles.length === 0) return 0;

  return Math.max(...userRoles.map(role => ROLE_PERMISSIONS[role].level));
}

/**
 * Check if user can perform dashboard actions (edit tournament, manage participants, etc.)
 * @param userRoles - Array of user's tournament roles
 * @returns boolean indicating if user has dashboard permissions
 */
export function canManageDashboard(userRoles: TournamentRole[]): boolean {
  return hasTournamentPermission(userRoles, "dashboard");
}

/**
 * Check if user can perform auction actions (start auction, manage auction room, etc.)
 * @param userRoles - Array of user's tournament roles
 * @returns boolean indicating if user has auction permissions
 */
export function canManageAuction(userRoles: TournamentRole[]): boolean {
  return hasTournamentPermission(userRoles, "auction");
}

/**
 * Check if user is an organizer (highest level role)
 * @param userRoles - Array of user's tournament roles
 * @returns boolean indicating if user is an organizer
 */
export function isOrganizer(userRoles: TournamentRole[]): boolean {
  return userRoles.includes("organizer");
}

/**
 * Check if user is an admin or higher
 * @param userRoles - Array of user's tournament roles
 * @returns boolean indicating if user is admin or organizer
 */
export function isAdminOrHigher(userRoles: TournamentRole[]): boolean {
  return hasTournamentRoles(userRoles, ["organizer", "admin"]);
}

/**
 * Get all permissions for a given set of roles
 * @param userRoles - Array of user's tournament roles
 * @returns array of all permissions the user has
 */
export function getAllPermissions(userRoles: TournamentRole[]): Permission[] {
  const permissions = new Set<Permission>();

  for (const role of userRoles) {
    const roleConfig = ROLE_PERMISSIONS[role];
    roleConfig.permissions.forEach(permission => permissions.add(permission));
  }

  return Array.from(permissions);
}
