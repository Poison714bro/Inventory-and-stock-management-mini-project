/**
 * Inventory & Stock Management System - Data Structures Core
 * -------------------------------------------------------------
 * Custom implementations of:
 * 1. Product (Data Entity)
 * 2. HashNode & CustomHashTable (O(1) Lookup via Separate Chaining)
 * 3. BSTNode & ProductBST (O(n) Ordered Retrieval via In-Order Traversal)
 * 4. InventoryManager (Synchronizes both structures using identical references)
 *
 * NOTE: Intentionally implemented from scratch without Map, Set, or Array.sort()
 * to satisfy academic evaluation and viva requirements.
 */

/**
 * 1. Product Entity
 */
class Product {
  constructor(id, name, category, quantity, price) {
    this.id = Number(id);
    this.name = String(name).trim();
    this.category = String(category).trim();
    this.quantity = Number(quantity);
    this.price = Number(price);
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  get totalValue() {
    return this.quantity * this.price;
  }
}

/**
 * 2. Hash Table Supporting Node (Separate Chaining Singly-Linked List)
 */
class HashNode {
  constructor(key, value, next = null) {
    this.key = Number(key);
    this.value = value; // Points to Product instance
    this.next = next;
  }
}

/**
 * Custom Hash Table with Fixed Capacity and Separate Chaining
 */
class CustomHashTable {
  constructor(capacity = 13) {
    this.capacity = capacity;
    this.buckets = new Array(capacity).fill(null);
    this.size = 0;
  }

  /**
   * Modulo Hash Function: h(k) = |k| % capacity
   */
  hash(key) {
    const numericKey = Math.abs(Number(key));
    return numericKey % this.capacity;
  }

  /**
   * Inserts or updates a product in the hash table.
   * If key exists, updates the value in-place in O(1) avg time.
   * If key is new, prepends node to chain in O(1) time.
   */
  put(key, product) {
    const k = Number(key);
    const index = this.hash(k);
    let current = this.buckets[index];
    let chainSteps = 0;

    // Check if key already exists in the chain
    while (current !== null) {
      chainSteps++;
      if (current.key === k) {
        current.value = product;
        return {
          updated: true,
          bucketIndex: index,
          chainSteps,
          chainLength: this.getChainLength(index),
        };
      }
      current = current.next;
    }

    // Key does not exist: prepend new node to the bucket's linked list (O(1))
    const newNode = new HashNode(k, product, this.buckets[index]);
    this.buckets[index] = newNode;
    this.size++;

    return {
      updated: false,
      bucketIndex: index,
      chainSteps: 1,
      chainLength: this.getChainLength(index),
    };
  }

  /**
   * Searches for a product by key in O(1) average time.
   * Returns search result with diagnostics (bucketIndex and chainSteps).
   */
  get(key) {
    const k = Number(key);
    const index = this.hash(k);
    let current = this.buckets[index];
    let chainSteps = 0;

    while (current !== null) {
      chainSteps++;
      if (current.key === k) {
        return {
          found: true,
          product: current.value,
          bucketIndex: index,
          chainSteps,
          chainLength: this.getChainLength(index),
        };
      }
      current = current.next;
    }

    return {
      found: false,
      product: null,
      bucketIndex: index,
      chainSteps,
      chainLength: this.getChainLength(index),
    };
  }

  /**
   * Removes a product by key from the separate chaining linked list.
   */
  remove(key) {
    const k = Number(key);
    const index = this.hash(k);
    let current = this.buckets[index];
    let prev = null;
    let chainSteps = 0;

    while (current !== null) {
      chainSteps++;
      if (current.key === k) {
        const removedProduct = current.value;
        if (prev === null) {
          this.buckets[index] = current.next;
        } else {
          prev.next = current.next;
        }
        this.size--;
        return {
          removed: true,
          product: removedProduct,
          bucketIndex: index,
          chainSteps,
          chainLength: this.getChainLength(index),
        };
      }
      prev = current;
      current = current.next;
    }

    return {
      removed: false,
      product: null,
      bucketIndex: index,
      chainSteps,
      chainLength: this.getChainLength(index),
    };
  }

  /**
   * Helper to compute chain length at a specific bucket
   */
  getChainLength(index) {
    let count = 0;
    let current = this.buckets[index];
    while (current !== null) {
      count++;
      current = current.next;
    }
    return count;
  }

  /**
   * Returns snapshot of all buckets for UI visualization.
   */
  getBuckets() {
    const result = [];
    for (let i = 0; i < this.capacity; i++) {
      const items = [];
      let current = this.buckets[i];
      while (current !== null) {
        items.push({
          key: current.key,
          product: current.value,
        });
        current = current.next;
      }
      result.push({
        index: i,
        count: items.length,
        hasCollision: items.length > 1,
        items,
      });
    }
    return result;
  }

  /**
   * Returns collision count (any bucket with > 1 element contributes to collisions)
   */
  getCollisionStats() {
    let collidedBuckets = 0;
    let overflowItems = 0;
    let occupiedBuckets = 0;

    for (let i = 0; i < this.capacity; i++) {
      const len = this.getChainLength(i);
      if (len > 0) occupiedBuckets++;
      if (len > 1) {
        collidedBuckets++;
        overflowItems += len - 1;
      }
    }

    return {
      capacity: this.capacity,
      size: this.size,
      occupiedBuckets,
      collidedBuckets,
      overflowItems,
      loadFactor: Number((this.size / this.capacity).toFixed(2)),
    };
  }

  clear() {
    this.buckets = new Array(this.capacity).fill(null);
    this.size = 0;
  }
}

/**
 * 3. Binary Search Tree Supporting Node
 */
class BSTNode {
  constructor(product) {
    this.product = product; // Points to Product instance
    this.left = null;
    this.right = null;
  }
}

/**
 * Binary Search Tree for Ordered Product Storage by ID
 */
class ProductBST {
  constructor() {
    this.root = null;
    this.size = 0;
  }

  /**
   * Inserts a product ordered by product.id.
   * If ID matches an existing node, updates product reference.
   */
  insert(product) {
    const id = product.id;

    if (!this.root) {
      this.root = new BSTNode(product);
      this.size++;
      return { inserted: true, depth: 1 };
    }

    let current = this.root;
    let depth = 1;

    while (current) {
      depth++;
      if (id === current.product.id) {
        current.product = product;
        return { updated: true, depth };
      } else if (id < current.product.id) {
        if (current.left === null) {
          current.left = new BSTNode(product);
          this.size++;
          return { inserted: true, depth };
        }
        current = current.left;
      } else {
        if (current.right === null) {
          current.right = new BSTNode(product);
          this.size++;
          return { inserted: true, depth };
        }
        current = current.right;
      }
    }
  }

  /**
   * Deletes a node by ID handling all 3 cases:
   * 1. Node with no child (Leaf)
   * 2. Node with 1 child
   * 3. Node with 2 children (Replaced with In-Order Successor)
   */
  delete(id) {
    const targetId = Number(id);
    let deletedProduct = null;

    const deleteNode = (node, key) => {
      if (node === null) {
        return null;
      }

      if (key < node.product.id) {
        node.left = deleteNode(node.left, key);
        return node;
      } else if (key > node.product.id) {
        node.right = deleteNode(node.right, key);
        return node;
      } else {
        // Node found!
        deletedProduct = node.product;

        // Case 1 & 2: Leaf or Single Child
        if (node.left === null) {
          return node.right;
        } else if (node.right === null) {
          return node.left;
        }

        // Case 3: Two Children
        // Find In-Order Successor (minimum node in the right subtree)
        const successor = this.findMinNode(node.right);
        node.product = successor.product;
        // Delete the in-order successor from right subtree
        node.right = deleteNode(node.right, successor.product.id);
        return node;
      }
    };

    this.root = deleteNode(this.root, targetId);

    if (deletedProduct) {
      this.size--;
      return { deleted: true, product: deletedProduct };
    }

    return { deleted: false, product: null };
  }

  /**
   * Helper to find minimum node in a given subtree
   */
  findMinNode(node) {
    let current = node;
    while (current.left !== null) {
      current = current.left;
    }
    return current;
  }

  /**
   * In-Order Traversal (Left -> Root -> Right)
   * Generates a sorted ascending array of products without Array.sort()!
   */
  inOrderTraversal() {
    const sortedProducts = [];

    const traverse = (node) => {
      if (node === null) return;
      traverse(node.left);
      sortedProducts.push(node.product);
      traverse(node.right);
    };

    traverse(this.root);
    return sortedProducts;
  }

  /**
   * Computes the height of the BST
   */
  getHeight(node = this.root) {
    if (node === null) return 0;
    return 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
  }

  /**
   * Returns a nested tree structure for interactive visual rendering
   */
  getVisualTree(node = this.root) {
    if (node === null) return null;
    return {
      id: node.product.id,
      name: node.product.name,
      category: node.product.category,
      left: this.getVisualTree(node.left),
      right: this.getVisualTree(node.right),
      isLeaf: node.left === null && node.right === null,
    };
  }

  clear() {
    this.root = null;
    this.size = 0;
  }
}

/**
 * 4. InventoryManager Controller
 * Synchronizes CustomHashTable and ProductBST using the SAME object references.
 */
class InventoryManager {
  constructor(hashCapacity = 13) {
    this.hashTable = new CustomHashTable(hashCapacity);
    this.bst = new ProductBST();
    this.operationHistory = [];
  }

  /**
   * Add or Update Stock Item:
   * 1. Checks Hash Table in O(1) avg time.
   * 2. If exists, updates quantity/price on the shared Product reference.
   * 3. If new, inserts into both Hash Table and BST.
   */
  addOrUpdate(id, name, category, quantity, price) {
    const numericId = Number(id);
    const existing = this.hashTable.get(numericId);

    if (existing.found) {
      // O(1) in-place update on shared reference
      const product = existing.product;
      const prevQty = product.quantity;
      const prevPrice = product.price;

      product.name = String(name).trim();
      product.category = String(category).trim();
      product.quantity = Number(quantity);
      product.price = Number(price);
      product.updatedAt = new Date();

      const log = {
        type: 'UPDATE',
        component: 'HASH_TABLE',
        summary: `Updated Product ID #${numericId} (${product.name}) in-place`,
        details: `Qty: ${prevQty} → ${product.quantity}, Price: $${prevPrice.toFixed(2)} → $${product.price.toFixed(2)}`,
        complexity: 'O(1) Hash Table Lookup & Mutate',
        bucketIndex: existing.bucketIndex,
        chainSteps: existing.chainSteps,
        timestamp: new Date(),
      };
      this.logOperation(log);

      return {
        action: 'UPDATE',
        product,
        bucketIndex: existing.bucketIndex,
        chainSteps: existing.chainSteps,
        log,
      };
    } else {
      // New product: instantiate and insert into both
      const newProduct = new Product(numericId, name, category, quantity, price);

      const htRes = this.hashTable.put(numericId, newProduct);
      const bstRes = this.bst.insert(newProduct);

      const log = {
        type: 'INSERT',
        component: 'DUAL_SYNC',
        summary: `Inserted new Product ID #${numericId} ("${newProduct.name}")`,
        details: `Bucket [${htRes.bucketIndex}] (Chain len: ${htRes.chainLength}) & BST (Depth: ${bstRes.depth})`,
        complexity: 'O(1) Hash Insert + O(log n) BST Insert',
        bucketIndex: htRes.bucketIndex,
        chainSteps: htRes.chainSteps,
        timestamp: new Date(),
      };
      this.logOperation(log);

      return {
        action: 'INSERT',
        product: newProduct,
        bucketIndex: htRes.bucketIndex,
        chainLength: htRes.chainLength,
        depth: bstRes.depth,
        log,
      };
    }
  }

  /**
   * Fast Product Lookup by ID via Hash Table in O(1) average time
   */
  searchById(id) {
    const numericId = Number(id);
    const result = this.hashTable.get(numericId);

    const log = {
      type: 'SEARCH',
      component: 'HASH_TABLE',
      summary: result.found
        ? `Found Product ID #${numericId} ("${result.product.name}")`
        : `Product ID #${numericId} not found in inventory`,
      details: `Bucket [${result.bucketIndex}], Traversed ${result.chainSteps} chain step(s)`,
      complexity: 'O(1) Average Time',
      bucketIndex: result.bucketIndex,
      chainSteps: result.chainSteps,
      found: result.found,
      timestamp: new Date(),
    };
    this.logOperation(log);

    return {
      ...result,
      log,
    };
  }

  /**
   * Deletes a product from both Hash Table and BST
   */
  deleteById(id) {
    const numericId = Number(id);

    const htResult = this.hashTable.remove(numericId);
    const bstResult = this.bst.delete(numericId);

    const product = htResult.product || bstResult.product;
    const success = htResult.removed || bstResult.deleted;

    const log = {
      type: 'DELETE',
      component: 'DUAL_SYNC',
      summary: success
        ? `Deleted Product ID #${numericId} ("${product ? product.name : 'Unknown'}")`
        : `Cannot delete: Product ID #${numericId} does not exist`,
      details: success
        ? `Removed from Bucket [${htResult.bucketIndex}] & BST re-balanced (Successor handling applied)`
        : `No items matched ID #${numericId}`,
      complexity: 'O(1) Hash Chain Delete + O(log n) BST Delete',
      bucketIndex: htResult.bucketIndex,
      chainSteps: htResult.chainSteps,
      success,
      timestamp: new Date(),
    };
    this.logOperation(log);

    return {
      success,
      product,
      bucketIndex: htResult.bucketIndex,
      chainSteps: htResult.chainSteps,
      log,
    };
  }

  /**
   * Returns inventory sorted in ascending order of ID via BST in-order traversal
   */
  getSortedInventory() {
    return this.bst.inOrderTraversal();
  }

  /**
   * Aggregates live system statistics
   */
  getStats() {
    const items = this.getSortedInventory();
    const totalCount = items.length;
    let totalQuantity = 0;
    let totalValuation = 0;
    let lowStockCount = 0;

    for (let i = 0; i < items.length; i++) {
      totalQuantity += items[i].quantity;
      totalValuation += items[i].totalValue;
      if (items[i].quantity < 10) {
        lowStockCount++;
      }
    }

    const hashStats = this.hashTable.getCollisionStats();
    const treeHeight = this.bst.getHeight();

    return {
      totalCount,
      totalQuantity,
      totalValuation,
      lowStockCount,
      treeHeight,
      hashStats,
    };
  }

  logOperation(entry) {
    this.operationHistory.unshift(entry);
    if (this.operationHistory.length > 20) {
      this.operationHistory.pop();
    }
  }

  getRecentLogs(limit = 6) {
    return this.operationHistory.slice(0, limit);
  }

  /**
   * Pre-populates 6 tech inventory items in UNSORTED ID order:
   * 105, 101, 118, 103, 114, 109
   * Demonstrates:
   * - Collision at Bucket 1 (105 % 13 = 1, 118 % 13 = 1)
   * - Collision at Bucket 10 (101 % 13 = 10, 114 % 13 = 10)
   * - Clean BST structure with root 105
   */
  loadSampleSeedData() {
    this.clear();

    const seedItems = [
      { id: 105, name: 'AMD Ryzen 7 7800X3D', category: 'Processor', quantity: 14, price: 389.99 },
      { id: 101, name: 'NVIDIA GeForce RTX 4070 Super', category: 'Graphics Card', quantity: 8, price: 599.99 },
      { id: 118, name: 'Corsair Vengeance 32GB DDR5', category: 'RAM', quantity: 25, price: 119.50 },
      { id: 103, name: 'Samsung 990 Pro 2TB NVMe SSD', category: 'Storage', quantity: 30, price: 179.99 },
      { id: 114, name: 'Logitech G Pro X Superlight 2', category: 'Peripherals', quantity: 42, price: 159.00 },
      { id: 109, name: 'ASUS ROG Swift 27" OLED Monitor', category: 'Display', quantity: 5, price: 749.00 },
    ];

    seedItems.forEach((item) => {
      this.addOrUpdate(item.id, item.name, item.category, item.quantity, item.price);
    });

    return seedItems.length;
  }

  clear() {
    this.hashTable.clear();
    this.bst.clear();
    this.operationHistory = [];
  }
}

// Export for Node testing or browser window attachment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Product,
    HashNode,
    CustomHashTable,
    BSTNode,
    ProductBST,
    InventoryManager,
  };
} else if (typeof window !== 'undefined') {
  window.Product = Product;
  window.HashNode = HashNode;
  window.CustomHashTable = CustomHashTable;
  window.BSTNode = BSTNode;
  window.ProductBST = ProductBST;
  window.InventoryManager = InventoryManager;
}
