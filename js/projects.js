// ----------------------- PROJECTS GITGRAPH ----------------------- //

var C = GitGraphCommon;
var colorCycler = C.createColorCycler(["#f85149", "#58a6ff", "#d29922", "#3fb950", "#bc8cff"]);
var myTemplate = C.createTemplate({colors: ["#f85149", "#58a6ff", "#d29922", "#3fb950", "#bc8cff"]});

var gitgraph = new GitGraph({
  template: myTemplate,
  author: "",
});

// ---- MAIN BRANCH ----
var branch_color = colorCycler.next();
var career = gitgraph
  .branch({name: "career", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "", message: "Research Projects"});

// ---- UMH Projects ----
branch_color = colorCycler.next();
var umh = career
  .branch({name: "UMH", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "UMH (2022–present)", message: " "})
  .commit({message: "[Oct 2025 – Currently] · TED2021", detailId: "detail-TED2021"})
  .commit({message: "[Jan 2025 – Oct 2025] · AViRobots", detailId: "detail-AViRobots"})
  .commit({message: "[Nov 2022 – Dec 2024] · PROMETEO", detailId: "detail-PROMETEO"})
  .commit({message: "[Dec 2024 – Currently] · ACTVIS", detailId: "detail-ACTVIS"})
  .merge(career, {message: "merge UMH", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
career.checkout();

// ---- GMV Projects ----
branch_color = colorCycler.next();
var gmv = career
  .branch({name: "GMV", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "GMV (2017–2021)", message: " "})
  .commit({message: "[Mar 2019 – Oct 2021] · MOSAR", detailId: "detail-MOSAR"})
  .commit({message: "[Feb 2019 – Oct 2021] · PROACT", detailId: "detail-PROACT"})
  .commit({message: "[Feb 2019 – Oct 2021] · ADE", detailId: "detail-ADE"})
  .commit({message: "[Jan 2018 – Jan 2019] · ERGO", detailId: "detail-ERGO"})
  .commit({message: "[Feb 2017 – May 2018] · GOTCHA", detailId: "detail-GOTCHA"})
  .merge(career, {message: "merge GMV", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
career.checkout();

// ---- Other ----
branch_color = colorCycler.next();
var other = career
  .branch({name: "other", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "Other", message: " "})
  .commit({message: "HIDALGO", detailId: "detail-HIDALGO"})
  .commit({message: "Other projects", detailId: "detail-Other"})
  .merge(career, {message: "merge other", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();

career.commit({message: " ", messageColor: "#6e7681"});

// ---- Finalize ----
C.finalize(gitgraph, myTemplate);

