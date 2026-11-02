# 📦 Inventory & Stock Management System (C++ DSA Project)

A clean, lightweight **Inventory and Stock Management System** featuring a **C++ Backend** implementing custom Data Structures & Algorithms from scratch:
- **Instant Search ($O(1)$ Average)** via custom **Hash Table** with Separate Chaining.
- **Ordered Product Storage ($O(n)$ In-Order Traversal)** via custom **Binary Search Tree (BST)**.
- **Dual Mode**: Interactive Academic Console CLI + Native C++ HTTP Web Server.

---

## 🏗️ Architecture & DSA Overview

```
                                [ Web Frontend ]
                         (index.html, style.css, app.js)
                                      │
                                      ▼  HTTP / REST API (port 8080)
┌─────────────────────────────────────────────────────────────────────────────┐
│                            C++ BACKEND (inventory.exe)                      │
│                                                                             │
│                        ┌─────────────────────────┐                          │
│                        │    InventoryManager     │                          │
│                        └────────────┬────────────┘                          │
│                                     │                                       │
│                   Shared Memory Pointer (Product*)                          │
│                   ┌─────────────────┴─────────────────┐                     │
│                   ▼                                   ▼                     │
│       ┌───────────────────────┐           ┌───────────────────────┐         │
│       │    CustomHashTable    │           │      ProductBST       │         │
│       │  - Fixed Capacity: 13 │           │  - Ordered by ID      │         │
│       │  - Separate Chaining  │           │  - 3-Case Deletion    │         │
│       │  - O(1) Search/Update │           │  - O(n) In-Order Walk │         │
│       └───────────────────────┘           └───────────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

Both data structures store pointers to the **same heap-allocated `Product` instance** in memory. Updating an item via the Hash Table in $O(1)$ automatically updates the data retrieved during BST traversal without rebuilding or rebalancing the tree.

---

## 📁 File Structure

```
├── backend/
│   ├── Product.hpp            # Product entity class (id, name, category, quantity, price)
│   ├── CustomHashTable.hpp    # Fixed 13-bucket Hash Table with separate chaining
│   ├── ProductBST.hpp         # Binary Search Tree with 3-case deletion & in-order traversal
│   ├── InventoryManager.hpp   # Controller synchronizing Hash Table & BST
│   └── main.cpp               # Interactive CLI + Native C++ HTTP server
├── inventory.exe              # Statically compiled standalone C++ executable (no DLLs needed)
├── index.html                 # Streamlined, minimal single-page dashboard
├── style.css                  # Clean, modern, responsive CSS styling
├── app.js                     # Frontend controller connecting to C++ REST API
├── dsa.js                     # Client-side DSA fallback for direct file opening
└── README.md                  # Project documentation & viva guide
```

---

## ⚡ How to Run

### Mode 1: Native C++ Web Server (Recommended)
Launch the built-in C++ HTTP server:
```powershell
.\inventory.exe --server 8080
```
Open **[http://localhost:8080](http://localhost:8080)** in your browser.

### Mode 2: Interactive Console CLI (For Viva / Code Walkthrough)
Run the C++ program directly in your terminal:
```powershell
.\inventory.exe
```
This opens an interactive menu:
```
------------------- DSA INVENTORY MENU -------------------
1. Add or Update Stock Item (O(1) Hash / O(log n) BST)
2. Search Product by ID (O(1) Hash Table Lookup)
3. Display Sorted Inventory (O(n) BST In-Order Traversal)
4. Delete Product by ID (O(1) Chain + O(log n) BST Successor)
5. Inspect Hash Table Buckets & Collision Chaining
6. Display System Statistics & Time Complexities
7. Re-Seed Demo Data (IDs: 105, 101, 118, 103, 114, 109)
8. Start Native C++ Web Server on Port 8080
9. Exit
```

### Mode 3: Direct Web File (Offline)
Simply double-click [`index.html`](file:///c:/Users/Pushkar/OneDrive/Desktop/ADS%20mini%20project/index.html). The frontend includes client-side fallback logic (`dsa.js`) so it functions standalone anywhere.

---

## 🔨 How to Recompile C++ Backend

Using `g++` (LLVM-MinGW / GCC):
```powershell
g++ -std=c++17 -O2 -static backend/main.cpp -o inventory.exe -lws2_32
```
*Note: The `-static` flag packages runtime dependencies into a single, portable executable that runs on any 64-bit Windows machine.*

---

## 📊 Time Complexity Matrix

| Operation | Primary Structure | Time Complexity (Average) | Description |
|---|---|---|---|
| **Search / Lookup** | Hash Table | $\mathbf{O(1)}$ | $h(\text{id}) = \text{id} \pmod{13}$ + bucket chain scan |
| **In-Place Update** | Hash Table | $\mathbf{O(1)}$ | Mutates the shared `Product*` pointer directly |
| **Insert Product** | Hash Table + BST | $\mathbf{O(1) + O(\log n)}$ | Prepends to bucket head ($O(1)$) and places in BST ($O(\log n)$) |
| **Sorted Listing** | BST In-Order | $\mathbf{O(n)}$ | Left $\rightarrow$ Root $\rightarrow$ Right walk without using `sort()` |
| **Delete Product** | Hash Table + BST | $\mathbf{O(1) + O(\log n)}$ | Unlinks from bucket chain + BST 2-child successor replacement |

---

## 🧪 Pre-Configured Demo Data & Collisions

The sample data inserts items in **unsorted order**: `105, 101, 118, 103, 114, 109`.

- **Bucket 1 Collision**: $105 \pmod{13} = 1$ & $118 \pmod{13} = 1$
  - Chain: `Bucket [1]: #118 -> #105 -> NULL`
- **Bucket 10 Collision**: $101 \pmod{13} = 10$ & $114 \pmod{13} = 10$
  - Chain: `Bucket [10]: #114 -> #101 -> NULL`
- **BST In-Order Traversal**: Produces ascending sequence:
  - `101 → 103 → 105 (Root) → 109 → 114 → 118`

---

## 🎓 Viva Defense Q&A

1. **Why is the Hash Table bucket size 13?**
   - 13 is a prime number. Prime moduli reduce clustering when keys share common divisors, distributing items more uniformly across buckets.
2. **How does BST node deletion work when a node has two children?**
   - The algorithm locates the **In-Order Successor** (smallest node in the right subtree), copies its data to the target node, and recursively deletes the successor from the right subtree.
3. **How does synchronization work between the Hash Table and BST?**
   - Both data structures store the exact same pointer (`Product*`) to heap memory. Any modification made through the Hash Table is immediately visible when traversing the BST.