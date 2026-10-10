declare const process: { env: { API_URL?: string } }

// Documentación markdown importada como texto (webpack: asset/source, vite: ?raw).
declare module '*.md?raw' {
  const content: string
  export default content
}
