/**
 * Type declarations for Vite's special import syntax
 * This allows TypeScript to recognize imports like `import x from './file.json?raw'`
 */
declare module '*.json?raw' {
    const content: string;
    export default content;
}
