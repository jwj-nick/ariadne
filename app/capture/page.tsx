import type { Metadata } from 'next';
import CaptureRunner from '../components/CaptureRunner';
import { matchTargets } from '../lib/graph';

export const metadata: Metadata = {
  title: '본 것 담기',
  description: '길에서 방송에서 마주친 것을 넣어 두면 아는 이름을 알아보고 오늘 퀴즈에 넣습니다.',
};

export default function CapturePage() {
  return (
    <div>
      <h1 className="mb-1 text-[22px] font-semibold">본 것 담기</h1>
      <p className="mb-4 text-[13.5px]" style={{ color: 'var(--muted)' }}>
        밖에서 마주친 이름을 여기에 넣어 두십시오. 아는 것이면 오늘 퀴즈에 넣고, 모르는 것이면
        새로 만들어 달라고 신청할 수 있습니다.
      </p>
      <CaptureRunner targets={matchTargets()} />
    </div>
  );
}
