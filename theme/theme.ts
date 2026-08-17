// theme/theme.ts
// Palette derived from the uploaded swatches: deep navy, warm cream/white,
// brick red, medium blue, and a dark teal-navy. Same five colors, two
// arrangements — light mode leads with the cream/white, dark mode leads
// with the navy.

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
  background: '#F7F4EC', // warm cream
  surface: '#FFFFFF',
  surfaceAlt: '#EFF3F8',
  card: '#E7EEF6', // pale medium-blue tint
  primary: '#2C6FA0', // medium blue
  primaryDark: '#153A52', // dark teal-navy
  accentRed: '#B23A3D', // brick red
  textPrimary: '#122335', // near-black navy
  textSecondary: '#5C6E80',
  textOnPrimary: '#FFFFFF',
  border: '#E0DED2',
  success: '#3FAE72',
  successBg: '#E4F8ED',
  error: '#C24A47',
  errorBg: '#FBEAE8',
  shadow: '#122335',
};

export const darkColors: ThemeColors = {
  background: '#0E1B2A', // near-black navy
  surface: '#153043',
  surfaceAlt: '#102538',
  card: '#1A3A52', // dark teal-navy
  primary: '#4C93C9', // medium blue, lifted for contrast on dark
  primaryDark: '#0E1B2A',
  accentRed: '#D2645F', // brick red, lifted for contrast on dark
  textPrimary: '#F5F2E8', // warm cream
  textSecondary: '#9AB0C2',
  textOnPrimary: '#0E1B2A',
  border: '#22415C',
  success: '#57C98B',
  successBg: '#123527',
  error: '#DE7A76',
  errorBg: '#3A1E1D',
  shadow: '#000000',
};
