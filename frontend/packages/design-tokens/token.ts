export const colors = {
primary: '#0d6efd', secondary: '#6c757d', success: '#198754', info: '#0dcaf0', warning: '#ffc107', danger: '#dc3545', light: '#f8f9fa', dark: '#212529'
} as const;
export const radius = { sm: '4px', md: '8px', lg: '12px', xl: '20px' } as const;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32 } as const;
export const typography = { fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Arial, sans-serif', baseSize: 16 } as const;
export type Tokens = { colors: typeof colors; radius: typeof radius; spacing: typeof spacing; typography: typeof typography };
export const tokens: Tokens = { colors, radius, spacing, typography };