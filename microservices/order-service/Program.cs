using Microsoft.EntityFrameworkCore;
using OrderService.Data;
using OrderService.Models;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// 1. Configure Database Connection (Azure SQL / Managed Identity)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=tcp:gst-free-sql.database.windows.net,1433;Database=gst-prod;Authentication=Active Directory Managed Identity;User Id=8ea17514-6448-41a1-a72e-bc89328998ce;";

builder.Services.AddDbContext<OrderDbContext>(options =>
{
    options.UseSqlServer(connectionString);
});

// 2. Register HttpClient for internal microservice communication
var catalogServiceUrl = builder.Configuration["CatalogServiceUrl"] ?? "http://catalog-api";
builder.Services.AddHttpClient("CatalogClient", client =>
{
    client.BaseAddress = new Uri(catalogServiceUrl);
    client.Timeout = TimeSpan.FromSeconds(5);
});

var app = builder.Build();

// 3. Auto-Migration on startup
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<OrderDbContext>();
    db.Database.EnsureCreated();
    Console.WriteLine("✅ Order database schema verified and updated automatically.");
}
catch (Exception ex)
{
    Console.WriteLine($"⚠️ Order Database Auto-Migration warning: {ex.Message}");
}

// 4. Health Check
app.MapGet("/health", () => Results.Ok(new { status = "Healthy", service = "OrderService", timestamp = DateTime.UtcNow }));

// 5. Get all orders
app.MapGet("/orders", async (OrderDbContext db) =>
{
    return await db.Orders.OrderByDescending(o => o.OrderDate).ToListAsync();
});

// 6. Create Order (Demonstrates inter-service microservice call)
app.MapPost("/orders", async (CreateOrderRequest request, OrderDbContext db, IHttpClientFactory httpClientFactory) =>
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

    // C. Record the order in database
    var order = new Order
    {
        CustomerEmail = request.CustomerEmail,
        ProductId = request.ProductId,
        Quantity = request.Quantity,
        TotalAmount = price * request.Quantity,
        Status = "Confirmed",
        OrderDate = DateTime.UtcNow
    };

    db.Orders.Add(order);
    await db.SaveChangesAsync();

    return Results.Created($"/orders/{order.Id}", order);
});

app.Run();

public record CreateOrderRequest(string CustomerEmail, int ProductId, int Quantity);
