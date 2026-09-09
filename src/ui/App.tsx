import { useZoleGame } from './game/useZoleGame.ts';
import { Table } from './components/Table.tsx';

export function App() {
  const vm = useZoleGame();
  return <Table vm={vm} />;
}
