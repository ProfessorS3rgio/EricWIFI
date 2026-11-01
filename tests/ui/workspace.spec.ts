import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
test("public pages, auth boundary, collection workflow, and responsive layout", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Your connection/ }),
  ).toBeVisible();
  await expect(page.getByText("Maria Santos")).toBeVisible();
  await expect(page.getByText("09171234567")).toHaveCount(0);
  await expect(page.getByText("San Isidro")).toHaveCount(0);
  await page.getByLabel("Find your bill").fill("unknown");
  await expect(
    page.getByRole("heading", { name: "No matching bills." }),
  ).toBeVisible();
  await page.getByLabel("Find your bill").fill("Maria");
  await expect(page.getByText("Maria Santos")).toBeVisible();
  await page.getByLabel("Filter bill status").selectOption("paid");
  await expect(page.getByText("Maria Santos")).toHaveCount(0);
  await page.getByLabel("Filter bill status").selectOption("all");
  await page.getByLabel("Find your bill").fill("");
  await page.setViewportSize({ width: 1440, height: 1000 });
  mkdirSync("test-results/previews", { recursive: true });
  await page.screenshot({
    path: "test-results/previews/home-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/previews/home-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  expect((await request.post("/api/payments", { data: {} })).status()).toBe(
    401,
  );
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Admin MPIN").fill("1234");
  await page.getByRole("button", { name: "Open workspace" }).click();
  await expect(
    page.getByRole("heading", { name: /A clear view/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: /Collected in \d{4}/ }),
  ).toContainText("₱200.00");
  await expect(page.getByText("Maria Santos")).toBeVisible();
  expect(
    (
      await page.request.post("/api/payments", {
        headers: {
          Origin: "https://untrusted.example",
          Cookie: (await page.context().cookies())
            .map((cookie) => `${cookie.name}=${cookie.value}`)
            .join("; "),
        },
        data: {},
      })
    ).status(),
  ).toBe(403);
  await page.screenshot({
    path: "test-results/previews/dashboard-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/previews/dashboard-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Clients", exact: true }).click();
  await page.getByLabel("Search clients").fill("unknown");
  await expect(
    page.getByRole("heading", { name: "No matching clients." }),
  ).toBeVisible();
  await page.getByLabel("Search clients").fill("Maria");
  await page
    .getByRole("link", { name: /Maria Santos/ })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Monthly bills" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Edit client" }).click();
  await page.getByLabel("Full name").fill("Maria Santos Updated");
  await page.getByLabel("Internet plan").fill("Home 100 Mbps");
  await page.getByLabel("Monthly fee").fill("999.50");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("heading", { name: /Maria Santos Updated/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("row").filter({ hasText: "₱799.25" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Collect", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Record a payment" }),
  ).toBeVisible();
  await page.getByLabel("Amount received").fill("100.25");
  await page.getByRole("button", { name: "Review payment" }).click();
  await expect(
    page.getByRole("heading", { name: "Everything look right?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirm & save payment" }).click();
  await expect(page.getByRole("status")).toContainText("100.25");
  await page.getByRole("button", { name: "Void", exact: true }).first().click();
  await page.getByLabel("Reason").fill("Test correction");
  await page.getByRole("button", { name: "Confirm void" }).click();
  await expect(page.getByText("Test correction")).toBeVisible();
  await page.goto("/customer?token=33333333-3333-4333-8333-333333333333");
  await expect(
    page.getByRole("heading", { name: "A clear connection." }),
  ).toBeVisible();
  await expect(page.getByText("09171234567")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/previews/customer-mobile.png",
    fullPage: true,
  });
  await page.goto("/customer?phone=09171234567");
  await expect(page.getByText("Maria Santos", { exact: false })).toHaveCount(0);
  await page.goto("/clients/new");
  await page.getByLabel(/Full name/).fill("Juan Dela Cruz");
  await page.getByLabel(/Internet plan/).fill("Home 25 Mbps");
  await page.getByLabel(/Monthly fee/).fill("499.50");
  await page.getByRole("button", { name: /Save client/ }).click();
  await expect(page).toHaveURL(/\/clients$/);
  await expect(page.getByText("Juan Dela Cruz")).toBeVisible();
});
