import type Instance from '@giro3d/giro3d/core/Instance';
import type PickResult from '@giro3d/giro3d/core/picking/PickResult';
import type Giro3DMap from '@giro3d/giro3d/entities/Map';
import type Shape from '@giro3d/giro3d/entities/Shape';
import type { CreationOptions } from '@giro3d/giro3d/interactions/DrawTool';
import type { Vector2 } from 'three';

import Coordinates from '@giro3d/giro3d/core/geographic/Coordinates';
import { isMap } from '@giro3d/giro3d/entities/Map';
import { isShapePickResult } from '@giro3d/giro3d/entities/Shape';
import DrawTool, { conditions } from '@giro3d/giro3d/interactions/DrawTool';

import type { PieroContext } from '@/context';
import type CameraController from '@/services/CameraController';

import { DEFAULT_SHAPE_COLOR } from '@/constants';

import { type ElevationPoint, useElevationProfileStore } from './store';

export default class ElevationProfileManager {
    private readonly _camera: CameraController;
    private _currentPath: Shape | null = null;
    private _drawAbortController: AbortController | null = null;
    private readonly _drawTool: DrawTool;
    private readonly _instance: Instance;
    private readonly _store = useElevationProfileStore();

    public constructor(
        private readonly context: PieroContext,
        instance: Instance,
        camera: CameraController,
    ) {
        this._instance = instance;
        this._camera = camera;
        this._drawTool = new DrawTool({ instance });

        // Disable camera while drawing
        this._drawTool.addEventListener('start-drag', () => {
            camera.enabled = false;
        });
        this._drawTool.addEventListener('end-drag', () => {
            camera.enabled = true;
        });

        this._store.setInstance(instance);
        this._store.setCursorManager(context.view.getSceneCursorManager());
    }

    public cancelDrawing(): void {
        if (this._drawAbortController) {
            this._drawAbortController.abort();
            this._drawAbortController = null;
        }
    }

    public clearPath(): void {
        if (this._currentPath) {
            this._instance.remove(this._currentPath);
            this._currentPath = null;
        }
        this._store.clearProfile();
    }

    public dispose(): void {
        this.cancelDrawing();
        if (this._currentPath) {
            this._instance.remove(this._currentPath);
            this._currentPath = null;
        }
        this._drawTool.dispose();
    }

    public async drawPath(): Promise<void> {
        if (this._store.isDrawing) {
            return;
        }

        this._store.setIsDrawing(true);

        // Remove previous path if exists
        if (this._currentPath) {
            this._instance.remove(this._currentPath);
            this._currentPath = null;
        }

        this._drawAbortController = new AbortController();

        const options: CreationOptions = {
            color: DEFAULT_SHAPE_COLOR,
            endCondition: (e: MouseEvent) => conditions.rightClick(e) || conditions.doubleClick(e),
            pick: this.pick.bind(this),
            showLine: true,
            showSegmentLabels: true,
            showVertexLabels: false,
            showVertices: true,
            signal: this._drawAbortController.signal,
        };

        try {
            const shape = await this._drawTool.createLineString(options);

            if (shape == null) {
                return;
            }

            // The DrawTool already adds the shape to the instance internally,
            // so we only need to keep a reference and compute the profile.
            this._currentPath = shape;
            this.computeProfile(this._currentPath);
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.error('[ElevationProfile] Error drawing path:', error);
            }
        } finally {
            this._drawAbortController = null;
            this._store.setIsDrawing(false);
        }
    }

    private computeProfile(shape: Shape): void {
        const instance = this._instance;
        const map = instance.getEntities(o => isMap(o)).at(0) as Giro3DMap | undefined;

        if (map === undefined) {
            console.warn('[ElevationProfile] No map found for elevation profile');
            return;
        }

        const points = shape.points;
        if (points.length < 2) {
            return;
        }

        const crs = instance.referenceCrs;
        const profilePoints: ElevationPoint[] = [];
        let totalDistance = 0;

        // Get elevation for each point
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const coord = new Coordinates(crs, point.x, point.y, point.z);

            // Get elevation from map
            const elevationResult = map
                .getElevation({ coordinates: coord })
                .samples.sort((a, b) => a.resolution - b.resolution)
                .at(0);

            const elevation = elevationResult?.elevation ?? point.z;

            // Calculate distance from start
            if (i > 0) {
                const prevPoint = points[i - 1];
                const segmentDistance = point.distanceTo(prevPoint);
                totalDistance += segmentDistance;
            }

            profilePoints.push({
                coordinates: [point.x, point.y],
                distance: totalDistance,
                elevation,
            });
        }

        this._store.setProfileData(profilePoints);
    }

    private pick(event: MouseEvent | Vector2): PickResult[] {
        const results = this._instance.pickObjectsAt(event, {
            sortByDistance: true,
        });

        // Filter out shape pick results to avoid picking on the shape
        // being drawn or other shapes (annotations, measures, etc.)
        return results.filter(res => !isShapePickResult(res));
    }
}
