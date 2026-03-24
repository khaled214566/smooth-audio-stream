/// <reference types="vite/client" />

declare module "jsmediatags" {
  const jsmediatags: {
    read: (
      data: Blob | File | ArrayBuffer | string,
      callbacks: { onSuccess: (tag: { tags: Record<string, unknown> }) => void; onError: (error: unknown) => void }
    ) => void;
  };
  export default jsmediatags;
}
