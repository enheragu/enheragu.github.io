// ----------------------- MAIN GITGRAPH ----------------------- //

var C = GitGraphCommon;
var colorCycler = C.createColorCycler();
var myTemplate = C.createTemplate();

var gitgraph = new GitGraph({
  template: myTemplate,
  author: "",
});

// Helper: dynamic publication count from Liquid-injected data
function _pc(typeKey) {
  var c = window.pubCounts && window.pubCounts[typeKey];
  return c ? " (" + c + ")" : "";
}

// ---- MAIN BRANCH ----
var branch_color = colorCycler.next();
var cv_eeha = gitgraph
  .branch({name: "eeha", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "", message: "About me: " , detailId: "detail-presentation"})
  .commit({tag: "", message: " " });

// ---- EDUCATION ----
branch_color = colorCycler.next();
var education = cv_eeha
  .branch({name: "education", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "Education", message: " " })
  .commit({message: "[2022 – Currently] · PhD.Tecnologías Industriales y de Telecomunicación · UMH", detailId: "detail-phd" })
  .commit({message: "[2021 – 2022] · M.Sc. Robotics · UMH", detailId: "detail-mscrobotics" })
  .commit({message: "[2012 – 2018] · B.Sc. Electronics & Automation Eng. · UPM", detailId: "detail-electronicsdeg" })
  .merge(cv_eeha, {message: "merge education", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();

cv_eeha.checkout();

// ---- WORK EXPERIENCE ----
branch_color = colorCycler.next();
var work = cv_eeha
  .branch({name: "work", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "Work Experience", message: " "})
  .commit({message: "[Dec. 2022 – Currently] · Research Engineer & PhD Student · UMH", detailId: "detail-umh" })
  .commit({message: "[Dec. 2025] · Visiting researcher · DFKI Bremen", detailId: "detail-dfki-2025" })
  .commit({message: "[Feb. 2022 – Sep. 2022] · Research Intern · UMH", detailId: "detail-umh-intern" })
  .commit({message: "[Feb. 2017 – Oct. 2021] · Robotics Engineer · GMV · On Board Autonomy Division", detailId: "detail-gmv" })
  .commit({message: "[Feb. 2016 - Aug. 2016] · Intern · BQ", detailId: "detail-bq" });
work.merge(cv_eeha, {message: "merge work experience", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
cv_eeha.checkout();

// ---- PUBLICATIONS (with sub-commits per type) ----
branch_color = colorCycler.next();
var publications = cv_eeha
  .branch({name: "publications", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "Publications", message: " "})
  .commit({message: "Journal Articles" + _pc("journal"), detailId: "detail-pub-journals" })
  .commit({message: "Book Chapters" + _pc("book_chapter"), detailId: "detail-pub-chapters" })
  .commit({message: "Conference Papers" + _pc("conference_paper"), detailId: "detail-pub-conferences" })
  .commit({message: "Oral Presentations" + _pc("presentation"), detailId: "detail-pub-presentations" })
  .commit({message: "Poster presentations" + _pc("poster"), detailId: "detail-pub-posters" })
  .merge(cv_eeha, {message: "merge publications", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
cv_eeha.checkout();

// ---- PROJECTS ----
branch_color = colorCycler.next();
var projects = cv_eeha
  .branch({name: "projects", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "Projects", message: " ", detailId: "detail-projects" })
  .merge(cv_eeha, {message: "merge projects", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
cv_eeha.checkout();


// ---- COURSES ----
branch_color = colorCycler.next();
var courses = cv_eeha
  .branch({name: "courses", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "Courses and Workshops", message: " ", detailId: "detail-courses" })
  .merge(cv_eeha, {message: "merge courses", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();

// ---- SKILLS ----
branch_color = colorCycler.next();
var skills = cv_eeha
  .branch({name: "skills", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "Skills", message: " ", detailId: "detail-skills" })
  .merge(cv_eeha, {message: "merge skills", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();

cv_eeha.commit({message: "Feel free to reach out! :)", messageColor: "#6e7681"});

// ---- Finalize: widthExtension + relayout + resize hook ----
C.finalize(gitgraph, myTemplate);
