// store.js - Data management for the D&D Shop Generator

// Item Store - manages item data
const itemStore = {
    getItems: function() {
        const items = localStorage.getItem('dndShopItems');
        return items ? JSON.parse(items) : [];
    },
    saveItems: function(items) {
        localStorage.setItem('dndShopItems', JSON.stringify(items));
    },
    addItem: function(item) {
        const items = this.getItems();
        // Generate a unique ID
        item.id = Date.now().toString();
        item.cooldown = 0;
        items.push(item);
        this.saveItems(items);
        return item;
    },
    deleteItem: function(id) {
        let items = this.getItems();
        items = items.filter(item => item.id !== id);
        this.saveItems(items);
    },
    applyCooldown: function(id) {
        let items = this.getItems();
        const item = items.find(item => item.id === id);
        if (item) {
            // Get cooldown days from configuration
            const config = JSON.parse(localStorage.getItem('dndShopConfig') || '{}');
            const categories = config.categories || [
                {name: "Small", cooldownDays: 2},
                {name: "Medium", cooldownDays: 3},
                {name: "Large", cooldownDays: 5}
            ];
            
            const categoryConfig = categories.find(c => 
                c.name.toLowerCase() === item.category.toLowerCase());
            
            if (categoryConfig) {
                item.cooldown = categoryConfig.cooldownDays;
            } else {
                // Default cooldown if category not found
                item.cooldown = 3;
            }
            this.saveItems(items);
        }
    },
    decrementCooldowns: function(currentMarket) {
        let items = this.getItems();
        items = items.map(item => {
            // Always decrement cooldowns for all items regardless of market type
            if (item.cooldown > 0) {
                item.cooldown--;
            }
            return item;
        });
        this.saveItems(items);
    },
    exportItems: function() {
        const items = this.getItems();
        const config = JSON.parse(localStorage.getItem('dndShopConfig') || '{}');
        const data = {
            items: items,
            config: config
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dnd-shop-data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
    importItems: function(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.items) {
                this.saveItems(data.items);
            }
            if (data.config) {
                localStorage.setItem('dndShopConfig', JSON.stringify(data.config));
            }
            return true;
        } catch (e) {
            console.error("Error importing data:", e);
            return false;
        }
    },
    resetCooldown: function(id) {
        let items = this.getItems();
        const item = items.find(item => item.id === id);
        if (item) {
            item.cooldown = 0;
            this.saveItems(items);
        }
    },
};

// Config Store - manages application configuration
const configStore = {
    defaultCategories: [
        {name: "Small", cooldownDays: 2, itemLimit: 3},
        {name: "Medium", cooldownDays: 3, itemLimit: 2},
        {name: "Large", cooldownDays: 5, itemLimit: 1}
    ],
    defaultCurrencyNames: {
        local: "Local Currency",
        national: "National Currency"
    },
    getConfig: function() {
        const config = localStorage.getItem('dndShopConfig');
        if (!config) {
            // If no config exists, initialize with defaults
            const defaultConfig = { 
                categories: this.defaultCategories,
                currencyNames: this.defaultCurrencyNames
            };
            this.saveConfig(defaultConfig);
            return defaultConfig;
        }
        const parsedConfig = JSON.parse(config);
        // Ensure currency names exist
        if (!parsedConfig.currencyNames) {
            parsedConfig.currencyNames = this.defaultCurrencyNames;
            this.saveConfig(parsedConfig);
        }
        return parsedConfig;
    },
    saveConfig: function(config) {
        localStorage.setItem('dndShopConfig', JSON.stringify(config));
    },
    updateCategory: function(name, cooldownDays, itemLimit) {
        const config = this.getConfig();
        let category = config.categories.find(c => c.name === name);
        
        if (category) {
            category.cooldownDays = cooldownDays;
            category.itemLimit = itemLimit;
        } else {
            config.categories.push({
                name: name, 
                cooldownDays: cooldownDays,
                itemLimit: itemLimit
            });
        }
        
        this.saveConfig(config);
    },
    deleteCategory: function(name) {
        const config = this.getConfig();
        config.categories = config.categories.filter(c => c.name !== name);
        this.saveConfig(config);
    },
    updateCurrencyNames: function(localName, nationalName) {
        const config = this.getConfig();
        config.currencyNames = {
            local: localName,
            national: nationalName
        };
        this.saveConfig(config);
        this.updateCurrencyLabels();
    },

    updateCurrencyLabels: function() {
        const config = this.getConfig();
        const names = config.currencyNames;
        
        // Update form labels
        const localLabel = document.getElementById('localPriceLabel');
        const nationalLabel = document.getElementById('nationalPriceLabel');
        if (localLabel) localLabel.textContent = names.local + ':';
        if (nationalLabel) nationalLabel.textContent = names.national + ':';

        // Update currency name inputs in settings
        const localInput = document.getElementById('local-currency-name');
        const nationalInput = document.getElementById('national-currency-name');
        if (localInput) localInput.value = names.local;
        if (nationalInput) nationalInput.value = names.national;
    },

    resetToDefaults: function() {
        this.saveConfig({ 
            categories: this.defaultCategories,
            currencyNames: this.defaultCurrencyNames
        });
    }
};