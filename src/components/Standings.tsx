import { useGame } from '@/game/GameContext';
import { standings } from '@/game/selectors';

export function Standings() {
  const { state } = useGame();
  return (
    <ul className="flex w-full max-w-sm flex-col gap-1">
      {standings(state).map((team, i) => (
        <li
          key={team.id}
          className={`flex items-center gap-3 rounded-lg bg-card px-4 py-2 ${
            state.activeTeamIds.includes(team.id) ? '' : 'opacity-40'
          }`}
        >
          <span className="w-5 text-sm text-muted-foreground">{i + 1}</span>
          <span className="h-3 w-3 rounded-full" style={{ background: team.color }} />
          <span className="flex-1 truncate font-medium">{team.name}</span>
          <span className="text-xl font-bold tabular-nums">{team.score}</span>
        </li>
      ))}
    </ul>
  );
}
