// shop-generator.js - Functionality for the shop generation features

// Set market type for shop generation
function setMarketType(type, btn) {
    document.querySelectorAll('.toggle-btn').forEach(el => el.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('selectedMarket').value = type;
}

// Generate shop
function generateShop() {
    const market = document.getElementById('selectedMarket').value;
    
    // First decrement all cooldowns for the current market only
    itemStore.decrementCooldowns(market);
    
    // Then reload shop
    const shopContainer = document.getElementById('generated-shop-container');
    if (!shopContainer) return;
    
    // Get disabled categories from localStorage
    const disabledCategories = JSON.parse(localStorage.getItem('disabledCategories') || '[]');
    
    // Get available items from localStorage and config details
    let items;
    if (market === 'black') {
        // Black Market shows items from both Day and Black markets
        items = itemStore.getItems().filter(item => 
            (item.market === 'day' || item.market === 'black') && 
            item.cooldown === 0 &&
            !disabledCategories.includes(item.category)
        );
    } else {
        // Day Market only shows Day Market items
        items = itemStore.getItems().filter(item => 
            item.market === market && 
            item.cooldown === 0 &&
            !disabledCategories.includes(item.category)
        );
    }
    
    // Get the current config from localStorage
    const config = configStore.getConfig();
    const currencyNames = config.currencyNames;

    if (items.length > 0) {
        // Group items by category for limiting
        const itemsByCategory = {};
        items.forEach(item => {
            if (!itemsByCategory[item.category]) {
                itemsByCategory[item.category] = [];
            }
            itemsByCategory[item.category].push(item);
        });

        // Apply item limits per category and shuffle
        const selectedItems = [];
        config.categories.forEach(category => {
            // Skip disabled categories
            if (disabledCategories.includes(category.name)) {
                return;
            }
            
            const categoryItems = itemsByCategory[category.name] || [];
            // Shuffle items in this category
            for (let i = categoryItems.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [categoryItems[i], categoryItems[j]] = [categoryItems[j], categoryItems[i]];
            }
            
            // Select only up to the limit for this category
            // Ensure we're using the correct itemLimit from the config
            const limit = category.itemLimit || 3; // Default to 3 if not specified
            console.log(`Category ${category.name} using limit: ${limit}`);
            selectedItems.push(...categoryItems.slice(0, limit));
        });

        shopContainer.innerHTML = `
            <div class="shop-grid">
                ${selectedItems.map(item => `
                    <div class="shop-item ${item.market === 'black' ? 'black-market' : ''}" data-id="${item.id}">
                        <h3>${item.name}</h3>
                        <div class="shop-item-content">
                            <p>${item.description}</p>
                            <p><strong>${currencyNames.local}:</strong> ${item.localPrice}</p>
                            <p><strong>${currencyNames.national}:</strong> ${item.nationalPrice}</p>
                            <p><strong>Category:</strong> ${item.category}</p>
                        </div>
                        <button class="btn" onclick="buyItem('${item.id}')">Buy</button>
                    </div>
                `).join('')}
            </div>`;
    } else {
        shopContainer.innerHTML = '<p>No items available.</p>';
    }

    // Also refresh the items table if it's visible
    const itemsTab = document.getElementById('Items');
    if (itemsTab && itemsTab.style.display === 'block' && typeof refreshItemsTable === 'function') {
        refreshItemsTable();
    }
}

// Function to clear the shop
function clearShop() {
    const shopContainer = document.getElementById('generated-shop-container');
    if (shopContainer) {
        shopContainer.innerHTML = '';
    }
}

// Buy an item from the shop
function buyItem(id) {
    // Apply cooldown to the item
    itemStore.applyCooldown(id);
    
    // Update UI to grey out the button without regenerating the shop
    const buyButton = document.querySelector(`button[onclick="buyItem('${id}')"]`);
    if (buyButton) {
        const itemContainer = buyButton.closest('.shop-item');
        if (itemContainer) {
            // Grey out the item
            itemContainer.style.opacity = '0.5';
            // Disable the button
            buyButton.disabled = true;
            buyButton.textContent = 'Purchased';
        }
    }
    
    // Refresh the items table if it's visible
    const itemsTab = document.getElementById('Items');
    if (itemsTab && itemsTab.style.display === 'block' && typeof refreshItemsTable === 'function') {
        refreshItemsTable();
    }
}

// Load and update category toggles for shop generation
function updateCategoryToggles() {
    const config = configStore.getConfig();
    const container = document.getElementById('category-toggles');
    
    if (!container) return;
    
    // Get disabled categories from localStorage or initialize empty array
    const disabledCategories = JSON.parse(localStorage.getItem('disabledCategories') || '[]');
    
    // Clear existing toggles
    container.innerHTML = '';
    
    // Create toggle for each category
    config.categories.forEach(category => {
        const isDisabled = disabledCategories.includes(category.name);
        const toggleWrapper = document.createElement('div');
        toggleWrapper.className = 'category-toggle';
        toggleWrapper.style.display = 'flex';
        toggleWrapper.style.alignItems = 'center';
        toggleWrapper.style.padding = '8px 12px';
        toggleWrapper.style.border = '1px solid var(--table-border)';
        toggleWrapper.style.borderRadius = '4px';
        toggleWrapper.style.backgroundColor = isDisabled ? 'transparent' : 'var(--button-bg)';
        toggleWrapper.style.color = isDisabled ? 'var(--text-color)' : 'white';
        toggleWrapper.style.cursor = 'pointer';
        toggleWrapper.style.transition = 'all 0.2s ease';
        
        toggleWrapper.innerHTML = `
            <input type="checkbox" id="category-toggle-${category.name}" 
                data-category="${category.name}" 
                style="margin-right: 8px;"
                ${isDisabled ? '' : 'checked'}>
            <label for="category-toggle-${category.name}" style="cursor: pointer; user-select: none;">
                ${category.name}
            </label>
        `;
        
        toggleWrapper.addEventListener('click', (e) => {
            const checkbox = toggleWrapper.querySelector('input[type="checkbox"]');
            // Toggle the checkbox
            checkbox.checked = !checkbox.checked;
            
            // Update the toggle style
            toggleWrapper.style.backgroundColor = checkbox.checked ? 'var(--button-bg)' : 'transparent';
            toggleWrapper.style.color = checkbox.checked ? 'white' : 'var(--text-color)';
            
            // Save the disabled categories
            saveDisabledCategories();
            
            // Prevent the checkbox's default behavior
            e.preventDefault();
        });
        
        container.appendChild(toggleWrapper);
    });
}

// Save disabled categories to localStorage
function saveDisabledCategories() {
    const checkboxes = document.querySelectorAll('#category-toggles input[type="checkbox"]');
    const disabledCategories = [];
    
    checkboxes.forEach(checkbox => {
        if (!checkbox.checked) {
            disabledCategories.push(checkbox.getAttribute('data-category'));
        }
    });
    
    localStorage.setItem('disabledCategories', JSON.stringify(disabledCategories));
}

// Select/deselect all category toggles
function selectAllCategories(select) {
    const checkboxes = document.querySelectorAll('#category-toggles input[type="checkbox"]');
    const toggleWrappers = document.querySelectorAll('.category-toggle');
    
    checkboxes.forEach((checkbox, index) => {
        checkbox.checked = select;
        const wrapper = toggleWrappers[index];
        wrapper.style.backgroundColor = select ? 'var(--button-bg)' : 'transparent';
        wrapper.style.color = select ? 'white' : 'var(--text-color)';
    });
    
    saveDisabledCategories();
}

// Initialize shop generator functionality
document.addEventListener('DOMContentLoaded', function() {
    updateCategoryToggles();
    
    // Add event listener for the generate shop button
    const generateShopBtn = document.querySelector('button[onclick="generateShop()"]');
    if (!generateShopBtn) {
        const generateShopBtn = document.getElementById('generate-shop-btn');
        if (generateShopBtn) {
            generateShopBtn.addEventListener('click', generateShop);
        }
    }
    
    // Add event listener for the clear shop button
    const clearShopBtn = document.querySelector('button[onclick="clearShop()"]');
    if (!clearShopBtn) {
        const clearShopBtn = document.getElementById('clear-shop-btn');
        if (clearShopBtn) {
            clearShopBtn.addEventListener('click', clearShop);
        }
    }
});