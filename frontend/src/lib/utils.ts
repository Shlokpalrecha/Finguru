import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    food: 'bg-orange-500',
    transport: 'bg-blue-500',
    office_supplies: 'bg-purple-500',
    utilities: 'bg-yellow-500',
    rent: 'bg-red-500',
    professional_services: 'bg-indigo-500',
    raw_materials: 'bg-green-500',
    maintenance: 'bg-pink-500',
    miscellaneous: 'bg-gray-500',
  };
  return colors[category] || 'bg-gray-500';
}

export function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    food: 'Food & Beverages',
    transport: 'Transportation',
    office_supplies: 'Office Supplies',
    utilities: 'Utilities',
    rent: 'Rent & Lease',
    professional_services: 'Professional Services',
    raw_materials: 'Raw Materials',
    maintenance: 'Repairs & Maintenance',
    miscellaneous: 'Miscellaneous',
  };
  return names[category] || category;
}
