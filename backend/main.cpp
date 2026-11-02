/**
 * ============================================================================
 * Inventory & Stock Management System - C++ Backend & Server
 * ============================================================================
 * Core Data Structures:
 * 1. CustomHashTable: O(1) Lookup with Separate Chaining (Capacity 13)
 * 2. ProductBST: O(n) In-Order Sorted Traversal & 3-Case Deletion
 * 3. InventoryManager: Synchronized Dual-Structure Architecture
 *
 * Modes of Execution:
 * A. Interactive CLI Mode:
 *    Run without arguments for an academic viva / console walkthrough.
 * B. Native HTTP Web Server Mode:
 *    Run with `--server [port]` to serve the simplified web frontend & REST API.
 * ============================================================================
 */

#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <iomanip>
#include <algorithm>
#include <fstream>

#ifdef _WIN32
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <winsock2.h>
#include <ws2tcpip.h>
#pragma comment(lib, "ws2_32.lib")
#endif

#include "Product.hpp"
#include "CustomHashTable.hpp"
#include "ProductBST.hpp"
#include "InventoryManager.hpp"

// Global Inventory Instance
InventoryManager g_manager(13);

// Forward Declarations
void runInteractiveCli();
void runHttpServer(int port);

int main(int argc, char* argv[]) {
    // Seed initial demo items
    g_manager.loadSampleSeedData();

    if (argc > 1 && std::string(argv[1]) == "--server") {
        int port = 8080;
        if (argc > 2) {
            port = std::stoi(argv[2]);
        }
        runHttpServer(port);
        return 0;
    }

    // Default to interactive CLI
    std::cout << "==============================================================\n";
    std::cout << "    INVENTORY & STOCK MANAGEMENT SYSTEM (C++ DSA BACKEND)     \n";
    std::cout << "    Custom Hash Table O(1) + Binary Search Tree O(n)          \n";
    std::cout << "==============================================================\n";
    std::cout << "Usage: \n";
    std::cout << "  inventory.exe           -> Interactive Academic Console CLI\n";
    std::cout << "  inventory.exe --server  -> Launch Native C++ REST API Server\n";
    std::cout << "==============================================================\n\n";

    runInteractiveCli();
    return 0;
}

/**
 * ----------------------------------------------------------------------------
 * A. Interactive CLI for Academic Viva & Code Walkthrough
 * ----------------------------------------------------------------------------
 */
void displayMenu() {
    std::cout << "\n------------------- DSA INVENTORY MENU -------------------\n";
    std::cout << "1. Add or Update Stock Item (O(1) Hash / O(log n) BST)\n";
    std::cout << "2. Search Product by ID (O(1) Hash Table Lookup)\n";
    std::cout << "3. Display Sorted Inventory (O(n) BST In-Order Traversal)\n";
    std::cout << "4. Delete Product by ID (O(1) Chain + O(log n) BST Successor)\n";
    std::cout << "5. Inspect Hash Table Buckets & Collision Chaining\n";
    std::cout << "6. Display System Statistics & Time Complexities\n";
    std::cout << "7. Re-Seed Demo Data (IDs: 105, 101, 118, 103, 114, 109)\n";
    std::cout << "8. Start Native C++ Web Server on Port 8080\n";
    std::cout << "9. Exit\n";
    std::cout << "Enter your choice [1-9]: ";
}

void runInteractiveCli() {
    int choice = 0;

    while (true) {
        displayMenu();
        if (!(std::cin >> choice)) {
            if (std::cin.eof()) break;
            std::cin.clear();
            std::string dummy;
            std::cin >> dummy;
            std::cout << "Invalid input. Please enter a number between 1 and 9.\n";
            continue;
        }

        if (choice == 1) {
            int id, qty;
            double price;
            std::string name, category;

            std::cout << "\nEnter Product ID (integer): ";
            std::cin >> id;
            std::cin.ignore();

            std::cout << "Enter Product Name: ";
            std::getline(std::cin, name);

            std::cout << "Enter Category (e.g. GPU, CPU, RAM, Storage): ";
            std::getline(std::cin, category);

            std::cout << "Enter Quantity: ";
            std::cin >> qty;

            std::cout << "Enter Unit Price ($): ";
            std::cin >> price;

            std::string action;
            int bucketIdx, chainSteps;
            g_manager.addOrUpdate(id, name, category, qty, price, action, bucketIdx, chainSteps);

            if (action == "UPDATE") {
                std::cout << "\n[SUCCESS] Updated existing Product #" << id
                          << " in-place via Hash Table in O(1) time!\n";
                std::cout << "Bucket: [" << bucketIdx << "], Chain Steps: " << chainSteps << "\n";
            } else {
                std::cout << "\n[SUCCESS] Inserted new Product #" << id
                          << " into Hash Table (Bucket [" << bucketIdx << "]) and BST in O(log n)!\n";
            }
        } else if (choice == 2) {
            int id;
            std::cout << "\nEnter Product ID to search: ";
            std::cin >> id;

            int bucketIdx, chainSteps;
            Product* p = g_manager.searchById(id, bucketIdx, chainSteps);

            std::cout << "\n--- HASH TABLE LOOKUP DIAGNOSTICS ---\n";
            std::cout << "Hash Function   : h(" << id << ") = |" << id << "| % 13 = " << bucketIdx << "\n";
            std::cout << "Target Bucket   : Bucket [" << bucketIdx << "]\n";
            std::cout << "Chain Steps     : " << chainSteps << "\n";
            std::cout << "Time Complexity : O(1) Average\n";

            if (p != nullptr) {
                std::cout << "Status          : [FOUND]\n";
                std::cout << "Product Details : " << p->name << " (" << p->category << ")\n";
                std::cout << "Stock Quantity  : " << p->quantity << " units\n";
                std::cout << "Unit Price      : $" << std::fixed << std::setprecision(2) << p->price << "\n";
                std::cout << "Total Value     : $" << p->getTotalValue() << "\n";
            } else {
                std::cout << "Status          : [NOT FOUND] in bucket chain.\n";
            }
        } else if (choice == 3) {
            std::cout << "\n--- SORTED INVENTORY (BST IN-ORDER TRAVERSAL: LEFT -> ROOT -> RIGHT) ---\n";
            std::vector<Product*> items = g_manager.getSortedInventory();

            if (items.empty()) {
                std::cout << "Inventory is empty.\n";
            } else {
                std::cout << std::left << std::setw(8) << "ID"
                          << std::setw(32) << "Name"
                          << std::setw(18) << "Category"
                          << std::right << std::setw(10) << "Quantity"
                          << std::setw(14) << "Price ($)"
                          << std::setw(16) << "Total ($)" << "\n";
                std::cout << std::string(98, '-') << "\n";

                for (Product* p : items) {
                    std::cout << std::left << std::setw(8) << p->id
                              << std::setw(32) << p->name
                              << std::setw(18) << p->category
                              << std::right << std::setw(10) << p->quantity
                              << std::setw(14) << std::fixed << std::setprecision(2) << p->price
                              << std::setw(16) << p->getTotalValue() << "\n";
                }
                std::cout << std::string(98, '-') << "\n";
                std::cout << "Total Products: " << items.size() << " (Ascending Order by ID)\n";
            }
        } else if (choice == 4) {
            int id;
            std::cout << "\nEnter Product ID to delete: ";
            std::cin >> id;

            int bucketIdx, chainSteps;
            bool ok = g_manager.deleteById(id, bucketIdx, chainSteps);

            if (ok) {
                std::cout << "\n[SUCCESS] Deleted Product #" << id
                          << " from Hash Table Bucket [" << bucketIdx << "] and removed from BST!\n";
            } else {
                std::cout << "\n[ERROR] Product #" << id << " not found in inventory.\n";
            }
        } else if (choice == 5) {
            g_manager.getHashTable().printBuckets();

            int occupied, collided, overflow;
            g_manager.getHashTable().getCollisionStats(occupied, collided, overflow);
            std::cout << "\nCollision Summary:\n";
            std::cout << "Occupied Buckets : " << occupied << " / 13\n";
            std::cout << "Collided Buckets : " << collided << "\n";
            std::cout << "Overflow Items   : " << overflow << "\n";
        } else if (choice == 6) {
            std::cout << "\n--- SYSTEM STATISTICS & COMPLEXITY PROFILES ---\n";
            std::cout << "Data Structure 1: CustomHashTable\n";
            std::cout << "  - Modulo Prime Capacity : 13\n";
            std::cout << "  - Collision Strategy    : Separate Chaining (Linked List)\n";
            std::cout << "  - Search Time           : O(1) average\n";
            std::cout << "  - Update Time           : O(1) average\n";
            std::cout << "Data Structure 2: ProductBST\n";
            std::cout << "  - Ordering              : Ascending by Product ID\n";
            std::cout << "  - Tree Height           : " << g_manager.getBST().getHeight() << "\n";
            std::cout << "  - Sorted Retrieval      : O(n) via In-Order Traversal (no sort required)\n";
            std::cout << "  - Node Deletion         : O(log n) with 2-child successor replacement\n";
        } else if (choice == 7) {
            g_manager.loadSampleSeedData();
            std::cout << "\n[SUCCESS] Re-seeded 6 demo items in unsorted order (105, 101, 118, 103, 114, 109).\n";
            std::cout << "Guaranteed collisions present at Bucket 1 and Bucket 10.\n";
        } else if (choice == 8) {
            runHttpServer(8080);
            break;
        } else if (choice == 9) {
            std::cout << "\nExiting Inventory Management System. Goodbye!\n";
            break;
        } else {
            std::cout << "Invalid choice. Please select from 1 to 9.\n";
        }
    }
}

/**
 * ----------------------------------------------------------------------------
 * B. Native C++ HTTP Web Server & REST API
 * ----------------------------------------------------------------------------
 */
#ifdef _WIN32
std::string readFileContent(const std::string& path) {
    std::ifstream file(path, std::ios::in | std::ios::binary);
    if (!file.is_open()) return "";
    std::ostringstream ss;
    ss << file.rdbuf();
    return ss.str();
}

std::string getMimeType(const std::string& path) {
    if (path.rfind(".html") != std::string::npos) return "text/html";
    if (path.rfind(".css") != std::string::npos) return "text/css";
    if (path.rfind(".js") != std::string::npos) return "application/javascript";
    if (path.rfind(".json") != std::string::npos) return "application/json";
    return "text/plain";
}

std::string urlDecode(const std::string& in) {
    std::string out;
    for (size_t i = 0; i < in.length(); ++i) {
        if (in[i] == '%') {
            if (i + 2 < in.length()) {
                int hexVal;
                std::istringstream hexStream(in.substr(i + 1, 2));
                if (hexStream >> std::hex >> hexVal) {
                    out += static_cast<char>(hexVal);
                    i += 2;
                } else {
                    out += in[i];
                }
            }
        } else if (in[i] == '+') {
            out += ' ';
        } else {
            out += in[i];
        }
    }
    return out;
}

void handleHttpRequest(SOCKET clientSocket) {
    char buffer[4096] = {0};
    int bytesReceived = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);
    if (bytesReceived <= 0) return;

    std::string request(buffer, bytesReceived);
    std::istringstream reqStream(request);
    std::string method, uri, version;
    reqStream >> method >> uri >> version;

    std::string responseBody = "";
    std::string contentType = "application/json";
    int statusCode = 200;

    // Parse Query Params
    std::string path = uri;
    std::string query = "";
    size_t qPos = uri.find('?');
    if (qPos != std::string::npos) {
        path = uri.substr(0, qPos);
        query = uri.substr(qPos + 1);
    }

    // 1. API: GET /api/inventory
    if (method == "GET" && path == "/api/inventory") {
        responseBody = g_manager.getInventoryJson();
    }
    // 2. API: GET /api/stats
    else if (method == "GET" && path == "/api/stats") {
        responseBody = g_manager.getStatsJson();
    }
    // 3. API: GET /api/buckets
    else if (method == "GET" && path == "/api/buckets") {
        responseBody = g_manager.getHashTable().getBucketsJson();
    }
    // 4. API: GET /api/search?id=###
    else if (method == "GET" && path == "/api/search") {
        int id = 0;
        size_t idPos = query.find("id=");
        if (idPos != std::string::npos) {
            id = std::stoi(query.substr(idPos + 3));
        }

        int bucketIdx = 0, chainSteps = 0;
        Product* p = g_manager.searchById(id, bucketIdx, chainSteps);

        std::ostringstream ss;
        ss << "{"
           << "\"found\":" << (p ? "true" : "false") << ","
           << "\"id\":" << id << ","
           << "\"bucketIndex\":" << bucketIdx << ","
           << "\"chainSteps\":" << chainSteps << ",";
        if (p) {
            ss << "\"product\":" << p->toJson();
        } else {
            ss << "\"product\":null";
        }
        ss << "}";
        responseBody = ss.str();
    }
    // 5. API: POST /api/products
    else if (method == "POST" && path == "/api/products") {
        // Find body in request
        size_t bodyPos = request.find("\r\n\r\n");
        if (bodyPos != std::string::npos) {
            std::string body = request.substr(bodyPos + 4);

            // Simple parser for key=val or json fields
            int id = 0, qty = 0;
            double price = 0.0;
            std::string name = "Item", category = "General";

            // Support JSON parsing
            auto extractField = [&](const std::string& key) -> std::string {
                size_t p = body.find("\"" + key + "\"");
                if (p == std::string::npos) return "";
                size_t colon = body.find(':', p);
                if (colon == std::string::npos) return "";
                size_t start = body.find_first_not_of(" \t\r\n", colon + 1);
                if (start == std::string::npos) return "";
                if (body[start] == '"') {
                    size_t end = body.find('"', start + 1);
                    return body.substr(start + 1, end - start - 1);
                } else {
                    size_t end = body.find_first_of(",}\r\n", start);
                    return body.substr(start, end - start);
                }
            };

            std::string idStr = extractField("id");
            std::string nameStr = extractField("name");
            std::string catStr = extractField("category");
            std::string qtyStr = extractField("quantity");
            std::string priceStr = extractField("price");

            if (!idStr.empty()) id = std::stoi(idStr);
            if (!nameStr.empty()) name = nameStr;
            if (!catStr.empty()) category = catStr;
            if (!qtyStr.empty()) qty = std::stoi(qtyStr);
            if (!priceStr.empty()) price = std::stod(priceStr);

            std::string action;
            int bucketIdx, chainSteps;
            g_manager.addOrUpdate(id, name, category, qty, price, action, bucketIdx, chainSteps);

            std::ostringstream ss;
            ss << "{\"success\":true,\"action\":\"" << action << "\",\"bucketIndex\":" << bucketIdx << "}";
            responseBody = ss.str();
        }
    }
    // 6. API: DELETE /api/products?id=### or POST /api/delete
    else if ((method == "DELETE" && path == "/api/products") || (method == "POST" && path == "/api/delete")) {
        int id = 0;
        size_t idPos = query.find("id=");
        if (idPos != std::string::npos) {
            id = std::stoi(query.substr(idPos + 3));
        } else {
            size_t bodyPos = request.find("\r\n\r\n");
            if (bodyPos != std::string::npos) {
                std::string body = request.substr(bodyPos + 4);
                size_t p = body.find("\"id\":");
                if (p != std::string::npos) {
                    id = std::stoi(body.substr(p + 5));
                }
            }
        }

        int bucketIdx, chainSteps;
        bool ok = g_manager.deleteById(id, bucketIdx, chainSteps);
        std::ostringstream ss;
        ss << "{\"success\":" << (ok ? "true" : "false") << "}";
        responseBody = ss.str();
    }
    // 7. API: POST /api/seed
    else if (method == "POST" && path == "/api/seed") {
        g_manager.loadSampleSeedData();
        responseBody = "{\"success\":true,\"message\":\"Seed data loaded\"}";
    }
    // 8. API: POST /api/clear
    else if (method == "POST" && path == "/api/clear") {
        g_manager.clear();
        responseBody = "{\"success\":true,\"message\":\"Inventory cleared\"}";
    }
    // 9. Static File Serving (index.html, style.css, app.js, dsa.js)
    else {
        std::string filename = path == "/" ? "index.html" : path.substr(1);
        std::string content = readFileContent(filename);
        if (!content.empty()) {
            responseBody = content;
            contentType = getMimeType(filename);
        } else {
            statusCode = 404;
            responseBody = "404 Not Found";
            contentType = "text/plain";
        }
    }

    std::ostringstream header;
    header << "HTTP/1.1 " << statusCode << " OK\r\n"
           << "Content-Type: " << contentType << "\r\n"
           << "Content-Length: " << responseBody.size() << "\r\n"
           << "Access-Control-Allow-Origin: *\r\n"
           << "Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS\r\n"
           << "Access-Control-Allow-Headers: Content-Type\r\n"
           << "Connection: close\r\n\r\n";

    std::string fullResponse = header.str() + responseBody;
    send(clientSocket, fullResponse.c_str(), (int)fullResponse.size(), 0);
    closesocket(clientSocket);
}

void runHttpServer(int port) {
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        std::cerr << "Failed to initialize Winsock.\n";
        return;
    }

    SOCKET listenSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (listenSocket == INVALID_SOCKET) {
        std::cerr << "Failed to create socket.\n";
        WSACleanup();
        return;
    }

    sockaddr_in serverAddr;
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_addr.s_addr = INADDR_ANY;
    serverAddr.sin_port = htons(port);

    if (bind(listenSocket, (sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
        std::cerr << "Socket bind failed on port " << port << ".\n";
        closesocket(listenSocket);
        WSACleanup();
        return;
    }

    if (listen(listenSocket, SOMAXCONN) == SOCKET_ERROR) {
        std::cerr << "Socket listen failed.\n";
        closesocket(listenSocket);
        WSACleanup();
        return;
    }

    std::cout << "\n=========================================================\n";
    std::cout << "  NATIVE C++ BACKEND SERVER RUNNING ON PORT " << port << " \n";
    std::cout << "=========================================================\n";
    std::cout << "  Web UI   : http://localhost:" << port << "\n";
    std::cout << "  REST API : http://localhost:" << port << "/api/inventory\n";
    std::cout << "  Press Ctrl+C to stop.\n\n";

    while (true) {
        SOCKET clientSocket = accept(listenSocket, nullptr, nullptr);
        if (clientSocket != INVALID_SOCKET) {
            handleHttpRequest(clientSocket);
        }
    }

    closesocket(listenSocket);
    WSACleanup();
}
#else
void runHttpServer(int port) {
    std::cout << "Native socket server currently configured for Windows (Winsock).\n";
}
#endif
