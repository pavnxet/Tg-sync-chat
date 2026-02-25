chrome.action.onClicked.addListener(async (tab) => {
  // Use Vercel URL in production, localhost in development
  const targetBaseUrl = 'http://localhost:3000';

  if (tab && tab.url && tab.title) {
    const url = new URL(targetBaseUrl);
    url.searchParams.set('title', tab.title);
    url.searchParams.set('url', tab.url);

    chrome.tabs.create({ url: url.toString() });
  } else {
    // If no context, just open the app
    chrome.tabs.create({ url: targetBaseUrl });
  }
});
