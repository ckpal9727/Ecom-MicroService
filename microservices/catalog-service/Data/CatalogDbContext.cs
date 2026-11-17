using Microsoft.EntityFrameworkCore;
using CatalogService.Models;

namespace CatalogService.Data;

public class CatalogDbContext : DbContext
{
    public CatalogDbContext(DbContextOptions<CatalogDbContext> options) : base(options) { }

    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Seed initial data if table is new
        modelBuilder.Entity<Product>().HasData(
            new Product { Id = 1, Name = "Pro Gaming Laptop", Description = "16GB RAM, RTX 4070", Price = 1299.99m, Stock = 15 },
            new Product { Id = 2, Name = "Wireless Noise-Canceling Headphones", Description = "Active Noise Cancellation", Price = 199.99m, Stock = 50 },
            new Product { Id = 3, Name = "Mechanical Keyboard RGB", Description = "Hot-swappable switches", Price = 89.99m, Stock = 100 }
        );
    }
}
