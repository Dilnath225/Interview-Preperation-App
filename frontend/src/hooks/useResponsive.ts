import { useWindowDimensions, Platform } from 'react-native';

export interface ResponsiveInfo {
  width: number;
  height: number;
  isWeb: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  maxContentWidth: number;
  contentPadding: number;
  columns: number;
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  const isWeb = Platform.OS === 'web';
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;
  const isWide = width >= 1280;

  // Max width for centered content container
  const maxContentWidth = isWide ? 1240 : isDesktop ? 1080 : isTablet ? 720 : width;
  const contentPadding = isDesktop ? 32 : isTablet ? 24 : 16;
  const columns = isWide ? 4 : isDesktop ? 3 : isTablet ? 2 : 1;

  return {
    width,
    height,
    isWeb,
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    maxContentWidth,
    contentPadding,
    columns,
  };
}
