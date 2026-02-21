// ----------------------- ACADEMIC GITGRAPH ----------------------- //

var C = GitGraphCommon;
var colorCycler = C.createColorCycler(["#58a6ff", "#3fb950", "#d29922", "#f85149", "#bc8cff"]);
var myTemplate = C.createTemplate({colors: ["#58a6ff", "#3fb950", "#d29922", "#f85149", "#bc8cff"]});

var gitgraph = new GitGraph({
  template: myTemplate,
  author: "",
});

// ---- MAIN BRANCH ----
var branch_color = colorCycler.next();
var academic = gitgraph
  .branch({name: "academic", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "", message: "Academic Journey"});

// ---- PhD ----
branch_color = colorCycler.next();
var phd = academic
  .branch({name: "PhD", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "PhD", message: " "})
  .commit({message: "[2022 – Currently] · PhD in Industrial & Telecom Technologies · UMH", detailId: "detail-phd"})
  .merge(academic, {message: "merge PhD", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
academic.checkout();

// ---- Master ----
branch_color = colorCycler.next();
var msc = academic
  .branch({name: "Master", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "M.Sc.", message: " "})
  .commit({message: "[2021 – 2022] · M.Sc. Robotics · UMH", detailId: "detail-msc"})
  .merge(academic, {message: "merge Master", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
academic.checkout();

// ---- Degree ----
branch_color = colorCycler.next();
var bsc = academic
  .branch({name: "Degree", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "B.Sc.", message: " "})
  .commit({message: "[2012 – 2018] · B.Sc. Electronics & Automation · UPM", detailId: "detail-bsc"})
  .merge(academic, {message: "merge Degree", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();

academic.commit({message: " ", messageColor: "#6e7681"});

// ---- Finalize ----
C.finalize(gitgraph, myTemplate);
