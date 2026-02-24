// ----------------------- GALLERY GITGRAPH ----------------------- //

var C = GitGraphCommon;
var galleryColors = [
  "#6e7681",  // gallery (main)
  "#3fb950",  // UMH
  "#f85149",  // PhD
  "#d29922",  // M.Sc. Thesis
  "#d29922",  // GMV
  "#bc8cff",  // PROACT
  "#58a6ff",  // ADE
  "#f85149",  // ERGO
  "#3fb950",  // GOTCHA
  "#58a6ff",  // UPM
  "#f85149",  // B.Sc. Thesis
  "#bc8cff"   // Hacklab
];
var colorCycler = C.createColorCycler(galleryColors);
var myTemplate = C.createTemplate({colors: galleryColors});

var gitgraph = new GitGraph({
  template: myTemplate,
  author: "",
});

// ---- MAIN BRANCH ----
var branch_color = colorCycler.next();
var gallery = gitgraph
  .branch({name: "gallery", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "", message: "Photo Gallery"});

// ============================================================
// UMH (2021 – present)  — newest → top
// ============================================================
branch_color = colorCycler.next();
var umh = gallery
  .branch({name: "UMH", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "UMH", message: " "});

// ---- PhD (sub-branch of UMH) — placeholder ----
branch_color = colorCycler.next();
var phd = umh
  .branch({name: "PhD", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "PhD", message: " "})
  .merge(umh, {message: "merge PhD", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
umh.checkout();

// ---- M.Sc. Thesis (sub-branch of UMH) ----
branch_color = colorCycler.next();
var mscThesis = umh
  .branch({name: "M.Sc. Thesis", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "M.Sc. Thesis", message: " "})
  .commit({message: "[06/2022] · M.Sc. Thesis", detailId: "umh-tfm-2022"})
  .merge(umh, {message: "merge M.Sc. Thesis", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();

umh.merge(gallery, {message: "merge UMH", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
gallery.checkout();

// ============================================================
// GMV (2017 – 2021)
// ============================================================
branch_color = colorCycler.next();
var gmv = gallery
  .branch({name: "GMV", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "GMV", message: " "});

// ---- PROACT (sub-branch of GMV) — newest GMV project ----
branch_color = colorCycler.next();
var proact = gmv
  .branch({name: "PROACT", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "PROACT", message: " "})
  .commit({message: "[04/2021] · PROACT", detailId: "proact-2021"})
  .merge(gmv, {message: "merge PROACT", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
gmv.checkout();

// ---- ADE (sub-branch of GMV) ----
branch_color = colorCycler.next();
var ade = gmv
  .branch({name: "ADE", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "ADE", message: " "})
  .commit({message: "[10/2020] · Bremen Field Tests (2nd Campaign)", detailId: "ade-bremen-2020-10"})
  .commit({message: "[07/2020] · Bremen Field Tests", detailId: "ade-bremen-2020-07"})
  .merge(gmv, {message: "merge ADE", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
gmv.checkout();

// ---- ERGO (sub-branch of GMV) ----
branch_color = colorCycler.next();
var ergo = gmv
  .branch({name: "ERGO", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "ERGO", message: " "})
  .commit({message: "[12/2018] · Gara Medouar, Morocco", detailId: "ergo-morocco-2018"})
  .commit({message: "[11/2018] · Xaluka Workshop", detailId: "ergo-xaluka-2018"})
  .commit({message: "[08/2018] · Bremen Field Tests", detailId: "ergo-bremen-2018"})
  .commit({message: "[08/2018] · GMV Lab – Orbital Scenario", detailId: "ergo-gmv-2018"})
  .merge(gmv, {message: "merge ERGO", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
gmv.checkout();

// ---- GOTCHA (sub-branch of GMV) — oldest GMV project ----
branch_color = colorCycler.next();
var gotcha = gmv
  .branch({name: "GOTCHA", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "GOTCHA", message: " "})
  .commit({message: "[05/2018] · Colmenar Field Tests", detailId: "gotcha-colmenar-2018"})
  .commit({message: "[12/2017] · GOTCHA GMV Marsyard", detailId: "gotcha-2017"})
  .merge(gmv, {message: "merge GOTCHA", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();

gmv.merge(gallery, {message: "merge GMV", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
gallery.checkout();

// ============================================================
// UPM (2012 – 2018)  — oldest → bottom
// ============================================================
branch_color = colorCycler.next();
var upm = gallery
  .branch({name: "UPM", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "UPM", message: " "});

// ---- B.Sc. Thesis (sub-branch of UPM) — placeholder ----
branch_color = colorCycler.next();
var bscThesis = upm
  .branch({name: "B.Sc. Thesis", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "B.Sc. Thesis", message: " "})
  .merge(upm, {message: "merge B.Sc. Thesis", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
upm.checkout();

// ---- Hacklab (sub-branch of UPM) ----
branch_color = colorCycler.next();
var hacklab = upm
  .branch({name: "Hacklab", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "Hacklab", message: " "})
  .commit({message: "[12/2015] · Hidalgo & Hacklab Team", detailId: "hidalgo-hacklab-2015"})
  .commit({message: "[12/2014] · Hacklab Challenge", detailId: "hacklab-challenge-2014"})
  .merge(upm, {message: "merge Hacklab", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();

upm.merge(gallery, {message: "merge UPM", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();

gallery.commit({message: " ", messageColor: "#6e7681"});
// ---- Finalize ----
C.finalize(gitgraph, myTemplate);

// ---- Collect gallery items for lightbox navigation after layout ----
if (typeof collectGalleryItems === "function") {
  setTimeout(collectGalleryItems, 200);
}