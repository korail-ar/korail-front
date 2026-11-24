'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

import { DEFAULT_START, findPlace, findPlatform, findStartPoint } from './data';
import { findRoute } from './route';
import { buildSteps } from './steps';
import type { GuideStep, Route, StartPoint, StationPlace } from './types';

export type JourneyParam = 'start' | 'to' | 'platform' | 'step' | 'q' | 'category' | 'next';

/**
 * 화면 사이를 이동할 때 출발 위치(start)·목적지(to)·타는 곳(platform)을 주소에 담아 넘긴다.
 * QR 코드는 `/?start=<id>` 주소를 담으므로, 새로 고침하거나 공유해도 같은 안내가 열린다.
 */
export function buildHref(
  path: string,
  current: URLSearchParams,
  overrides: Partial<Record<JourneyParam, string | number | null>> = {},
  keep: readonly JourneyParam[] = ['start'],
): string {
  const params = new URLSearchParams();
  keep.forEach((key) => {
    const value = current.get(key);
    if (value !== null) {
      params.set(key, value);
    }
  });
  Object.entries(overrides).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  });
  if (params.get('start') === DEFAULT_START.id) {
    params.delete('start');
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export type JourneyStatus = 'ok' | 'no-destination' | 'no-route';

export interface Journey {
  params: URLSearchParams;
  start: StartPoint;
  destination: StationPlace | undefined;
  platformNumber: number | undefined;
  route: Route | null;
  steps: GuideStep[];
  stepIndex: number;
  status: JourneyStatus;
  href: (
    path: string,
    overrides?: Partial<Record<JourneyParam, string | number | null>>,
    keep?: readonly JourneyParam[],
  ) => string;
}

export function getStepIndex(value: string | null, stepCount: number): number {
  const index = Number(value ?? 0);
  if (!Number.isInteger(index) || index < 0) {
    return 0;
  }
  return Math.min(index, Math.max(stepCount - 1, 0));
}

/** 주소의 출발 위치·목적지로 경로와 안내 단계를 계산한다. 모든 계산은 기기 안에서 한다. */
export default function useJourney(): Journey {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  return useMemo(() => {
    const params = new URLSearchParams(queryString);
    const start = findStartPoint(params.get('start'));
    const destination = findPlace(params.get('to'));
    const platformNumber = findPlatform(params.get('platform'))?.number;
    const route = destination?.routeNodeId
      ? findRoute(start.nodeId, destination.routeNodeId)
      : null;
    const steps =
      route && destination
        ? buildSteps(route, { startName: start.name, destination, platformNumber })
        : [];

    let status: JourneyStatus = 'ok';
    if (!destination) {
      status = 'no-destination';
    } else if (!route) {
      status = 'no-route';
    }

    return {
      params,
      start,
      destination,
      platformNumber,
      route,
      steps,
      stepIndex: getStepIndex(params.get('step'), steps.length),
      status,
      href: (path, overrides, keep) => buildHref(path, params, overrides, keep),
    };
  }, [queryString]);
}
