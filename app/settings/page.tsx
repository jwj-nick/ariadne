import type { Metadata } from 'next';
import Settings from '../components/Settings';
import { getGraph } from '../lib/graph';

export const metadata: Metadata = {
  title: '진도와 백업',
  description: '진도를 확인하고, 눈높이를 고르고, 학습 기록을 백업합니다.',
};

export default function SettingsPage() {
  return (
    <div>
      <h1 className="mb-6 text-[22px] font-semibold">진도와 백업</h1>
      <Settings totalTraces={getGraph().traces.length} />
    </div>
  );
}
