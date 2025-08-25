import { MD3LightTheme } from 'react-native-paper';
import { tokens } from '@packages/design-tokens/tokens';
export const paperTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: tokens.colors.primary,
        secondary: tokens.colors.secondary,
        surface: '#ffffff',
        background: '#ffffff',
        error: tokens.colors.danger,
    },
    roundness: parseInt(tokens.radius.md, 10) || 8,
};