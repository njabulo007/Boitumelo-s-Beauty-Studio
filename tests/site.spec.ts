import { test, expect } from "@playwright/test";
test("public site, navigation, lightbox, missing-contact feedback and fallback", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/images.unsplash.com/**", (route) => route.abort());
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "A little care.",
  );
  await expect(page.locator("#contact")).toContainText(
    "13074 Lehole Street, Tsakane, Brakpan",
  );
  await expect(
    page.getByRole("link", { name: "Get directions" }),
  ).toHaveAttribute("href", /13074%20Lehole%20Street/);
  await expect(page.locator("body")).not.toContainText(
    /demo|sample|website preview/i,
  );
  await page.getByRole("tab", { name: /Hair/ }).click();
  await expect(page.getByRole("tabpanel")).toContainText("Protective styling");
  await page.getByRole("tab", { name: /Nails/ }).click();
  await expect(page.getByRole("tabpanel")).toContainText("Gel manicure");
  await page.getByRole("button", { name: "View A soft touch of pink" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.locator(".hero-actions button").click();
  await expect(page.getByRole("status")).toContainText(
    "WhatsApp number is confirmed",
  );
  await expect(page.locator(".hero-visual .image-fallback")).toBeVisible();
  await page
    .getByRole("button", { name: "Do I need an account to enquire?" })
    .click();
  await expect(page.locator("#faq-1")).toContainText("No.");
  expect(errors).toEqual([]);
});
test("owner edits shared prices, publishes and ends an offer", async ({
  page,
}) => {
  await page.goto("/#owner");
  await page.getByRole("button", { name: "Open owner dashboard" }).click();
  await page
    .getByRole("button", { name: "Services & pricing", exact: true })
    .click();
  await page
    .locator(".management-row")
    .filter({ hasText: "Classic pedicure" })
    .getByRole("button", { name: "Edit", exact: true })
    .click();
  await page.getByLabel("Regular price (R)").fill("350");
  await page.getByRole("button", { name: "Save service" }).click();
  await page
    .getByRole("link", { name: "View website", exact: true })
    .first()
    .click();
  await expect(
    page.locator(".service-row").filter({ hasText: "Classic pedicure" }),
  ).toContainText("350");
  await page.goto("/#owner");
  await page.getByRole("button", { name: "Promotions", exact: true }).click();
  await page.getByRole("button", { name: "Create offer" }).click();
  await page.getByLabel("Offer title").fill("A fresh pedicure");
  await page
    .getByLabel("Description", { exact: true })
    .fill("A sample treat for your feet.");
  await page.getByLabel("Linked service").selectOption("pedi");
  await page.getByLabel("Offer price (R)").fill("300");
  await page.getByLabel("Publish when within").check();
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("A fresh pedicure");
  await page.getByRole("button", { name: "Back to editing" }).click();
  await page.getByRole("button", { name: "Save & publish" }).click();
  await expect(
    page.locator(".promo-card").filter({ hasText: "A fresh pedicure" }),
  ).toContainText("ACTIVE");
  await page
    .getByRole("link", { name: "View website", exact: true })
    .first()
    .click();
  await expect(
    page.locator(".offer-feature").filter({ hasText: "A fresh pedicure" }),
  ).toContainText("300");
  await expect(
    page.locator(".service-row").filter({ hasText: "Classic pedicure" }),
  ).toContainText("300");
  await page.goto("/#owner");
  await page.getByRole("button", { name: "Promotions", exact: true }).click();
  await page
    .locator(".promo-card")
    .filter({ hasText: "A fresh pedicure" })
    .getByRole("button", { name: "End offer" })
    .click();
  await page.goto("/#home");
  await expect(
    page.locator(".service-row").filter({ hasText: "Classic pedicure" }),
  ).toContainText("350");
  await expect(
    page.locator(".offer-feature").filter({ hasText: "A fresh pedicure" }),
  ).toHaveCount(0);
});
test("registration, sign-out, password reset explanation and owner/customer separation", async ({
  page,
}) => {
  await page.goto("/#rewards");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByLabel("Your first name").fill("Test");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("test@example.test");
  await page.getByLabel("Password", { exact: true }).fill("demo-pass-123");
  await page
    .locator("form")
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.locator(".account-title")).toContainText("Test");
  await expect(
    page.getByRole("button", { name: "Record completed visit" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.getByRole("button", { name: "Forgot your password?" }).click();
  await page
    .getByLabel("Email address", { exact: true })
    .fill("test@example.test");
  await page.getByRole("button", { name: "Show reset options" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Password reset emails are not available yet",
  );
  await page.getByRole("button", { name: "Back to sign in" }).click();
  await page
    .getByLabel("Email address", { exact: true })
    .fill("test@example.test");
  await page.getByLabel("Password", { exact: true }).fill("demo-pass-123");
  await page
    .getByRole("button", { name: "Sign in", exact: true })
    .last()
    .click();
  await expect(page.locator(".account-title")).toContainText("Test");
  await page.goto("/#owner");
  await expect(
    page.getByRole("button", { name: "Open owner dashboard" }),
  ).toBeVisible();
});
test("five owner-recorded visits earn one reward and redemption updates customer history", async ({
  page,
}) => {
  await page.goto("/#owner");
  await page.getByRole("button", { name: "Open owner dashboard" }).click();
  await page
    .getByRole("button", { name: "Customers & rewards", exact: true })
    .click();
  for (let i = 0; i < 5; i++) {
    await page.getByLabel("Service received").selectOption("gel");
    await page
      .getByRole("button", { name: "Record completed visit", exact: true })
      .click();
    await page.getByRole("button", { name: "Confirm completed visit" }).click();
  }
  await expect(page.locator(".customer-summary")).toContainText("5");
  await page
    .getByRole("button", { name: "Redeem reward", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Redeem reward", exact: true }),
  ).toBeDisabled();
  await page.goto("/#rewards");
  await page.getByRole("button", { name: "Explore rewards" }).click();
  await expect(page.locator(".history-list")).toContainText("Reward redeemed");
  await expect(page.locator(".history-list>div")).toHaveCount(6);
});
test("gallery caption, category management and reset", async ({ page }) => {
  await page.goto("/#owner");
  await page.getByRole("button", { name: "Open owner dashboard" }).click();
  await page
    .getByRole("button", { name: "Services & pricing", exact: true })
    .click();
  await page.getByRole("button", { name: "Manage categories" }).click();
  await page.getByLabel("Add a category", { exact: true }).fill("Lashes");
  await page.getByRole("button", { name: "Add category", exact: true }).click();
  await expect(page.locator(".category-list")).toContainText("Lashes");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Gallery", exact: true }).click();
  await page
    .locator(".gallery-admin-card")
    .first()
    .getByRole("button", { name: "Edit / replace" })
    .click();
  await page
    .getByLabel("Caption", { exact: true })
    .fill("Fresh pink inspiration");
  await page.getByRole("button", { name: "Save photograph" }).click();
  await page.goto("/#gallery");
  await expect(
    page.getByRole("button", { name: "View Fresh pink inspiration" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Lashes", exact: true }),
  ).toBeVisible();
  await page.goto("/#owner");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Reset workspace data" }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Open owner dashboard" }),
  ).toBeVisible();
});
for (const width of [360, 390, 768, 1440])
  test(`no horizontal overflow at ${width}px; public and account layouts`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    if (width < 800) {
      await page.getByRole("button", { name: "Open navigation" }).click();
      await page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: "Services", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Open navigation" }),
      ).toBeVisible();
    }
    await page.goto("/#rewards");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.goto("/#owner");
    await page.getByRole("button", { name: "Open owner dashboard" }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    if (width < 800)
      await page.getByRole("button", { name: "Toggle dashboard menu" }).click();
    await page
      .getByRole("button", { name: "Customers & rewards", exact: true })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  });
test("reduced motion and keyboard-visible navigation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe("auto");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
});

test("image upload validation, compressed preview, persistence and confirmed removal", async ({
  page,
}) => {
  await page.goto("/#owner");
  await page.getByRole("button", { name: "Open owner dashboard" }).click();
  await page.getByRole("button", { name: "Gallery", exact: true }).click();
  await page.getByRole("button", { name: "Add photograph" }).click();
  await page.getByLabel("Choose a photograph", { exact: true }).setInputFiles({
    name: "bad.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not an image"),
  });
  await expect(page.getByRole("alert")).toContainText("JPG, PNG or WebP");
  const data = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 1600;
    c.height = 1000;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#cf9d94";
    ctx.fillRect(0, 0, 1600, 1000);
    return c.toDataURL("image/png").split(",")[1];
  });
  await page.getByLabel("Choose a photograph", { exact: true }).setInputFiles({
    name: "demo-photo.png",
    mimeType: "image/png",
    buffer: Buffer.from(data, "base64"),
  });
  await expect(page.locator(".photo-preview img")).toBeVisible();
  await page
    .getByLabel("Caption", { exact: true })
    .fill("A local demo picture");
  await page
    .getByLabel("Alternative text", { exact: true })
    .fill("A blush-coloured illustrative test image");
  await page.getByRole("button", { name: "Save photograph" }).click();
  await expect(
    page
      .locator(".gallery-admin-card")
      .filter({ hasText: "A local demo picture" }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Gallery", exact: true }).click();
  const card = page
    .locator(".gallery-admin-card")
    .filter({ hasText: "A local demo picture" });
  await expect(card).toBeVisible();
  await card
    .getByRole("button", { name: "Remove A local demo picture", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(card).toHaveCount(0);
});
