using System.Collections.Concurrent;
using CatalogService.Models;

var builder = WebApplication.CreateBuilder(args);

// Register thread-safe in-memory store with seeded data
var products = new ConcurrentDictionary<int, Product>();
products.TryAdd(1, new Product { Id = 1, Name = "Pro Gaming Laptop", Description = "16GB RAM, RTX 4070", Price = 1299.99m, Stock = 15 });
products.TryAdd(2, new Product { Id = 2, Name = "Wireless Noise-Canceling Headphones", Description = "Active Noise Cancellation", Price = 199.99m, Stock = 50 });
products.TryAdd(3, new Product { Id = 3, Name = "Mechanical Keyboard RGB", Description = "Hot-swappable switches", Price = 89.99m, Stock = 100 });

builder.Services.AddSingleton(products);

var app = builder.Build();

// 1. Health check endpoint (Used by Azure for Auto-Healing & Autoscaling)
app.MapGet("/health", () => Results.Ok(new { status = "Healthy", service = "CatalogService", timestamp = DateTime.UtcNow }));

// 2. Products API Endpoints
app.MapGet("/products", (ConcurrentDictionary<int, Product> store) =>
{
    return Results.Ok(store.Values.OrderBy(p => p.Id));
});

app.MapGet("/products/{id}", (int id, ConcurrentDictionary<int, Product> store) =>
{
    return store.TryGetValue(id, out var product) 
        ? Results.Ok(product) 
        : Results.NotFound(new { message = $"Product {id} not found" });
});

app.MapPost("/products", (Product product, ConcurrentDictionary<int, Product> store) =>
{
    var nextId = store.Keys.DefaultIfEmpty(0).Max() + 1;
    product.Id = nextId;
    store[nextId] = product;
    return Results.Created($"/products/{product.Id}", product);
});

// 3. Stock reduction endpoint (Used internally by OrderService)
app.MapPut("/products/{id}/reduce-stock", (int id, int quantity, ConcurrentDictionary<int, Product> store) =>
{
    if (!store.TryGetValue(id, out var product)) 
        return Results.NotFound(new { message = "Product not found" });

    if (product.Stock < quantity) 
        return Results.BadRequest(new { message = "Insufficient stock available" });

    product.Stock -= quantity;
    return Results.Ok(new { message = "Stock updated", remainingStock = product.Stock });
});

app.Run();
