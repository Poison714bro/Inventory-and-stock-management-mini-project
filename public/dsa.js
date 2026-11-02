/**
 * Client-Side DSA Engine Fallback (Used when opening index.html directly as a local file)
 * Implements Product, CustomHashTable (Separate Chaining), ProductBST, and InventoryManager.
 */

class Product {
  constructor(id, name, category, quantity, price) {
    this.id = Number(id);
    this.name = String(name).trim();
    this.category = String(category).trim();
    this.quantity = Number(quantity);
    this.price = Number(price);
  }

  get totalValue() {
    return this.quantity * this.price;
  }
}

class HashNode {
  constructor(key, value, next = null) {
    this.key = Number(key);
    this.value = value;
    this.next = next;
  }
}

class CustomHashTable {
  constructor(capacity = 13) {
    this.capacity = capacity;
    this.buckets = new Array(capacity).fill(null);
    this.size = 0;
  }

  hash(key) {
    return Math.abs(Number(key)) % this.capacity;
  }

  put(key, product) {
    const k = Number(key);
    const index = this.hash(k);
    let cur = this.buckets[index];
    let steps = 0;

    while (cur !== null) {
      steps++;
      if (cur.key === k) {
        cur.value = product;
        return { updated: true, bucketIndex: index, chainSteps: steps };
      }
      cur = cur->next || cur.next;
    }

    const newNode = new HashNode(k, product, this.buckets[index]);
    this.buckets[index] = newNode;
    this.size++;
    return { updated: false, bucketIndex: index, chainSteps: 1 };
  }

  get(key) {
    const k = Number(key);
    const index = this.hash(k);
    let cur = this.buckets[index];
    let steps = 0;

    while (cur !== null) {
      steps++;
      if (cur.key === k) {
        return { found: true, product: cur.value, bucketIndex: index, chainSteps: steps };
      }
      cur = cur.next;
    }

    return { found: false, product: null, bucketIndex: index, chainSteps: steps };
  }

  remove(key) {
    const k = Number(key);
    const index = this.hash(k);
    let cur = this.buckets[index];
    let prev = null;
    let steps = 0;

    while (cur !== null) {
      steps++;
      if (cur.key === k) {
        if (prev === null) {
          this.buckets[index] = cur.next;
        } else {
          prev.next = cur.next;
        }
        this.size--;
        return { removed: true, product: cur.value, bucketIndex: index, chainSteps: steps };
      }
      prev = cur;
      cur = cur.next;
    }

    return { removed: false, product: null, bucketIndex: index, chainSteps: steps };
  }

  getBuckets() {
    const res = [];
    for (let i = 0; i < this.capacity; i++) {
      const items = [];
      let cur = this.buckets[i];
      while (cur !== null) {
        items.push({
          key: cur.key,
          name: cur.value ? cur.value.name : '',
          product: cur.value,
        });
        cur = cur.next;
      }
      res.push({
        index: i,
        count: items.length,
        hasCollision: items.length > 1,
        items,
      });
    }
    return res;
  }

  getCollisionStats() {
    let occupied = 0, collided = 0, overflow = 0;
    for (let i = 0; i < this.capacity; i++) {
      let len = 0;
      let cur = this.buckets[i];
      while (cur !== null) { len++; cur = cur.next; }
      if (len > 0) occupied++;
      if (len > 1) { collided++; overflow += (len - 1); }
    }
    return { capacity: this.capacity, size: this.size, occupiedBuckets: occupied, collidedBuckets: collided, overflowItems: overflow };
  }

  clear() {
    this.buckets = new Array(this.capacity).fill(null);
    this.size = 0;
  }
}

class BSTNode {
  constructor(product) {
    this.product = product;
    this.left = null;
    this.right = null;
  }
}

class ProductBST {
  constructor() {
    this.root = null;
    this.size = 0;
  }

  insert(product) {
    const id = product.id;
    if (!this.root) {
      this.root = new BSTNode(product);
      this.size++;
      return;
    }
    let cur = this.root;
    while (cur) {
      if (id === cur.product.id) {
        cur.product = product;
        return;
      } else if (id < cur.product.id) {
        if (!cur.left) { cur.left = new BSTNode(product); this.size++; return; }
        cur = cur.left;
      } else {
        if (!cur.right) { cur.right = new BSTNode(product); this.size++; return; }
        cur = cur.right;
      }
    }
  }

  delete(id) {
    const del = (node, key) => {
      if (!node) return null;
      if (key < node.product.id) {
        node.left = del(node.left, key);
        return node;
      } else if (key > node.product.id) {
        node.right = del(node.right, key);
        return node;
      } else {
        if (!node.left) return node.right;
        if (!node.right) return node.left;
        let succ = node.right;
        while (succ.left) succ = succ.left;
        node.product = succ.product;
        node.right = del(node.right, succ.product.id);
        return node;
      }
    };
    this.root = del(this.root, Number(id));
  }

  inOrderTraversal() {
    const res = [];
    const traverse = (n) => {
      if (!n) return;
      traverse(n.left);
      res.push(n.product);
      traverse(n.right);
    };
    traverse(this.root);
    return res;
  }

  clear() {
    this.root = null;
    this.size = 0;
  }
}

class InventoryManager {
  constructor(capacity = 13) {
    this.hashTable = new CustomHashTable(capacity);
    this.bst = new ProductBST();
  }

  addOrUpdate(id, name, category, quantity, price) {
    const numId = Number(id);
    const existing = this.hashTable.get(numId);
    if (existing.found) {
      existing.product.name = name;
      existing.product.category = category;
      existing.product.quantity = Number(quantity);
      existing.product.price = Number(price);
      return { action: 'UPDATE', bucketIndex: existing.bucketIndex, chainSteps: existing.chainSteps };
    } else {
      const p = new Product(numId, name, category, quantity, price);
      const ht = this.hashTable.put(numId, p);
      this.bst.insert(p);
      return { action: 'INSERT', bucketIndex: ht.bucketIndex, chainSteps: ht.chainSteps };
    }
  }

  searchById(id) {
    return this.hashTable.get(Number(id));
  }

  deleteById(id) {
    const numId = Number(id);
    this.hashTable.remove(numId);
    this.bst.delete(numId);
    return { success: true };
  }

  getSortedInventory() {
    return this.bst.inOrderTraversal();
  }

  getStats() {
    const items = this.getSortedInventory();
    let qty = 0, val = 0;
    items.forEach((p) => { qty += p.quantity; val += p.totalValue; });
    return { totalCount: items.length, totalQuantity: qty, totalValuation: val, hashStats: this.hashTable.getCollisionStats() };
  }

  loadSampleSeedData() {
    this.clear();
    const seeds = [
      { id: 105, name: 'AMD Ryzen 7 7800X3D', category: 'Processor', quantity: 14, price: 389.99 },
      { id: 101, name: 'NVIDIA GeForce RTX 4070 Super', category: 'Graphics Card', quantity: 8, price: 599.99 },
      { id: 118, name: 'Corsair Vengeance 32GB DDR5', category: 'RAM', quantity: 25, price: 119.50 },
      { id: 103, name: 'Samsung 990 Pro 2TB NVMe SSD', category: 'Storage', quantity: 30, price: 179.99 },
      { id: 114, name: 'Logitech G Pro X Superlight 2', category: 'Peripherals', quantity: 42, price: 159.00 },
      { id: 109, name: 'ASUS ROG Swift 27-inch OLED Monitor', category: 'Display', quantity: 5, price: 749.00 },
    ];
    seeds.forEach((s) => this.addOrUpdate(s.id, s.name, s.category, s.quantity, s.price));
  }

  clear() {
    this.hashTable.clear();
    this.bst.clear();
  }
}

if (typeof window !== 'undefined') {
  window.InventoryManager = InventoryManager;
}
