chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "createKudo",
    title: "Criar Kudo com \"%s\"",
    contexts: ["selection"]
  });

  chrome.storage.local.get({ kudos: [], teamMembers: [] }, (result) => {
    if (!result.kudos) {
      chrome.storage.local.set({ kudos: [] });
    }
    if (!result.teamMembers) {
      chrome.storage.local.set({ teamMembers: [] });
    }
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "createKudo") {
    const selectedText = info.selectionText;

    chrome.storage.local.get({ pendingKudo: null }, () => {
      chrome.storage.local.set({
        pendingKudo: {
          text: selectedText,
          url: tab.url,
          title: tab.title,
          timestamp: Date.now()
        }
      });

      chrome.action.openPopup();
    });
  }
});
