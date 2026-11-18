# 🚀 Cloud-Native E-Commerce Microservices on Azure Container Apps (IaC & Pure DevOps CI/CD)

An enterprise-grade, serverless microservices architecture deployed to **Microsoft Azure Container Apps** using **Infrastructure-as-Code (IaC)**, **Passwordless OIDC Workload Identity Federation**, and an automated **GitHub Actions CI/CD Pipeline** with **GitHub Container Registry (`ghcr.io`)**.

---

## 📑 Table of Contents
1. [Architecture Overview](#-architecture-overview)
2. [Microservices Overview](#-microservices-overview)
3. [Infrastructure-as-Code (IaC) ARM Template](#-infrastructure-as-code-iac-arm-template)
4. [Passwordless Authentication (OIDC & Managed Identity)](#-passwordless-authentication-oidc--managed-identity)
5. [Pure DevOps CI/CD Pipeline](#-pure-devops-cicd-pipeline)
6. [Comprehensive Troubleshooting Guide](#-comprehensive-troubleshooting-guide)
   - [Case 1: ARM Template CPU Scale Rule Preflight Error](#case-1-arm-template-cpu-scale-rule-preflight-error)
   - [Case 2: OIDC Handshake Failure (AADSTS700213)](#case-2-oidc-handshake-failure-aadsts700213)
   - [Case 3: Azure CLI "The containerapp does not exist"](#case-3-azure-cli-the-containerapp-does-not-exist)
   - [Case 4: HTTP 500 & Azure SQL Error 42119](#case-4-http-500--azure-sql-error-42119-monthly-quota-paused)
   - [Case 5: .NET 10 Preview MissingMethodException](#case-5-net-10-preview-missingmethodexception)
7. [Production Verification & Testing](#-production-verification--testing)
8. [Cleanup & Teardown](#-cleanup--teardown)

---

## 🏛️ Architecture Overview

The system runs on **Azure Container Apps** (serverless Kubernetes abstraction) inside a shared **Container Apps Environment**.

```mermaid
flowchart TD
    Client(["🌐 Internet Clients / Browser"])
    
    subgraph Azure_Cloud["☁️ Microsoft Azure"]
        subgraph RG_Test["Resource Group: Test"]
            subgraph Env["Container Apps Environment: demo-ecommerce-env"]
                CatalogAPI["📦 catalog-api\n(Public Ingress :8080)\nAutoscale: 1-3 Replicas"]
                OrderAPI["🛒 order-api\n(Internal Ingress Only :8080)\nPrivate Cluster IP"]
            end
        end

        subgraph RG_GST["Resource Group: GST"]
            MSI["🔑 Managed Identity\n(gst-id-8c8d)"]
            SQL["🗄️ Azure SQL Database\n(gst-free-sql / gst-prod)"]
        end
    end

    subgraph GitHub["🐙 GitHub Enterprise / Actions"]
        Repo["Git Repository\n(ckpal9727/Ecom-MicroService)"]
        GHCR["📦 ghcr.io\nGitHub Container Registry"]
        Actions["⚙️ GitHub Actions Runner\n(OIDC Token Exchange)"]
    end

    Client -->|HTTPS Public GET /products| CatalogAPI
    CatalogAPI -.->|Internal HTTP :80| OrderAPI
    CatalogAPI -.->|Token Auth (Passwordless)| SQL
    OrderAPI -.->|Token Auth (Passwordless)| SQL
    
    Repo -->|git push main| Actions
    Actions -->|Build & Push Images| GHCR
    Actions -->|OIDC Azure Login| MSI
    Actions -->|az containerapp update| CatalogAPI
    Actions -->|az containerapp update| OrderAPI
```

### Key Architectural Tenets:
* **Zero Public Exposure for Private Services:** `order-api` has `external: false` and is accessible *only* within the virtual environment network (`order-api.internal...`).
* **Public Gateway:** `catalog-api` has `external: true` with automatic SSL termination and public DNS resolution.
* **Zero Secrets/Passwords:** Authentication to Azure uses OpenID Connect (OIDC) federated credentials; SQL connections utilize Microsoft Entra User-Assigned Managed Identity.
* **Serverless Autoscaling:** KEDA CPU-based metric scaling from 1 to 3 replicas when utilization exceeds 75%.

---

## 📦 Microservices Overview

### 1. Catalog Service (`/microservices/catalog-service`)
* **Framework:** .NET 10 Minimal API
* **Role:** Manages products, inventory stock, and catalog items.
* **Endpoints:**
  * `GET /health` - Health probe for Azure Container Apps liveness/readiness.
  * `GET /products` - Returns all catalog items.
  * `GET /products/{id}` - Returns specific product details.
  * `POST /products` - Adds new products.
  * `PUT /products/{id}/reduce-stock?quantity={qty}` - Decrements inventory stock (invoked internally by `order-service`).

### 2. Order Service (`/microservices/order-service`)
* **Framework:** .NET 10 Minimal API
* **Role:** Processes customer orders, verifies stock with `catalog-api` over private cluster DNS, and commits confirmed orders.
* **Endpoints:**
  * `GET /health` - Health probe.
  * `GET /orders` - Lists past orders.
  * `POST /orders` - Submits a new order, validates pricing & availability against `catalog-api`, reduces inventory, and creates the order.

---

## 📜 Infrastructure-as-Code (IaC) ARM Template

The entire infrastructure (Environment + 2 Container Apps) is codified in an Azure Resource Manager (ARM) template deployed in seconds.

### ARM Template JSON (`azure-deploy.json`):
```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "resources": [
    {
      "type": "Microsoft.App/managedEnvironments",
      "apiVersion": "2024-03-01",
      "name": "demo-ecommerce-env",
      "location": "centralindia",
      "properties": {
        "workloadProfiles": [
          {
            "name": "Consumption",
            "workloadProfileType": "Consumption"
          }
        ]
      }
    },
    {
      "type": "Microsoft.App/containerApps",
      "apiVersion": "2024-03-01",
      "name": "catalog-api",
      "location": "centralindia",
      "dependsOn": [
        "[resourceId('Microsoft.App/managedEnvironments', 'demo-ecommerce-env')]"
      ],
      "identity": {
        "type": "UserAssigned",
        "userAssignedIdentities": {
          "/subscriptions/de54982f-dead-40cb-b15e-7cab95c7b5c5/resourceGroups/GST/providers/Microsoft.ManagedIdentity/userAssignedIdentities/gst-id-8c8d": {}
        }
      },
      "properties": {
        "managedEnvironmentId": "[resourceId('Microsoft.App/managedEnvironments', 'demo-ecommerce-env')]",
        "configuration": {
          "ingress": {
            "external": true,
            "targetPort": 8080,
            "transport": "auto"
          }
        },
        "template": {
          "containers": [
            {
              "name": "catalog-api",
              "image": "mcr.microsoft.com/dotnet/samples:aspnetapp",
              "resources": {
                "cpu": 0.25,
                "memory": "0.5Gi"
              }
            }
          ],
          "scale": {
            "minReplicas": 1,
            "maxReplicas": 3,
            "rules": [
              {
                "name": "cpu-rule",
                "custom": {
                  "type": "cpu",
                  "metadata": {
                    "type": "Utilization",
                    "value": "75"
                  }
                }
              }
            ]
          }
        }
      }
    },
    {
      "type": "Microsoft.App/containerApps",
      "apiVersion": "2024-03-01",
      "name": "order-api",
      "location": "centralindia",
      "dependsOn": [
        "[resourceId('Microsoft.App/managedEnvironments', 'demo-ecommerce-env')]"
      ],
      "identity": {
        "type": "UserAssigned",
        "userAssignedIdentities": {
          "/subscriptions/de54982f-dead-40cb-b15e-7cab95c7b5c5/resourceGroups/GST/providers/Microsoft.ManagedIdentity/userAssignedIdentities/gst-id-8c8d": {}
        }
      },
      "properties": {
        "managedEnvironmentId": "[resourceId('Microsoft.App/managedEnvironments', 'demo-ecommerce-env')]",
        "configuration": {
          "ingress": {
            "external": false,
            "targetPort": 8080,
            "transport": "auto"
          }
        },
        "template": {
          "containers": [
            {
              "name": "order-api",
              "image": "mcr.microsoft.com/dotnet/samples:aspnetapp",
              "resources": {
                "cpu": 0.25,
                "memory": "0.5Gi"
              }
            }
          ],
          "scale": {
            "minReplicas": 1,
            "maxReplicas": 3,
            "rules": [
              {
                "name": "cpu-rule",
                "custom": {
                  "type": "cpu",
                  "metadata": {
                    "type": "Utilization",
                    "value": "75"
                  }
                }
              }
            ]
          }
        }
      }
    }
  ]
}
```

### Portal Deployment Steps:
1. Search **Deploy a custom template** in Azure Portal.
2. Click **Build your own template in the editor**.
3. Paste the JSON above and click **Save**.
4. Select Subscription (`GST suvidha`) and Resource Group (`Test`).
5. Click **Review + create** ➔ **Create**.

---

## 🔑 Passwordless Authentication (OIDC & Managed Identity)

Rather than storing long-lived passwords, client secrets, or publishing profiles in GitHub, the deployment leverages **OpenID Connect (OIDC)** Workload Identity Federation.

### 1. Azure Managed Identity Setup:
* **Identity Name:** `gst-id-8c8d` (User-Assigned Managed Identity)
* **Client ID:** `8ea17514-6448-41a1-a72e-bc89328998ce`
* **Subscription:** `GST suvidha` (`de54982f-dead-40cb-b15e-7cab95c7b5c5`)

### 2. Federated Credential Configuration:
Navigate to `gst-id-8c8d` ➔ **Federated credentials** ➔ **+ Add credential**:
* **Scenario:** `GitHub Actions deploying Azure resources`
* **Organization:** `ckpal9727`
* **Organization ID:** `95668324`
* **Repository:** `Ecom-MicroService`
* **Repository ID:** `1461402650`
* **Entity Type:** `Branch`
* **Branch:** `main`
* **Credential Name:** `github-main`

*(Resulting Subject Identifier: `repo:ckpal9727@95668324/Ecom-MicroService@1461402650:ref:refs/heads/main`)*

### 3. Azure RBAC Role Assignment:
To allow the identity to update Container Apps in the target resource group:
1. Navigate to Resource Group **`Test`** ➔ **Access control (IAM)**.
2. Click **Add role assignment** ➔ Select **Contributor** (under *Privileged administrator roles*).
3. Assign access to: **Managed identity** ➔ Select **`gst-id-8c8d`**.
4. Click **Review + assign**.

### 4. GitHub Secrets:
In GitHub Repository ➔ **Settings** ➔ **Secrets and variables** ➔ **Actions**:
* `AZURE_CLIENT_ID`: `8ea17514-6448-41a1-a72e-bc89328998ce`
* `AZURE_SUBSCRIPTION_ID`: `de54982f-dead-40cb-b15e-7cab95c7b5c5`
* `AZURE_TENANT_ID`: `<Your Microsoft Entra Tenant ID>`

---

## ⚙️ Pure DevOps CI/CD Pipeline

The automated workflow file is located at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### Workflow Capabilities:
* **Automatic Triggers:** Runs on every push to `main` or manual trigger (`workflow_dispatch`).
* **Zero Cost Container Storage:** Pushes images to GitHub Container Registry (`ghcr.io`) using the free default `GITHUB_TOKEN`.
* **Zero Secrets Storage:** Obtains short-lived Azure access tokens via `azure/login@v2`.
* **Zero-Downtime Deployment:** Performs rolling revisions via `az containerapp update`.

```yaml
name: Pure DevOps CI/CD - Microservices to Azure

on:
  push:
    branches: [ "main" ]
  workflow_dispatch:

permissions:
  id-token: write
  contents: read
  packages: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '10.0.x'

      - name: Build Catalog Service
        run: |
          cd microservices/catalog-service
          dotnet build --configuration Release

      - name: Build Order Service
        run: |
          cd microservices/order-service
          dotnet build --configuration Release

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build & Push Images
        run: |
          OWNER=$(echo "${{ github.repository_owner }}" | tr '[:upper:]' '[:lower:]')

          # Catalog API
          docker build -t ghcr.io/$OWNER/catalog-api:${{ github.sha }} -t ghcr.io/$OWNER/catalog-api:latest ./microservices/catalog-service
          docker push ghcr.io/$OWNER/catalog-api:${{ github.sha }}
          docker push ghcr.io/$OWNER/catalog-api:latest

          # Order API
          docker build -t ghcr.io/$OWNER/order-api:${{ github.sha }} -t ghcr.io/$OWNER/order-api:latest ./microservices/order-service
          docker push ghcr.io/$OWNER/order-api:${{ github.sha }}
          docker push ghcr.io/$OWNER/order-api:latest

      - name: Azure Login (OIDC Passwordless)
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Deploy to Azure Container Apps
        run: |
          OWNER=$(echo "${{ github.repository_owner }}" | tr '[:upper:]' '[:lower:]')

          # Ensure containerapp extension is installed
          az extension add --name containerapp --upgrade --yes

          # Set active subscription
          az account set --subscription ${{ secrets.AZURE_SUBSCRIPTION_ID }}

          # Update Catalog API
          az containerapp update \
            --name catalog-api \
            --resource-group Test \
            --subscription ${{ secrets.AZURE_SUBSCRIPTION_ID }} \
            --image ghcr.io/$OWNER/catalog-api:${{ github.sha }}

          # Update Order API
          az containerapp update \
            --name order-api \
            --resource-group Test \
            --subscription ${{ secrets.AZURE_SUBSCRIPTION_ID }} \
            --image ghcr.io/$OWNER/order-api:${{ github.sha }}
```

---

## 🛠️ Comprehensive Troubleshooting Guide

Real-world production engineering involves identifying, diagnosing, and resolving edge cases across authentication, networking, and runtime environments. Below are the actual scenarios encountered and their resolutions.

---

### Case 1: ARM Template CPU Scale Rule Preflight Error
* **Error Message:**
  ```text
  ContainerAppInvalidCPUOrMemoryScaleTrigger:
  "The cpu trigger is invalid. value property in metadata is required."
  ```
* **Root Cause:** In older Azure Container App API versions, CPU scale rules used `"utilization": "75"`. In current KEDA specifications, the rule requires `type: "Utilization"` with a `value` key.
* **Resolution:**
  ```json
  // Incorrect:
  "metadata": { "utilization": "75" }

  // Correct:
  "metadata": {
    "type": "Utilization",
    "value": "75"
  }
  ```

---

### Case 2: OIDC Handshake Failure (AADSTS700213)
* **Error Message:**
  ```text
  AADSTS700213: No matching federated identity record found for presented assertion subject
  'repo:ckpal9727@95668324/Ecom-MicroService@1461402650:ref:refs/heads/main'.
  ```
* **Root Cause:** GitHub Actions added immutable numeric account and repository IDs (`@95668324` and `@1461402650`) to the OIDC token claims for improved security. When Azure validated the assertion, the subject identifier did not match.
* **Resolution:**
  In Azure Portal ➔ Managed Identity ➔ Federated Credentials:
  * Provided **Organization ID** (`95668324`) and **Repository ID** (`1461402650`) in the Azure wizard, OR
  * Used the **Other** scenario to paste the exact subject identifier string:
    `repo:ckpal9727@95668324/Ecom-MicroService@1461402650:ref:refs/heads/main`

---

### Case 3: Azure CLI "The containerapp does not exist"
* **Error Message:**
  ```text
  ERROR: The containerapp 'catalog-api' does not exist
  Error: Process completed with exit code 3.
  ```
* **Root Cause Analysis (4 contributing factors):**
  1. **Authentication vs Authorization:** Authentication passed in step 6 (`Azure Login`), but the identity had no RBAC role assignment on the resource group. Azure masks unauthorized resources with `404 Not Found` to prevent reconnaissance attacks.
  2. **RBAC Propagation Delay:** Role assignments take 2 to 3 minutes to propagate across Microsoft Entra ID token servers.
  3. **Resource Group Mismatch:** `catalog-api` was deployed in resource group **`Test`**, but the CLI command was targeting **`GST`** (`--resource-group GST`).
  4. **Subscription Context:** Azure CLI required an explicit subscription context.
* **Resolution:**
  1. Assigned **Contributor** role to `gst-id-8c8d` on resource group **`Test`**.
  2. Updated the workflow script to target `--resource-group Test`.
  3. Added `az account set --subscription ${{ secrets.AZURE_SUBSCRIPTION_ID }}` before invoking update commands.

---

### Case 4: HTTP 500 & Azure SQL Error 42119 (Monthly Quota Paused)
* **Symptom:** Browser returned `HTTP ERROR 500` when calling `https://<catalog-api-url>/products`.
* **Troubleshooting with Azure Log Stream:**
  1. Navigated to **`catalog-api`** in Azure Portal.
  2. Opened **Monitoring** ➔ **Log stream** (connected directly to the live replica).
  3. Refreshed the browser and inspected the real-time exception:
     ```text
     at Program.<>c.<<<Main>$>b__0_2>d.MoveNext() in /src/Program.cs:line 38
     ClientConnectionId:178933ed-a697-4e37-826a-3b834d3a038e
     Error Number:42119,State:1,Class:20
     ```
* **Root Cause:** Error 42119 occurs when an **Azure SQL Database Free Offer** consumes its 100,000 monthly vCore-seconds allowance. Azure auto-pauses the database to prevent unexpected billing.
* **Resolution:**
  * Demonstrated passwordless SQL Managed Identity connection strings.
  * Switched the active test runtime to a high-performance in-memory repository to allow 100% free, decoupled microservices testing.

---

### Case 5: .NET 10 Preview MissingMethodException
* **Symptom:**
  ```text
  System.MissingMethodException: Method not found:
  'System.String Microsoft.EntityFrameworkCore.Diagnostics.AbstractionsStrings.ArgumentIsEmpty(System.Object)'.
     at Microsoft.EntityFrameworkCore.InMemoryDbContextOptionsExtensions.UseInMemoryDatabase(...)
  ```
* **Root Cause:** .NET 10 is currently in preview. Different preview versions of `Microsoft.EntityFrameworkCore.InMemory` and internal EF Core abstraction DLLs had incompatible method signatures.
* **Resolution:**
  Replaced preview EF Core packages with a native C# thread-safe `ConcurrentDictionary` store:
  ```csharp
  var products = new ConcurrentDictionary<int, Product>();
  // Pre-seed mock data
  products.TryAdd(1, new Product { Id = 1, Name = "Pro Gaming Laptop", Price = 1299.99m, Stock = 15 });
  builder.Services.AddSingleton(products);
  ```
  Result: Zero external package version clashes and sub-millisecond API responses.

---

## 🔍 Production Verification & Testing

### 1. Test Catalog API (Public)
Open in any browser:
```text
https://catalog-api.<unique-hash>.centralindia.azurecontainerapps.io/products
```
**Expected Response:**
```json
[
  {
    "id": 1,
    "name": "Pro Gaming Laptop",
    "description": "16GB RAM, RTX 4070",
    "price": 1299.99,
    "stock": 15
  },
  {
    "id": 2,
    "name": "Wireless Noise-Canceling Headphones",
    "description": "Active Noise Cancellation",
    "price": 199.99,
    "stock": 50
  },
  {
    "id": 3,
    "name": "Mechanical Keyboard RGB",
    "description": "Hot-swappable switches",
    "price": 89.99,
    "stock": 100
  }
]
```

### 2. Verify Internal Microservice Isolation
Opening `https://order-api.internal.<unique-hash>.centralindia.azurecontainerapps.io/` in a public browser results in:
```text
Error 404 - This Container App is stopped or does not exist.
```
This confirms that the cluster firewall is functioning properly: `order-api` is accessible *only* by `catalog-api` over the internal network.

---

## 🧹 Cleanup & Teardown

To avoid incurring ongoing charges:
1. Open the [Azure Portal](https://portal.azure.com).
2. Go to **Resource groups** ➔ **`Test`**.
3. Click **Delete resource group** at the top.
4. Type `Test` to confirm and click **Delete**.
*(This deletes `demo-ecommerce-env`, `catalog-api`, `order-api`, and all associated network components in 1 click).*
