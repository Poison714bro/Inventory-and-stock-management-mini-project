#ifndef PRODUCT_BST_HPP
#define PRODUCT_BST_HPP

#include <vector>
#include <iostream>
#include <algorithm>
#include "Product.hpp"

/**
 * Binary Search Tree Node
 */
class BSTNode {
public:
    Product* product; // Points to shared Product instance
    BSTNode* left;
    BSTNode* right;

    explicit BSTNode(Product* product)
        : product(product), left(nullptr), right(nullptr) {}
};

/**
 * Binary Search Tree for Ordered Product Storage by ID
 * Implements standard BST Insertion, 3-Case Deletion (In-Order Successor),
 * and In-Order Traversal (O(n) sorted output).
 */
class ProductBST {
private:
    BSTNode* root;
    int size;

    BSTNode* insertRecursive(BSTNode* node, Product* product, bool& inserted) {
        if (node == nullptr) {
            inserted = true;
            size++;
            return new BSTNode(product);
        }

        if (product->id < node->product->id) {
            node->left = insertRecursive(node->left, product, inserted);
        } else if (product->id > node->product->id) {
            node->right = insertRecursive(node->right, product, inserted);
        } else {
            // ID already exists: update product pointer in-place
            node->product = product;
            inserted = false;
        }

        return node;
    }

    BSTNode* findMinNode(BSTNode* node) const {
        BSTNode* current = node;
        while (current != nullptr && current->left != nullptr) {
            current = current->left;
        }
        return current;
    }

    BSTNode* deleteRecursive(BSTNode* node, int id, bool& deleted) {
        if (node == nullptr) {
            return nullptr;
        }

        if (id < node->product->id) {
            node->left = deleteRecursive(node->left, id, deleted);
        } else if (id > node->product->id) {
            node->right = deleteRecursive(node->right, id, deleted);
        } else {
            // Node found!
            deleted = true;

            // Case 1 & 2: Leaf or single child
            if (node->left == nullptr) {
                BSTNode* temp = node->right;
                delete node;
                size--;
                return temp;
            } else if (node->right == nullptr) {
                BSTNode* temp = node->left;
                delete node;
                size--;
                return temp;
            }

            // Case 3: Two children
            // Find In-Order Successor (minimum node in right subtree)
            BSTNode* successor = findMinNode(node->right);
            node->product = successor->product;
            // Delete successor from right subtree
            node->right = deleteRecursive(node->right, successor->product->id, deleted);
        }

        return node;
    }

    void inOrderRecursive(BSTNode* node, std::vector<Product*>& result) const {
        if (node == nullptr) return;
        inOrderRecursive(node->left, result);
        result.push_back(node->product);
        inOrderRecursive(node->right, result);
    }

    int getHeightRecursive(BSTNode* node) const {
        if (node == nullptr) return 0;
        return 1 + std::max(getHeightRecursive(node->left), getHeightRecursive(node->right));
    }

    void clearRecursive(BSTNode* node) {
        if (node == nullptr) return;
        clearRecursive(node->left);
        clearRecursive(node->right);
        delete node;
    }

public:
    ProductBST() : root(nullptr), size(0) {}

    ~ProductBST() {
        clear();
    }

    bool insert(Product* product) {
        bool inserted = false;
        root = insertRecursive(root, product, inserted);
        return inserted;
    }

    bool remove(int id) {
        bool deleted = false;
        root = deleteRecursive(root, id, deleted);
        return deleted;
    }

    /**
     * In-Order Traversal (Left -> Root -> Right)
     * Returns products strictly sorted ascending by ID in O(n) time.
     */
    std::vector<Product*> inOrderTraversal() const {
        std::vector<Product*> result;
        inOrderRecursive(root, result);
        return result;
    }

    int getHeight() const {
        return getHeightRecursive(root);
    }

    int getSize() const {
        return size;
    }

    void clear() {
        clearRecursive(root);
        root = nullptr;
        size = 0;
    }
};

#endif // PRODUCT_BST_HPP
