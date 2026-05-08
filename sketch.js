let player = { elo: 1200, mmr: 1200, history: [] };
let opponent = { mmr: 1200, winRate: 0.5, difficulty: "普通" };
let matchCount = 0;
let lastMatchResult = "尚未開始對戰";
let gameState = "intro";
let ui = { margin: 20, btn1: {}, btn2: {}, btn3: {}, btnNext: {}, btnUndo: {} };
const COLORS = {
  bg: 248,
  cardBg: 255,
  stroke: 220,
  textMain: 40,
  textSub: 100,
  elo: [0, 122, 255],
  mmr: [255, 45, 85],
  win: [52, 199, 89],
  loss: [255, 59, 48],
  accent: [88, 86, 214]
};
let isMatchSettled = false;
let stateHistory = []; // 用於存放歷史狀態以供回溯

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  
  // 針對 iOS 優化：防止畫布被拖動、橡皮筋回彈以及雙擊縮放
  canvas.elt.style.touchAction = 'none';
  
  player.history.push({ elo: player.elo, mmr: player.mmr });
  generateNewOpponent();
}

function draw() {
  background(COLORS.bg);
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
      drawDashboard(ui.margin, ui.margin, width - ui.margin * 2, 170);
      drawMatchArea(ui.margin, ui.margin + 190, width - ui.margin * 2, 180);
      drawResultArea(ui.margin, ui.margin + 390, width - ui.margin * 2, 100);
      uiBottom = ui.margin + 390 + 100;
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
  
  fill(COLORS.win);
  rect(width / 2, height / 2 + 140, 160, 50, 10);
  fill(255);
  textSize(18); text("進入模擬系統", width / 2, height / 2 + 140);
  pop();
}

function drawDashboard(x, y, w, h) {
  push();
  translate(x, y);
  drawCard(0, 0, w, h);
  fill(COLORS.textMain); noStroke(); textAlign(LEFT, TOP);
  textSize(18); textStyle(BOLD); text("玩家資訊", 20, 20);
  textSize(14); textStyle(NORMAL);
  fill(COLORS.elo); text("ELO (公開): " + Math.round(player.elo), 20, 55);
  fill(COLORS.mmr); text("MMR (隱藏): " + Math.round(player.mmr), 20, 85);
  fill(100); text("場次: " + matchCount, 20, 115);

  // 系統洞察文字 (教學核心)
  let status = "狀態: 平穩";
  let statusCol = color(100);
  if (player.mmr - player.elo > 100) { status = "狀態: 加速升段中↑"; statusCol = color(0, 150, 0); }
  else if (player.elo - player.mmr > 100) { status = "狀態: 分數虛高↓"; statusCol = color(200, 0, 0); }
  fill(statusCol); textStyle(BOLD); textSize(12);
  text(status, 20, 135);
  textStyle(NORMAL);

  // 返回一步按鈕
  ui.btnUndo = { x: x + 20, y: y + h - 35, w: w - 40, h: 25 };
  textAlign(CENTER, CENTER);
  fill(stateHistory.length > 0 ? 180 : 230);
  rect(20, h - 35, w - 40, 25, 5);
  fill(255); textSize(11); text("返回一步 (撤銷)", 20 + (w - 40) / 2, h - 35 + 12);
  pop();
}

function drawMatchArea(x, y, w, h) {
  push();
  translate(x, y);
  drawCard(0, 0, w, h);
  fill(COLORS.textMain); noStroke(); textAlign(LEFT, TOP);

  if (!isMatchSettled) {
    textSize(16); textStyle(BOLD); text("⚠ 發現對手 !", 20, 20);
    textSize(14); textStyle(NORMAL);
    text("對手 MMR: " + opponent.mmr, 20, 50);
    text("預估勝率: " + (opponent.winRate * 100).toFixed(1) + "%", 20, 75);
    text("挑戰難度: " + opponent.difficulty, 20, 100);

    let btnW = (w - 80) / 3;
    ui.btn1 = { x: x + 20, y: y + 120, w: btnW, h: 45 };
    ui.btn2 = { x: x + 40 + btnW, y: y + 120, w: btnW, h: 45 };
    ui.btn3 = { x: x + 60 + 2 * btnW, y: y + 120, w: btnW, h: 45 };

    textAlign(CENTER, CENTER);
    textSize(12);
    fill(COLORS.win); rect(20, 120, btnW, 45, 5);
    fill(255); text("贏", 20 + btnW / 2, 120 + 22);
    fill(COLORS.loss); rect(40 + btnW, 120, btnW, 45, 5);
    fill(255); text("輸", 40 + btnW + btnW / 2, 120 + 22);
    fill(COLORS.accent); rect(60 + 2 * btnW, 120, btnW, 45, 5);
    fill(255); text("5連勝", 60 + 2 * btnW + btnW / 2, 120 + 22);
  } else {
    textSize(16); textStyle(BOLD); fill(150); text("✓ 對戰完成", 20, 20);
    textSize(14); textStyle(NORMAL); fill(100);
    text("請查看右側(或下方)戰報以了解積分變動。", 20, 50);
    
    ui.btnNext = { x: x + 20, y: y + 120, w: w - 40, h: 45 };
    textAlign(CENTER, CENTER);
    fill(COLORS.textSub); rect(20, 120, w - 40, 45, 5);
    fill(255); text("尋找下一個對手", 20 + (w - 40) / 2, 120 + 22);
  }
  pop();
}

function drawResultArea(x, y, w, h) {
  push();
  translate(x, y);
  drawCard(0, 0, w, h);
  fill(COLORS.textMain); noStroke(); textAlign(LEFT, TOP);
  textSize(16); textStyle(BOLD); text("戰報回饋", 20, 20);
  
  // 顯示上局結果
  textSize(14);
  if (lastMatchResult.includes("勝利")) fill(COLORS.win);
  else if (lastMatchResult.includes("失敗")) fill(COLORS.loss);
  else fill(COLORS.textSub);
  textStyle(NORMAL);
  // 自動換行處理長戰報
  text(lastMatchResult, 20, 45, w - 40, h - 50);
  pop();
}

function drawCard(x, y, w, h) {
  fill(COLORS.cardBg);
  stroke(COLORS.stroke);
  rect(x, y, w, h, 12);
}

function drawChart(startY) {
  push();
  let topPadding = 50;
  let chartTop = startY + topPadding;
  let chartBottom = height - 70;
  let chartWidth = width - 80;
  let chartHeight = max(chartBottom - chartTop, 120);

  let allValues = player.history.flatMap(h => [h.elo, h.mmr]);
  let minY = min(allValues) - 80;
  let maxY = max(allValues) + 80;
  
  translate(50, chartTop + chartHeight);
  
  // 繪製背景網格與提示線
  stroke(COLORS.stroke); strokeWeight(1);
  for(let i=0; i<=4; i++) {
    let gy = map(lerp(minY, maxY, i/4), minY, maxY, 0, -chartHeight);
    line(0, gy, chartWidth, gy);
    noStroke(); fill(180); textSize(10);
    text(Math.round(lerp(minY, maxY, i/4)), -35, gy + 3);
    stroke(COLORS.stroke);
  }
  
  // 教學導引線：當前 MMR 水平
  stroke(COLORS.mmr[0], COLORS.mmr[1], COLORS.mmr[2], 80); drawingContext.setLineDash([5, 5]);
  let curMmrY = map(player.mmr, minY, maxY, 0, -chartHeight);
  line(0, curMmrY, chartWidth, curMmrY);
  drawingContext.setLineDash([]);

  stroke(150); line(0, 0, chartWidth, 0); line(0, 0, 0, -chartHeight);
  
  // ELO Line
  noFill(); stroke(COLORS.elo); strokeWeight(2.5);
  beginShape();
  for (let i = 0; i < player.history.length; i++) {
    let px = i * (chartWidth / max(20, player.history.length));
    let py = map(player.history[i].elo, minY, maxY, 0, -chartHeight);
    vertex(px, py);
    if (i === player.history.length - 1) {
      push(); fill(COLORS.elo); noStroke(); 
      circle(px, py, 6); 
      textSize(11); textStyle(BOLD); text(Math.round(player.elo), px + 5, py - 5);
      pop();
    }
  }
  endShape();
  
  // MMR Line
  stroke(COLORS.mmr);
  beginShape();
  for (let i = 0; i < player.history.length; i++) {
    let px = i * (chartWidth / max(20, player.history.length));
    let py = map(player.history[i].mmr, minY, maxY, 0, -chartHeight);
    vertex(px, py);
    if (i === player.history.length - 1) {
      push(); fill(COLORS.mmr); noStroke(); 
      circle(px, py, 6);
      textSize(11); textStyle(BOLD); text(Math.round(player.mmr), px + 5, py + 15);
      pop();
    }
  }
  endShape();
  pop();
  fill(100); textAlign(LEFT, CENTER); textSize(12);
  text("藍: ELO | 紅: MMR | 橫軸: 場次", 50, height - 30);
}

function saveState() {
  // 深拷貝當前重要數據
  stateHistory.push(JSON.parse(JSON.stringify({
    player: player,
    opponent: opponent,
    matchCount: matchCount,
    lastMatchResult: lastMatchResult,
    isMatchSettled: isMatchSettled
  })));
  // 限制歷史長度，避免佔用過多記憶體
  if (stateHistory.length > 30) stateHistory.shift();
}

function playMatch(times, forceResult) {
  saveState();
  let totalEloDelta = 0;
  for (let i = 0; i < times; i++) {
    let expected = 1.0 / (1.0 + Math.pow(10, (opponent.mmr - player.elo) / 400.0));
    
    // 判斷勝負邏輯：若有強制結果則用之，否則看是否為連勝模式，最後才是隨機
    let isWin;
    if (forceResult !== undefined) {
      isWin = forceResult;
    } else {
      isWin = (times > 1) ? true : Math.random() < opponent.winRate;
    }
    
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
      
      // --- 戰術講解邏輯 ---
      let explanation = "";
      let diff = opponent.mmr - player.elo;
      if (isWin) {
        if (diff > 50) explanation = "【下剋上】戰勝強敵，表現遠超預期，獲得高額獎勵。";
        else if (diff < -50) explanation = "【穩定】擊敗較弱對手，屬預料之中，積分增長平緩。";
        else explanation = "【均勢】戰勝同水平對手，獲得標準積分回饋。";
      } else {
        if (diff > 50) explanation = "【抗壓】敗給高分強敵，系統認定屬正常發揮，扣分較少。";
        else if (diff < -50) explanation = "【爆冷】意外敗給低分對手，系統大幅調低實力評估。";
        else explanation = "【遺憾】惜敗給同水平對手，積分略微下調。";
      }
      lastMatchResult = `結果: ${res} (你 ${sign}${Math.round(eloDelta)} / 對手 ${oppSign}${Math.round(Math.abs(eloDelta))})\n分析: ${explanation}`;
    }
  }
  
  // 教學補充說明 (只在對戰結束後追加一次)
  let logicHint = "";
  if (player.mmr > player.elo + 50) logicHint = "\n(註: MMR較高，勝場加分會有額外權重)";
  else if (player.elo > player.mmr + 50) logicHint = "\n(註: ELO過高，敗場扣分會較重)";
  
  if (times > 1) {
    lastMatchResult = `結果: 5連勝 (總計 +${Math.round(totalEloDelta)} ELO)\n分析: 【連勝】展現壓倒性實力，系統正在加速提升你的隱藏分。`;
  }
  lastMatchResult += logicHint; // 追加到最終的戰報結果
  isMatchSettled = true;
}

function generateNewOpponent() {
  if (gameState === "playing") saveState();
  isMatchSettled = false;
  lastMatchResult = "等待對戰中...";
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

function undo() {
  if (stateHistory.length > 0) {
    let prevState = stateHistory.pop();
    player = prevState.player;
    opponent = prevState.opponent;
    matchCount = prevState.matchCount;
    lastMatchResult = prevState.lastMatchResult;
    isMatchSettled = prevState.isMatchSettled;
  }
}

function mousePressed() {
  if (gameState === "intro") {
    if (mouseX > width/2-80 && mouseX < width/2+80 && mouseY > height/2+115 && mouseY < height/2+165) {
      gameState = "playing";
    }
    return;
  }
  
  // 返回一步按鈕判定
  if (mouseX > ui.btnUndo.x && mouseX < ui.btnUndo.x + ui.btnUndo.w && mouseY > ui.btnUndo.y && mouseY < ui.btnUndo.y + ui.btnUndo.h) {
    undo();
    return;
  }

  if (isMatchSettled) {
    if (mouseX > ui.btnNext.x && mouseX < ui.btnNext.x + ui.btnNext.w && mouseY > ui.btnNext.y && mouseY < ui.btnNext.y + ui.btnNext.h) {
      generateNewOpponent();
    }
    return;
  }

  if (mouseX > ui.btn1.x && mouseX < ui.btn1.x + ui.btn1.w && mouseY > ui.btn1.y && mouseY < ui.btn1.y + ui.btn1.h) {
    playMatch(1, true); // 強制贏球
  }
  if (mouseX > ui.btn2.x && mouseX < ui.btn2.x + ui.btn2.w && mouseY > ui.btn2.y && mouseY < ui.btn2.y + ui.btn2.h) {
    playMatch(1, false); // 強制輸球
  }
  if (mouseX > ui.btn3.x && mouseX < ui.btn3.x + ui.btn3.w && mouseY > ui.btn3.y && mouseY < ui.btn3.y + ui.btn3.h) {
    playMatch(5); // 預設連勝
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}