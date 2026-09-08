import type { Metadata } from 'next';
import CaptureRunner from '../components/CaptureRunner';
import { matchTargets } from '../lib/graph';

export const metadata: Metadata = {
  title: '조우 캡처',
  description: '마주친 것을 던져 넣으면 아는 흔적을 알아보고 오늘 복습에 넣습니다.',
};

export default function CapturePage() {
  return (
    <div>
      <h1 className="mb-4 text-[22px] font-semibold">조우 캡처</h1>
      <CaptureRunner targets={matchTargets()} />
    </div>
  );
}
