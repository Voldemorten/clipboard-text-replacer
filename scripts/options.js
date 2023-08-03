document.addEventListener('DOMContentLoaded', function () {
    const addButton = document.getElementById('add-button');
    const newItemFrom = document.getElementById('replace-text-from');
    const newItemTo = document.getElementById('replace-text-to');
    const todoList = document.getElementById('todo-list');

    // Load items from Chrome memory when the options page is opened
    chrome.storage.sync.get(['replacementItems'], function (result) {
        const replacementItems = result.replacementItems || [];
        renderTodoList(replacementItems);
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
                    // Update the displayed todo list
                    renderTodoList(replacementItems);
                });
            });

            // Clear the input field after adding the item
            newItemFrom.value = '';
            newItemTo.value = '';
        }
    });

    // Remove an item from the todo list
    function removeItem(index) {
        chrome.storage.sync.get(['replacementItems'], function (result) {
            const replacementItems = result.replacementItems || [];
            // Remove the item at the given index
            replacementItems.splice(index, 1);
            // Save the updated items to Chrome memory
            chrome.storage.sync.set({ replacementItems: replacementItems }, function () {
                // Update the displayed todo list
                renderTodoList(replacementItems);
            });
        });
    }

    // Render the todo list on the options page
    function renderTodoList(replacementItems) {
        todoList.innerHTML = ''; // Clear the list first
        replacementItems.forEach((item, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = item.newItemTextFrom + ' -> ' + item.newItemTextTo;
            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.addEventListener('click', function () {
                removeItem(index);
            });
            listItem.appendChild(removeButton);
            todoList.appendChild(listItem);
        });
    }
});
