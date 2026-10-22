import type { ReactNode, SVGProps } from 'react';

export type IconName = 'home' | 'spark' | 'chat' | 'file' | 'user' | 'shield' | 'flag' | 'alert' | 'star' | 'settings' | 'bell' | 'logout' | 'search' | 'chevron';

export function Icon({ name, size = 18, ...props }: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const paths: Record<IconName, ReactNode> = {
    home: <><path {...common} d="m3 10 9-7 9 7" /><path {...common} d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    spark: <><path {...common} d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" /><path {...common} d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" /></>,
    chat: <><path {...common} d="M4 5.5h16v10H8l-4 4v-14Z" /><path {...common} d="M8 9h8M8 12h5" /></>,
    file: <><path {...common} d="M6 3h8l4 4v14H6V3Z" /><path {...common} d="M14 3v5h4M9 13h6M9 16h6" /></>,
    user: <><circle {...common} cx="12" cy="8" r="3.5" /><path {...common} d="M5 21c.7-3.2 3-5 7-5s6.3 1.8 7 5" /></>,
    shield: <><path {...common} d="M12 3 20 6v5c0 5-3.3 8.2-8 10-4.7-1.8-8-5-8-10V6l8-3Z" /><path {...common} d="m8.5 12 2.2 2.2 4.8-5" /></>,
    flag: <><path {...common} d="M5 21V4M5 5h12l-2 4 2 4H5" /></>,
    alert: <><path {...common} d="M12 4 21 20H3L12 4Z" /><path {...common} d="M12 9v5M12 17h.01" /></>,
    star: <path {...common} d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
    settings: <><path {...common} d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" /><path {...common} d="m19 12 2-1-1-2-2 .2a7.5 7.5 0 0 0-1.5-1.5l.2-2-2-1-1 2a7.4 7.4 0 0 0-2 0l-1-2-2 1 .2 2A7.5 7.5 0 0 0 7.4 9L5.4 8.8l-1 2 2 1a7.4 7.4 0 0 0 0 2l-2 1 1 2 2-.2a7.5 7.5 0 0 0 1.5 1.5l-.2 2 2 1 1-2a7.4 7.4 0 0 0 2 0l1 2 2-1-.2-2a7.5 7.5 0 0 0 1.5-1.5l2 .2 1-2-2-1a7.4 7.4 0 0 0 0-2Z" /></>,
    bell: <><path {...common} d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></>,
    logout: <><path {...common} d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9" /></>,
    search: <><circle {...common} cx="10.5" cy="10.5" r="6" /><path {...common} d="m15 15 5 5" /></>,
    chevron: <path {...common} d="m9 5 7 7-7 7" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
