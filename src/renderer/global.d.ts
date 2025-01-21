declare module '*.css';
declare module '*.svg';
declare module '*.png';
declare module 'react' {
    interface CSSProperties {
      WebkitAppRegion?: 'drag' | 'no-drag';
    }
  }
  
  export {};