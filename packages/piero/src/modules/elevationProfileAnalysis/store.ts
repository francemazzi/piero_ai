import type Instance from '@giro3d/giro3d/core/Instance';

import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';

import type SceneCursorManager from '@/services/SceneCursorManager';

export interface ElevationPoint {
    coordinates: [number, number]; // [x, y] coordinates
    distance: number; // Distance along the path in meters
    elevation: number; // Elevation in meters
}

export const useElevationProfileStore = defineStore('elevationProfile', () => {
    const instance = shallowRef<Instance>();
    const cursorManager = shallowRef<SceneCursorManager>();
    const isDrawing = ref(false);
    const profileData = ref<ElevationPoint[]>([]);
    const isEnabled = ref(false);

    function setInstance(v: Instance): void {
        instance.value = v;
    }

    function setCursorManager(v: SceneCursorManager): void {
        cursorManager.value = v;
    }

    function setIsDrawing(v: boolean): void {
        isDrawing.value = v;
    }

    function setProfileData(data: ElevationPoint[]): void {
        profileData.value = data;
    }

    function clearProfile(): void {
        profileData.value = [];
    }

    function setEnabled(v: boolean): void {
        isEnabled.value = v;
    }

    return {
        clearProfile,
        cursorManager,
        instance,
        isDrawing,
        isEnabled,
        profileData,
        setCursorManager,
        setEnabled,
        setInstance,
        setIsDrawing,
        setProfileData,
    };
});

export type ElevationProfileStore = ReturnType<typeof useElevationProfileStore>;
