// items-table.js - Functionality for the items table component

// Current sort state
let currentSort = {
    column: 'name',
    direction: 'asc'
};

// Current filters
let filters = {
    name: '',
    category: '',
    market: '',
    cooldown: ''
};

// Load and display items from localStorage with sorting and filtering
function refreshItemsTable() {
    let items = itemStore.getItems();
    const tableBody = document.getElementById('items-table-body');
    
    if (!tableBody) {
        console.error('Items table body not found');
        return;
    }
    
    // Apply filters
    items = items.filter(item => {
        // Name filter (case insensitive)
        if (filters.name && !item.name.toLowerCase().includes(filters.name.toLowerCase())) {
            return false;
        }
        
        // Category filter
        if (filters.category && item.category !== filters.category) {
            return false;
        }
        
        // Market filter
        if (filters.market && item.market !== filters.market) {
            return false;
        }
        
        // Cooldown filter
        if (filters.cooldown === 'available' && item.cooldown > 0) {
            return false;
        }
        if (filters.cooldown === 'cooldown' && item.cooldown === 0) {
            return false;
        }
        
        return true;
    });
    
    // Apply sorting
    items.sort((a, b) => {
        let valueA, valueB;
        
        // Handle special sorting cases
        if (currentSort.column === 'cooldown') {
            valueA = a.cooldown;
            valueB = b.cooldown;
        } else if (currentSort.column === 'market') {
            valueA = a.market === 'day' ? 'Day Market' : 'Black Market';
            valueB = b.market === 'day' ? 'Day Market' : 'Black Market';
        } else {
            valueA = a[currentSort.column];
            valueB = b[currentSort.column];
            
            // Try to handle numeric values appropriately
            if (!isNaN(parseFloat(valueA)) && !isNaN(parseFloat(valueB))) {
                valueA = parseFloat(valueA);
                valueB = parseFloat(valueB);
            } else if (typeof valueA === 'string' && typeof valueB === 'string') {
                valueA = valueA.toLowerCase();
                valueB = valueB.toLowerCase();
            }
        }
        
        // Perform the comparison
        if (valueA < valueB) {
            return currentSort.direction === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
            return currentSort.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });
    
    // Update the table
    if (!items || items.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8">No items available</td></tr>';
        return;
    }
    
    // Get currency names from config
    const config = configStore.getConfig();
    const currencyNames = config.currencyNames || { local: 'Local Currency', national: 'National Currency' };
    
    tableBody.innerHTML = items.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.description}</td>
            <td>${item.localPrice}</td>
            <td>${item.nationalPrice}</td>
            <td>${item.category}</td>
            <td>${item.market === 'day' ? 'Day Market' : 'Black Market'}</td>
            <td>${item.cooldown > 0 ? `<span class="cooldown">${item.cooldown} days</span>` : 'Available'}</td>
            <td>
                <div class="action-buttons">
                    ${item.cooldown > 0 ? `
                        <button class="btn" onclick="resetItemCooldown('${item.id}')">Reset Cooldown</button>
                    ` : ''}
                    <button class="btn btn-danger" onclick="deleteItem('${item.id}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Update sort indicators in column headers
    document.querySelectorAll('th.sortable').forEach(th => {
        th.classList.remove('asc', 'desc');
        if (th.dataset.sort === currentSort.column) {
            th.classList.add(currentSort.direction);
        }
    });
    
    // Update category filter options dynamically
    updateCategoryFilterOptions();
}

// Make sure the function is accessible globally
window.refreshItemsTableWithSortAndFilter = refreshItemsTable;

// Update category filter with all available categories
function updateCategoryFilterOptions() {
    const categoryFilter = document.getElementById('category-filter');
    if (!categoryFilter) return;
    
    const currentSelection = categoryFilter.value;
    
    // Get all unique categories from items
    const items = itemStore.getItems();
    const categories = [...new Set(items.map(item => item.category))];
    
    // Clear existing options (except the first one)
    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }
    
    // Add options for each category
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
    
    // Restore selected value if it still exists
    if (categories.includes(currentSelection)) {
        categoryFilter.value = currentSelection;
    }
}

// Sort items by clicking on column headers
function setupSortHandlers() {
    document.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;
            
            // Toggle sort direction or set new column
            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.column = column;
                currentSort.direction = 'asc';
            }
            
            refreshItemsTable();
        });
    });
}

// Setup filter event handlers
function setupFilterHandlers() {
    // Name filter (with debounce)
    let nameFilterTimeout;
    const nameFilter = document.getElementById('name-filter');
    if (nameFilter) {
        nameFilter.addEventListener('input', (e) => {
            clearTimeout(nameFilterTimeout);
            nameFilterTimeout = setTimeout(() => {
                filters.name = e.target.value;
                refreshItemsTable();
            }, 300);
        });
    }
    
    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            filters.category = e.target.value;
            refreshItemsTable();
        });
    }
    
    // Market filter
    const marketFilter = document.getElementById('market-filter');
    if (marketFilter) {
        marketFilter.addEventListener('change', (e) => {
            filters.market = e.target.value;
            refreshItemsTable();
        });
    }
    
    // Cooldown filter
    const cooldownFilter = document.getElementById('cooldown-filter');
    if (cooldownFilter) {
        cooldownFilter.addEventListener('change', (e) => {
            filters.cooldown = e.target.value;
            refreshItemsTable();
        });
    }
}

// Reset all filters
function resetFilters() {
    filters = {
        name: '',
        category: '',
        market: '',
        cooldown: ''
    };
    
    // Reset filter controls
    const nameFilter = document.getElementById('name-filter');
    const categoryFilter = document.getElementById('category-filter');
    const marketFilter = document.getElementById('market-filter');
    const cooldownFilter = document.getElementById('cooldown-filter');
    
    if (nameFilter) nameFilter.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (marketFilter) marketFilter.value = '';
    if (cooldownFilter) cooldownFilter.value = '';
    
    refreshItemsTable();
}

// Reset cooldown for a specific item
function resetItemCooldown(id) {
    itemStore.resetCooldown(id);
    refreshItemsTable();
}

// Delete an item
function deleteItem(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        itemStore.deleteItem(id);
        refreshItemsTable();
    }
}

// Initialize the items table
document.addEventListener('DOMContentLoaded', function() {
    setupSortHandlers();
    setupFilterHandlers();
    refreshItemsTable();

    // Handle form submission for adding new items
    const form = document.getElementById('add-item-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            
            const newItem = {
                id: Date.now().toString(),
                name: formData.get('name'),
                description: formData.get('description'),
                localPrice: formData.get('localPrice'),
                nationalPrice: formData.get('nationalPrice'),
                category: formData.get('category'),
                market: formData.get('market'),
                cooldown: 0
            };
            
            itemStore.addItem(newItem);
            refreshItemsTable();

            // Save current category and market values
            const category = formData.get('category');
            const market = formData.get('market');
            
            // Reset only the input fields we want to clear
            form.querySelector('#name').value = '';
            form.querySelector('#description').value = '';
            form.querySelector('#localPrice').value = '';
            form.querySelector('#nationalPrice').value = '';
            
            // Restore category and market values
            form.querySelector('#category').value = category;
            form.querySelector('#market').value = market;

            // Focus on the name field for the next item
            form.querySelector('#name').focus();
        });
    }
});