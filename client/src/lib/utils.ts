import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

export function formatTimeRemaining(endTime: Date | string) {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end.getTime() - now.getTime();
  
  if (diff <= 0) return "Time expired";
  
  const minutes = Math.floor(diff / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function getStepName(step: string) {
  const stepNames: Record<string, string> = {
    'proposal_presentation': 'Proposal Presentation',
    'clarifying_questions': 'Clarifying Questions',
    'quick_reactions': 'Quick Reactions',
    'objections_round': 'Objections Round',
    'resolve_objections': 'Resolve Objections',
    'consent_round': 'Consent Round',
    'record_outcome': 'Record Outcome'
  };
  return stepNames[step] || step;
}

export function getStepDescription(step: string) {
  const descriptions: Record<string, string> = {
    'proposal_presentation': 'The proposer presents their proposal to the circle',
    'clarifying_questions': 'Participants ask questions to better understand the proposal',
    'quick_reactions': 'Participants share brief initial reactions and thoughts',
    'objections_round': 'Participants voice any objections to the proposal',
    'resolve_objections': 'Work together to find solutions to objections',
    'consent_round': 'Final round where participants give their consent decision',
    'record_outcome': 'Document the final decision and any follow-up actions'
  };
  return descriptions[step] || '';
}
