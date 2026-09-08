import type { Metadata } from 'next';
import RequestSlip from '../components/RequestSlip';
import { CATEGORY_LABEL, DOMAIN_LABEL, getGraph, matchTargets } from '../lib/graph';

export const metadata: Metadata = {
  title: '카드 요청서',
  description: '더 알고 싶은 것을 담아 두면, 카드를 새로 만들어 달라고 부탁하는 글로 뽑아 줍니다.',
};

export default function RequestPage() {
  return (
    <div>
      <h1 className="mb-4 text-[22px] font-semibold">카드 요청서</h1>
      <RequestSlip
        targets={matchTargets()}
        totalTraces={getGraph().traces.length}
        categories={Object.keys(CATEGORY_LABEL)}
        domains={Object.keys(DOMAIN_LABEL)}
      />
    </div>
  );
}
