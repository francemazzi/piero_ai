import type { ElevationLayerDatasetConfig } from '@/types/configuration/datasets/layer';
import type { GeoTIFFSourceConfig } from '@/types/configuration/sources/geotiff';

import { getConfig } from '@/config-loader';
import { getPublicFolderUrl } from '@/utils/Configuration';

import type { LoadDatasetFromFile } from './loader';

/**
 * Loads a COG (Cloud Optimized GeoTIFF) file as an elevation layer dataset.
 *
 * Note: For local File objects, we create an object URL. However, GeoTIFF files
 * must be true COG (Cloud Optimized GeoTIFF) format to work properly.
 * Regular GeoTIFF files may cause "Invalid byte order value" errors.
 */
export const load: LoadDatasetFromFile<ElevationLayerDatasetConfig> = context => {
    const config = getConfig();
    const defaultCrs = config.default_crs;

    // Try to detect CRS from filename (common patterns)
    // Default to the app's default CRS
    let projection = defaultCrs;

    // Common CRS patterns in filenames
    if (context.filename.includes('3857')) {
        projection = 'EPSG:3857';
    } else if (context.filename.includes('4326')) {
        projection = 'EPSG:4326';
    } else if (context.filename.includes('7791')) {
        projection = 'EPSG:7791';
    }

    // Handle File objects vs URL strings
    let fileUrl: string;
    if (typeof context.file === 'string') {
        // URL string - resolve relative paths
        fileUrl = getPublicFolderUrl(context.file);
    } else {
        // File object - create object URL for local file import
        // Note: GeoTIFFSource requires a valid URL. Object URLs work but the file
        // must be a valid COG (Cloud Optimized GeoTIFF) format.
        // Regular GeoTIFF files may not work properly.
        fileUrl = URL.createObjectURL(context.file);
    }

    const source: GeoTIFFSourceConfig = {
        // @ts-expect-error - projection is deprecated but still required for now
        projection,
        type: 'cog',
        url: fileUrl,
    };

    return {
        name: context.filename,
        source,
        type: 'elevationLayer',
        visible: true,
    } satisfies ElevationLayerDatasetConfig;
};
