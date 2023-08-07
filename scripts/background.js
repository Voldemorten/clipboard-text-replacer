// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// A generic onclick callback function.
chrome.contextMenus.onClicked.addListener(genericOnClick);

// To be injected to the active tab
function contentCopy(text) {
    const defaultNotificationStyles = {
        position: 'fixed',
        top: '20px' /* Adjust this value to control the vertical position */,
        right: '20px' /* Adjust this value to control the horizontal position */,
        backgroundColor: '#444',
        color: '#fff',
        padding: '25px',
        borderRadius: '4px',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
        opacity: '1',
        transition: 'opacity 0.5s ease-in-out' /* Add the fade-out transition */,
        zIndex: '9999',
    };

    navigator.clipboard
        .writeText(text)
        .then((t) => {
            // Add a notification to the body, that disappears after 2 seconds
            const notification = document.createElement('div');
            notification.textContent = `Copied ${text} to clipboard`;

            const customStyles = {
                color: '#155724',
                backgroundColor: '#d4edda',
                borderColor: '#c3e6cb',
            };

            Object.assign(notification.style, { ...defaultNotificationStyles, ...customStyles });

            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.opacity = '0';
                // Schedule the removal after the transition completes (0.5 seconds)
                setTimeout(() => {
                    notification.remove();
                }, 500);
            }, 5000);

            console.log('Copied to clipboard: ', text);
        })
        .catch((error) => {
            // alert(error);
            console.log(error);
            if (error.message === 'Document is not focused.') {
                // Notify the user
                alert(
                    'Error: The document is not focused. Please click on the document and try again.'
                );
            } else {
                // Add a notification to the body, that disappears after 5 seconds
                const notification = document.createElement('div');
                notification.textContent = `Copied ${text} to clipboard`;

                const customStyles = {
                    color: '#721c24',
                    backgroundCcolor: '#f8d7da',
                    borderColor: '#f5c6cb',
                };

                Object.assign(notification.style, {
                    ...defaultNotificationStyles,
                    ...customStyles,
                });

                setTimeout(() => {
                    notification.style.opacity = '0';
                    // Schedule the removal after the transition completes (0.5 seconds)
                    setTimeout(() => {
                        notification.remove();
                    }, 500);
                }, 5000);
            }
        });
}

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    let tabs = await chrome.tabs.query(queryOptions);
    if (tabs[0]) {
        return tabs[0];
    }
    return null;
}

const readLocalStorage = async () => {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['replacementItems'], function (result) {
            if (result['replacementItems'] === undefined) {
                resolve([]);
            } else {
                resolve(result['replacementItems']);
            }
        });
    });
};

// A generic onclick callback function.
async function genericOnClick(info) {
    const validUrlRegex =
        /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/;
    try {
        const replacementItems = await readLocalStorage();

        if (!replacementItems.length) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    alert('No items found in local storage. Please add some items first.');
                },
            });
            return;
        }

        if (info.menuItemId.includes('generated')) {
            return generatedOnClick(info);
        } else {
            const tab = await getCurrentTab();
            let textToReplace = info.linkUrl || info.selectionText;
            switch (info.menuItemId) {
                case 'copyAndReplaceSelection':
                    textToReplace = replaceText({
                        replacementItems,
                        textToReplace,
                        chained: false,
                    });
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: contentCopy,
                        args: [textToReplace],
                    });
                    break;

                case 'copyAndReplaceSelectionChained':
                    textToReplace = replaceText({
                        replacementItems,
                        textToReplace,
                        chained: true,
                    });
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: contentCopy,
                        args: [textToReplace],
                    });
                    break;

                case 'copyAndReplaceSelectionAndOpenInNewTab':
                    textToReplace = replaceText({
                        replacementItems,
                        textToReplace,
                        chained: false,
                    });
                    chrome.tabs.create({ url: textToReplace });
                    break;

                case 'copyAndReplaceSelectionAndOpenInNewTabChained':
                    textToReplace = replaceText({
                        replacementItems,
                        textToReplace,
                        chained: true,
                    });
                    chrome.tabs.create({ url: textToReplace });
                    break;

                case 'selection':
                    console.log('Selection item clicked');
                    break;

                case 'link':
                    console.log('Link item clicked');
                    break;

                default:
                    // Standard context menu item function
                    console.log('Standard context menu item clicked.');
            }
        }
    } catch (e) {
        console.error(e);
    }
}

function isValidRegex(regexString) {
    const regexPattern = /^\/.*\/[gimuy]*$/;
    return regexPattern.test(regexString);
}

function replaceText({ replacementItems, textToReplace, chained } = {}) {
    let localReplacementItems = replacementItems;
    if (chained) {
        localReplacementItems = [...replacementItems].reverse();
    }
    // copy textToReplace to a new variable
    let replacedText = textToReplace;

    for (let i = 0; i < localReplacementItems.length; i++) {
        const item = localReplacementItems[i];
        if (isValidRegex(item.newItemTextFrom)) {
            const lastSlashIndex = item.newItemTextFrom.lastIndexOf('/');
            const regexPattern = item.newItemTextFrom.slice(1, lastSlashIndex);
            const regexOptions = item.newItemTextFrom.slice(lastSlashIndex + 1);
            const regex = new RegExp(regexPattern, regexOptions);
            replacedText = replacedText.replace(regex, item.newItemTextTo);
        } else {
            replacedText = replacedText.replaceAll(item.newItemTextFrom, item.newItemTextTo);
        }

        if (!chained && textToReplace !== replacedText) {
            return replacedText;
        }
    }
    return replacedText;
}

async function generatedOnClick(info) {
    const item = JSON.parse(info.menuItemId.replace('generated-', ''));
    const tab = await getCurrentTab();
    const replacedText = replaceText({
        replacementItems: [item],
        textToReplace: info.linkUrl || info.selectionText,
        chained: false,
    });
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: contentCopy,
        args: [replacedText],
    });
}

async function addContextMenusFromReplacementItems() {
    const replacementItems = await readLocalStorage();
    for (let i = 0; i < replacementItems.length; i++) {
        const item = replacementItems[i];
        chrome.contextMenus.create({
            title: `Replace ${item.newItemTextFrom} with ${item.newItemTextTo} and copy to clipboard`,
            contexts: ['selection', 'link'],
            id: `generated-${JSON.stringify(item)}`,
        });
    }
}

function addGenericContextMenus() {
    chrome.contextMenus.create({
        title: 'replace selection with first matched rule and open in new tab',
        contexts: ['link'],
        id: 'copyAndReplaceSelectionAndOpenInNewTab',
    });

    chrome.contextMenus.create({
        title: 'replace selection with chained rules and open in new tab',
        contexts: ['link'],
        id: 'copyAndReplaceSelectionAndOpenInNewTabChained',
    });

    chrome.contextMenus.create({
        title: 'Copy and replace selection with the first matched rule',
        contexts: ['selection', 'link'],
        id: 'copyAndReplaceSelection',
    });

    chrome.contextMenus.create({
        title: 'Copy and replace selection with the chained rules',
        contexts: ['selection', 'link'],
        id: 'copyAndReplaceSelectionChained',
    });
}

chrome.runtime.onInstalled.addListener(async function (details) {
    addGenericContextMenus();
    await addContextMenusFromReplacementItems();
    if (details.reason == 'install') {
        chrome.runtime.openOptionsPage();
    }
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === 'sync' && 'replacementItems' in changes) {
        // The 'replacementItems' value has changed.
        // Reload your logic inside the chrome.runtime.onInstalled listener here.
        // You can either call the listener function directly or move the logic into a separate function and call it.
        chrome.contextMenus.removeAll();
        addGenericContextMenus();
        addContextMenusFromReplacementItems();
    }
});
