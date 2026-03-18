// src/styles/responsive.ts
// ГЛОБАЛЬНЫЕ АДАПТИВНЫЕ СТИЛИ

export const responsive = {
  // Контейнеры
  pageContainer: {
    width: '100%',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 clamp(12px, 3vw, 24px)',
    boxSizing: 'border-box' as const
  },

  contentContainer: {
    padding: 'clamp(16px, 4vw, 32px)',
    minHeight: 'calc(100vh - 70px)',
    boxSizing: 'border-box' as const
  },

  // Карточки
  card: {
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'clamp(8px, 1.5vw, 16px)',
    padding: 'clamp(16px, 3vw, 24px)',
    boxShadow: 'var(--shadow-sm)'
  },

  cardHeader: {
    padding: 'clamp(16px, 3vw, 24px)',
    borderBottom: '1px solid var(--border-color)'
  },

  // Сетки
  grid2Cols: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
    gap: 'clamp(12px, 2vw, 20px)'
  },

  grid3Cols: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(250px, 100%), 1fr))',
    gap: 'clamp(12px, 2vw, 16px)'
  },

  grid4Cols: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))',
    gap: 'clamp(10px, 1.5vw, 14px)'
  },

  // Flex
  flexRow: {
    display: 'flex',
    gap: 'clamp(8px, 1.5vw, 16px)',
    alignItems: 'center' as const,
    flexWrap: 'wrap' as const
  },

  flexCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'clamp(10px, 2vw, 16px)'
  },

  // Типография
  h1: {
    fontSize: 'clamp(24px, 4vw, 32px)',
    fontWeight: '700' as const,
    lineHeight: 1.2,
    margin: 0
  },

  h2: {
    fontSize: 'clamp(20px, 3.5vw, 28px)',
    fontWeight: '700' as const,
    lineHeight: 1.3,
    margin: 0
  },

  h3: {
    fontSize: 'clamp(18px, 3vw, 24px)',
    fontWeight: '600' as const,
    lineHeight: 1.4,
    margin: 0
  },

  h4: {
    fontSize: 'clamp(16px, 2.5vw, 20px)',
    fontWeight: '600' as const,
    lineHeight: 1.4,
    margin: 0
  },

  bodyLarge: {
    fontSize: 'clamp(15px, 2vw, 18px)',
    lineHeight: 1.6
  },

  body: {
    fontSize: 'clamp(14px, 1.8vw, 16px)',
    lineHeight: 1.6
  },

  bodySmall: {
    fontSize: 'clamp(12px, 1.5vw, 14px)',
    lineHeight: 1.5
  },

  caption: {
    fontSize: 'clamp(11px, 1.3vw, 13px)',
    lineHeight: 1.4
  },

  // Кнопки
  button: {
    padding: 'clamp(8px, 1.5vw, 12px) clamp(16px, 2.5vw, 24px)',
    fontSize: 'clamp(13px, 1.8vw, 15px)',
    fontWeight: '600' as const,
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap' as const
  },

  buttonSmall: {
    padding: 'clamp(6px, 1vw, 8px) clamp(12px, 2vw, 16px)',
    fontSize: 'clamp(12px, 1.6vw, 14px)',
    fontWeight: '600' as const,
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer'
  },

  buttonLarge: {
    padding: 'clamp(12px, 2vw, 16px) clamp(20px, 3vw, 32px)',
    fontSize: 'clamp(14px, 2vw, 16px)',
    fontWeight: '700' as const,
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer'
  },

  // Инпуты
  input: {
    width: '100%',
    padding: 'clamp(10px, 1.8vw, 14px) clamp(12px, 2vw, 16px)',
    fontSize: 'clamp(14px, 1.8vw, 16px)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    outline: 'none',
    boxSizing: 'border-box' as const
  },

  textarea: {
    width: '100%',
    minHeight: 'clamp(80px, 15vw, 120px)',
    padding: 'clamp(10px, 1.8vw, 14px) clamp(12px, 2vw, 16px)',
    fontSize: 'clamp(14px, 1.8vw, 16px)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    outline: 'none',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const
  },

  // Аватары
  avatar: (size: 'small' | 'medium' | 'large' | 'xlarge' = 'medium') => {
    const sizes = {
      small: 'clamp(32px, 5vw, 40px)',
      medium: 'clamp(40px, 6vw, 48px)',
      large: 'clamp(48px, 7vw, 56px)',
      xlarge: 'clamp(60px, 10vw, 80px)'
    };
    const fontSizes = {
      small: 'clamp(12px, 1.8vw, 16px)',
      medium: 'clamp(14px, 2vw, 18px)',
      large: 'clamp(16px, 2.5vw, 20px)',
      xlarge: 'clamp(20px, 3.5vw, 28px)'
    };
    return {
      width: sizes[size],
      height: sizes[size],
      minWidth: sizes[size],
      minHeight: sizes[size],
      aspectRatio: '1 / 1' as const,
      flexShrink: 0,
      borderRadius: '50%',
      display: 'flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      fontSize: fontSizes[size],
      fontWeight: '700' as const
    };
  },

  // Бейджи
  badge: {
    padding: 'clamp(3px, 0.6vw, 5px) clamp(8px, 1.5vw, 12px)',
    fontSize: 'clamp(10px, 1.3vw, 12px)',
    fontWeight: '600' as const,
    borderRadius: '12px',
    whiteSpace: 'nowrap' as const
  },

  // Разделители
  gap: {
    xs: 'clamp(4px, 0.8vw, 6px)',
    sm: 'clamp(8px, 1.2vw, 10px)',
    md: 'clamp(12px, 2vw, 16px)',
    lg: 'clamp(16px, 2.5vw, 20px)',
    xl: 'clamp(20px, 3vw, 28px)',
    xxl: 'clamp(24px, 4vw, 32px)'
  },

  // Отступы
  spacing: {
    xs: 'clamp(4px, 0.8vw, 6px)',
    sm: 'clamp(8px, 1.2vw, 12px)',
    md: 'clamp(12px, 2vw, 16px)',
    lg: 'clamp(16px, 3vw, 24px)',
    xl: 'clamp(24px, 4vw, 32px)',
    xxl: 'clamp(32px, 5vw, 48px)'
  },

  // Медиа запросы (для условной логики в React)
  breakpoints: {
    mobile: 480,
    tablet: 768,
    laptop: 1024,
    desktop: 1280
  }
};

// Хелпер для создания медиа-запросов
export const useMediaQuery = (query: string): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(query).matches;
};

// Хелперы для проверки устройства
export const isMobile = () => window.innerWidth <= responsive.breakpoints.mobile;
export const isTablet = () => window.innerWidth > responsive.breakpoints.mobile && window.innerWidth <= responsive.breakpoints.tablet;
export const isLaptop = () => window.innerWidth > responsive.breakpoints.tablet && window.innerWidth <= responsive.breakpoints.laptop;
export const isDesktop = () => window.innerWidth > responsive.breakpoints.laptop;
