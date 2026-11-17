using System.Collections.Concurrent;
using OrderService.Models;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Register thread-safe in-memory order store
var orders = new ConcurrentDictionary<int, Order>();
builder.Services.AddSingleton(orders);

// Register HttpClient for internal microservice communication
var catalogServiceUrl = builder.Configuration["CatalogServiceUrl"] ?? "http://catalog-api";
builder.Services.AddHttpClient("CatalogClient", client =>
{
    client.BaseAddress = new Uri(catalogServiceUrl);
    client.Timeout = TimeSpan.FromSeconds(5);
});

var app = builder.Build();

// 1. Health Check
app.MapGet("/health", () => Results.Ok(new { status = "Healthy", service = "OrderService", timestamp = DateTime.UtcNow }));

// 2. Get all orders
app.MapGet("/orders", (ConcurrentDictionary<int, Order> store) =>
{
    return Results.Ok(store.Values.OrderByDescending(o => o.OrderDate));
});

// 3. Create Order (Demonstrates inter-service microservice call)
app.MapPost("/orders", async (CreateOrderRequest request, ConcurrentDictionary<int, Order> store, IHttpClientFactory httpClientFactory) =>
{
    var httpClient = httpClientFactory.CreateClient("CatalogClient");

    // A. Check Product in CatalogService over internal network
    HttpResponseMessage productResponse;
    try
    {
        productResponse = await httpClient.GetAsync($"/products/{request.ProductId}");
    }
    catch (Exception ex)
    {
        return Results.Problem($"Failed to reach Catalog Service: {ex.Message}");
    }

    if (!productResponse.IsSuccessStatusCode)
    {
        return Results.BadRequest(new { message = $"Product with ID {request.ProductId} does not exist in catalog." });
    }

    var productJson = await productResponse.Content.ReadAsStringAsync();
    using var doc = JsonDocument.Parse(productJson);
    var price = doc.RootElement.GetProperty("price").GetDecimal();
    var stock = doc.RootElement.GetProperty("stock").GetInt32();

    if (stock < request.Quantity)
    {
        return Results.BadRequest(new { message = $"Insufficient stock. Only {stock} available." });
    }

    // B. Reduce stock in CatalogService
    var stockResponse = await httpClient.PutAsync($"/products/{request.ProductId}/reduce-stock?quantity={request.Quantity}", null);
    if (!stockResponse.IsSuccessStatusCode)
    {
        return Results.Problem("Failed to reserve product stock.");
    }

    // C. Record the order in in-memory store
    var nextId = store.Keys.DefaultIfEmpty(0).Max() + 1;
    var order = new Order
    {
        Id = nextId,
        CustomerEmail = request.CustomerEmail,
        ProductId = request.ProductId,
        Quantity = request.Quantity,
        TotalAmount = price * request.Quantity,
        Status = "Confirmed",
        OrderDate = DateTime.UtcNow
    };

    store[nextId] = order;
    return Results.Created($"/orders/{order.Id}", order);
});

app.Run();

public record CreateOrderRequest(string CustomerEmail, int ProductId, int Quantity);
