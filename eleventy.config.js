import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const fmt = (d, opts) => new Date(d).toLocaleDateString("en-US", { timeZone: "UTC", ...opts });

export default function (eleventyConfig) {
  // Cache-bust the stylesheet: the URL changes whenever style.css changes
  eleventyConfig.addGlobalData("cssVersion", () =>
    createHash("md5").update(readFileSync("src/css/style.css")).digest("hex").slice(0, 8)
  );
  eleventyConfig.addPassthroughCopy({ "src/fonts": "fonts", "src/css": "css", "src/images": "images", "src/static": "/" });

  // Engraved "plate" illustration. Source images are 3:2 (2048x1360).
  eleventyConfig.addShortcode("plate", (img, alt = "", sizes = "100vw", eager = false, widths = [480, 800, 1200, 1600]) => {
    if (!img) return "";
    const p = `/images/plates/${img}`;
    const srcset = widths.map((w) => `${p}-${w}.webp ${w}w`).join(", ");
    const esc = String(alt).replace(/"/g, "&quot;");
    return `<picture><source type="image/webp" srcset="${srcset}" sizes="${sizes}"><img src="${p}-1200.jpg" alt="${esc}" width="1200" height="797" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></picture>`;
  });

  eleventyConfig.addCollection("posts", (api) =>
    api.getFilteredByTag("posts").sort((a, b) => b.date - a.date)
  );

  eleventyConfig.addFilter("longDate", (d) => fmt(d, { year: "numeric", month: "long", day: "numeric" }));
  eleventyConfig.addFilter("dayDate", (d) => fmt(d, { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));
  // Volume = year of publication counted from the first year (2025 = Vol. I)
  eleventyConfig.addFilter("volume", (d) => ROMAN[new Date(d).getUTCFullYear() - 2024] || "");
  eleventyConfig.addFilter("plain", (html = "") => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
  eleventyConfig.addFilter("paragraphs", (html = "", start = 0, count = 1) =>
    (html.match(/<p>[\s\S]*?<\/p>/g) || []).slice(start, start + count).join("\n")
  );
  eleventyConfig.addFilter("excerpt", (html = "", len = 220) => {
    // Gather whole paragraphs until we reach roughly `len` characters
    const paras = (html.match(/<p>([\s\S]*?)<\/p>/g) || []).map((p) => p.replace(/<[^>]+>/g, "").trim()).filter(Boolean);
    let out = "";
    for (const p of paras) { if (out && out.length + p.length > len * 1.25) break; out += (out ? " " : "") + p; if (out.length >= len * 0.6) break; }
    return out.length > len * 1.25 ? out.slice(0, out.lastIndexOf(" ", len)) + "…" : out;
  });
  eleventyConfig.addFilter("readMins", (html = "") =>
    Math.max(1, Math.round(html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length / 230))
  );
  eleventyConfig.addFilter("upper", (s = "") => s.toUpperCase());
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v));

  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom",
    outputPath: "/feed.xml",
    collection: { name: "posts", limit: 20 },
    metadata: {
      language: "en",
      title: "Artificially Intelligent Life",
      subtitle: "Dispatches on artificial intelligence, design and the creative trade, by Todd Blackmon.",
      base: "https://artificiallyintelligent.life/",
      author: { name: "Todd Blackmon" },
    },
  });

  return { dir: { input: "src", output: "_site" }, markdownTemplateEngine: "njk", htmlTemplateEngine: "njk" };
}
