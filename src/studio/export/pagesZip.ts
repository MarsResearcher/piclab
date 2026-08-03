import JSZip from 'jszip';
import { imageDataToPngBlob, safeFilePart } from './imageEncode';

export type ZipPage = {
  name: string;
  image: ImageData;
};

/** Build a ZIP of PNG pages (all artboards / practice booklet). */
export async function buildPagesZip(
  pages: ZipPage[],
  opts?: { folderName?: string },
): Promise<Blob> {
  const zip = new JSZip();
  const folder = opts?.folderName
    ? zip.folder(safeFilePart(opts.folderName))
    : zip;
  if (!folder) throw new Error('zip folder failed');

  let i = 0;
  for (const page of pages) {
    i += 1;
    const blob = await imageDataToPngBlob(page.image);
    const name = `${String(i).padStart(2, '0')}-${safeFilePart(page.name)}.png`;
    folder.file(name, blob);
  }
  return zip.generateAsync({ type: 'blob' });
}
