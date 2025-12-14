import { type Box3, Vector3 } from 'three';

import type { PieroContext } from '@/context';
import type { Module } from '@/module';

/**
 * Automatically fits the camera on loaded datasets.
 *
 * Why this exists:
 * - Avoid hardcoding dataset extents and camera positions in `config.ts`.
 * - Make the UX "just work" when the user imports datasets at runtime.
 */
export default class AutoConfiguration implements Module {
    public readonly id = 'builtin-auto-configuration';
    public readonly name = 'Auto configuration';

    // Throttling avoids spamming camera moves when multiple datasets/layers load in bursts.
    private _lastFitAtMs = 0;
    private readonly _minIntervalMs = 500;
    private _scheduled = false;

    public initialize(context: PieroContext): void {
        const schedule = (): void => this.scheduleFit(context);

        context.events.addEventListener('ready', schedule);
        context.events.addEventListener('dataset-added', schedule);
        context.events.addEventListener('dataset-removed', schedule);
        context.events.addEventListener('dataset-visibility-changed', schedule);
    }

    private expandBox(box: Box3): Box3 {
        const expanded = box.clone();
        const size = new Vector3();
        expanded.getSize(size);

        const marginXY = Math.max(size.x, size.y) * 0.15;
        // Keep Z margin small; we mostly care about XY framing.
        const marginZ = Math.max(size.z * 0.05, 1);

        expanded.expandByVector(new Vector3(marginXY, marginXY, marginZ));
        return expanded;
    }

    private fitCameraToScene(context: PieroContext): void {
        const now = Date.now();
        if (now - this._lastFitAtMs < this._minIntervalMs) {
            return;
        }

        const bbox = context.view.getBoundingBox();
        if (bbox.isEmpty()) {
            return;
        }

        const expanded = this.expandBox(bbox);
        const camera = context.view.getCameraController();

        // No transition: keeps imports snappy and deterministic.
        void camera.lookTopDownAt(expanded, false);

        this._lastFitAtMs = now;
    }

    private scheduleFit(context: PieroContext): void {
        if (this._scheduled) {
            return;
        }
        this._scheduled = true;

        // Let the current dataset/layer finish loading and attach to the instance.
        window.setTimeout(() => {
            this._scheduled = false;
            this.fitCameraToScene(context);
        }, 250);
    }
}
