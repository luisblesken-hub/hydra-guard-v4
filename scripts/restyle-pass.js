const fs = require("fs");
const path = require("path");

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.tsx?$/.test(e.name)) files.push(p);
  }
})("src");

const reps = [
  [/bg-emerald-500/g, "bg-hg-ink"],
  [/hover:bg-emerald-400/g, "hover:bg-hg-steel"],
  [/hover:bg-emerald-700/g, "hover:bg-hg-steel"],
  [/bg-emerald-600/g, "bg-hg-ink"],
  [/bg-indigo-600/g, "bg-hg-steel"],
  [/hover:bg-indigo-700/g, "hover:bg-hg-ink"],
  [/hover:bg-indigo-500/g, "hover:bg-hg-steel"],
  [/bg-indigo-700/g, "bg-hg-ink"],
  [/text-emerald-600/g, "text-hg-steel"],
  [/text-emerald-500/g, "text-hg-steel"],
  [/text-emerald-700/g, "text-hg-steel"],
  [/text-emerald-400/g, "text-hg-accent"],
  [/text-emerald-800/g, "text-slate-800"],
  [/bg-emerald-100/g, "bg-slate-100"],
  [/bg-emerald-50/g, "bg-slate-50"],
  [/border-emerald-200/g, "border-hg-line"],
  [/border-emerald-300/g, "border-hg-line"],
  [/focus:border-emerald-400/g, "focus:border-hg-steel"],
  [/focus:border-indigo-500/g, "focus:border-hg-steel"],
  [/file:bg-indigo-600/g, "file:bg-hg-ink"],
  [/hover:file:bg-indigo-500/g, "hover:file:bg-hg-steel"],
  [/bg-sky-700/g, "bg-hg-steel"],
  [/hover:bg-sky-800/g, "hover:bg-hg-ink"],
  [/border-sky-200/g, "border-hg-line"],
  [/bg-sky-50\/80/g, "bg-slate-50"],
  [/text-sky-950/g, "text-hg-ink"],
  [/text-sky-900\/80/g, "text-slate-600"],
  [/text-sky-800\/70/g, "text-slate-500"],
  [/text-sky-700/g, "text-hg-steel"],
  [/bg-indigo-100/g, "bg-slate-100"],
  [/text-indigo-800/g, "text-slate-800"],
  [/text-indigo-700/g, "text-hg-steel"],
  [/text-indigo-600/g, "text-hg-steel"],
  [/ring-indigo-200/g, "ring-slate-200"],
  [/bg-indigo-600/g, "bg-hg-steel"],
];

let n = 0;
for (const f of files) {
  let c = fs.readFileSync(f, "utf8");
  const o = c;
  for (const [a, b] of reps) c = c.replace(a, b);
  if (c !== o) {
    fs.writeFileSync(f, c);
    n++;
    console.log(f);
  }
}
console.log("updated", n);
