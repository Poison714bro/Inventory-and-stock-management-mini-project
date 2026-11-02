#ifndef INVENTORY_MANAGER_HPP
#define INVENTORY_MANAGER_HPP

#include <vector>
#include <string>
#include <sstream>
#include <iomanip>
#include <iostream>
#include "Product.hpp"
#include "CustomHashTable.hpp"
#include "ProductBST.hpp"

/**
 * InventoryManager Controller
 * Synchronizes CustomHashTable and ProductBST using identical Product* heap pointers.
 *
 * Search & Update: O(1) via Hash Table
 * Sorted Retrieval: O(n) via BST In-Order Traversal
 * Deletion: O(1) Hash Chain + O(log n) BST Delete (No linear vector scanning!)
 */
class InventoryManager {
private:
    CustomHashTable hashTable;
    ProductBST bst;

public:
    explicit InventoryManager(int hashCapacity = 13)
        : hashTable(hashCapacity) {}

    ~InventoryManager() {
        clear();
    }

    /**
     * Add or Update Product:
     * 1. Checks Hash Table in O(1) avg time.
     * 2. If exists: updates properties directly on shared Product*.
     * 3. If new: allocates Product*, inserts into both structures.
     */
    bool addOrUpdate(int id, const std::string& name, const std::string& category,
                     int quantity, double price, std::string& outAction,
                     int& outBucketIdx, int& outChainSteps) {
        Product* existing = hashTable.get(id, outBucketIdx, outChainSteps);

        if (existing != nullptr) {
            // O(1) in-place update on shared reference
            existing->name = name;
            existing->category = category;
            existing->quantity = quantity;
            existing->price = price;
            outAction = "UPDATE";
            return false;
        } else {
            // Insert into both data structures
            Product* newProduct = new Product(id, name, category, quantity, price);
            hashTable.put(id, newProduct, outBucketIdx, outChainSteps);
            bst.insert(newProduct);
            outAction = "INSERT";
            return true;
        }
    }

    /**
     * O(1) Average Search via Hash Table
     */
    Product* searchById(int id, int& outBucketIdx, int& outChainSteps) const {
        return hashTable.get(id, outBucketIdx, outChainSteps);
    }

    /**
     * Efficient Deletion:
     * Removes from Hash Table in O(1) returning the Product* pointer,
     * removes from BST in O(log n), and immediately frees heap memory.
     * ZERO linear vector searching!
     */
    bool deleteById(int id, int& outBucketIdx, int& outChainSteps) {
        Product* target = hashTable.remove(id, outBucketIdx, outChainSteps);
        if (target == nullptr) return false;

        bst.remove(id);
        delete target;
        return true;
    }

    /**
     * Returns products sorted by ID ascending via BST In-Order Traversal (O(n))
     */
    std::vector<Product*> getSortedInventory() const {
        return bst.inOrderTraversal();
    }

    CustomHashTable& getHashTable() { return hashTable; }
    const CustomHashTable& getHashTable() const { return hashTable; }
    const ProductBST& getBST() const { return bst; }

    void loadSampleSeedData() {
        clear();

        struct Seed {
            int id;
            std::string name;
            std::string category;
            int quantity;
            double price;
        };

        // Unsorted ID sequence ensuring collisions at size 13 table:
        // 105 % 13 = 1, 118 % 13 = 1 (Collision at Bucket 1)
        // 101 % 13 = 10, 114 % 13 = 10 (Collision at Bucket 10)
        std::vector<Seed> seeds = {
            {105, "AMD Ryzen 7 7800X3D", "Processor", 14, 389.99},
            {101, "NVIDIA GeForce RTX 4070 Super", "Graphics Card", 8, 599.99},
            {118, "Corsair Vengeance 32GB DDR5", "RAM", 25, 119.50},
            {103, "Samsung 990 Pro 2TB NVMe SSD", "Storage", 30, 179.99},
            {114, "Logitech G Pro X Superlight 2", "Peripherals", 42, 159.00},
            {109, "ASUS ROG Swift 27\" OLED Monitor", "Display", 5, 749.00}
        };

        std::string action;
        int bucket, steps;
        for (const auto& s : seeds) {
            addOrUpdate(s.id, s.name, s.category, s.quantity, s.price, action, bucket, steps);
        }
    }

    std::string getInventoryJson() const {
        std::vector<Product*> items = getSortedInventory();
        std::ostringstream ss;
        ss << "[";
        for (size_t i = 0; i < items.size(); ++i) {
            if (i > 0) ss << ",";
            ss << items[i]->toJson();
        }
        ss << "]";
        return ss.str();
    }

    std::string getStatsJson() const {
        std::vector<Product*> items = getSortedInventory();
        int totalUnits = 0;
        double totalValuation = 0.0;
        int lowStockCount = 0;

        for (Product* p : items) {
            totalUnits += p->quantity;
            totalValuation += p->getTotalValue();
            if (p->quantity < 10) lowStockCount++;
        }

        int occupied = 0, collided = 0, overflow = 0;
        hashTable.getCollisionStats(occupied, collided, overflow);

        std::ostringstream ss;
        ss << std::fixed << std::setprecision(2);
        ss << "{"
           << "\"totalCount\":" << items.size() << ","
           << "\"totalQuantity\":" << totalUnits << ","
           << "\"totalValuation\":" << totalValuation << ","
           << "\"lowStockCount\":" << lowStockCount << ","
           << "\"occupiedBuckets\":" << occupied << ","
           << "\"collidedBuckets\":" << collided << ","
           << "\"overflowItems\":" << overflow << ","
           << "\"treeHeight\":" << bst.getHeight() << ","
           << "\"hashCapacity\":" << hashTable.getCapacity()
           << "}";
        return ss.str();
    }

    void clear() {
        hashTable.clear(true); // Frees all Product* heap instances
        bst.clear();           // Frees all BSTNode instances
    }
};

#endif // INVENTORY_MANAGER_HPP
