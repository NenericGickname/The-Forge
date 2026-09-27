// Area Mastery tab: add it whenever the Compendium tabs exist
setInterval(() => {
  try {
    installAreaMasteryTab();
  } catch (e) {}
}, 500);
