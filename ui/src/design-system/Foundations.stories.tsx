import type { ReactNode } from 'react';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import {
  PRIMITIVE_SCALES,
  RADII,
  SEMANTIC_COLORS,
  SHADOWS,
  SIZES,
  SPACING,
  TYPE_SCALE,
} from './tokenDocs';

// Figma "컬러 · 타이포 레퍼런스 v2"(node 110:96)를 코드 토큰으로 다시 그린 문서 페이지.

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-button text-ink">{title}</h2>
      {description && <p className="text-caption text-ink-mute">{description}</p>}
      {children}
    </section>
  );
}

function TypeScale() {
  return (
    <Section title="Type Scale">
      <ul>
        {TYPE_SCALE.map((token) => (
          <li key={token.name} className="flex items-center gap-5 border-b border-line py-2.5">
            <span className="flex w-35 shrink-0 flex-col gap-0.5">
              <span className="text-caption font-bold text-ink">{token.name}</span>
              <span className="text-[11px] text-ink-mute">{token.spec}</span>
            </span>
            <span className={`${token.className} text-ink`}>{token.sample}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Primitives() {
  return (
    <Section title="Color Scheme — Primitives">
      {PRIMITIVE_SCALES.map((scale) => (
        <div key={scale.id} className="flex flex-col gap-2">
          <h3 className="text-caption text-ink-sub">{scale.title}</h3>
          <ul className="flex flex-wrap gap-2">
            {scale.steps.map(({ step, hex }) => (
              <li key={step} className="flex w-24 flex-col items-center gap-1">
                <span
                  className="h-12 w-24 rounded-sm border border-line"
                  style={{ background: `var(--color-${scale.id}-${step})` }}
                />
                <span className="text-[11px] font-bold text-ink">{step}</span>
                <span className="text-[10px] text-ink-mute">{hex}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </Section>
  );
}

function Semantic() {
  return (
    <Section
      title="Color Scheme — Semantic"
      description="기준 색(Primary 블루 500 · Secondary 블루 50) + 민트 보조. 클래스는 bg-<이름>, text-<이름>, border-<이름>."
    >
      <ul className="flex flex-wrap gap-2.5">
        {SEMANTIC_COLORS.map((name) => (
          <li
            key={name}
            className="flex items-center gap-2 rounded-sm border border-line py-1.5 pr-2.5 pl-1.5"
          >
            <span
              className="size-7 rounded-xs border border-line"
              style={{ background: `var(--color-${name})` }}
            />
            <span className="text-[12px] font-medium text-ink">{name}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function SpacingAndRadius() {
  return (
    <div className="flex gap-12">
      <Section title="Spacing">
        <ul className="flex flex-col gap-2.5">
          {SPACING.map((token) => (
            <li key={token.name} className="flex items-center gap-2.5">
              <span className={`h-2.5 rounded-[2px] bg-brand ${token.className}`} />
              <span className="text-[12px] text-ink-sub">{`${token.name} · ${token.px}px`}</span>
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Radius">
        <ul className="flex flex-col gap-2.5">
          {RADII.map((token) => (
            <li key={token.name} className="flex items-center gap-2.5">
              <span
                className={`size-9 border-[1.5px] border-brand bg-brand-soft ${token.className}`}
              />
              <span className="text-[12px] text-ink-sub">{`${token.name} · ${token.px}`}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function Shadows() {
  return (
    <Section title="Shadow">
      <ul className="flex gap-6 py-4">
        {SHADOWS.map((token) => (
          <li key={token.name} className="flex flex-col gap-2">
            <span className={`h-[90px] w-[220px] rounded-lg bg-surface ${token.className}`} />
            <span className="text-[12px] text-ink-sub">{`${token.name} · ${token.spec}`}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Sizes() {
  return (
    <Section title="Sizes">
      <ul>
        {SIZES.map((token) => (
          <li key={token.name} className="flex items-center gap-4 border-b border-line py-1.5">
            <span className="w-40 shrink-0 text-caption font-bold text-ink">{token.name}</span>
            <span className="text-[12px] text-ink-mute">{token.description}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Foundations() {
  return (
    <div className="flex max-w-[1200px] flex-col gap-9 rounded-lg border border-line bg-surface p-8">
      <h1 className="text-title text-ink">컬러 · 타이포 레퍼런스 v2</h1>
      <TypeScale />
      <Primitives />
      <Semantic />
      <SpacingAndRadius />
      <Shadows />
      <Sizes />
    </div>
  );
}

const meta = {
  title: 'Foundations/Tokens',
  component: Foundations,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Foundations>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Reference: Story = {};

export const Typography: Story = { render: () => <TypeScale /> };

export const Colors: Story = {
  render: () => (
    <div className="flex flex-col gap-9">
      <Primitives />
      <Semantic />
    </div>
  ),
};
