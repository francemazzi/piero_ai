import { EventDispatcher } from 'three';
import { Box3, Vector3 } from 'three';
import { describe, expect, it, vi } from 'vitest';

import type { PieroContext } from '@/context';
import type { PieroEvents } from '@/events';

// Use Vite raw import so the fixture is bundled in tests (works in jsdom too).
// This also guarantees we are using the real dataset folder content.
// Type declaration is in vite-raw.d.ts
import layerJsonRaw from '../../../../../public/datasets/enrico_gabrielli/3dtiles/layer.json?raw';
import AutoConfiguration from '../AutoConfiguration';

function buildBboxFromLayerJsonBounds(bounds4326: [number, number, number, number]): Box3 {
    const [west, south, east, north] = bounds4326;
    const minX = lonToWebMercatorX(west);
    const maxX = lonToWebMercatorX(east);
    const minY = latToWebMercatorY(south);
    const maxY = latToWebMercatorY(north);

    // Keep Z flat; AutoConfiguration expands it anyway.
    return new Box3(new Vector3(minX, minY, 0), new Vector3(maxX, maxY, 0));
}

function latToWebMercatorY(lat: number): number {
    const rad = (lat * Math.PI) / 180;
    return 6378137 * Math.log(Math.tan(Math.PI / 4 + rad / 2));
}

function lonToWebMercatorX(lon: number): number {
    return (lon * 20037508.34) / 180;
}

describe('AutoConfiguration', () => {
    it('fits camera after datasets are ready (using enrico_gabrielli dataset bounds)', async () => {
        vi.useFakeTimers();
        const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1_000_000);

        // Read dataset bounds from the public folder fixture.
        const layerJson = JSON.parse(layerJsonRaw) as {
            bounds: [number, number, number, number];
        };

        const rawBox = buildBboxFromLayerJsonBounds(layerJson.bounds);

        const lookTopDownAt = vi.fn().mockResolvedValue(undefined);
        const context: PieroContext = {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            analysis: {} as any,
            baseURL: new URL('http://localhost/'),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            bookmarks: {} as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            configuration: {} as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            datasets: {} as any,
            events: new EventDispatcher<PieroEvents>(),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            notifications: {} as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            search: {} as any,
            view: {
                getBoundingBox: () => rawBox,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                getCameraController: () => ({ lookTopDownAt }) as any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                getInstance: () => ({}) as any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                getSceneCursorManager: () => ({}) as any,
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            widgets: {} as any,
        };

        const module = new AutoConfiguration();
        module.initialize(context);

        // Simulate app ready event (typical first fit).
        context.events.dispatchEvent({ type: 'ready' });

        // Debounced by 250ms.
        await vi.advanceTimersByTimeAsync(300);

        expect(lookTopDownAt).toHaveBeenCalledTimes(1);

        const [argBox, enableTransition] = lookTopDownAt.mock.calls[0];
        expect(enableTransition).toBe(false);
        expect(argBox).toBeInstanceOf(Box3);

        const expanded = argBox as Box3;
        // Expanded box should be larger than raw bounds.
        expect(expanded.min.x).toBeLessThan(rawBox.min.x);
        expect(expanded.min.y).toBeLessThan(rawBox.min.y);
        expect(expanded.max.x).toBeGreaterThan(rawBox.max.x);
        expect(expanded.max.y).toBeGreaterThan(rawBox.max.y);

        nowSpy.mockRestore();
        vi.useRealTimers();
    });

    it('throttles consecutive fits (burst of dataset events)', async () => {
        vi.useFakeTimers();

        const rawBox = new Box3(new Vector3(0, 0, 0), new Vector3(100, 100, 0));
        const lookTopDownAt = vi.fn().mockResolvedValue(undefined);

        const nowSpy = vi.spyOn(Date, 'now');
        nowSpy.mockReturnValue(1_000_000);

        const context: PieroContext = {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            analysis: {} as any,
            baseURL: new URL('http://localhost/'),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            bookmarks: {} as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            configuration: {} as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            datasets: {} as any,
            events: new EventDispatcher<PieroEvents>(),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            notifications: {} as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            search: {} as any,
            view: {
                getBoundingBox: () => rawBox,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                getCameraController: () => ({ lookTopDownAt }) as any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                getInstance: () => ({}) as any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                getSceneCursorManager: () => ({}) as any,
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            widgets: {} as any,
        };

        const module = new AutoConfiguration();
        module.initialize(context);

        // Burst of events
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        context.events.dispatchEvent({ type: 'dataset-added', value: {} as any });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        context.events.dispatchEvent({ type: 'dataset-added', value: {} as any });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        context.events.dispatchEvent({ type: 'dataset-visibility-changed', value: {} as any });

        // Debounce window.
        await vi.advanceTimersByTimeAsync(300);
        expect(lookTopDownAt).toHaveBeenCalledTimes(1);

        // Another burst within throttling window (minInterval 500ms)
        nowSpy.mockReturnValue(1_000_200);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        context.events.dispatchEvent({ type: 'dataset-added', value: {} as any });
        await vi.advanceTimersByTimeAsync(300);
        expect(lookTopDownAt).toHaveBeenCalledTimes(1);

        // After throttling window, should fit again
        nowSpy.mockReturnValue(1_000_800);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        context.events.dispatchEvent({ type: 'dataset-added', value: {} as any });
        await vi.advanceTimersByTimeAsync(300);
        expect(lookTopDownAt).toHaveBeenCalledTimes(2);

        nowSpy.mockRestore();
        vi.useRealTimers();
    });
});
