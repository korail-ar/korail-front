import type { ReactNode } from 'react';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import BottomSheet from '@/components/BottomSheet/BottomSheet';
import Button from '@/components/Button/Button';
import CategoryChip from '@/components/CategoryChip/CategoryChip';
import FacilityCard from '@/components/FacilityCard/FacilityCard';
import Icon, { ICON_NAMES } from '@/components/Icon/Icon';
import IconButton from '@/components/IconButton/IconButton';
import FloorControl from '@/components/MapControl/FloorControl';
import RecenterControl from '@/components/MapControl/RecenterControl';
import ZoomControl from '@/components/MapControl/ZoomControl';
import MapLabel from '@/components/MapLabel/MapLabel';
import MapMarker from '@/components/MapMarker/MapMarker';
import NumberBadge from '@/components/NumberBadge/NumberBadge';
import ResultItem from '@/components/ResultItem/ResultItem';
import RouteLine from '@/components/RouteLine/RouteLine';
import RouteSummary from '@/components/RouteSummary/RouteSummary';
import SearchField from '@/components/SearchField/SearchField';
import StateMessage from '@/components/StateMessage/StateMessage';
import StepBar from '@/components/StepBar/StepBar';
import StepItem from '@/components/StepItem/StepItem';
import Tag from '@/components/Tag/Tag';

// Figma "공통 컴포넌트"(node 82:72)를 실제 컴포넌트로 다시 배치한 한 장짜리 시트.
// 예시의 매장명·층·거리·시간은 가짜 값이다. Pressed 상태는 :active와 같은 클래스를 붙여 보여준다.

function Block({ title, spec, children }: { title: string; spec?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-heading text-ink">{title}</h2>
      {spec && <p className="text-caption text-ink-mute">{spec}</p>}
      <div className="flex flex-wrap items-start gap-6 rounded-md border border-dashed border-line-strong p-5">
        {children}
      </div>
    </section>
  );
}

const SAMPLE_ROUTE = [
  [10, 54],
  [10, 32],
  [170, 32],
  [170, 10],
] as const;

function UiComponents() {
  return (
    <div className="flex w-[1100px] flex-col gap-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-display text-ink">대전역 길찾기 · 컴포넌트</h1>
        <p className="text-body text-ink-mute">
          예시의 매장명·층·거리·시간은 가짜 값입니다. 색·간격·모서리는 토큰에 연결되어 있습니다.
        </p>
      </header>
      <Block title="Icons" spec="24 그리드 · 2px 선 · 둥근 끝">
        <div className="grid grid-cols-[repeat(16,24px)] gap-4">
          {ICON_NAMES.map((name) => (
            <Icon key={name} name={name} label={name} />
          ))}
        </div>
      </Block>
      <Block
        title="Button"
        spec="Type = Primary · Secondary · Text / State = Default · Pressed · Disabled"
      >
        <div className="grid grid-cols-[repeat(3,max-content)] gap-5">
          <Button icon="pin">여기로 안내</Button>
          <Button icon="pin" className="bg-brand-press">
            여기로 안내
          </Button>
          <Button icon="pin" disabled>
            여기로 안내
          </Button>
          <Button variant="secondary" icon="pin">
            여기로 안내
          </Button>
          <Button variant="secondary" icon="pin" className="bg-brand-tint">
            여기로 안내
          </Button>
          <Button variant="secondary" icon="pin" disabled>
            여기로 안내
          </Button>
          <Button variant="text" icon="refresh">
            여기로 안내
          </Button>
          <Button variant="text" icon="refresh" className="bg-brand-tint">
            여기로 안내
          </Button>
          <Button variant="text" icon="refresh" disabled>
            여기로 안내
          </Button>
        </div>
      </Block>
      <div className="flex flex-wrap gap-12">
        <Block title="IconButton" spec="State = Default · Pressed · Disabled">
          <IconButton icon="chev-left" label="뒤로" />
          <IconButton icon="chev-left" label="뒤로(눌림)" className="bg-surface-sunken" />
          <IconButton icon="chev-left" label="뒤로(비활성)" disabled />
        </Block>
        <Block title="CategoryChip" spec="State = Default · Selected · Disabled">
          <CategoryChip icon="toilet" label="화장실" />
          <CategoryChip icon="toilet" label="화장실" selected />
          <CategoryChip icon="toilet" label="화장실" disabled />
        </Block>
      </div>
      <div className="flex flex-wrap gap-12">
        <Block title="Tag" spec="Type = Neutral · Info · Start · Warn">
          <Tag label="3층" />
          <Tag label="3층" variant="info" />
          <Tag label="3층" variant="start" />
          <Tag label="3층" variant="warn" />
        </Block>
        <Block title="NumberBadge" spec="Type = Exit · Platform · Car">
          <NumberBadge kind="exit" number={1} />
          <NumberBadge kind="platform" number={1} />
          <NumberBadge kind="car" number={1} />
        </Block>
      </div>
      <Block title="SearchField" spec="State = Default · Focus · Float">
        <SearchField className="w-80" label="목적지 검색(기본)" />
        <SearchField
          className="w-80 border-2 border-brand"
          label="목적지 검색(포커스)"
          value="어디로 가시나요?"
          readOnly
          onClear={fn()}
        />
        <SearchField className="w-80" label="목적지 검색(지도 위)" floating />
      </Block>
      <Block title="ResultItem">
        <ResultItem className="w-80" icon="toilet" name="화장실 (동쪽)" meta="3층 · 매장 A 옆" />
      </Block>
    </div>
  );
}

function MapAndWayfinding() {
  return (
    <div className="flex w-[1100px] flex-col gap-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-display text-ink">지도 · 안내 · 상태</h1>
        <p className="text-body text-ink-mute">
          지도 우선순위: 목적지 → 안내 시작 위치 → 층간 이동 → 단계 지점 → 경로선 → 선택된 시설 →
          시설. 안내 시작 위치는 멈춰 있는 표시입니다(움직임·방향 화살표 없음).
        </p>
      </header>
      <div className="flex flex-wrap gap-12">
        <Block
          title="MapMarker"
          spec="Destination · Start · Floor · Step · FacilitySelected · Facility · FacilityDim"
        >
          <MapMarker type="destination" icon="ticket" />
          <MapMarker type="start" />
          <MapMarker type="floor" icon="stairs" />
          <MapMarker type="step" step={1} />
          <MapMarker type="facility-selected" icon="locker" />
          <MapMarker type="facility" icon="locker" />
          <MapMarker type="facility-dim" />
        </Block>
        <Block title="MapLabel" spec="Type = Facility · Strong · Start">
          <MapLabel label="보관함" />
          <MapLabel label="보관함" variant="strong" />
          <MapLabel label="보관함" variant="start" />
        </Block>
      </div>
      <div className="flex flex-wrap gap-12">
        <Block title="RouteLine" spec="Type = Default · Transfer (회색 바탕은 미리보기용)">
          <svg width="180" height="64" overflow="visible" className="bg-map-ground" aria-hidden>
            <RouteLine points={SAMPLE_ROUTE} />
          </svg>
          <svg width="180" height="64" overflow="visible" className="bg-map-ground" aria-hidden>
            <RouteLine points={SAMPLE_ROUTE} transfer />
          </svg>
        </Block>
        <Block title="MapControls" spec="Zoom · Recenter · Floors">
          <div className="flex items-start gap-10">
            <ZoomControl onZoomIn={fn()} onZoomOut={fn()} />
            <RecenterControl onRecenter={fn()} />
            <FloorControl floors={['4F', '3F', '2F', '1F']} value="3F" onChange={fn()} />
          </div>
        </Block>
      </div>
      <Block title="FacilityCard · RouteSummary">
        <FacilityCard
          className="w-[330px]"
          icon="locker"
          name="물품보관함"
          floor="3층"
          needsCheck
          rows={[
            { id: 'location', icon: 'pin', text: '화장실(동쪽) 옆' },
            { id: 'time', icon: 'walk', text: '안내 시작 위치에서 약 1분' },
          ]}
        />
        <RouteSummary
          className="w-80"
          from="출입구 1 안쪽"
          to="매표·안내 창구"
          time="약 2분"
          distance="약 120m · 같은 층"
          stepCount={3}
          floor="3층"
        />
      </Block>
      <Block title="StepItem · StepBar" spec="State = Done · Current · Next">
        <ol className="w-[300px]">
          <StepItem state="done" icon="arrow-up" text="출입구 1에서 앞으로 직진" />
          <StepItem
            state="current"
            icon="turn-right"
            text="출입구 1에서 앞으로 직진"
            sub="매장 B가 왼쪽에 보여요 · 약 30m"
          />
          <StepItem state="next" icon="pin" text="출입구 1에서 앞으로 직진" />
        </ol>
        <StepBar
          className="w-80 self-start"
          icon="turn-right"
          text="대합실 앞에서 오른쪽으로"
          sub="매장 B가 왼쪽에 보여요 · 약 30m"
        />
      </Block>
      <Block title="BottomSheet">
        <div className="w-[344px]">
          <BottomSheet title="자주 찾는 곳">
            <p className="text-caption text-ink-mute">
              내용 자리: 결과 목록 · FacilityCard · RouteSummary · StepItem 중 하나만 넣습니다.
            </p>
          </BottomSheet>
        </div>
      </Block>
      <Block title="StateMessage" spec="Type = Loading · Empty · NeedsCheck · NoRoute · Error">
        <div className="flex flex-wrap items-start gap-6">
          <StateMessage className="w-60" type="loading" />
          <StateMessage className="w-60" type="empty" />
          <StateMessage className="w-60" type="needs-check" />
          <StateMessage
            className="w-60"
            type="no-route"
            action={{ label: '목적지 변경', onClick: fn() }}
          />
          <StateMessage
            className="w-60"
            type="error"
            action={{ label: '다시 시도', onClick: fn() }}
          />
        </div>
      </Block>
    </div>
  );
}

const meta = {
  title: 'Design Sheet/Components',
  component: UiComponents,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof UiComponents>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Figma "컴포넌트 상태 (UI Components)" 프레임. */
export const UiComponentsSheet: Story = {};

/** Figma "지도 상태 스타일 (Map & Wayfinding)" 프레임. */
export const MapAndWayfindingSheet: Story = { render: () => <MapAndWayfinding /> };
