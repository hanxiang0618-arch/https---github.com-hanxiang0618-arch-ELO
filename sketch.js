// --- 遊戲參數設定 ---
let player = {
  elo: 1200,      // 公開分數
  mmr: 1200,      // 隱藏分
  history: []     // 紀錄數據用於繪圖
};

let kFactor = 32; // ELO 變動係數
let matchLog = "準備好開始第一場對抗了嗎？";
let matchCount = 0;
let gameState = "intro"; // 'intro' 或 'playing'

// UI 佈局變數 (用於自適應)
let ui = {
  margin: 20,
  btn1: { x: 0, y: 0, w: 120, h: 45 },
  btn2: { x: 0, y: 0, w: 120, h: 45 }
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  recordData(); // 紀錄初始數據
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(245);
  
  if (gameState === "intro") {
    drawIntroScreen();
  } else {
    let uiBottom = 0;
    if (width > 600) {
      // 電腦版：橫向排列
      drawDashboard(ui.margin, ui.margin, 200, 160);
      drawMatchArea(ui.margin + 220, ui.margin, width - (ui.margin * 2 + 220), 160);
      uiBottom = ui.margin + 160;
    } else {
      // 手機版：縱向堆疊
      drawDashboard(ui.margin, ui.margin, width - ui.margin * 2, 130);
      drawMatchArea(ui.margin, ui.margin + 150, width - ui.margin * 2, 180);
      uiBottom = ui.margin + 150 + 180;
    }
    
    // 3. 繪製下方的數據圖表
    drawChart(uiBottom);
  }
}

function drawIntroScreen() {
  push();
  textAlign(CENTER, CENTER);
  let centerX = width / 2;
  let centerY = height / 2;
  
  // 標題
  fill(50);
  textSize(min(width * 0.08, 36));
  textStyle(BOLD);
  text("ELO 積分系統模擬器", centerX, centerY - 100);
  
  // 說明文字
  textSize(min(width * 0.04, 16));
  textStyle(NORMAL);
  rectMode(CENTER);
  let desc = "本工具模擬競技遊戲的評分邏輯：\n\n1. ELO 是你的公開分數。\n2. MMR 是系統對你實力的隱藏評估。\n3. 當 MMR 高於 ELO 時，系統會讓你贏球加更多分，輸球扣較少。\n\n點擊下方按鈕開始模擬對戰過程。";
  text(desc, centerX, centerY, width * 0.8, 200);
  
  // 開始按鈕
  fill(76, 175, 80);
  noStroke();
  rect(centerX, centerY + 140, 160, 50, 10);
  fill(255);
  textSize(20);
  text("開始體驗", centerX, centerY + 140);
  pop();
}

function drawDashboard(x, y, w, h) {
  push();
  translate(x, y);
  fill(255);
  stroke(200);
  rect(0, 0, w, h, 10);
  
  fill(50);
  noStroke();
  textSize(18);
  textStyle(BOLD);
  text("玩家資訊", 20, 30);
  
  textSize(14);
  textStyle(NORMAL);
  fill(0, 102, 204);
  text("ELO (公開): " + player.elo, 20, 60);
  fill(204, 0, 102);
  text("MMR (隱藏): " + Math.round(player.mmr), 20, 90);
  
  fill(100);
  text("場次: " + matchCount, 20, 115);
  pop();
}

function drawMatchArea(x, y, w, h) {
  push();
  translate(x, y);
  fill(255);
  stroke(200);
  rect(0, 0, w, h, 10);
  
  fill(50);
  noStroke();
  textSize(16);
  textAlign(LEFT, TOP);
  text(matchLog, 20, 20, w - 40, 60);
  
  // 更新按鈕座標以便 click 偵測
  ui.btn1 = { x: x + 20, y: y + 90, w: (w - 60) / 2, h: 50 };
  ui.btn2 = { x: x + 40 + ui.btn1.w, y: y + 90, w: (w - 60) / 2, h: 50 };
  
  // 繪製按鈕
  textAlign(CENTER, CENTER);
  fill(76, 175, 80);
  rect(20, 90, ui.btn1.w, ui.btn1.h, 5);
  fill(255);
  text("隨機對戰", 20 + ui.btn1.w / 2, 90 + ui.btn1.h / 2);
  
  fill(33, 150, 243);
  rect(40 + ui.btn1.w, 90, ui.btn2.w, ui.btn2.h, 5);
  fill(255);
  text("故意連勝", 40 + ui.btn1.w + ui.btn2.w / 2, 90 + ui.btn2.h / 2);
  pop();
}

function drawChart(startY) {
  push();
  // 1. 計算圖表可用空間
  let topPadding = 50; // 圖表與上方文字的間距
  let chartTop = startY + topPadding;
  let chartBottom = height - 70; // 底部留給圖例的空間
  let chartWidth = width - 80;
  let chartHeight = chartBottom - chartTop;

  // 2. 如果螢幕太短，確保圖表至少有基本高度但下移位置
  if (chartHeight < 60) {
    chartHeight = 60;
  }

  // 3. 動態計算 Y 軸範圍 (避免分數過高撞到文字)
  let allValues = player.history.flatMap(h => [h.elo, h.mmr]);
  let minY = min(allValues) - 50;
  let maxY = max(allValues) + 50;
  
  translate(50, chartTop + chartHeight);
  
  // 座標軸
  stroke(150);
  line(0, 0, chartWidth, 0); // X
  line(0, 0, 0, -chartHeight); // Y
  
  noFill();
  // 繪製 ELO 線 (藍色)
  stroke(0, 102, 204);
  beginShape();
  for (let i = 0; i < player.history.length; i++) {
    let x = i * (chartWidth / 20); // 最多顯示20場
    let y = map(player.history[i].elo, minY, maxY, 0, -chartHeight);
    vertex(x, y);
  }
  endShape();
  
  // 繪製 MMR 線 (紅色)
  stroke(204, 0, 102);
  beginShape();
  for (let i = 0; i < player.history.length; i++) {
    let x = i * (chartWidth / 20);
    let y = map(player.history[i].mmr, minY, maxY, 0, -chartHeight);
    vertex(x, y);
  }
  endShape();
  
  pop();
  fill(100);
  textSize(12);
  textAlign(LEFT, CENTER);
  text("藍線: ELO | 紅線: MMR | 橫軸: 場次", 50, height - 30);
}

// 點擊事件處理
function mousePressed() {
  if (gameState === "intro") {
    // 檢查「開始體驗」按鈕範圍 (居中按鈕的座標計算)
    if (mouseX > width / 2 - 80 && mouseX < width / 2 + 80 &&
        mouseY > height / 2 + 115 && mouseY < height / 2 + 165) {
      gameState = "playing";
    }
    return;
  }

  // 隨機對戰按鈕
  if (mouseX > ui.btn1.x && mouseX < ui.btn1.x + ui.btn1.w && mouseY > ui.btn1.y && mouseY < ui.btn1.y + ui.btn1.h) {
    runMatch(random([0, 1])); // 隨機輸贏
  }
  // 故意連勝按鈕
  if (mouseX > ui.btn2.x && mouseX < ui.btn2.x + ui.btn2.w && mouseY > ui.btn2.y && mouseY < ui.btn2.y + ui.btn2.h) {
    runMatch(1); // 強制贏球
  }
}

function runMatch(isWin) {
  matchCount++;
  
  // 1. 模擬匹配一個與你 MMR 接近的對手
  let opponentMmr = player.mmr + random(-50, 50);
  
  // 2. 計算 ELO 變動 (經典公式)
  let expectedWinRate = 1 / (1 + Math.pow(10, (opponentMmr - player.elo) / 400));
  
  // 3. MMR 的特殊加成：如果 MMR > ELO，贏球加更多，輸球扣更少 (系統嘗試修正)
  let mmrBonus = (player.mmr - player.elo) * 0.1; 
  
  // 修正：當 MMR > ELO 時，無論輸贏都應該獲得正向修正量（贏了加更多，輸了扣更少）
  let eloChange = kFactor * (isWin - expectedWinRate) + (isWin === 1 ? mmrBonus : mmrBonus / 2);
  player.elo += Math.round(eloChange);
  
  // 4. 更新 MMR (MMR 通常變動更敏感，用於快速定位實力)
  let mmrChange = kFactor * 1.5 * (isWin - 0.5); // 簡化版 MMR 邏輯
  player.mmr += mmrChange;
  
  // 更新日誌
  let resultText = isWin ? "【勝利】" : "【失敗】";
  matchLog = `${resultText} 對手 MMR: ${Math.round(opponentMmr)} | ELO 變動: ${Math.round(eloChange)}`;
  
  recordData();
}

function recordData() {
  player.history.push({ elo: player.elo, mmr: player.mmr });
  if (player.history.length > 21) player.history.shift();
}