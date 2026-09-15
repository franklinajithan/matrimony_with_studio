/**
 * CupidMatch Design Tokens
 * 
 * Central source of truth for design values.
 * Use these tokens throughout the application for consistency.
 * 
 * Brand Promise: "Meet someone who understands where you come from — and where you're going."
 * Visual Direction: Modern, warm, professional
 */

// =============================================================================
// COLORS
// =============================================================================

export const colors = {
  // Background & Surfaces
  background: {
    primary: '#FBF8F4', // Warm ivory
    surface: '#FFFFFF', // White
    elevated: '#FFFFFF', // White elevated surfaces
  },

  // Text
  text: {
    primary: '#17151D', // Near-black
    secondary: '#6F6979', // Muted gray
    muted: '#9B95A3', // Even more muted
    inverse: '#FFFFFF', // White text on dark backgrounds
  },

  // Brand Colors
  brand: {
    violet: {
      DEFAULT: '#7027E8', // Primary violet
      light: '#EEE7FF', // Soft violet background
      dark: '#5A1FB8', // Darker violet for hover
    },
    coral: {
      DEFAULT: '#FF6F72', // Coral accent
      light: '#FFE5E6', // Soft coral background
      dark: '#E65659', // Darker coral for hover
    },
    ivory: {
      DEFAULT: '#FBF8F4', // Warm ivory (same as background.primary)
    },
  },

  // Semantic Colors
  status: {
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    info: '#3B82F6',
    infoLight: '#DBEAFE',
  },

  // Border & Dividers
  border: {
    DEFAULT: '#EAE4EF', // Soft lavender border
    light: '#F5F2F7', // Even lighter border
    dark: '#D4CEDA', // Darker border for emphasis
  },
} as const;

// =============================================================================
// SPACING
// =============================================================================

/**
 * Spacing scale based on 4px base unit
 * Use consistent spacing for predictable layouts
 */
export const spacing = {
  0: '0',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  32: '8rem', // 128px
  40: '10rem', // 160px
  48: '12rem', // 192px
  56: '14rem', // 224px
  64: '16rem', // 256px
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    serif: '"Cormorant Garamond", Georgia, serif',
  },

  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }], // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
    base: ['1rem', { lineHeight: '1.5rem' }], // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '5xl': ['3rem', { lineHeight: '1' }], // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }], // 60px
    '7xl': ['4.5rem', { lineHeight: '1' }], // 72px
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// =============================================================================
// BORDERS & RADIUS
// =============================================================================

export const borders = {
  width: {
    DEFAULT: '1px',
    0: '0px',
    2: '2px',
    4: '4px',
    8: '8px',
  },

  radius: {
    none: '0',
    sm: '0.375rem', // 6px
    DEFAULT: '0.5rem', // 8px
    md: '0.75rem', // 12px
    lg: '1rem', // 16px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '2rem', // 32px
    full: '9999px',
  },
} as const;

// =============================================================================
// SHADOWS
// =============================================================================

/**
 * Restrained shadows for depth
 */
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  none: 'none',
} as const;

// =============================================================================
// BREAKPOINTS
// =============================================================================

/**
 * Responsive breakpoints
 * Mobile-first approach
 */
export const breakpoints = {
  xs: '360px', // Small mobile
  sm: '390px', // Standard mobile
  md: '768px', // Tablet
  lg: '1024px', // Small desktop
  xl: '1440px', // Standard desktop
  '2xl': '1920px', // Large desktop
} as const;

// =============================================================================
// Z-INDEX SCALE
// =============================================================================

/**
 * Z-index layers for consistent stacking
 */
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

// =============================================================================
// TRANSITIONS
// =============================================================================

/**
 * Animation timing and durations
 * Respect prefers-reduced-motion
 */
export const transitions = {
  duration: {
    fast: '150ms',
    DEFAULT: '200ms',
    slow: '300ms',
    slower: '500ms',
  },

  timing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
} as const;

// =============================================================================
// COMPONENT-SPECIFIC TOKENS
// =============================================================================

/**
 * Specific values for common components
 */
export const components = {
  button: {
    height: {
      sm: '2rem', // 32px
      md: '2.5rem', // 40px
      lg: '3rem', // 48px
      xl: '3.5rem', // 56px
    },
    paddingX: {
      sm: '0.75rem', // 12px
      md: '1rem', // 16px
      lg: '1.5rem', // 24px
      xl: '2rem', // 32px
    },
  },

  input: {
    height: {
      sm: '2rem', // 32px
      md: '2.5rem', // 40px
      lg: '3rem', // 48px
    },
  },

  card: {
    padding: {
      sm: '1rem', // 16px
      md: '1.5rem', // 24px
      lg: '2rem', // 32px
    },
    radius: borders.radius['2xl'], // 24px
  },

  navbar: {
    height: '4rem', // 64px
  },

  footer: {
    paddingY: '3rem', // 48px
  },

  touchTarget: {
    min: '44px', // Accessibility minimum
  },
} as const;

// =============================================================================
// ACCESSIBILITY
// =============================================================================

/**
 * Accessibility-focused values
 */
export const a11y = {
  focusRing: {
    width: '2px',
    offset: '2px',
    color: colors.brand.violet.DEFAULT,
    style: 'solid',
  },

  minimumTouchTarget: '44px',
  
  contrastRatios: {
    // WCAG 2.2 AA requirements
    normalText: 4.5,
    largeText: 3,
    uiComponents: 3,
  },
} as const;

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Complete design system export
 */
export const designTokens = {
  colors,
  spacing,
  typography,
  borders,
  shadows,
  breakpoints,
  zIndex,
  transitions,
  components,
  a11y,
} as const;

export default designTokens;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type ColorToken = typeof colors;
export type SpacingToken = typeof spacing;
export type TypographyToken = typeof typography;
export type BorderToken = typeof borders;
export type ShadowToken = typeof shadows;
export type BreakpointToken = typeof breakpoints;
export type ZIndexToken = typeof zIndex;
export type TransitionToken = typeof transitions;
export type ComponentToken = typeof components;
export type A11yToken = typeof a11y;
export type DesignTokens = typeof designTokens;
