import { useZoleGame } from './game/useZoleGame.ts';
import { useTheme } from './theme/useTheme.ts';
import { Table } from './components/Table.tsx';

export function App() {
  const vm = useZoleGame();
  const { theme, setTheme } = useTheme();
  return <Table vm={vm} theme={theme} onThemeChange={setTheme} />;
}
