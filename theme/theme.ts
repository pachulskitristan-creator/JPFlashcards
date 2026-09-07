// theme/theme.ts
// Palette drawn from Japanese traditional colors (伝統色) instead of an
// arbitrary swatch set:
//   - Ai-iro   藍色  indigo blue   -> primary
//   - Shu-iro  朱色  vermillion    -> accentRed (shrine-gate red)
//   - Matcha-iro 抹茶色 tea green  -> success
//   - Sumi-iro 墨色  ink black     -> primary text (light) / background (dark)
//   - Washi    和紙  paper cream  -> background (light) / primary text (dark)
// Light mode leads with washi paper and ink text; dark mode inverts to
// sumi ink with washi text, both keeping the same indigo/vermillion/
// matcha accents so the app reads as the same palette in either mode,
// not two different ones.

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  card: string;
  primary: string;
  primaryDark: string;
  accentRed: string;
  textPrimary: string;
  textSecondary: string;
  textOnPrimary: string;
  border: string;
  success: string;
  successBg: string;
  error: string;
  errorBg: string;
  shadow: string;
}

export const lightColors: ThemeColors = {
  background: '#F8F3E7', // washi paper
  surface: '#FFFFFF',
  surfaceAlt: '#F1ECDD', // paper tint
  card: '#E6EDF6', // pale ai-iro tint
  primary: '#2A5F91', // ai-iro (indigo blue)
  primaryDark: '#153252', // deep indigo
  accentRed: '#C8392C', // shu-iro (shrine vermillion)
  textPrimary: '#27282B', // sumi-iro (ink black)
  textSecondary: '#5C616A',
  textOnPrimary: '#FFFFFF',
  border: '#E2DCCB',
  success: '#6C8C3E', // matcha
  successBg: '#E9F0DB',
  error: '#B23B3B',
  errorBg: '#FBEAE8',
  shadow: '#27282B',
};

export const darkColors: ThemeColors = {
  background: '#18191B', // sumi-iro (ink black)
  surface: '#1C2A3A', // ai-iro-tinted surface
  surfaceAlt: '#182432',
  card: '#223850', // ai-iro card
  primary: '#5C97CC', // ai-iro, lifted for contrast on ink
  primaryDark: '#0F1E2E',
  accentRed: '#E07A62', // shu-iro, lifted for contrast on ink
  textPrimary: '#F3EEDF', // washi paper
  textSecondary: '#9FAEBC',
  textOnPrimary: '#101820',
  border: '#2C4058',
  success: '#8FB262', // matcha, lifted
  successBg: '#1F2C18',
  error: '#E2726B',
  errorBg: '#3A1C1A',
  shadow: '#000000',
};
