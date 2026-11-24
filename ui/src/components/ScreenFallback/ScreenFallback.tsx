import AppBar from '@/components/AppBar/AppBar';
import StateMessage from '@/components/StateMessage/StateMessage';

interface ScreenFallbackProps {
  title: string;
}

/** 주소(출발 위치·목적지)를 읽기 전에 잠깐 보이는 화면. 제목 줄은 미리 그려 둔다. */
export default function ScreenFallback({ title }: ScreenFallbackProps) {
  return (
    <>
      <AppBar title={title} />
      <div className="px-5 pt-2">
        <StateMessage type="loading" title="화면을 준비하는 중" />
      </div>
    </>
  );
}
