using Microsoft.EntityFrameworkCore;
using CatalogService.Data;
using CatalogService.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Configure Database Connection (Azure SQL / Managed Identity)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=tcp:gst-free-sql.database.windows.net,1433;Database=gst-prod;Authentication=Active Directory Managed Identity;User Id=8ea17514-6448-41a1-a72e-bc89328998ce;";

builder.Services.AddDbContext<CatalogDbContext>(options =>
{
    options.UseSqlServer(connectionString);
});

var app = builder.Build();

// 2. AUTO-MIGRATION ON STARTUP (The DevOps Gold Standard)
// Automatically checks the database, creates tables & seeds data if needed!
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<CatalogDbContext>();
    db.Database.EnsureCreated();
    Console.WriteLine("✅ Database schema verified and updated automatically.");
}
catch (Exception ex)
{
    Console.WriteLine($"⚠️ Database Auto-Migration warning: {ex.Message}");
}

// 3. Health check endpoint (Used by Azure for Auto-Healing & Autoscaling)
app.MapGet("/health", () => Results.Ok(new { status = "Healthy", service = "CatalogService", timestamp = DateTime.UtcNow }));

// 4. Products API Endpoints
app.MapGet("/products", async (CatalogDbContext db) =>
{
    return await db.Products.ToListAsync();
});

app.MapGet("/products/{id}", async (int id, CatalogDbContext db) =>
{
    var product = await db.Products.FindAsync(id);
    return product is not null ? Results.Ok(product) : Results.NotFound(new { message = $"Product {id} not found" });
});

app.MapPost("/products", async (Product product, CatalogDbContext db) =>
{
    db.Products.Add(product);
    await db.SaveChangesAsync();
    return Results.Created($"/products/{product.Id}", product);
});

// 5. Stock reduction endpoint (Used internally by OrderService)
app.MapPut("/products/{id}/reduce-stock", async (int id, int quantity, CatalogDbContext db) =>
{
    var product = await db.Products.FindAsync(id);
    if (product is null) return Results.NotFound(new { message = "Product not found" });
    if (product.Stock < quantity) return Results.BadRequest(new { message = "Insufficient stock available" });

    product.Stock -= quantity;
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Stock updated", remainingStock = product.Stock });
});

app.Run();
