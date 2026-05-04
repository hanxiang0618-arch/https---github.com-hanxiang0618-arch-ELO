// --- 遊戲參數設定 ---
let player = {
  elo: 1200,      
  mmr: 1200,      
  history: []     
};

let kFactor = 32; 
let matchLog = "準備好開始第一場對抗了嗎？";
let matchCount = 0;
let gameState = "intro"; 
let battleState = "searching"; // 'searching' (準備中) 或 'result' (顯示結果)

// 新增對手資訊變數
let currentOpponent = {
  mmr: 0,
  expectedWinRate: 0
};

let ui = {
  margin: 20,
  btn1: { x: 0, y: 0, w: 120, h: 45 },
  btn2: { x: 0, y: 0, w: 120, h: 45 }
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  generateOpponent(); // 初始化第一個對手
  recordData(); 
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// 每次戰鬥結束或開始時，預先生成下一個對手
function generateOpponent() {
  currentOpponent.mmr = Math.round(player.mmr + random(-200, 200));
  // ELO 核心公式：計算預期勝率
  currentOpponent.expectedWinRate = 1 / (1 + Math.pow(10, (currentOpponent.mmr - player.elo) / 400));
}

function draw() {
  background(245);
  rectMode(CORNER); // 確保每一幀開始時重置為預設的左上角對齊
  
  if (gameState === "intro") {
    drawIntroScreen();
  } else {
    let uiBottom = 0;
    if (width > 600) {
      drawDashboard(ui.margin, ui.margin, 200, 180);
      drawMatchArea(ui.margin + 220, ui.margin, width - (ui.margin * 2 + 220), 180);
      uiBottom = ui.margin + 180;
    } else {
      drawDashboard(ui.margin, ui.margin, width - ui.margin * 2, 145);
      drawMatchArea(ui.margin, ui.margin + 165, width - ui.margin * 2, 220);
      uiBottom = ui.margin + 165 + 220;
    }
    drawChart(uiBottom);
  }
}

// 繪製數據圖表
function drawChart(startY) {
  push();
  let topPadding = 50; 
  let chartTop = startY + topPadding;
  let chartBottom = height - 70;
  let chartWidth = width - 80;
  let chartHeight = chartBottom - chartTop;

  if (chartHeight < 60) chartHeight = 60;

  let allValues = player.history.flatMap(h => [h.elo, h.mmr]);
  let minY = min(allValues) - 50;
  let maxY = max(allValues) + 50;
  
  translate(50, chartTop + chartHeight);
  
  // 座標軸
  stroke(150); line(0, 0, chartWidth, 0); line(0, 0, 0, -chartHeight);
  
  // ELO 折線 (藍色)
  noFill(); stroke(0, 102, 204); strokeWeight(2);
  beginShape();
  for (let i = 0; i < player.history.length; i++) {
    let x = i * (chartWidth / 20);
    let y = map(player.history[i].elo, minY, maxY, 0, -chartHeight);
    vertex(x, y);
  }
  endShape();
  
  // MMR 折線 (紅色)
  stroke(204, 0, 102);
  beginShape();
  for (let i = 0; i < player.history.length; i++) {
    let x = i * (chartWidth / 20);
    let y = map(player.history[i].mmr, minY, maxY, 0, -chartHeight);
    vertex(x, y);
  }
  endShape();
  pop();
  
  fill(100); textSize(12); textAlign(LEFT, CENTER);
  text("藍: ELO | 紅: MMR | 橫軸: 場次", 50, height - 30);
}

function drawIntroScreen() {
  push();
  textAlign(CENTER, CENTER);
  fill(50);
  textSize(min(width * 0.08, 36));
  textStyle(BOLD);
  text("ELO 積分系統模擬器", width/2, height/2 - 100);
  
  textSize(min(width * 0.04, 16));
  textStyle(NORMAL);
  rectMode(CENTER);
  let desc = "本工具模擬競技遊戲的評分邏輯：\n\n1. ELO 是你的公開分數。\n2. MMR 是系統對你實力的隱藏評估。\n3. 在對戰前，你可以看到對手的實力與預期勝率。";
  text(desc, width/2, height/2, width * 0.8, 200);
  
  fill(76, 175, 80);
  noStroke();
  rect(width/2, height/2 + 140, 160, 50, 10);
  fill(255);
  textSize(20);
  text("開始體驗", width/2, height/2 + 140);
  pop();
}

function drawDashboard(x, y, w, h) {
  push();
  translate(x, y);
  fill(255); stroke(200); rect(0, 0, w, h, 10);
  fill(50); noStroke(); textSize(18); textStyle(BOLD); text("玩家資訊", 20, 30);
  textSize(14); textStyle(NORMAL);
  fill(0, 102, 204); text("ELO (公開): " + player.elo, 20, 65);
  fill(204, 0, 102); text("MMR (隱藏): " + Math.round(player.mmr), 20, 95);
  fill(100); text("場次: " + matchCount, 20, 125);
  pop();
}

function drawMatchArea(x, y, w, h) {
  push();
  translate(x, y);
  fill(255); stroke(200); rect(0, 0, w, h, 10);
  
  fill(50); noStroke(); textSize(16); textAlign(LEFT, TOP);
  
  if (battleState === "searching") {
    // 顯示即將對戰的對手資訊
    fill(0, 150, 136); textStyle(BOLD);
    text("⚠️ 發現對手！", 20, 20);
    fill(80); textStyle(NORMAL);
    text(`對手實力 (MMR): ${currentOpponent.mmr}`, 20, 45);
    let winProb = (currentOpponent.expectedWinRate * 100).toFixed(1);
    text(`預估勝率: ${winProb}%`, 20, 65);
  } else {
    // 顯示上場戰鬥結果
    fill(50); text(matchLog, 20, 20, w - 40, 60);
  }
  
  ui.btn1 = { x: x + 20, y: y + 100, w: (w - 60) / 2, h: 50 };
  ui.btn2 = { x: x + 40 + ui.btn1.w, y: y + 100, w: (w - 60) / 2, h: 50 };
  
  textAlign(CENTER, CENTER);
  // 按鈕 1：進行對戰
  fill(76, 175, 80); rect(20, 100, ui.btn1.w, ui.btn1.h, 5);
  fill(255); text(battleState === "searching" ? "接受對戰" : "尋找新對手", 20 + ui.btn1.w/2, 100 + ui.btn1.h/2);
  
  // 按鈕 2：快速模擬（連勝模式）
  fill(33, 150, 243); rect(40 + ui.btn1.w, 100, ui.btn2.w, ui.btn2.h, 5);
  fill(255); text("故意連勝", 40 + ui.btn1.w + ui.btn2.w/2, 100 + ui.btn2.h/2);
  pop();
}

// 繪圖 Chart 邏輯保持不變 (省略... 同上一個版本)
// ... [這裡請保留你原本的 drawChart 函數內容] ...

function mousePressed() {
  if (gameState === "intro") {
    if (mouseX > width/2-80 && mouseX < width/2+80 && mouseY > height/2+115 && mouseY < height/2+165) {
      gameState = "playing";
    }
    return;
  }

  // 點擊左邊按鈕
  if (mouseX > ui.btn1.x && mouseX < ui.btn1.x + ui.btn1.w && mouseY > ui.btn1.y && mouseY < ui.btn1.y + ui.btn1.h) {
    if (battleState === "searching") {
      // 進行對戰：根據勝率判定結果
      let isWin = random() < currentOpponent.expectedWinRate ? 1 : 0;
      runMatch(isWin);
      battleState = "result";
    } else {
      // 顯示完結果，回到尋找狀態
      generateOpponent();
      battleState = "searching";
    }
  }
  
  // 點擊右邊按鈕 (故意連勝)
  if (mouseX > ui.btn2.x && mouseX < ui.btn2.x + ui.btn2.w && mouseY > ui.btn2.y && mouseY < ui.btn2.y + ui.btn2.h) {
    runMatch(1);
    battleState = "result";
  }
}

function runMatch(isWin) {
  matchCount++;
  
  // 1. 使用當前對手的 MMR
  let opponentMmr = currentOpponent.mmr;
  let expectedWinRate = currentOpponent.expectedWinRate;
  
  // 2. MMR 加成邏輯
  let mmrBonus = (player.mmr - player.elo) * 0.1; 
  let eloChange = kFactor * (isWin - expectedWinRate) + (isWin === 1 ? mmrBonus : mmrBonus / 2);
  player.elo += Math.round(eloChange);
  
  // 3. 更新 MMR
  let mmrChange = kFactor * 1.5 * (isWin - 0.5);
  player.mmr += mmrChange;
  
  let resultText = isWin ? "🎉 勝利！" : "💀 失敗...";
  matchLog = `${resultText}\n對手 MMR: ${Math.round(opponentMmr)}\nELO 變動: ${Math.round(eloChange)} (預估勝率: ${(expectedWinRate*100).toFixed(1)}%)`;
  
  recordData();
}

function recordData() {
  player.history.push({ elo: player.elo, mmr: player.mmr });
  if (player.history.length > 21) player.history.shift();
}