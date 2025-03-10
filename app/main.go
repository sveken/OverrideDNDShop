package main

import (
	"embed"
	"encoding/json"
	"html/template"
	"log"
	"net/http"
	"strings"
)

//go:embed templates
var content embed.FS

type Item struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Price       string `json:"price"`
	Category    string `json:"category"` // Small, Medium, Large
	Market      string `json:"market"`   // Day or Black
	Cooldown    int    `json:"cooldown"` // Current cooldown counter
}

type CategoryConfig struct {
	Name         string `json:"name"`
	CooldownDays int    `json:"cooldownDays"`
}

// Global configuration
var config = struct {
	Categories []CategoryConfig
}{
	Categories: []CategoryConfig{
		{Name: "Small", CooldownDays: 2},
		{Name: "Medium", CooldownDays: 3},
		{Name: "Large", CooldownDays: 5},
	},
}

var itemStore = &ItemStore{
	items: []Item{},
}

type ItemStore struct {
	items []Item
}

func (store *ItemStore) getItems() []Item {
	return store.items
}

func (store *ItemStore) addItem(item Item) {
	store.items = append(store.items, item)
}

func (store *ItemStore) deleteItem(id string) {
	for i, item := range store.items {
		if item.ID == id {
			store.items = append(store.items[:i], store.items[i+1:]...)
			return
		}
	}
}

func (store *ItemStore) applyCooldown(id string, cooldown int) {
	for i, item := range store.items {
		if item.ID == id {
			store.items[i].Cooldown = cooldown
			return
		}
	}
}

func (store *ItemStore) decrementCooldowns() {
	for i, item := range store.items {
		if item.Cooldown > 0 {
			store.items[i].Cooldown--
		}
	}
}

func titleCase(s string) string {
	return strings.Title(s)
}

func main() {

	// Create HTTP server
	mux := http.NewServeMux()

	// Static files
	staticFileServer := http.FileServer(http.FS(content))
	mux.Handle("/static/", staticFileServer)

	// Routes
	mux.HandleFunc("/", handleIndex)
	mux.HandleFunc("/add-item", handleAddItem)
	mux.HandleFunc("/delete-item", handleDeleteItem)
	mux.HandleFunc("/generate-shop", handleGenerateShop)
	mux.HandleFunc("/buy-item", handleBuyItem)
	mux.HandleFunc("/config", handleConfig)
	mux.HandleFunc("/export", handleExport)
	mux.HandleFunc("/import", handleImport)

	// Start server
	log.Println("Starting server on :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}

func handleIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}

	tmpl, err := template.ParseFS(content, "templates/index.html", "templates/base.html", "templates/items-table.html")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Don't pass any items - they will be loaded from localStorage client-side
	if err := tmpl.ExecuteTemplate(w, "base", nil); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleAddItem(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse the form
	if err := r.ParseForm(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Just return success - actual item storage is handled client-side
	w.WriteHeader(http.StatusOK)
}

func handleDeleteItem(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse the form data
	if err := r.ParseForm(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Just return success - actual deletion is handled client-side
	w.WriteHeader(http.StatusOK)
}

func handleGenerateShop(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	market := r.FormValue("market")
	if market != "day" && market != "black" {
		market = "day" // Default
	}

	// Parse all required templates
	tmpl, err := template.New("base").Funcs(template.FuncMap{
		"title": titleCase,
	}).ParseFS(content, "templates/base.html", "templates/generated-shop.html")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data := struct {
		Market string
	}{
		Market: market,
	}

	// Execute the base template - items are loaded client-side
	if err := tmpl.ExecuteTemplate(w, "base", data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func getAvailableItems(market string) []Item {
	items := itemStore.getItems()
	availableItems := []Item{}

	for _, item := range items {
		if item.Market == market && item.Cooldown == 0 {
			availableItems = append(availableItems, item)
		}
	}

	log.Printf("Available items for market %s: %+v", market, availableItems)

	return availableItems
}

func handleBuyItem(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Just return success - cooldowns are handled client-side
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Item cooldown applied"))
}

func handleConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(config)
		return
	}

	if r.Method == http.MethodPost {
		var newConfig struct {
			Categories []CategoryConfig `json:"categories"`
		}

		if err := json.NewDecoder(r.Body).Decode(&newConfig); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		config.Categories = newConfig.Categories
		w.WriteHeader(http.StatusOK)
		return
	}

	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}

func handleExport(w http.ResponseWriter, r *http.Request) {
	// This is just a placeholder, actual export happens client-side
	// We'll provide JS functions to export from localStorage to a file
	w.Write([]byte("Export initiated"))
}

func handleImport(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// This is just a placeholder, actual import happens client-side
	// We'll provide JS functions to import from a file to localStorage
	w.Write([]byte("Import successful"))
}
