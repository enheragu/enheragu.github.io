// ----------------------- ACADEMIC GITGRAPH ----------------------- //

var C = GitGraphCommon;
var colorCycler = C.createColorCycler([C.palette.blue, C.palette.green, C.palette.amber, C.palette.red, C.palette.purple]);
var myTemplate = C.createTemplate({colors: [C.palette.blue, C.palette.green, C.palette.amber, C.palette.red, C.palette.purple]});

var gitgraph = new GitGraph({
  template: myTemplate,
  author: "",
});

// ---- MAIN BRANCH ----
var branch_color = colorCycler.next();
var academic = gitgraph
  .branch({name: "academic", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "", message: "Academic Journey"});

// ---- Teaching ----
// Explicit colour (purple, the one the cycler never reaches here) so adding
// this branch does not shift the PhD / M.Sc. / B.Sc. colours.
var teaching = academic
  .branch({name: "Teaching", color: C.palette.purple, commitDefaultOptions: {color: C.palette.purple}})
  .commit({tag: "Teaching", message: " "})
  .commit({message: C.label("detail-teaching", "[2022 – present] · Teaching Assistant & Lecturer · UMH"), detailId: "detail-teaching"})
  // Future: .commit({message: C.label("detail-supervision", "Supervised theses"), detailId: "detail-supervision"})
  .merge(academic, {message: "merge Teaching", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
academic.checkout();

// ---- PhD ----
branch_color = colorCycler.next();
var phd = academic
  .branch({name: "PhD", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "PhD", message: " "})
  .commit({message: C.label("detail-phd", "PhD in Industrial & Telecom Technologies"), detailId: "detail-phd"})
  .merge(academic, {message: "merge PhD", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
academic.checkout();

// ---- Master ----
branch_color = colorCycler.next();
var msc = academic
  .branch({name: "Master", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "M.Sc.", message: " "})
  .commit({message: C.label("detail-msc", "M.Sc. Robotics"), detailId: "detail-msc"})
  .merge(academic, {message: "merge Master", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
academic.checkout();

// ---- Degree ----
branch_color = colorCycler.next();
var bsc = academic
  .branch({name: "Degree", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "B.Sc.", message: " "})
  .commit({message: C.label("detail-bsc", "B.Sc. Electronics & Automation Eng."), detailId: "detail-bsc"})
  .merge(academic, {message: "merge Degree", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();

academic.commit({message: " ", messageColor: C.palette.gray});

// ---- Finalize ----
C.finalize(gitgraph, myTemplate);
