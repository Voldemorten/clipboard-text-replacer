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

    // Render the replacement list on the options page
    function renderReplacementItems(replacementItems) {
        replacementList.innerHTML = ''; // Clear the list first
        replacementItems.forEach((item, index) => {
            const tableRow = document.createElement('tr');
            tableRow.className = 'bg-white'; // Add background color

            const replacementFrom = document.createElement('td');
            replacementFrom.textContent = item.newItemTextFrom;
            replacementFrom.className = 'font-bold text-blue-500 p-2'; // Style the replacement from text

            const arrowIcon = document.createElement('td');
            arrowIcon.className = 'px-10'; // Add padding to the arrow icon
            arrowIcon.innerHTML =
                '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-5 w-5 mx-2"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>'; // SVG arrow icon

            const replacementTo = document.createElement('td');
            replacementTo.textContent = item.newItemTextTo;
            replacementTo.className = 'font-bold text-green-500 py-2 pr-10'; // Style the replacement to text

            const removeButtonContainer = document.createElement('td');
            removeButtonContainer.className = 'p-2'; // Add padding to the remove button
            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.className = 'px-3 py-1 bg-red-500 text-white rounded hover:bg-red-700'; // Style the remove button
            removeButton.addEventListener('click', function () {
                removeItem(index);
            });
            removeButtonContainer.appendChild(removeButton);

            tableRow.appendChild(replacementFrom);
            tableRow.appendChild(arrowIcon);
            tableRow.appendChild(replacementTo);
            tableRow.appendChild(removeButtonContainer);

            replacementList.appendChild(tableRow);
        });
    }
});
