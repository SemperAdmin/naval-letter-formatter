const BLOB_URL_CLEANUP_DELAY_MS = 10000;

/**
 * Opens a blob in a new browser tab with a suggested filename for download.
 * Uses an anchor tag with download attribute to preserve the filename.
 *
 * @param blob - The blob to open
 * @param filename - The suggested filename for download
 */
export function openBlobInNewTab(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);

  // Create an anchor element with download attribute to suggest filename
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  // Trigger the download/open
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the blob URL after a delay (give time for download to start)
  setTimeout(() => URL.revokeObjectURL(url), BLOB_URL_CLEANUP_DELAY_MS);
}
