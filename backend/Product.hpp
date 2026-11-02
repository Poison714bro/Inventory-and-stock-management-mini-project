#ifndef PRODUCT_HPP
#define PRODUCT_HPP

#include <string>
#include <sstream>
#include <iomanip>

/**
 * Product Data Entity
 * Represents an inventory item stored in memory.
 * Both the Hash Table and Binary Search Tree hold pointers to instances of this class.
 */
class Product {
public:
    int id;
    std::string name;
    std::string category;
    int quantity;
    double price;

    Product(int id, const std::string& name, const std::string& category, int quantity, double price)
        : id(id), name(name), category(category), quantity(quantity), price(price) {}

    double getTotalValue() const {
        return quantity * price;
    }

    std::string toJson() const {
        std::ostringstream ss;
        ss << std::fixed << std::setprecision(2);
        ss << "{"
           << "\"id\":" << id << ","
           << "\"name\":\"" << escapeJson(name) << "\","
           << "\"category\":\"" << escapeJson(category) << "\","
           << "\"quantity\":" << quantity << ","
           << "\"price\":" << price << ","
           << "\"totalValue\":" << getTotalValue()
           << "}";
        return ss.str();
    }

private:
    static std::string escapeJson(const std::string& s) {
        std::ostringstream ss;
        for (char c : s) {
            if (c == '"') ss << "\\\"";
            else if (c == '\\') ss << "\\\\";
            else if (c == '\b') ss << "\\b";
            else if (c == '\f') ss << "\\f";
            else if (c == '\n') ss << "\\n";
            else if (c == '\r') ss << "\\r";
            else if (c == '\t') ss << "\\t";
            else ss << c;
        }
        return ss.str();
    }
};

#endif // PRODUCT_HPP
