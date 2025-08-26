import { designTokens } from '../designTokens';

export type BrandColors = keyof typeof designTokens.colors.brand;
export type SemanticColors = keyof typeof designTokens.colors.semantic;
export type TypographyScale = keyof typeof designTokens.typography.scale;

export type TokenizedClasses =
  | `bg-brand-${BrandColors}`
  | `text-semantic-${SemanticColors}`
  | `text-${TypographyScale}`;
