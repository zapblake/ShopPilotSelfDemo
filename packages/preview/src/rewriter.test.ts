import assert from "node:assert";
import {
  rewriteLinks,
  injectBanner,
  injectBase,
  neutralizeCheckoutScripts,
  neutralizeForms,
  rewriteHtml,
} from "./rewriter";

const baseOptions = {
  previewJobId: "job123",
  originalDomain: "example-store.com",
  previewBasePath: "/p/job123",
  mode: "dev" as const,
};

// --- rewriteLinks ---

function testRewriteInternalLink() {
  const html = '<a href="/products/king-mattress">Mattress</a>';
  const result = rewriteLinks(html, baseOptions);
  assert(
    result.includes('href="/p/job123/products/king-mattress"'),
    `Internal link should be rewritten. Got: ${result}`
  );
  console.log("PASS: rewriteLinks - internal link rewritten");
}

function testRewriteExternalLink() {
  const html = '<a href="https://google.com">Google</a>';
  const result = rewriteLinks(html, baseOptions);
  assert(
    result.includes('href="https://google.com"'),
    `External link href should be unchanged. Got: ${result}`
  );
  assert(
    result.includes('target="_blank"'),
    `External link should have target="_blank". Got: ${result}`
  );
  console.log("PASS: rewriteLinks - external link unchanged with target=_blank");
}

function testRewriteSameDomainFullUrl() {
  const html = '<a href="https://example-store.com/collections/beds">Beds</a>';
  const result = rewriteLinks(html, baseOptions);
  assert(
    result.includes('href="/p/job123/collections/beds"'),
    `Same-domain full URL should be rewritten. Got: ${result}`
  );
  console.log("PASS: rewriteLinks - same-domain full URL rewritten");
}

function testRewriteRootLink() {
  const html = '<a href="/">Home</a>';
  const result = rewriteLinks(html, baseOptions);
  assert(
    result.includes('href="/p/job123/"'),
    `Root link should be rewritten. Got: ${result}`
  );
  console.log("PASS: rewriteLinks - root link rewritten");
}

function testRewriteSubdomainMode() {
  const html = '<a href="/products/foo">Foo</a>';
  const result = rewriteLinks(html, { ...baseOptions, mode: "subdomain", previewBasePath: "" });
  assert(
    result.includes('href="/products/foo"'),
    `Subdomain mode should keep path as-is. Got: ${result}`
  );
  console.log("PASS: rewriteLinks - subdomain mode keeps path");
}

// --- injectBanner ---

function testInjectBanner() {
  const html = "<html><body><h1>Hello</h1></body></html>";
  const result = injectBanner(html, "job123", "My Store");
  assert(
    result.includes("zapsight-preview-banner"),
    `Banner should be injected. Got: ${result}`
  );
  assert(
    result.includes("My Store"),
    `Banner should contain store name. Got: ${result}`
  );
  console.log("PASS: injectBanner - banner injected with store name");
}

// --- injectBase ---

function testInjectBase() {
  const html = "<html><head><title>Test</title></head><body></body></html>";
  const result = injectBase(html, "example-store.com");
  assert(
    result.includes('<base href="https://example-store.com/"'),
    `Base tag should be injected. Got: ${result}`
  );
  console.log("PASS: injectBase - base tag added");
}

function testInjectBaseSkipsExisting() {
  const html = '<html><head><base href="https://other.com/" /><title>Test</title></head></html>';
  const result = injectBase(html, "example-store.com");
  assert(
    !result.includes("example-store.com"),
    `Should not override existing base tag. Got: ${result}`
  );
  console.log("PASS: injectBase - skips existing base tag");
}

// --- neutralizeCheckoutScripts ---

function testNeutralizeCheckoutScript() {
  const html = '<script>window.location.href = "/checkout";</script>';
  const result = neutralizeCheckoutScripts(html);
  assert(
    !result.includes("window.location"),
    `Checkout script should be removed. Got: ${result}`
  );
  assert(
    result.includes("<!-- [ZapSight Preview]"),
    `Should have comment marker. Got: ${result}`
  );
  console.log("PASS: neutralizeCheckoutScripts - checkout script removed");
}

function testKeepsSafeScripts() {
  const html = "<script>console.log('hello');</script>";
  const result = neutralizeCheckoutScripts(html);
  assert(
    result.includes("console.log"),
    `Safe script should be kept. Got: ${result}`
  );
  console.log("PASS: neutralizeCheckoutScripts - safe script kept");
}

// --- neutralizeForms ---

function testNeutralizeForms() {
  const html = '<form action="/cart/add" method="POST"><button>Add</button></form>';
  const result = neutralizeForms(html);
  assert(
    result.includes("event.preventDefault()"),
    `Form should have preventDefault. Got: ${result}`
  );
  console.log("PASS: neutralizeForms - form submission prevented");
}

// --- rewriteHtml (integration) ---

function testFullRewrite() {
  const html = `<html><head><title>Store</title></head><body>
    <a href="/">Home</a>
    <a href="https://google.com">External</a>
    <script>window.location.href="/checkout";</script>
    <form action="/cart"><button>Submit</button></form>
  </body></html>`;

  const result = rewriteHtml(html, { ...baseOptions, storeName: "Test Store" });

  assert(result.includes("zapsight-preview-banner"), "Should have banner");
  assert(result.includes('<base href="https://example-store.com/"'), "Should have base tag");
  assert(result.includes('href="/p/job123/"'), "Should rewrite root link");
  assert(result.includes('target="_blank"'), "Should add target=_blank to external");
  assert(result.includes("<!-- [ZapSight Preview]"), "Should remove checkout script");
  assert(result.includes("event.preventDefault()"), "Should neutralize form");

  console.log("PASS: rewriteHtml - full integration test");
}

// Run all tests
console.log("Running rewriter tests...\n");
testRewriteInternalLink();
testRewriteExternalLink();
testRewriteSameDomainFullUrl();
testRewriteRootLink();
testRewriteSubdomainMode();
testInjectBanner();
testInjectBase();
testInjectBaseSkipsExisting();
testNeutralizeCheckoutScript();
testKeepsSafeScripts();
testNeutralizeForms();
testFullRewrite();
console.log("\nAll tests passed!");
