# 📦 Inventory and Stock Management System (DSA Mini Project)

A lightweight, high-performance, single-page web application demonstrating core **Data Structures & Algorithms (DSA)** principles:
- **Instant Search ($O(1)$ Average)** via custom **Hash Table** with Separate Chaining.
- **Ordered Product Storage ($O(n)$ In-Order Traversal)** via custom **Binary Search Tree (BST)**.
- **Synchronized Shared Memory Architecture**: Both structures point to the exact same `Product` instance in heap memory.

---

## 🚀 Key Features

1. **Custom Data Structures from Scratch (`dsa.js`)**:
   - **`Product`**: Models inventory entity (`id`, `name`, `category`, `quantity`, `price`, `createdAt`, `updatedAt`).
   - **`CustomHashTable`**: Fixed array of 13 buckets with prime-modulo hashing ($h(k) = |k| \pmod{13}$) and separate chaining (singly-linked list).
   - **`ProductBST`**: Binary Search Tree ordered by `product.id`. Implements insertion, 3-case deletion (leaf, 1 child, 2 children using in-order successor), and sorted in-order traversal ($O(n)$) without built-in sorting.
   - **`InventoryManager`**: Synchronizes both data structures so additions, lookups, in-place updates, and deletions reflect consistently across both engines.

2. **Interactive UI & Visualizers (`index.html`, `style.css`, `app.js`)**:
   - **Instant Search Card ($O(1)$)**: Diagnostic breakdown displaying target bucket index, chain traversal steps, and equation $h(\text{id})$.
   - **Live Sorted Inventory Table**: Displays products in ascending order strictly via BST In-Order Walk (Left $\rightarrow$ Root $\rightarrow$ Right).
   - **Hash Table Bucket Inspector**: Visualizes all 13 buckets with linked list arrows (`-> [ID] -> NULL`) and glowing collision badges.
   - **BST Tree Hierarchy & SVG Graph**: Renders the dynamic binary search tree hierarchy and in-order traversal path.
   - **Live Terminal Log**: Tracks the last operations with time complexity notations ($O(1)$, $O(\log n)$, $O(n)$).
   - **Theme Support**: Seamless Dark/Light mode toggle with `localStorage` persistence.

---

## 📊 Time Complexity Matrix

| Operation | Primary Structure | Average Case | Worst Case (Degenerate) | Notes |
|---|---|---|---|---|
| **Lookup / Search** | Hash Table | $\mathbf{O(1)}$ | $O(k)$ (chain length) | Modulo indexing + chain traversal |
| **In-Place Update** | Hash Table | $\mathbf{O(1)}$ | $O(k)$ | Updates shared `Product` object directly |
| **Insert New Product**| Hash Table + BST | $\mathbf{O(1) + O(\log n)}$ | $O(n)$ | Added to bucket head + placed in BST |
| **Sorted Retrieval** | BST In-Order | $\mathbf{O(n)}$ | $O(n)$ | Yields sorted array without `Array.sort()` |
| **Delete Product** | Hash Table + BST | $\mathbf{O(1) + O(\log n)}$ | $O(n)$ | Linked list splice + BST successor swap |

---

## 🧪 Pre-Populated Seed Data & Collisions

On load, the system seeds 6 items in **unsorted ID order**:
`105, 101, 118, 103, 114, 109`

Modulo 13 distribution:
- **Bucket 1**: `#105` ($105 \pmod{13} = 1$) & `#118` ($118 \pmod{13} = 1$) $\rightarrow$ **Collision chained!**
- **Bucket 5**: `#109` ($109 \pmod{13} = 5$)
- **Bucket 10**: `#101` ($101 \pmod{13} = 10$) & `#114` ($114 \pmod{13} = 10$) $\rightarrow$ **Collision chained!**
- **Bucket 12**: `#103` ($103 \pmod{13} = 12$)

**BST Root**: `#105`, resulting in balanced left and right subtrees. In-order traversal yields:
`101 → 103 → 105 → 109 → 114 → 118`.

---

## 💻 How to Run Locally

You can run this project in two ways:

### Option 1: Direct File (No install required)
Simply double-click [`index.html`](file:///c:/Users/Pushkar/OneDrive/Desktop/ADS%20mini%20project/index.html) or open it in any modern browser (Chrome, Edge, Firefox, Brave, Safari).

### Option 2: Local HTTP Server (Python)
```bash
# In the project directory:
python -m http.server 5500
```
Then visit [http://localhost:5500](http://localhost:5500) in your browser.

---

## 🎓 Academic Viva Questions & Answers

1. **Why use both a Hash Table and a BST together?**
   - *Answer*: A Hash Table provides extremely fast average $O(1)$ search and updates, but cannot efficiently output items in sorted order ($O(n \log n)$ needed to sort buckets). A BST stores elements with intrinsic order, enabling $O(n)$ sorted in-order traversal and range queries. Using both provides the optimal trade-off.

2. **How do you keep data consistent between the Hash Table and BST?**
   - *Answer*: Both data structures store pointers/references to the *same* `Product` object instance in memory. When a property (like quantity or price) is updated via the Hash Table, the change is instantly reflected when traversing the BST without rebalancing or rebuilding the tree.

3. **How does BST node deletion handle a node with two children?**
   - *Answer*: It finds the node's **In-Order Successor** (the smallest value in its right subtree). The target node's product data is replaced with the successor's data, and the successor node is recursively deleted from the right subtree.

4. **Why is table capacity set to a prime number (13)?**
   - *Answer*: Prime table sizes minimize clustering when keys share common factors with the hash modulus, distributing keys more uniformly across buckets.