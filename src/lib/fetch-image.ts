'use server';

export async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image. Status: ${response.status}`);
    }
    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/png';
    return `data:${contentType};base64,${base64Image}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown fetch error';
    console.error(`Error fetching image: ${message}`);
    throw new Error(`Could not fetch or process the image: ${message}`);
  }
}
