<script setup lang="ts">
    import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

    import SwitchToggle from '@/components/SwitchToggle.vue';

    import { useElevationProfileStore } from './store';

    const store = useElevationProfileStore();
    const chartContainer = ref<HTMLCanvasElement | null>(null);
    let chartInstance: unknown = null;

    const hasProfileData = computed(() => store.profileData.length > 0);
    const maxElevation = computed(() => {
        if (store.profileData.length === 0) return 0;
        return Math.max(...store.profileData.map(p => p.elevation));
    });
    const minElevation = computed(() => {
        if (store.profileData.length === 0) return 0;
        return Math.min(...store.profileData.map(p => p.elevation));
    });
    const totalDistance = computed(() => {
        if (store.profileData.length === 0) return 0;
        return store.profileData[store.profileData.length - 1]?.distance ?? 0;
    });

    onMounted(() => {
        // Simple chart rendering using canvas
        updateChart();
    });

    onUnmounted(() => {
        if (chartInstance !== null) {
            chartInstance = null;
        }
    });

    function updateChart(): void {
        if (!chartContainer.value || store.profileData.length === 0) {
            return;
        }

        const canvas = chartContainer.value;
        if (canvas === null) {
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }

        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Set up drawing area
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;

        // Calculate scales
        const maxDist = totalDistance.value;
        const elevRange = maxElevation.value - minElevation.value || 1;
        const elevMin = minElevation.value - elevRange * 0.1; // Add 10% padding
        const elevMax = maxElevation.value + elevRange * 0.1;

        // Draw axes
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Draw labels
        ctx.fillStyle = '#333';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Distance (m)', width / 2, height - 10);
        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Elevation (m)', 0, 0);
        ctx.restore();

        // Draw elevation values on Y axis
        ctx.textAlign = 'right';
        const ySteps = 5;
        for (let i = 0; i <= ySteps; i++) {
            const value = elevMin + ((elevMax - elevMin) * i) / ySteps;
            const y = height - padding - (chartHeight * i) / ySteps;
            ctx.fillText(value.toFixed(1), padding - 10, y + 4);
        }

        // Draw distance values on X axis
        ctx.textAlign = 'center';
        const xSteps = 5;
        for (let i = 0; i <= xSteps; i++) {
            const value = (maxDist * i) / xSteps;
            const x = padding + (chartWidth * i) / xSteps;
            ctx.fillText(value.toFixed(0), x, height - padding + 20);
        }

        // Draw profile line
        if (store.profileData.length > 1) {
            ctx.strokeStyle = '#0066cc';
            ctx.lineWidth = 2;
            ctx.beginPath();

            store.profileData.forEach((point, index) => {
                const x = padding + (chartWidth * point.distance) / maxDist;
                const y =
                    height -
                    padding -
                    (chartHeight * (point.elevation - elevMin)) / (elevMax - elevMin);

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();

            // Fill area under curve
            ctx.fillStyle = 'rgba(0, 102, 204, 0.2)';
            ctx.lineTo(padding + chartWidth, height - padding);
            ctx.lineTo(padding, height - padding);
            ctx.closePath();
            ctx.fill();
        }
    }

    // Watch for profile data changes - use nextTick because the canvas
    // is inside v-if="hasProfileData" and may not be in the DOM yet
    watch(
        () => store.profileData,
        async () => {
            await nextTick();
            updateChart();
        },
        { deep: true },
    );

    function onCancelDrawing(): void {
        window.dispatchEvent(new CustomEvent('elevation-profile-cancel'));
    }

    function onClearPath(): void {
        window.dispatchEvent(new CustomEvent('elevation-profile-clear'));
    }

    function onDrawPath(): void {
        window.dispatchEvent(new CustomEvent('elevation-profile-draw'));
    }
</script>

<template>
    <div class="elevation-profile">
        <div class="input-group mb-3">
            <SwitchToggle
                v-bind:model-value="store.isEnabled"
                v-on:update:model-value="v => store.setEnabled(v)"
                id="elevation-profile-enable"
                title="Enable elevation profile"
            />
            <label for="elevation-profile-enable" class="form-check-label"
                >Enable elevation profile</label
            >
        </div>

        <div v-if="store.isEnabled" class="mb-3">
            <button v-if="!store.isDrawing" class="btn btn-primary btn-sm me-2" @click="onDrawPath">
                Draw Path
            </button>
            <button
                v-if="store.isDrawing"
                class="btn btn-warning btn-sm me-2"
                @click="onCancelDrawing"
            >
                Cancel Drawing
            </button>
            <button
                class="btn btn-secondary btn-sm"
                :disabled="!hasProfileData || store.isDrawing"
                @click="onClearPath"
            >
                Clear
            </button>
        </div>

        <div v-if="store.isDrawing" class="drawing-hint text-muted small mb-3">
            <strong>Left click</strong> to add points. <strong>Double click</strong> or
            <strong>right click</strong> to finish.
        </div>

        <div v-if="hasProfileData" class="profile-stats mb-3">
            <div class="stat-item">
                <strong>Total Distance:</strong> {{ totalDistance.toFixed(2) }} m
            </div>
            <div class="stat-item">
                <strong>Min Elevation:</strong> {{ minElevation.toFixed(2) }} m
            </div>
            <div class="stat-item">
                <strong>Max Elevation:</strong> {{ maxElevation.toFixed(2) }} m
            </div>
            <div class="stat-item">
                <strong>Elevation Range:</strong>
                {{ (maxElevation - minElevation).toFixed(2) }} m
            </div>
        </div>

        <div v-if="hasProfileData" class="chart-container">
            <canvas
                ref="chartContainer"
                width="400"
                height="300"
                style="max-width: 100%; height: auto"
            ></canvas>
        </div>

        <div v-else-if="store.isEnabled && !store.isDrawing" class="text-muted text-center py-4">
            Click "Draw Path" to draw a path on the map and see its elevation profile.
        </div>
    </div>
</template>
<style scoped>
    .elevation-profile {
        padding: 1rem;
    }

    .profile-stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
        font-size: 0.9rem;
    }

    .stat-item {
        padding: 0.25rem;
    }

    .chart-container {
        margin-top: 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 0.5rem;
        background: white;
    }

    .chart-container canvas {
        display: block;
        width: 100%;
        height: auto;
    }
</style>
