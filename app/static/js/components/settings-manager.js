// settings-manager.js - Functionality for the settings management tab

// Load categories into select dropdown
function loadCategories() {
    const config = configStore.getConfig();
    const categorySelect = document.getElementById('category');
    
    if (!categorySelect) return;
    
    categorySelect.innerHTML = '';
    config.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });
}

// Refresh category table in settings
function refreshCategoryTable() {
    const config = configStore.getConfig();
    const categoryList = document.getElementById('category-list');
    
    if (!categoryList) return;
    
    categoryList.innerHTML = '';
    
    config.categories.forEach(category => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${category.name}</td>
            <td>${category.cooldownDays}</td>
            <td>${category.itemLimit || 3}</td>
            <td>
                <button class="btn" onclick="editCategory('${category.name}')">Edit</button>
                <button class="btn-danger" onclick="deleteCategory('${category.name}')">Delete</button>
            </td>
        `;
        categoryList.appendChild(row);
    });
}

// Variables to track editing state
let isEditingCategory = false;
let editingCategoryName = '';

// Edit category function
function editCategory(name) {
    const config = configStore.getConfig();
    const category = config.categories.find(c => c.name === name);
    
    if (!category) return;
    
    // Set the editing state
    isEditingCategory = true;
    editingCategoryName = name;
    
    // Populate form fields with category values
    document.getElementById('new-category-name').value = category.name;
    document.getElementById('new-category-cooldown').value = category.cooldownDays;
    document.getElementById('new-category-item-limit').value = category.itemLimit || 3;
    
    // Change the Add button text to Update
    const actionButton = document.getElementById('category-action-btn');
    actionButton.textContent = 'Update Category';
    actionButton.onclick = function() {
        updateCategory();
    };
    
    // Add a cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'btn';
    cancelButton.style.backgroundColor = 'rgb(220, 38, 38)';
    cancelButton.style.marginLeft = '10px';
    cancelButton.onclick = cancelEditCategory;
    
    if (!document.getElementById('cancel-edit-btn')) {
        actionButton.parentNode.appendChild(cancelButton);
        cancelButton.id = 'cancel-edit-btn';
    }
    
    // Scroll to the edit form
    document.getElementById('new-category-name').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Function to update an existing category
function updateCategory() {
    const nameInput = document.getElementById('new-category-name');
    const cooldownInput = document.getElementById('new-category-cooldown');
    const itemLimitInput = document.getElementById('new-category-item-limit');
    
    const name = nameInput.value.trim();
    const cooldown = parseInt(cooldownInput.value);
    const itemLimit = parseInt(itemLimitInput.value);
    
    if (!name || isNaN(cooldown) || cooldown < 1 || isNaN(itemLimit) || itemLimit < 1) {
        alert('Please enter a valid category name, cooldown days, and item limit');
        return;
    }
    
    const config = configStore.getConfig();
    
    // If name changed, need to update all items using the old category name
    if (name !== editingCategoryName) {
        // Update items with the old category name to use the new one
        updateItemCategories(editingCategoryName, name);
    }
    
    // Update category in the config
    configStore.updateCategory(name, cooldown, itemLimit);
    
    // If we're editing an existing category and changed the name, delete the old one
    if (name !== editingCategoryName) {
        configStore.deleteCategory(editingCategoryName);
    }
    
    // Reset edit state
    cancelEditCategory();
    
    // Refresh UI
    refreshCategoryTable();
    loadCategories();
    
    // Also update category toggles if this component is loaded
    if (typeof updateCategoryToggles === 'function') {
        updateCategoryToggles();
    }
}

// Function to cancel category editing
function cancelEditCategory() {
    // Reset the editing state
    isEditingCategory = false;
    editingCategoryName = '';
    
    // Clear form inputs
    document.getElementById('new-category-name').value = '';
    document.getElementById('new-category-cooldown').value = '3';
    document.getElementById('new-category-item-limit').value = '3';
    
    // Reset the Add button using its ID
    const actionButton = document.getElementById('category-action-btn');
    if (actionButton) {
        actionButton.textContent = 'Add Category';
        actionButton.onclick = function() {
            addCategory();
        };
    }
    
    // Remove the cancel button
    const cancelButton = document.getElementById('cancel-edit-btn');
    if (cancelButton) {
        cancelButton.remove();
    }
}

// Function to update item categories when a category name changes
function updateItemCategories(oldCategoryName, newCategoryName) {
    const items = itemStore.getItems();
    const updatedItems = items.map(item => {
        if (item.category === oldCategoryName) {
            item.category = newCategoryName;
        }
        return item;
    });
    
    itemStore.saveItems(updatedItems);
}

// Add new category
function addCategory() {
    const nameInput = document.getElementById('new-category-name');
    const cooldownInput = document.getElementById('new-category-cooldown');
    const itemLimitInput = document.getElementById('new-category-item-limit');
    
    const name = nameInput.value.trim();
    const cooldown = parseInt(cooldownInput.value);
    const itemLimit = parseInt(itemLimitInput.value);
    
    if (!name || isNaN(cooldown) || cooldown < 1 || isNaN(itemLimit) || itemLimit < 1) {
        alert('Please enter a valid category name, cooldown days, and item limit');
        return;
    }
    
    configStore.updateCategory(name, cooldown, itemLimit);
    
    // Clear inputs
    nameInput.value = '';
    cooldownInput.value = '3';
    itemLimitInput.value = '3';
    
    // Refresh both tables
    refreshCategoryTable();
    loadCategories();
    
    // Also update category toggles if this component is loaded
    if (typeof updateCategoryToggles === 'function') {
        updateCategoryToggles();
    }
}

// Delete category function
function deleteCategory(name) {
    // Count items in this category
    const items = itemStore.getItems();
    const itemsInCategory = items.filter(item => item.category === name);
    
    let confirmMessage = `Are you sure you want to delete the "${name}" category?`;
    
    if (itemsInCategory.length > 0) {
        confirmMessage += `\n\nWARNING: This will also delete ${itemsInCategory.length} item(s) in this category!`;
    }
    
    if (confirm(confirmMessage)) {
        // First delete all items in this category
        if (itemsInCategory.length > 0) {
            for (const item of itemsInCategory) {
                itemStore.deleteItem(item.id);
            }
        }
        
        // Then delete the category
        configStore.deleteCategory(name);
        
        // Refresh UI
        refreshCategoryTable();
        loadCategories();
        
        // Refresh items table if available
        if (typeof refreshItemsTable === 'function') {
            refreshItemsTable();
        }
        
        // Also update category toggles if this component is loaded
        if (typeof updateCategoryToggles === 'function') {
            updateCategoryToggles();
        }
    }
}

// Export data
function exportData() {
    itemStore.exportItems();
}

// Import data
function importData() {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file to import');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const contents = e.target.result;
        const success = itemStore.importItems(contents);
        
        if (success) {
            alert('Data imported successfully. The page will now refresh.');
            // Refresh the page after a short delay to allow the alert to be seen
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            alert('Error importing data. Make sure the file format is correct.');
        }
    };
    reader.readAsText(file);
}

// Currency name save function
function saveCurrencyNames() {
    const localName = document.getElementById('local-currency-name').value.trim() || configStore.defaultCurrencyNames.local;
    const nationalName = document.getElementById('national-currency-name').value.trim() || configStore.defaultCurrencyNames.national;
    configStore.updateCurrencyNames(localName, nationalName);
}

// Initialize settings functionality
document.addEventListener('DOMContentLoaded', function() {
    refreshCategoryTable();
    loadCategories();
    
    // Initialize the config on first load
    if (!localStorage.getItem('dndShopConfig')) {
        configStore.resetToDefaults();
    }
    
    // Update currency labels in the UI
    configStore.updateCurrencyLabels();
});