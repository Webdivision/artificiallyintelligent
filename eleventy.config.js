import { feedPlugin } from "@11ty/eleventy-plugin-rss";

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const fmt = (d, opts) => new Date(d).toLocaleDateString("en-US", { timeZone: "UTC", ...opts });

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/fonts": "fonts", "src/css": "css", "src/static": "/" });

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
