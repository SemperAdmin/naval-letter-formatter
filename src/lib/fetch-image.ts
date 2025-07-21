'use server';

export async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  try {
    // Try multiple DoD seal sources for reliability
    const sealUrls = [
      imageUrl,
      "https://www.lrsm.upenn.edu/wp-content/uploads/1960/05/dod-logo.png",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/United_States_Department_of_Defense_Seal.svg/240px-United_States_Department_of_Defense_Seal.svg.png"
    ];
    
    for (const url of sealUrls) {
      try {
        console.log(`Trying to fetch DoD seal from: ${url}`);
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Naval-Letter-Formatter/1.0)',
            'Accept': 'image/*',
          },
        });
        
        if (!response.ok) {
          console.warn(`Failed to fetch from ${url}: ${response.status}`);
          continue;
        }
        
        const imageBuffer = await response.arrayBuffer();
        
        if (imageBuffer.byteLength === 0) {
          console.warn(`Empty response from ${url}`);
          continue;
        }
        
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const contentType = response.headers.get('content-type') || 'image/png';
        
        console.log(`Successfully fetched DoD seal from: ${url}`);
        return `data:${contentType};base64,${base64Image}`;
        
      } catch (urlError) {
        console.warn(`Error fetching from ${url}:`, urlError);
        continue;
      }
    }
    
    // If all URLs fail, return fallback SVG seal
    console.log('All seal URLs failed, using fallback seal');
    const fallbackSeal = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9Ijc1IiBjeT0iNzUiIHI9IjcwIiBmaWxsPSIjMDAyQTVDIiBzdHJva2U9IiNGRkQ3MDAiIHN0cm9rZS13aWR0aD0iNiIvPgo8Y2lyY2xlIGN4PSI3NSIgY3k9Ijc1IiByPSI1MCIgZmlsbD0iI0ZGRkZGRiIvPgo8Y2lyY2xlIGN4PSI3NSIgY3k9Ijc1IiByPSIzNSIgZmlsbD0iIzAwMkE1QyIvPgo8dGV4dCB4PSI3NSIgeT0iODUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNGRkZGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkRPRDwvdGV4dD4KPHRleHQgeD0iNzUiIHk9IjI1IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNGRkQ3MDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkRFUEFSVE1FTlQgT0YgREVGRU5TRTwvdGV4dD4KPHR]eHQgeD0iNzUiIHk9IjEzMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjRkZENzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5VTklURUQgU1RBVEVTIE9GIEFOR1JJQ0E8L3RleHQ+Cjwvc3ZnPg==`;
    return fallbackSeal;
    
  } catch (error) {
    console.error('Error fetching DoD seal:', error);
    // Return minimal fallback
    const minimalSeal = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9Ijc1IiBjeT0iNzUiIHI9IjcwIiBmaWxsPSIjMDAyQTVDIiBzdHJva2U9IiNGRkQ3MDAiIHN0cm9rZS13aWR0aD0iNCIvPgo8dGV4dCB4PSI3NSIgeT0iODUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNGRkZGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkRvRDwvdGV4dD4KPC9zdmc+`;
    return minimalSeal;
  }
}