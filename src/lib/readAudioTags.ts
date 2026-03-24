import jsmediatags from "jsmediatags";

export type TrackMediaTags = {
  title?: string;
  artist?: string;
  album?: string;
  albumArtist?: string;
  year?: string;
  track?: string;
  genre?: string;
  comment?: string;
  composer?: string;
  lyrics?: string;
  /** Blob URL for embedded cover — revoke when replacing */
  artworkObjectUrl?: string;
};

function asString(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") {
    const t = v.trim();
    return t.length ? t : undefined;
  }
  if (typeof v === "object" && v !== null && "data" in (v as object)) {
    const d = (v as { data?: unknown }).data;
    if (typeof d === "string") {
      const t = d.trim();
      return t.length ? t : undefined;
    }
  }
  return undefined;
}

function readTagsFromJsMediaTag(tag: { tags: Record<string, unknown> }): TrackMediaTags {
  const t = tag.tags;
  let artworkObjectUrl: string | undefined;
  const rawPic = t.picture as { format?: string; data?: unknown } | undefined;
  if (rawPic?.data && Array.isArray(rawPic.data)) {
    try {
      const mime = rawPic.format?.startsWith("image/") ? rawPic.format : `image/${rawPic.format || "jpeg"}`;
      const blob = new Blob([new Uint8Array(rawPic.data as number[])], { type: mime });
      artworkObjectUrl = URL.createObjectURL(blob);
    } catch {
      /* ignore bad picture */
    }
  }

  return {
    title: asString(t.title),
    artist: asString(t.artist),
    album: asString(t.album),
    albumArtist: asString(t.albumartist ?? t["album artist"]),
    year: asString(t.year ?? t.date),
    track: asString(t.track),
    genre: asString(t.genre),
    comment: asString(t.comment),
    composer: asString(t.composer),
    lyrics: asString(t.lyrics),
    artworkObjectUrl,
  };
}

export function readAudioTags(audioUrl: string): Promise<TrackMediaTags> {
  return new Promise((resolve, reject) => {
    const abs = audioUrl.startsWith("http") ? audioUrl : new URL(audioUrl, window.location.origin).href;
    fetch(abs)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.blob();
      })
      .then((blob) => {
        jsmediatags.read(blob, {
          onSuccess: (tag) => resolve(readTagsFromJsMediaTag(tag as { tags: Record<string, unknown> })),
          onError: (e) => reject(e instanceof Error ? e : new Error(String(e))),
        });
      })
      .catch(reject);
  });
}
