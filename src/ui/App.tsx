import { useZoleGame } from './game/useZoleGame.ts';
import { useKeyboard } from './game/useKeyboard.ts';
import { useTheme } from './theme/useTheme.ts';
import { Table } from './components/Table.tsx';

export function App() {
  const vm = useZoleGame();
  useKeyboard(vm);
  const { theme, setTheme } = useTheme();
  return <Table vm={vm} theme={theme} onThemeChange={setTheme} />;
}
