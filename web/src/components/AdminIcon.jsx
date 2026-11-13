const PATHS = {
  dashboard: ['M3 3h7v7H3z','M14 3h7v7h-7z','M3 14h7v7H3z','M14 14h7v7h-7z'],
  tasks: ['M4 7h2l2 2 4-4','M14 7h6','M4 17h2l2 2 4-4','M14 17h6'],
  chart: ['M4 20V10','M10 20V4','M16 20v-8','M22 20v-14'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2','M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8','M22 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'],
  tag: ['M20 13 11 22 2 13V4a2 2 0 0 1 2-2h9l9 9a2 2 0 0 1 0 3Z','M7.5 7.5h.01'],
  card: ['M2 5h20v14H2z','M2 10h20','M6 15h5'],
  orders: ['M3 4h2l2 12h12l2-9H6','M9 21h.01','M18 21h.01'],
  message: ['M21 11.5a8.4 8.4 0 0 1-.9 3.8A8.5 8.5 0 0 1 12.5 20a8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5Z'],
  qr: ['M3 3h7v7H3z','M14 3h7v7h-7z','M3 14h7v7H3z','M14 14h3','M14 18h2','M20 14v3','M18 20h3'],
  video: ['M3 5h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z','m18 9 5-3v12l-5-3'],
  microphone: ['M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z','M5 10v2a7 7 0 0 0 14 0v-2','M12 19v3','M8 22h8'],
  captions: ['M3 5h18v14H3z','M6 13h5','M13 13h5','M6 16h5','M13 16h5'],
  globe: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z','M2 12h20','M12 2a15 15 0 0 1 0 20','M12 2a15 15 0 0 0 0 20'],
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z','m21 21-4.35-4.35'],
  menu: ['M4 6h16','M4 12h16','M4 18h16'],
  close: ['M6 6l12 12','M18 6 6 18'],
  chevron: ['m9 18 6-6-6-6'],
  history: ['M3 12a9 9 0 1 0 3-6.7','M3 4v5h5','M12 7v5l3 2'],
  user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2','M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8'],
  logout: ['M10 17l5-5-5-5','M15 12H3','M12 3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6'],
  external: ['M12 5h7v7','M19 5 9 15','M19 13v6H5V5h6'],
  'chevron-down': ['m6 9 6 6 6-6'],
  refresh: ['M20 11a8 8 0 0 0-14-5L3 9','M3 3v6h6','M4 13a8 8 0 0 0 14 5l3-3','M15 15h6v6'],
};
export default function AdminIcon({ name, size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" focusable="false">
    {(PATHS[name] || PATHS.dashboard).map((d,i) => <path key={i} d={d} />)}
  </svg>;
}
