<div align="center">
  <a href="https://piero.giro3d.org">
    <img src="https://piero.giro3d.org/piero_logo.svg" height="120" alt="Piero">
  </a>
</div>

<div align="center">
  A versatile web application to visualize 3D geospatial data in the browser.
</div>

<br>

<div align="center">
  <a href="https://gitlab.com/giro3d/piero/badges/main/pipeline.svg"><img src="https://gitlab.com/giro3d/piero/badges/main/pipeline.svg" alt="Pipeline status"></a>
  <a href="https://matrix.to/#/#giro3d:matrix.org"><img src="https://img.shields.io/matrix/giro3d:matrix.org" alt="Matrix chat"></a>
</div>

![Piero application](graphics/screenshots/piero-app.webp)

[TOC]

---

## Bring Your Own Data

Piero is powered by **[Giro3D](https://giro3d.org/)** and supports a variety of heterogeneous data sources, either 2D and 3D. The application comes with some sample data, you can add your own data via drag and drop from your computer to visualize it.

### Loading Your Datasets

Piero supports multiple ways to load your datasets:

#### 1. Import from URL

You can import datasets directly from URLs (local or remote):

- **Relative URL** (from `public/` folder): Use paths like `datasets/your-folder/your-file.geojson`
    - Example: `datasets/tuo-dataset/tuo-file.geojson`
- **Absolute URL**: Use full URLs like `http://localhost:8080/datasets/tuo-dataset/tuo-file.geojson` or any remote URL

To import:

1. Open the **Datasets** panel (left sidebar)
2. Enter the URL in the "Import URL" field
3. Click **"Import URL"**

#### 2. Import from File

You can drag and drop files from your computer or use the file picker:

1. Open the **Datasets** panel (left sidebar)
2. Click **"Import file"** button
3. Select your file(s) from your computer

### Supported File Formats

Piero supports the following file formats for direct import (via "Import file" or "Import URL"):

#### ✅ Vector Data (2D/2.5D)

- **`.geojson`** or **`.geo.json`** - GeoJSON format (most common)
    - Example: `mydata.geojson`
    - Supports points, lines, polygons with properties
- **`.gpkg`** - GeoPackage format
    - Example: `mydata.gpkg`
- **`.gpx`** - GPS Exchange Format
    - Example: `track.gpx`
- **`.kml`** - Keyhole Markup Language
    - Example: `places.kml`

#### ✅ Raster/Elevation Data

- **`.tif`** or **`.tiff`** - GeoTIFF / Cloud Optimized GeoTIFF (COG)
    - Example: `dtm_lidar.tif`
    - Automatically imported as elevation layer
    - CRS detected from filename (e.g., `*_3857_*.tif` → EPSG:3857)
    - ⚠️ **Important**: Files must be in **COG (Cloud Optimized GeoTIFF)** format. Regular GeoTIFF files may cause errors. Use tools like `rio cogeo` to convert GeoTIFF to COG format.

#### ✅ Point Clouds (3D)

- **`.las`** - LAS point cloud format
    - Example: `lidar_data.las`
- **`.laz`** - Compressed LAS format
    - Example: `lidar_data.laz`

#### ✅ Tabular Data (with coordinates)

- **`.csv`** - Comma-separated values
    - Example: `points.csv` (must have X/Y/Z or lat/lon columns)
- **`.tsv`** - Tab-separated values
- **`.dsv`** - Delimiter-separated values

#### 📝 Note on Other Formats

Some formats are supported but require configuration in `config.ts` rather than direct import:

- **3D Tiles** - Requires tileset configuration
- **CityJSON, IFC, PLY** - Supported via modules (see full list below)

#### 3. Auto-Configuration Feature ✨

**New in this version**: When you import a dataset, Piero automatically:

- Calculates the bounding box of your data
- Adjusts the camera view to fit your dataset
- Centers the view on your data

No manual configuration needed! Just import your data and the view will adapt automatically.

> [!tip]
> If you have datasets in the `public/datasets/` folder, you can reference them using relative URLs like `datasets/your-folder/file.geojson`. This works both in development (`npm run start`) and in production builds.

**Example**: If you have files in `public/datasets/tuo-dataset/`:

- GeoJSON file: Use `datasets/tuo-dataset/tuo-file.geojson`
- COG GeoTIFF: Use `datasets/tuo-dataset/tuo-elevation.tif`
- 3D Tiles: Use `datasets/tuo-dataset/3dtiles/` (if configured as a tileset)

The application will automatically resolve these relative paths based on your `PIERO_BASE_URL` configuration.

![Display heterogeneous data](graphics/screenshots/3dview.png)

### Imagery

- GeoTIFF and [Cloud Optimized GeoTIFF (COG)](https://www.cogeo.org/)
- [MVT](https://docs.mapbox.com/data/tilesets/guides/vector-tiles-standards/)
- [WMS](https://www.ogc.org/standard/wms/)
- [WMTS](https://www.ogc.org/standard/wmts/)
- ... or any source supported by OpenLayers: BingMaps, OpenStreetMap, StadiaMaps, etc.

### 2D and 2.5D assets

- [GeoJSON](https://geojson.org/)
- [GeoPackage](https://www.geopackage.org/)
- [GPX](https://www.topografix.com/gpx.asp)
- [KML](https://www.ogc.org/standard/kml/)
- [Shapefile](https://doc.arcgis.com/en/arcgis-online/reference/shapefiles.htm) - not yet supported via drag and drop
- [WFS](https://www.ogc.org/standard/wfs/)

### 3D assets

- [3D Tiles](https://www.ogc.org/standard/3DTiles/) - ⚠️ Requires configuration in `config.ts`
- [CityJSON](https://www.cityjson.org/) - ⚠️ Requires CityJSON module
- [CSV pointcloud](https://github.com/ASPRSorg/LAS) - ✅ **Direct import supported** (`.csv` with X/Y/Z columns)
- [IFC](https://www.buildingsmart.org/standards/bsi-standards/industry-foundation-classes/) - ⚠️ Requires IFC module
- [LAS/LAZ pointcloud](https://github.com/ASPRSorg/LAS) - ✅ **Direct import supported** (`.las`, `.laz`)
- [PLY](https://paulbourke.net/dataformats/ply/) - ⚠️ Not supported via drag and drop
- [Potree pointcloud](https://github.com/potree/potree/) - ⚠️ Requires configuration in `config.ts`

### Extend

Piero can easily be extended to include any format supported by [Giro3D](https://giro3d.org) or [Three.js](https://threejs.org/). See [Run your own Piero](#run-your-own-piero).

## Features

Besides displaying 2D and 3D data, Piero adds some more advanced tools to navigate and analyze your data.

### Identification & Attribute table

By clicking on your data, you can easily get all the metadata from your objects. Supports a wide variety of metadata, among IFC properties, GeoJSON properties, WFS fields, CityJSON attributes, etc.

![Attribute table](graphics/screenshots/attributes.png)

### Geocoding

Piero includes a geocoding widget from [the French BAN database](https://adresse.data.gouv.fr/) to easily set the view on an addresse or point of interest.

### Bookmarks

**Bookmarks** let you save and share the current 3D view so that you can easily get back to a point of interest.

### 3D annotations

**3D annotations** let you place points, and draw lines and polygons on the map or on any 3D data. You can also import your own 3D GeoJSON files.

![Annotation](graphics/screenshots/annotation.png)

### Measurements

When dealing with buildings, it can be very useful to automagically determine the length between two objects. **Measurements** let you easily measure distances between walls and store the results.

![Measurements](graphics/screenshots/measurements.png)

### Cross section

The **cross section** tool let you define a cross-section plane to see through 3D objects.

![Cross section](graphics/screenshots/crosssection.png)

### Clipping box

The **clipping box** tool let you partially hide objects, so you can see through them. This can be useful to see inside a building, for instance displaying a single floor.

![Clipping box](graphics/screenshots/clippingbox.png)

## Run your own Piero

### Using Docker 🐋

Piero can be ran as a Docker container with minimal configuration. In the root directory of Piero, run the following commands:

```shell
docker build -t piero:latest .
docker run -e PIERO_BASE_URL=http://localhost:8080 -e PIERO_APP_TITLE="Hello from Piero!" -p 8080:80 piero:latest
```

Then open your browser at <http://localhost:8080>.

> [!note]
> To deploy Piero on a production server, you must set the value of `PIERO_BASE_URL` to the URL of your server. For example, if you are deploying Piero at <https://example.com/piero>, use `-e PIERO_BASE_URL=https://example.com/piero`. Otherwise, the default value of <http://example.com> will be used.

> [!note]
> The `PIERO_APP_TITLE` variable is not mandatory, but is useful to change the title of the webpage.

### Building from source

You'll simply need to checkout this application and edit the configuration.

```bash
# Clone the app
git clone https://gitlab.com/giro3d/piero.git
cd piero
```

On compatible platforms, you can use the `init.sh` script to initialize the configuration; otherwise initialize it manually:

1. Install npm dependencies

    ```sh
     npm install --force
    ```

    `--force` is required until issue #87 gets resolved.

2. Copy the default app configuration

    ```sh
     cp config.ts.sample config.ts
     cp styles.ts.sample styles.ts
    ```

3. Create the `.env.local` file to provide environment variables, and set the appropriate values for your app.

    | variable          | Description                                                                                | Default value           |
    | ----------------- | ------------------------------------------------------------------------------------------ | ----------------------- |
    | `PIERO_BASE_URL`  | The URL of your server where the app is deployed, for example: <https://example.com/piero> | `http://localhost:8080` |
    | `PIERO_APP_TITLE` | The title of your app                                                                      | `"Piero"`               |

    > [!tip]
    > Use the `.env` file as a template for `.env.local`.

If you want to learn more about the configuration, head up to [its documentation](./CONFIGURATION.md).

#### Organizing Your Datasets

You can organize your datasets in the `public/datasets/` folder. For example:

```text
public/
  datasets/
    your-project/
      your-data.geojson
      your-elevation.tif
      3dtiles/
        layer.json
        ...
```

Then reference them using relative URLs:

- `datasets/your-project/your-data.geojson`
- `datasets/your-project/your-elevation.tif`
- `datasets/your-project/3dtiles/` (for 3D Tiles)

> [!note]
> The `public/` folder is served as the root of your web application. Files in `public/datasets/` are accessible via relative URLs starting with `datasets/`.

#### Run

Run the app with `npm run start`: it should be available at <http://localhost:8080/>.

To deploy the app, simply build it; the static web application will be available in the `dist` folder - it can then be copied to your server:

```bash
npm run build
```

#### Tagged version vs. main

The `main` branch of Piero features the latest version of the application, while tagged versions are published [every quarter or so](https://gitlab.com/giro3d/piero/-/milestones). The [changelog](./CHANGELOG.md) of tagged versions is available once versions are published. For upcoming releases, head up to the corresponding [GitLab milestone](https://gitlab.com/giro3d/piero/-/milestones).

Breaking changes may be introduced between versions, as well as changes in the user experience. If such updates are unwanted on your side, you should use tagged versions.

Some breaking changes consist in changes in the [configuration file](./CONFIGURATION.md); such changes will generate deprecating warnings at runtime for at least 1 release and might be removed in the next release. For instance, the `camera` configuration was changed in release `v24.4`; using the old configuration generates a warning when using `v24.4` and might not work anymore with `v24.7`.

## Contributors and sponsors

Piero has received contributions and sponsoring from people and organizations listed in [CONTRIBUTORS.md](CONTRIBUTORS.md).
If you are interested in contributing to Piero, please read [CONTRIBUTING.md](CONTRIBUTING.md). Please also read our [Code of Conduct](https://gitlab.com/giro3d/giro3d/-/blob/main/CODE_OF_CONDUCT.md).

## Governance

The Piero project is part of [Giro3D](https://giro3d.org), and follows the same governance as [Giro3D](https://giro3d.org/governance.html).

## FAQ

### Where does the name Piero come from ?

The name is a reference to the italian artist and mathematician [Piero della Francesca](https://en.wikipedia.org/wiki/Piero_della_Francesca). It was suggested by Loïc Bartoletti and won the community poll for the name of the application.
