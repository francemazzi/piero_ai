import type Instance from '@giro3d/giro3d/core/Instance';
import type PickResult from '@giro3d/giro3d/core/picking/PickResult';
import type Giro3DMap from '@giro3d/giro3d/entities/Map';
import type Shape from '@giro3d/giro3d/entities/Shape';
import type { CreationOptions } from '@giro3d/giro3d/interactions/DrawTool';
import type { Vector2 } from 'three';

import Coordinates from '@giro3d/giro3d/core/geographic/Coordinates';
import { isMap } from '@giro3d/giro3d/entities/Map';
import { isShapePickResult } from '@giro3d/giro3d/entities/Shape';
import DrawTool from '@giro3d/giro3d/interactions/DrawTool';

import type { PieroContext } from '@/context';
import type CameraController from '@/services/CameraController';

import { DEFAULT_SHAPE_COLOR } from '@/constants';

import { type ElevationPoint, useElevationProfileStore } from './store';

export default class ElevationProfileManager {
    private readonly _camera: CameraController;
    private _currentPath: Shape | null = null;
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

    public clearPath(): void {
        if (this._currentPath) {
            this._instance.remove(this._currentPath);
            this._currentPath = null;
        }
        this._store.clearProfile();
    }

    public dispose(): void {
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

        const options: CreationOptions = {
            color: DEFAULT_SHAPE_COLOR,
            pick: this.pick.bind(this),
            showLine: true,
            showSegmentLabels: false,
            showVertexLabels: false,
            showVertices: true,
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
            console.error('Error drawing path:', error);
        } finally {
            this._store.setIsDrawing(false);
        }
    }

    private computeProfile(shape: Shape): void {
        const instance = this._instance;
        const map = instance.getEntities(o => isMap(o)).at(0) as Giro3DMap | undefined;

        if (map === undefined) {
            console.warn('No map found for elevation profile');
            return;
        }

        const points = shape.points;
        if (points.length < 2) {
            return;
        }

        const profilePoints: ElevationPoint[] = [];
        let totalDistance = 0;

        // Get elevation for each point
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const coord = Coordinates.fromVector3(point, instance.referenceCrs);

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

        // If we have many points, we might want to sample them for better performance
        // For now, we use all points
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
