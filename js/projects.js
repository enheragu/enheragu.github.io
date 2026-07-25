// ----------------------- PROJECTS GITGRAPH ----------------------- //

var C = GitGraphCommon;
var colorCycler = C.createColorCycler([C.palette.red, C.palette.blue, C.palette.amber, C.palette.green, C.palette.purple]);
var myTemplate = C.createTemplate({colors: [C.palette.red, C.palette.blue, C.palette.amber, C.palette.green, C.palette.purple]});

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
  .commit({message: C.label("detail-PROMETEO2025", "PROMETEO 2025"), detailId: "detail-PROMETEO2025"})
  .commit({message: C.label("detail-FIND", "FIND"), detailId: "detail-FIND"})
  .commit({message: C.label("detail-AViRobots", "AViRobots"), detailId: "detail-AViRobots"})
  .commit({message: C.label("detail-ROBOT_VIGILANTE", "Robot_Vigilante"), detailId: "detail-ROBOT_VIGILANTE"})
  .commit({message: C.label("detail-ACTVIS", "ACTVIS"), detailId: "detail-ACTVIS"})
  .commit({message: C.label("detail-TED2021", "TED2021"), detailId: "detail-TED2021"})
  .commit({message: C.label("detail-PROMETEO", "PROMETEO"), detailId: "detail-PROMETEO"})
  .merge(career, {message: "merge UMH", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
career.checkout();

// ---- GMV Projects ----
branch_color = colorCycler.next();
var gmv = career
  .branch({name: "GMV", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "GMV (2017–2021)", message: " "})
  .commit({message: C.label("detail-MOSAR", "MOSAR"), detailId: "detail-MOSAR"})
  .commit({message: C.label("detail-PROACT", "PROACT"), detailId: "detail-PROACT"})
  .commit({message: C.label("detail-ADE", "ADE"), detailId: "detail-ADE"})
  .commit({message: C.label("detail-ERGO", "ERGO"), detailId: "detail-ERGO"})
  .commit({message: C.label("detail-GOTCHA", "GOTCHA"), detailId: "detail-GOTCHA"})
  .merge(career, {message: "merge GMV", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
career.checkout();

// ---- UPM / HackLab ----
branch_color = colorCycler.next();
var upm = career
  .branch({name: "UPM", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "UPM (2012–2018)", message: " "})
  .commit({message: C.label("detail-RHA", "RHA (RoboHealth ARM)"), detailId: "detail-RHA"})
  .commit({message: C.label("detail-HIDALGO", "HIDALGO"), detailId: "detail-HIDALGO"})
  // "Other projects" hidden until its content is written (draft in _projects/detail_other.html):
  // .commit({message: "Other projects", detailId: "detail-Other"})
  .merge(career, {message: "merge UPM", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();

career.commit({message: " ", messageColor: C.palette.gray});

// ---- Finalize ----
C.finalize(gitgraph, myTemplate);

