// Pure helper (safe on client + server): insert on-the-fly transformations into a
// Cloudinary delivery URL so we serve small, optimized images instead of originals.
// e.g. cld(url, "w_600,h_600,c_fill,q_auto,f_auto") for a square thumbnail.
export function cld(url: string, transform: string): string {
  if (!url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/${transform}/`);
}

export const THUMB = "w_600,h_600,c_fill,q_auto,f_auto";
export const SLIDE = "w_1400,h_800,c_fill,q_auto,f_auto";
export const FULL = "w_1600,q_auto,f_auto";
// Width-constrained but NOT cropped — keeps each photo's real aspect ratio for the
// home-page masonry collage (no c_fill, so nothing gets chopped).
export const COLLAGE = "w_700,q_auto,f_auto";
