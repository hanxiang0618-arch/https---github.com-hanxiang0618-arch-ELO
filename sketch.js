let player = { elo: 1200, mmr: 1200, history: [] };
let opponent = { mmr: 1200, winRate: 0.5, difficulty: "普通" };
let matchCount = 0;
let lastMatchResult = "尚未開始對戰";
let gameState = "intro";
let ui = { margin: 20, btn1: {}, btn2: {} };

function setup() {
  createCanvas(windowWidth, windowHeight);
  player.history.push({ elo: player.elo, mmr: player.mmr });
  generateNewOpponent();
}

function draw() {
  background(245);
  rectMode(CORNER);

  if (gameState === "intro") {
    drawIntroScreen();
  } else {
    let uiBottom = 0;
    if (width > 600) {
      // 電腦版橫向排列
      drawDashboard(ui.margin, ui.margin, 180, 180);
      drawMatchArea(ui.margin + 200, ui.margin, 350, 180);
      drawResultArea(ui.margin + 570, ui.margin, width - (ui.margin * 2 + 570), 180);
      uiBottom = ui.margin + 180;
    } else {
      // 手機版縱向堆疊
      drawDashboard(ui.margin, ui.margin, width - ui.margin * 2, 145);
      drawMatchArea(ui.margin, ui.margin + 165, width - ui.margin * 2, 180);
      drawResultArea(ui.margin, ui.margin + 365, width - ui.margin * 2, 80);
      uiBottom = ui.margin + 365 + 80;
    }
    drawChart(uiBottom);
  }
}

function drawIntroScreen() {
  push();
  textAlign(CENTER, CENTER);
  fill(50);
  textSize(min(width * 0.08, 32));
  textStyle(BOLD);
  text("ELO 積分系統模擬器", width / 2, height / 2 - 100);
  
  textSize(16);
  textStyle(NORMAL);
  rectMode(CENTER);
  text("這是一個模擬競技遊戲 MMR 與 ELO 運作的工具。\n在手機上也可流暢操作。", width / 2, height / 2, width * 0.8, 200);
  
  fill(76, 175, 80);
  rect(width / 2, height / 2 + 140, 160, 50, 10);
  fill(255);
  text("開始體驗", width / 2, height / 2 + 140);
  pop();
}

function drawDashboard(x, y, w, h) {
  push();
  translate(x, y);
  fill(255); stroke(200); rect(0, 0, w, h, 10);
  fill(50); noStroke(); textAlign(LEFT, TOP);
  textSize(18); textStyle(BOLD); text("玩家資訊", 20, 20);
  textSize(14); textStyle(NORMAL);
  fill(0, 102, 204); text("ELO (公開): " + Math.round(player.elo), 20, 55);
  fill(204, 0, 102); text("MMR (隱藏): " + Math.round(player.mmr), 20, 85);
  fill(100); text("場次: " + matchCount, 20, 115);
  pop();
}

function drawMatchArea(x, y, w, h) {
  push();
  translate(x, y);
  fill(255); stroke(200); rect(0, 0, w, h, 10);
  fill(50); noStroke(); textAlign(LEFT, TOP);
  textSize(16); textStyle(BOLD); text("⚠ 發現對手 !", 20, 20);
  textSize(14); textStyle(NORMAL);
  text("對手 MMR: " + opponent.mmr, 20, 50);
  text("預估勝率: " + (opponent.winRate * 100).toFixed(1) + "%", 20, 75);
  text("挑戰難度: " + opponent.difficulty, 20, 100);

  // 按鈕位置計算
  ui.btn1 = { x: x + 20, y: y + 120, w: (w - 60) / 2, h: 45 };
  ui.btn2 = { x: x + 40 + ui.btn1.w, y: y + 120, w: (w - 60) / 2, h: 45 };

  textAlign(CENTER, CENTER);
  fill(76, 175, 80); rect(20, 120, ui.btn1.w, ui.btn1.h, 5);
  fill(255); text("接受對戰", 20 + ui.btn1.w / 2, 120 + ui.btn1.h / 2);
  
  fill(33, 150, 243); rect(40 + ui.btn1.w, 120, ui.btn2.w, ui.btn2.h, 5);
  fill(255); text("連勝 (5場)", 40 + ui.btn1.w + ui.btn2.w / 2, 120 + ui.btn2.h / 2);
  pop();
}

function drawResultArea(x, y, w, h) {
  push();
  translate(x, y);
  fill(255); stroke(200); rect(0, 0, w, h, 10);
  fill(50); noStroke(); textAlign(LEFT, TOP);
  textSize(16); textStyle(BOLD); text("戰報回饋", 20, 20);
  
  // 顯示上局結果
  textSize(14);
  if (lastMatchResult.includes("勝利")) fill(0, 120, 0);
  else if (lastMatchResult.includes("失敗")) fill(200, 0, 0);
  else fill(100);
  textStyle(NORMAL);
  // 自動換行處理長戰報
  text(lastMatchResult, 20, 45, w - 40, h - 50);
  pop();
}

function drawChart(startY) {
  push();
  let topPadding = 50;
  let chartTop = startY + topPadding;
  let chartBottom = height - 70;
  let chartWidth = width - 80;
  let chartHeight = max(chartBottom - chartTop, 80);

  let allValues = player.history.flatMap(h => [h.elo, h.mmr]);
  let minY = min(allValues) - 50;
  let maxY = max(allValues) + 50;
  
  translate(50, chartTop + chartHeight);
  stroke(150); line(0, 0, chartWidth, 0); line(0, 0, 0, -chartHeight);
  
  noFill(); stroke(0, 102, 204); strokeWeight(2);
  beginShape();
  for (let i = 0; i < player.history.length; i++) {
    let x = i * (chartWidth / max(20, player.history.length));
    let y = map(player.history[i].elo, minY, maxY, 0, -chartHeight);
    vertex(x, y);
  }
  endShape();
  
  stroke(204, 0, 102);
  beginShape();
  for (let i = 0; i < player.history.length; i++) {
    let x = i * (chartWidth / max(20, player.history.length));
    let y = map(player.history[i].mmr, minY, maxY, 0, -chartHeight);
    vertex(x, y);
  }
  endShape();
  pop();
  fill(100); textAlign(LEFT, CENTER); textSize(12);
  text("藍: ELO | 紅: MMR | 橫軸: 場次", 50, height - 30);
}

function playMatch(times) {
  let totalEloDelta = 0;
  for (let i = 0; i < times; i++) {
    let expected = 1.0 / (1.0 + Math.pow(10, (opponent.mmr - player.elo) / 400.0));
    let isWin = (times > 1) ? true : Math.random() < opponent.winRate;
    let actual = isWin ? 1 : 0;
    
    let K = 32;
    let eloDelta = K * (actual - expected);
    let mmrDelta = (K * 1.5) * (actual - expected);
    
    player.elo += eloDelta;
    player.mmr += mmrDelta;
    totalEloDelta += eloDelta;
    
    matchCount++;
    player.history.push({ elo: player.elo, mmr: player.mmr });

    if (times === 1) {
      let res = isWin ? "勝利" : "失敗";
      let sign = eloDelta >= 0 ? "+" : "";
      let oppSign = eloDelta >= 0 ? "-" : "+"; // 你加分對方就減分
      lastMatchResult = `結果: ${res} (你 ${sign}${Math.round(eloDelta)} / 對手 ${oppSign}${Math.round(Math.abs(eloDelta))})`;
    }
  }
  if (times > 1) {
    lastMatchResult = `結果: 5連勝 (總計 +${Math.round(totalEloDelta)} ELO)`;
  }
  generateNewOpponent();
}

function generateNewOpponent() {
  // 擴大匹配範圍到正負 200 分，讓對手更有感
  let diff = Math.floor(Math.random() * 400) - 200;
  opponent.mmr = Math.round(player.mmr + diff);
  opponent.winRate = 1.0 / (1.0 + Math.pow(10, (opponent.mmr - player.elo) / 400.0));
  
  // 根據勝率設定難度標籤
  if (opponent.winRate > 0.6) opponent.difficulty = "輕鬆 (虐菜局)";
  else if (opponent.winRate > 0.45) opponent.difficulty = "平均 (五五開)";
  else if (opponent.winRate > 0.3) opponent.difficulty = "困難 (硬仗)";
  else opponent.difficulty = "極限 (大魔王)";
}

function touchStarted() {
  mousePressed();
  return false;
}

function mousePressed() {
  if (gameState === "intro") {
    if (mouseX > width/2-80 && mouseX < width/2+80 && mouseY > height/2+115 && mouseY < height/2+165) {
      gameState = "playing";
    }
    return;
  }
  if (mouseX > ui.btn1.x && mouseX < ui.btn1.x + ui.btn1.w && mouseY > ui.btn1.y && mouseY < ui.btn1.y + ui.btn1.h) {
    playMatch(1);
  }
  if (mouseX > ui.btn2.x && mouseX < ui.btn2.x + ui.btn2.w && mouseY > ui.btn2.y && mouseY < ui.btn2.y + ui.btn2.h) {
    playMatch(5);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}