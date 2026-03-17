import type { ClassifiedPage, SelectedPages, PageType } from "./types";

function bestOfType(
  pages: ClassifiedPage[],
  type: PageType
): ClassifiedPage | null {
  const matches = pages.filter((p) => p.pageType === type);
  if (matches.length === 0) return null;
  return matches.reduce((best, p) => (p.score > best.score ? p : best));
}

export function selectRepresentativePages(
  pages: ClassifiedPage[]
): SelectedPages {
  return {
    homepage: bestOfType(pages, "homepage"),
    product: bestOfType(pages, "product"),
    collection: bestOfType(pages, "collection"),
    info: bestOfType(pages, "info"),
  };
}
