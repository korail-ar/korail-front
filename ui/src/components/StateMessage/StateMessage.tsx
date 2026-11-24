import Button, { type ButtonVariant } from '@/components/Button/Button';
import Icon, { type IconName } from '@/components/Icon/Icon';
import cn from '@/lib/cn';

export type StateMessageType = 'loading' | 'empty' | 'needs-check' | 'no-route' | 'error';

interface StateMessageAction {
  label: string;
  onClick: () => void;
  /** 기본 모양(상태별)을 바꿀 때. 예: 오류 카드의 '다시 시도' 텍스트 링크(Figma W11) */
  variant?: ButtonVariant;
  className?: string;
}

interface StateMessageProps {
  type: StateMessageType;
  /** 기본 문구를 바꿀 때만 넘긴다. 제목은 무슨 일인지, 설명은 지금 할 수 있는 일. */
  title?: string;
  description?: string;
  action?: StateMessageAction;
  className?: string;
}

interface StateConfig {
  icon: IconName;
  iconClassName: string;
  title: string;
  description: string;
  actionVariant: ButtonVariant;
}

// 빨강(danger)은 오류에만 쓴다.
const STATE_CONFIGS: Record<StateMessageType, StateConfig> = {
  loading: {
    icon: 'refresh',
    iconClassName: 'bg-bg text-brand motion-safe:[&>span]:animate-spin',
    title: '지도를 불러오는 중',
    description: '잠시만 기다려 주세요.',
    actionVariant: 'primary',
  },
  empty: {
    icon: 'search',
    iconClassName: 'bg-bg text-ink-sub',
    title: '검색 결과가 없어요',
    description: '다른 이름으로 찾거나\n아래 분류에서 골라 보세요.',
    actionVariant: 'secondary',
  },
  'needs-check': {
    icon: 'alert',
    iconClassName: 'bg-warn-bg text-warn-icon',
    title: '정보 확인이 필요해요',
    description: '현장과 다를 수 있어요.\n가까운 안내 창구에서 확인해 주세요.',
    actionVariant: 'secondary',
  },
  'no-route': {
    icon: 'walk',
    iconClassName: 'bg-warn-bg text-warn-icon',
    title: '경로를 찾지 못했어요',
    description: '다른 목적지를 선택하거나\n안내 창구에 문의해 주세요.',
    actionVariant: 'secondary',
  },
  error: {
    icon: 'alert',
    iconClassName: 'bg-danger-bg text-danger',
    title: '문제가 생겼어요',
    description: '연결 상태 확인 후 다시 시도해 주세요.',
    actionVariant: 'primary',
  },
};

/** 기다리는 중이거나 보여줄 내용이 없을 때의 안내. */
export default function StateMessage({
  type,
  title,
  description,
  action,
  className,
}: StateMessageProps) {
  const config = STATE_CONFIGS[type];

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex flex-col items-center gap-2 rounded-lg border border-line bg-surface px-4 py-6 text-center',
        className,
      )}
    >
      <span
        className={cn(
          'flex size-14 items-center justify-center rounded-full',
          config.iconClassName,
        )}
      >
        <Icon name={config.icon} size={28} />
      </span>
      <p className="text-body-lg text-ink">{title ?? config.title}</p>
      <p className="text-caption whitespace-pre-line text-ink-sub">
        {description ?? config.description}
      </p>
      {action && (
        <Button
          variant={action.variant ?? config.actionVariant}
          onClick={action.onClick}
          className={action.className}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
