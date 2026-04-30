import GameClient from '@/app/game/GameClient';

export const metadata = {
    title: 'GBF Portal | RPG Clicker',
    description: 'A hybrid RPG clicker and dungeon crawler game.',
};

export default function GamePage() {
    return <GameClient />;
}
