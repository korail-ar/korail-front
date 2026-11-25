import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { ReactNode } from 'react';

import Button from '@/components/Button/Button';
import CheckpointMarker from '@/components/CheckpointMarker/CheckpointMarker';
import GuidanceSheet, {
  GUIDANCE_SHEET_LINK_CLASS_NAMES,
} from '@/components/GuidanceSheet/GuidanceSheet';
import JourneyMilestones from '@/components/JourneyMilestones/JourneyMilestones';
import LandmarkPhoto from '@/components/LandmarkPhoto/LandmarkPhoto';
import LandmarkRow from '@/components/LandmarkRow/LandmarkRow';
import MapBadge from '@/components/MapBadge/MapBadge';
import SitePhotoMarker from '@/components/SitePhotoMarker/SitePhotoMarker';
import StepBar from '@/components/StepBar/StepBar';

const PHOTO = '/landmarks/flying-scone.png';

/**
 * 경로 안내 B·C안(Figma 295:2546~303:6776) 화면을 공통 컴포넌트로 조합한 모습.
 * 지도·경로는 디자인팀이 평면도에 맞춰 다시 고칠 예정이라(#34) 빈 지도 자리로 둔다.
 */
function Phone({ children, mapOverlay }: { children: ReactNode; mapOverlay?: ReactNode }) {
  return (
    <div className="flex h-[740px] w-[375px] flex-col overflow-hidden bg-bg">
      <div className="relative min-h-0 flex-1 bg-map-ground">
        <p className="absolute inset-x-0 top-1/2 text-center text-micro text-ink-mute">
          지도·경로 자리 (평면도 수정 후 #34)
        </p>
        {mapOverlay}
      </div>
      <div className="-mt-6">{children}</div>
    </div>
  );
}

function SheetLink({ children }: { children: ReactNode }) {
  return (
    <button type="button" className={GUIDANCE_SHEET_LINK_CLASS_NAMES}>
      {children}
    </button>
  );
}

const meta = {
  title: 'Design Sheet/Journey panels',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** B01 경로 전체 확인 */
export const B01RouteOverview: Story = {
  render: () => (
    <Phone mapOverlay={<MapBadge label="3F · 맞이방" className="absolute top-4 left-5" />}>
      <GuidanceSheet
        showHandle
        eyebrow="맞이방 QR에서 매표소까지"
        title="매표소로 가는 길"
        primaryAction={<Button>이 경로로 안내 시작</Button>}
      >
        <JourneyMilestones
          milestones={[
            { id: 'start', label: '맞이방 QR', role: '출발' },
            { id: 'via', label: '플라잉스콘', role: '경유' },
            { id: 'end', label: '매표소', role: '도착' },
          ]}
          current={0}
        />
        <ol>
          <LandmarkRow
            number={1}
            title="플라잉스콘을 지나 매표소로"
            description="중간 지점을 확인하며 이동해요"
          />
        </ol>
      </GuidanceSheet>
    </Phone>
  ),
};

/** B02 지도 따라가기 */
export const B02FollowMap: Story = {
  render: () => (
    <Phone
      mapOverlay={
        <>
          <StepBar
            variant="floating"
            icon="arrow-up"
            text="플라잉스콘 방향으로 직진"
            sub="매장을 오른쪽에 두고 이동하세요"
            className="absolute inset-x-5 top-4"
          />
          <MapBadge label="3F" className="absolute top-30 left-5" />
          <SitePhotoMarker src={PHOTO} placeName="플라잉스콘" className="absolute top-44 left-36" />
        </>
      }
    >
      <GuidanceSheet
        showHandle
        eyebrow="맞이방 QR → 매표소"
        title="플라잉스콘을 지나 매표소로"
        description="사진과 주변 간판을 비교하며 이동하세요."
        primaryAction={<Button>도착했어요 · 안내 종료</Button>}
        secondaryAction={<SheetLink>전체 이동 순서 보기</SheetLink>}
      />
    </Phone>
  ),
};

/** B03 · C 사진으로 현장 확인 */
export const B03SitePhoto: Story = {
  render: () => (
    <Phone>
      <GuidanceSheet
        showHandle
        title="이 간판을 찾아보세요"
        primaryAction={<Button>확인했어요 · 지도로 돌아가기</Button>}
        note="사진과 다르면 가까운 QR에서 위치 다시 확인"
      >
        <LandmarkPhoto src={PHOTO} alt="FLYING SCONE 간판이 보이는 3층 맞이방" />
        <p className="text-caption font-bold text-ink">플라잉스콘 · 3층 맞이방</p>
        <p className="text-body-sm whitespace-pre-line text-ink">
          {'FLYING SCONE 간판을 확인하고,\n매장을 오른쪽에 두고 이동하세요.'}
        </p>
      </GuidanceSheet>
    </Phone>
  ),
};

/** B04 필요할 때 이동 순서 펼치기 */
export const B04LandmarkList: Story = {
  render: () => (
    <Phone>
      <GuidanceSheet
        showHandle
        title="이 지점들만 확인하세요"
        description="맞이방 QR → 플라잉스콘 → 매표소"
        primaryAction={<Button>지도로 돌아가기</Button>}
        note="길이 헷갈리면 가까운 QR을 다시 확인하세요."
      >
        <ol>
          <LandmarkRow number={1} title="맞이방 QR에서 출발" description="맞이방 통로로 진입" />
          <LandmarkRow number={2} title="플라잉스콘 통과" description="매장을 오른쪽에 두고 이동" />
          <LandmarkRow
            number={3}
            title="매표소 표지판 확인"
            description="승차권 구매·변경·환불 문의"
          />
        </ol>
      </GuidanceSheet>
    </Phone>
  ),
};

/** C01~C03 스팟 확인형: 다음 확인 지점 */
export const C01SpotCheck: Story = {
  render: () => (
    <Phone
      mapOverlay={
        <>
          <StepBar
            variant="floating"
            text="통로 끝까지 곧장 이동하세요"
            sub="안내된 통로 끝을 확인하면 다음 단계"
            className="absolute inset-x-5 top-4"
          />
          <span className="absolute bottom-16 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
            <CheckpointMarker />
            <MapBadge label="QR로 확인한 출발점" tone="muted" />
          </span>
        </>
      }
    >
      <GuidanceSheet
        eyebrow="다음 확인 지점"
        title="맞이방 통로 끝"
        description={'해당 지점에 도착한 뒤 눌러주세요.\n다음 구간이 화면 위쪽으로 정렬돼요.'}
        primaryAction={<Button>다음 단계</Button>}
        secondaryAction={<SheetLink>시작 위치 다시 확인</SheetLink>}
      />
    </Phone>
  ),
};

/** C04 마지막 확인 지점 */
export const C04LastSpot: Story = {
  render: () => (
    <Phone
      mapOverlay={
        <StepBar
          variant="floating"
          text="정면의 매표소를 확인하세요"
          sub="승차권 구매·변경·환불 창구"
          className="absolute inset-x-5 top-4"
        />
      }
    >
      <GuidanceSheet
        eyebrow="마지막 확인 지점"
        title="매표소"
        description="현장 표지판에서 매표소를 확인해 주세요."
        primaryAction={<Button>도착했어요</Button>}
        secondaryAction={<SheetLink>이전 지점으로</SheetLink>}
      />
    </Phone>
  ),
};
