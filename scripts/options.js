document.addEventListener('DOMContentLoaded', function () {
    const addButton = document.getElementById('add-button');
    const newItemFrom = document.getElementById('replace-text-from');
    const newItemTo = document.getElementById('replace-text-to');
    const replacementList = document.getElementById('replacement-list');

    // Load items from Chrome memory when the options page is opened
    chrome.storage.sync.get(['replacementItems'], function (result) {
        const replacementItems = result.replacementItems || [];
        renderReplacementItems(replacementItems);
    });

    // Add event listener to the add button
    addButton.addEventListener('click', function () {
        const newItemTextFrom = newItemFrom.value.trim();
        const newItemTextTo = newItemTo.value.trim();
        if (newItemTextFrom !== '' && newItemTextTo !== '') {
            // Retrieve existing items from Chrome memory
            chrome.storage.sync.get(['replacementItems'], function (result) {
                const replacementItems = result.replacementItems || [];
                // Add the new item
                replacementItems.push({ newItemTextFrom, newItemTextTo });
                // Save the updated items to Chrome memory
                chrome.storage.sync.set({ replacementItems: replacementItems }, function () {
                    // Update the displayed replacement list
                    renderReplacementItems(replacementItems);
                });
            });

            // Clear the input field after adding the item
            newItemFrom.value = '';
            newItemTo.value = '';
        }
    });

    // Remove an item from the replacement list
    function removeItem(index) {
        chrome.storage.sync.get(['replacementItems'], function (result) {
            const replacementItems = result.replacementItems || [];
            // Remove the item at the given index
            replacementItems.splice(index, 1);
            // Save the updated items to Chrome memory
            chrome.storage.sync.set({ replacementItems: replacementItems }, function () {
                // Update the displayed replacement list
                renderReplacementItems(replacementItems);
            });
        });
    }

    function moveItem(index, direction) {
        chrome.storage.sync.get(['replacementItems'], function (result) {
            const replacementItems = result.replacementItems || [];
            if (direction === 'up' && index > 0) {
                const temp = replacementItems[index - 1];
                replacementItems[index - 1] = replacementItems[index];
                replacementItems[index] = temp;
            } else if (direction === 'down' && index < replacementItems.length - 1) {
                const temp = replacementItems[index + 1];
                replacementItems[index + 1] = replacementItems[index];
                replacementItems[index] = temp;
            }
            chrome.storage.sync.set({ replacementItems: replacementItems }, function () {
                renderReplacementItems(replacementItems);
            });
        });
    }

    // Render the replacement list on the options page
    function renderReplacementItems(replacementItems) {
        replacementList.innerHTML = ''; // Clear the list first
        replacementItems.forEach((item, index) => {
            const tableRow = document.createElement('tr');
            tableRow.className = 'bg-white'; // Add background color

            const replacementFrom = document.createElement('td');
            replacementFrom.textContent = item.newItemTextFrom;
            replacementFrom.className = 'font-bold text-blue-500 p-2 px-10'; // Style the replacement from text
            tableRow.appendChild(replacementFrom);

            const arrowIcon = document.createElement('td');
            arrowIcon.className = 'pr-10'; // Add padding to the arrow icon
            arrowIcon.innerHTML =
                '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-5 w-5 mx-2"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>'; // SVG arrow icon
            tableRow.appendChild(arrowIcon);

            const replacementTo = document.createElement('td');
            replacementTo.textContent = item.newItemTextTo;
            replacementTo.className = 'font-bold text-green-500 py-2 pr-10'; // Style the replacement to text
            tableRow.appendChild(replacementTo);

            const removeButtonContainer = document.createElement('td');
            removeButtonContainer.className = 'p-2'; // Add padding to the remove button
            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.className = 'px-3 py-1 bg-red-500 text-white rounded hover:bg-red-700'; // Style the remove button
            removeButton.addEventListener('click', function () {
                removeItem(index);
            });
            removeButtonContainer.appendChild(removeButton);
            tableRow.appendChild(removeButtonContainer);

            const upDownButtonContainer = document.createElement('td');
            upDownButtonContainer.className = 'p-2 flex flex-col justify-center'; // Add padding and flexbox to the up/down buttons

            const upButton = document.createElement('button');
            const upIcon = document.createElement('i');
            upIcon.className = 'fas fa-arrow-up';
            upButton.appendChild(upIcon);
            upButton.addEventListener('click', function () {
                moveItem(index, 'up');
            });
            upDownButtonContainer.appendChild(upButton);

            const downButton = document.createElement('button');
            const downIcon = document.createElement('i');
            downIcon.className = 'fas fa-arrow-down';
            downButton.appendChild(downIcon);
            downButton.addEventListener('click', function () {
                moveItem(index, 'down');
            });
            upDownButtonContainer.appendChild(downButton);

            tableRow.appendChild(upDownButtonContainer);

            replacementList.appendChild(tableRow);
        });
    }
});
