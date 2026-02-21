// ----------------------- GALLERY GITGRAPH ----------------------- //

var C = GitGraphCommon;
var galleryColors = ["#6e7681", "#bc8cff", "#d29922", "#58a6ff", "#3fb950", "#f85149", "#d29922"];
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

// ---- UMH ----
branch_color = colorCycler.next();
var umh = gallery
  .branch({name: "UMH", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "UMH", message: " "})
  .commit({message: "[06/2022] · TFM", detailId: "umh-tfm-2022"})
  .merge(gallery, {message: "merge UMH", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
gallery.checkout();

// ---- PROACT ----
branch_color = colorCycler.next();
var proact = gallery
  .branch({name: "PROACT", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "PROACT", message: " "})
  .commit({message: "[04/2021] · PROACT", detailId: "proact-2021"})
  .merge(gallery, {message: "merge PROACT", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
gallery.checkout();

// ---- ADE ----
branch_color = colorCycler.next();
var ade = gallery
  .branch({name: "ADE", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "ADE", message: " "})
  .commit({message: "[10/2020] · Bremen Field Tests (2nd Campaign)", detailId: "ade-bremen-2020-10"})
  .commit({message: "[07/2020] · Bremen Field Tests", detailId: "ade-bremen-2020-07"})
  .merge(gallery, {message: "merge ADE", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
gallery.checkout();

// ---- ERGO ----
branch_color = colorCycler.next();
var ergo = gallery
  .branch({name: "ERGO", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "ERGO", message: " "})
  .commit({message: "[12/2018] · Gara Medouar, Morocco", detailId: "ergo-morocco-2018"})
  .commit({message: "[11/2018] · Xaluka Workshop", detailId: "ergo-xaluka-2018"})
  .commit({message: "[08/2018] · Bremen Field Tests", detailId: "ergo-bremen-2018"})
  .commit({message: "[08/2018] · GMV Lab – Orbital Scenario", detailId: "ergo-gmv-2018"})
  .merge(gallery, {message: "merge ERGO", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
gallery.checkout();

// ---- GOTCHA ----
branch_color = colorCycler.next();
var gotcha = gallery
  .branch({name: "GOTCHA", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "GOTCHA", message: " "})
  .commit({message: "[05/2018] · Colmenar Field Tests", detailId: "gotcha-colmenar-2018"})
  .commit({message: "[12/2017] · GOTCHA GMV Marsyard", detailId: "gotcha-2017"})
  .merge(gallery, {message: "merge GOTCHA", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
gallery.checkout();

// ---- HIDALGO ----
branch_color = colorCycler.next();
var hidalgo = gallery
  .branch({name: "HACKLAB", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "HACKLAB", message: " "})
  .commit({message: "[12/2015] · Hidalgo presentations and Hacklab team", detailId: "hidalgo-hacklab-2015"})
  .commit({message: "[12/2014] · Hacklab challenge", detailId: "hacklab-challenge-2014"})
  .merge(gallery, {message: "merge HACKLAB", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();

gallery.commit({message: " ", messageColor: "#6e7681"});
// ---- Finalize ----
C.finalize(gitgraph, myTemplate);

// ---- Collect gallery items for lightbox navigation after layout ----
if (typeof collectGalleryItems === "function") {
  setTimeout(collectGalleryItems, 200);
}