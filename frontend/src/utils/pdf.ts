export async function openPdfInNewTab(url: string, token?: string | null): Promise<void> {
  if (!token) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to load PDF: HTTP ' + response.status);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const newWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');
    
    if (!newWindow) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.target = '_blank';
      a.click();
    }
  } catch (err) {
    console.error('Error opening PDF in new tab:', err);
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
