import type { PieroContext } from '@/context';
import type { Module } from '@/module';

import ElevationProfile from './elevationProfileAnalysis/ElevationProfile.vue';
import ElevationProfileManager from './elevationProfileAnalysis/ElevationProfileManager';

/**
 * An analysis module that displays an elevation profile along a drawn path.
 */
export default class ElevationProfileAnalysis implements Module {
    public readonly id = 'builtin-elevation-profile-analysis';
    public readonly name = 'Elevation Profile';

    private _manager: ElevationProfileManager | null = null;
    public dispose(): void {
        window.removeEventListener('elevation-profile-draw', this._drawHandler);
        window.removeEventListener('elevation-profile-clear', this._clearHandler);

        if (this._manager) {
            this._manager.dispose();
            this._manager = null;
        }
    }

    public initialize(context: PieroContext): void {
        context.analysis.registerTool({
            component: ElevationProfile,
            icon: 'bi-graph-up-arrow',
            name: 'Elevation Profile',
        });

        // Initialize manager when the view is ready
        context.events.addEventListener('ready', () => {
            const instance = context.view.getInstance();
            const camera = context.view.getCameraController();

            this._manager = new ElevationProfileManager(context, instance, camera);

            // Listen for draw/clear events from the Vue component
            window.addEventListener('elevation-profile-draw', this._drawHandler);
            window.addEventListener('elevation-profile-clear', this._clearHandler);
        });
    }

    private readonly _clearHandler = (): void => {
        this._manager?.clearPath();
    };
    private readonly _drawHandler = (): void => {
        console.info('[ElevationProfile] draw event received, manager:', this._manager != null);
        void this._manager?.drawPath();
    };
}
