// Pure YouTube helpers (no server-only imports) so both server and client can use them.

/** Extract the 11-char video id from any common YouTube URL, or null. */
export function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

/** Thumbnail URL for a video id (no API needed). */
export function youtubeThumb(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
