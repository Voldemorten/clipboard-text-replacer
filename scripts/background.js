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
    navigator.clipboard
        .writeText(text)
        .then((t) => {
            console.log('Copied to clipboard: ', text);
        })
        .catch((e) => {
            console.log(e);
            alert('Error copying to clipboard: ', JSON.stringify(e, null, 2));
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
    try {
        const tab = await getCurrentTab();
        const validUrlRegex =
            /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/;

        let textToReplace = info.linkUrl || info.selectionText;

        const replacementItems = await readLocalStorage();
        console.log(replacementItems);
        if (!replacementItems.length) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    alert('No items found in local storage. Please add some items first.');
                },
            });
            return;
        }
        for (let i = 0; i < replacementItems.length; i++) {
            const item = replacementItems[i];
            const regex = new RegExp(item.newItemTextFrom, 'gm');
            console.log(textToReplace);
            textToReplace = textToReplace.replace(regex, item.newItemTextTo);
            console.log(textToReplace);
        }

        console.log(5, textToReplace);

        switch (info.menuItemId) {
            case 'copyAndReplaceSelection':
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: contentCopy,
                    args: [textToReplace],
                });

                console.log('Substitution result: ', textToReplace);
                break;
            case 'copyAndReplaceSelectionAndOpenInNewTab':
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
        console.log(info);
    } catch (e) {
        console.error(e);
    }
}
chrome.runtime.onInstalled.addListener(function () {
    chrome.contextMenus.create({
        title: 'Copy and replace selection with localhost',
        contexts: ['selection', 'link'],
        id: 'copyAndReplaceSelection',
    });

    chrome.contextMenus.create({
        title: 'Copy and replace selection with localhost and open in new tab',
        contexts: ['selection', 'link'],
        id: 'copyAndReplaceSelectionAndOpenInNewTab',
    });
    // Create one test item for each context type.
    // let contexts = [
    //     'all',
    //     'page',
    //     'frame',
    //     'selection',
    //     'link',
    //     'editable',
    //     'image',
    //     'video',
    //     'audio',
    //     'browser_action',
    //     'page_action',
    //     'action',
    // ];
    // for (let i = 0; i < contexts.length; i++) {
    //     const context = contexts[i];
    //     let title = "Test '" + context + "' menu item";
    //     chrome.contextMenus.create({
    //         title: title,
    //         contexts: [context],
    //         id: context,
    //     });
    // }
});
