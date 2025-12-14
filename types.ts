import React from 'react';

export enum AnalysisMode {
  DASHBOARD = 'DASHBOARD',
  GLACIER = 'GLACIER',
  AVALANCHE = 'AVALANCHE',
  ECOSYSTEM = 'ECOSYSTEM',
  WEATHER = 'WEATHER'
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

export interface Coordinates {
  x: number;
  y: number;
  label: string;
  id: string;
}

export interface GlacierData {
  year: number;
  massBalance: number;
  meltRate: number;
}

export interface EcoData {
  subject: string;
  A: number;
  B: number;
  fullMark: number;
}

export interface AiResponse {
  markdown: string;
  loading: boolean;
  error?: string;
  isThinking?: boolean;
}