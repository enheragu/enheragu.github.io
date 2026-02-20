// ----------------------- MAIN GITGRAPH ----------------------- //

var colors = [ "#6e7681", "#58a6ff", "#d29922", "#3fb950", "#f85149",
               "#bc8cff", "#58a6ff", "#d29922", "#3fb950", "#f85149",
               "#bc8cff", "#58a6ff", "#d29922", "#3fb950", "#f85149" ];

var current_color = 0;
var screenWidth = window.innerWidth;
var isMobile = screenWidth <= 768;
var isTablet = !isMobile && screenWidth <= 1200;

// Custom template: thinner lines, smaller dots, wider spacing
var myTemplate = new GitGraph.Template({
  colors: colors,
  branch: {
    lineWidth: isMobile ? 2 : 3,
    spacingX: isMobile ? 18 : (isTablet ? 35 : 55),
    labelRotation: 0
  },
  commit: {
    spacingY: isMobile ? -25 : -40,
    dot: {
      size: isMobile ? 3 : 6,
      strokeWidth: isMobile ? 1 : 2
    },
    message: {
      display: true,
      font: isMobile ? "bold 11px 'Inter', sans-serif" : (isTablet ? "bold 12px 'Inter', sans-serif" : "bold 13px 'Inter', sans-serif"),
      displayBranch: false,
      displayHash: false,
      displayAuthor: false
    },
    tag: {
      font: isMobile ? "bold 10px 'Inter', sans-serif" : (isTablet ? "bold 11px 'Inter', sans-serif" : "bold 13px 'Inter', sans-serif")
    }
  }
});

var gitgraph = new GitGraph({
  template: myTemplate,
  author: "",
});

// Merge style: subtle but readable
var merge_font = "italic 11px 'Inter', sans-serif";
var merge_color = "#6e7681";

getColor = function() {
  var color = colors[current_color];
  current_color++;
  return color;
};

// Helper: dynamic publication count from Liquid-injected data
function _pc(typeKey) {
  var c = window.pubCounts && window.pubCounts[typeKey];
  return c ? " (" + c + ")" : "";
}

// ---- MAIN BRANCH ----
var branch_color = getColor();
var cv_eeha = gitgraph
  .branch({name: "eeha", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "", message: "About me: " , detailId: "detail-presentation"})
  .commit({tag: "", message: " " });

// ---- EDUCATION ----
branch_color = getColor();
var education = cv_eeha
  .branch({name: "education", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "Education", message: " " })
  .commit({message: "[2022 – Currently] · PhD.Tecnologías Industriales y de Telecomunicación · UMH", detailId: "detail-phd" })
  .commit({message: "[2021 – 2022] · M.Sc. Robotics · UMH", detailId: "detail-mscrobotics" })
  .commit({message: "[2012 – 2018] · B.Sc. Electronics & Automation Eng. · UPM", detailId: "detail-electronicsdeg" })
  .merge(cv_eeha, {message: "merge education", messageFont: merge_font, messageColor: merge_color}).delete();

cv_eeha.checkout();

// ---- WORK EXPERIENCE ----
branch_color = getColor();
var work = cv_eeha
  .branch({name: "work", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "Work Experience", message: " "})
  .commit({message: "[Dec. 2022 – Currently] · Research Engineer & PhD Student · UMH", detailId: "detail-umh" })
  .commit({message: "[Dec. 2025] · Visiting researcher · DFKI Bremen", detailId: "detail-dfki-2025" })
  .commit({message: "[Feb. 2022 – Sep. 2022] · Research Intern · UMH", detailId: "detail-umh-intern" })
  .commit({message: "[Feb. 2017 – Oct. 2021] · Robotics Engineer · GMV · On Board Autonomy Division", detailId: "detail-gmv" })
  .commit({message: "[Feb. 2016 - Aug. 2016] · Intern · BQ", detailId: "detail-bq" });
work.merge(cv_eeha, {message: "merge work experience", messageFont: merge_font, messageColor: merge_color}).delete();
cv_eeha.checkout();

// ---- PUBLICATIONS (with sub-commits per type) ----
branch_color = getColor();
var pub_color = branch_color;
var publications = cv_eeha
  .branch({name: "publications", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "Publications", message: " "}) //, detailId: "detail-publications" })
  .commit({message: "Journal Articles" + _pc("journal"), detailId: "detail-pub-journals" })
  .commit({message: "Book Chapters" + _pc("book_chapter"), detailId: "detail-pub-chapters" })
  .commit({message: "Conference Papers" + _pc("conference_paper"), detailId: "detail-pub-conferences" })
  .commit({message: "Oral Presentations" + _pc("presentation"), detailId: "detail-pub-presentations" })
  .commit({message: "Poster presentations" + _pc("poster"), detailId: "detail-pub-posters" })
  .merge(cv_eeha, {message: "merge publications", messageFont: merge_font, messageColor: merge_color}).delete();
cv_eeha.checkout();

// ---- PROJECTS ----
branch_color = getColor();
var projects = cv_eeha
  .branch({name: "projects", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "Projects", message: " ", detailId: "detail-projects" })
  .merge(cv_eeha, {message: "merge projects", messageFont: merge_font, messageColor: merge_color}).delete();
cv_eeha.checkout();


// ---- COURSES ----
branch_color = getColor();
var courses = cv_eeha
  .branch({name: "courses", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "Courses and Workshops", message: " ", detailId: "detail-courses" })
  .merge(cv_eeha, {message: "merge courses", messageFont: merge_font, messageColor: merge_color}).delete();

// ---- SKILLS ----
branch_color = getColor();
var skills = cv_eeha
  .branch({name: "skills", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "Skills", message: " ", detailId: "detail-skills" })
  .merge(cv_eeha, {message: "merge skills", messageFont: merge_font, messageColor: merge_color}).delete();

cv_eeha.commit({message: "Feel free to reach out! :)", messageColor: "#6e7681"});

// ---- Dynamic widthExtension: measure the widest tag to prevent canvas clipping ----
(function() {
  var canvas = document.getElementById("gitGraph");
  var ctx = canvas.getContext("2d");
  var tagFont = myTemplate.commit.tag.font || "bold 13px 'Inter', sans-serif";
  ctx.font = tagFont;
  var maxTagWidth = 0;
  for (var i = 0; i < gitgraph.commits.length; i++) {
    var c = gitgraph.commits[i];
    if (c.tag) {
      var w = ctx.measureText(c.tag).width;
      if (w > maxTagWidth) maxTagWidth = w;
    }
  }
  // Add padding for tag box + offset from dot
  if (maxTagWidth > 0) {
    myTemplate.commit.widthExtension = maxTagWidth + 50;
    gitgraph.render();
  }
})();

// ---- Position all detail panels correctly (single source of truth) ----
function relayoutPanels() {
  var canvas = document.getElementById("gitGraph");
  if (!canvas) return;
  var section = canvas.closest("section");
  if (!section) return;

  var commits = gitgraph.commits;
  var sf = gitgraph.scalingFactor || 1;
  var cssMarginX = gitgraph.marginX / sf;
  var cssMarginY = gitgraph.marginY / sf;
  var OFFSET_TOP = 30;
  var GAP = 15;
  var prevBottom = 0;

  // Get the CSS 'right' value for panels from computed style of first panel
  var cssRight = 0;
  for (var k = 0; k < commits.length; k++) {
    if (commits[k].detail) {
      cssRight = parseFloat(window.getComputedStyle(commits[k].detail).right) || 0;
      break;
    }
  }

  for (var i = 0; i < commits.length; i++) {
    var c = commits[i];
    if (!c.detail) continue;

    // Left: just past the commit dot
    var left = canvas.offsetLeft + cssMarginX + c.x + c.dotSize + 20;
    c.detail.style.left = left + "px";

    // Set explicit width so height measurement is accurate
    var availW = section.clientWidth - left - cssRight;
    if (availW > 50) {
      c.detail.style.width = availW + "px";
    }

    // Top: aligned with the commit dot position in CSS pixels
    var idealTop = canvas.offsetTop + cssMarginY + c.y + OFFSET_TOP;

    // Ensure no overlap with previous panel
    if (prevBottom > 0 && idealTop < prevBottom + GAP) {
      idealTop = prevBottom + GAP;
    }

    c.detail.style.top = idealTop + "px";

    // Force reflow to get accurate height after width+top are set
    void c.detail.offsetHeight;
    prevBottom = idealTop + c.detail.clientHeight;
  }

  // Ensure section is tall enough for all panels
  if (prevBottom > section.scrollHeight) {
    section.style.minHeight = (prevBottom + 40) + "px";
  }
}

// Run now + after each resize (gitgraph.render() runs first via window.onresize)
relayoutPanels();
var _origOnResize = window.onresize;
window.onresize = function() {
  if (_origOnResize) _origOnResize.call(window);
  relayoutPanels();
};
