#ifndef CUSTOM_HASH_TABLE_HPP
#define CUSTOM_HASH_TABLE_HPP

#include <vector>
#include <iostream>
#include <sstream>
#include <cmath>
#include "Product.hpp"

/**
 * Singly-Linked List Node for Separate Chaining
 */
class HashNode {
public:
    int key;
    Product* value; // Points to shared Product instance
    HashNode* next;

    HashNode(int key, Product* value, HashNode* next = nullptr)
        : key(key), value(value), next(next) {}
};

/**
 * Custom Hash Table with Fixed Capacity (13) and Separate Chaining
 * Provides O(1) average lookup, insertion, and update.
 */
class CustomHashTable {
private:
    int capacity;
    int size;
    std::vector<HashNode*> buckets;

public:
    explicit CustomHashTable(int capacity = 13)
        : capacity(capacity), size(0), buckets(capacity, nullptr) {}

    ~CustomHashTable() {
        clear();
    }

    /**
     * Modulo Hash Function: h(k) = |k| % capacity
     */
    int hash(int key) const {
        return std::abs(key) % capacity;
    }

    int getCapacity() const { return capacity; }
    int getSize() const { return size; }

    /**
     * Inserts or updates a product in the hash table.
     * If key exists, updates product pointer in O(1).
     * If key is new, prepends node to chain in O(1).
     */
    bool put(int key, Product* product, int& outBucketIdx, int& outChainSteps) {
        outBucketIdx = hash(key);
        HashNode* current = buckets[outBucketIdx];
        outChainSteps = 0;

        // Check if key already exists in this chain
        while (current != nullptr) {
            outChainSteps++;
            if (current->key == key) {
                current->value = product; // In-place update
                return false; // Existing updated
            }
            current = current->next;
        }

        // Key not found: prepend new node to bucket head in O(1)
        HashNode* newNode = new HashNode(key, product, buckets[outBucketIdx]);
        buckets[outBucketIdx] = newNode;
        size++;
        outChainSteps = 1;
        return true; // Newly inserted
    }

    /**
     * Searches for product by key in O(1) average time.
     */
    Product* get(int key, int& outBucketIdx, int& outChainSteps) const {
        outBucketIdx = hash(key);
        HashNode* current = buckets[outBucketIdx];
        outChainSteps = 0;

        while (current != nullptr) {
            outChainSteps++;
            if (current->key == key) {
                return current->value;
            }
            current = current->next;
        }

        return nullptr; // Not found
    }

    /**
     * Removes product by key from the separate chaining linked list.
     */
    bool remove(int key, int& outBucketIdx, int& outChainSteps) {
        outBucketIdx = hash(key);
        HashNode* current = buckets[outBucketIdx];
        HashNode* prev = nullptr;
        outChainSteps = 0;

        while (current != nullptr) {
            outChainSteps++;
            if (current->key == key) {
                if (prev == nullptr) {
                    buckets[outBucketIdx] = current->next;
                } else {
                    prev->next = current->next;
                }
                delete current;
                size--;
                return true;
            }
            prev = current;
            current = current->next;
        }

        return false; // Not found
    }

    int getChainLength(int bucketIdx) const {
        if (bucketIdx < 0 || bucketIdx >= capacity) return 0;
        int count = 0;
        HashNode* cur = buckets[bucketIdx];
        while (cur != nullptr) {
            count++;
            cur = cur->next;
        }
        return count;
    }

    void getCollisionStats(int& occupied, int& collided, int& overflow) const {
        occupied = 0;
        collided = 0;
        overflow = 0;
        for (int i = 0; i < capacity; i++) {
            int len = getChainLength(i);
            if (len > 0) occupied++;
            if (len > 1) {
                collided++;
                overflow += (len - 1);
            }
        }
    }

    void printBuckets() const {
        std::cout << "\n=== Hash Table Buckets (Capacity: " << capacity << ") ===\n";
        for (int i = 0; i < capacity; i++) {
            std::cout << "Bucket [" << i << "]: ";
            HashNode* cur = buckets[i];
            if (!cur) {
                std::cout << "NULL (Empty)\n";
            } else {
                while (cur != nullptr) {
                    std::cout << "[#" << cur->key << ": " << cur->value->name << "] -> ";
                    cur = cur->next;
                }
                std::cout << "NULL\n";
            }
        }
    }

    std::string getBucketsJson() const {
        std::ostringstream ss;
        ss << "[";
        for (int i = 0; i < capacity; i++) {
            if (i > 0) ss << ",";
            int len = getChainLength(i);
            ss << "{"
               << "\"index\":" << i << ","
               << "\"count\":" << len << ","
               << "\"hasCollision\":" << (len > 1 ? "true" : "false") << ","
               << "\"items\":[";

            HashNode* cur = buckets[i];
            bool first = true;
            while (cur != nullptr) {
                if (!first) ss << ",";
                ss << "{\"key\":" << cur->key << ",\"name\":\"" << Product::escapeJson(cur->value->name) << "\"}";
                first = false;
                cur = cur->next;
            }
            ss << "]}";
        }
        ss << "]";
        return ss.str();
    }

    void clear() {
        for (int i = 0; i < capacity; i++) {
            HashNode* cur = buckets[i];
            while (cur != nullptr) {
                HashNode* next = cur->next;
                delete cur;
                cur = next;
            }
            buckets[i] = nullptr;
        }
        size = 0;
    }
};

#endif // CUSTOM_HASH_TABLE_HPP
