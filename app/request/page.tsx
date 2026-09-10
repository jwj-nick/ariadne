import type { Metadata } from 'next';
import RequestSlip from '../components/RequestSlip';
import { CATEGORY_LABEL, DOMAIN_LABEL, getGraph, matchTargets } from '../lib/graph';

export const metadata: Metadata = {
  title: '새 항목 신청',
  description: '더 알고 싶은 것을 담아 두면, 새 카드를 만들어 달라고 부탁하는 글로 뽑아 줍니다.',
};

export default function RequestPage() {
  return (
    <div>
      <h1 className="mb-1 text-[22px] font-semibold">새 항목 신청</h1>
      <p className="mb-4 text-[13.5px]" style={{ color: 'var(--muted)' }}>
        여기에 없는 이름을 담아 두면 한 장의 글로 뽑아 줍니다. 그 글을 만드는 사람에게 넘기면
        다음 판에 실립니다.
      </p>
      <RequestSlip
        targets={matchTargets()}
        totalTraces={getGraph().traces.length}
        categories={Object.keys(CATEGORY_LABEL)}
        domains={Object.keys(DOMAIN_LABEL)}
      />
    </div>
  );
}
