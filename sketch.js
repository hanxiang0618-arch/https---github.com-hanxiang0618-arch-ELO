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
    // 1. 繪製左側資訊面板
    drawDashboard();
    
    // 2. 繪製右側匹配區域
    drawMatchArea();
    
    // 3. 繪製下方的數據圖表
    drawChart();
  }
}

function drawIntroScreen() {
  push();
  textAlign(CENTER, CENTER);
  
  // 標題
  fill(50);
  textSize(36);
  textStyle(BOLD);
  text("ELO 積分系統模擬器", width / 2, height / 2 - 80);
  
  // 說明文字
  textSize(16);
  textStyle(NORMAL);
  let desc = "本工具模擬競技遊戲的評分邏輯：\n\n1. ELO 是你的公開分數。\n2. MMR 是系統對你實力的隱藏評估。\n3. 當 MMR 高於 ELO 時，系統會讓你贏球加更多分，輸球扣較少。\n\n點擊下方按鈕開始模擬對戰過程。";
  text(desc, width / 2, height / 2 + 10);
  
  // 開始按鈕
  fill(76, 175, 80);
  noStroke();
  rectMode(CENTER);
  rect(width / 2, height / 2 + 120, 140, 45, 8);
  fill(255);
  textSize(20);
  text("開始體驗", width / 2, height / 2 + 120);
  pop();
}

function drawDashboard() {
  fill(255);
  stroke(200);
  rect(20, 20, 200, 160, 10);
  
  fill(50);
  noStroke();
  textSize(18);
  textStyle(BOLD);
  text("玩家資訊", 40, 50);
  
  textSize(14);
  textStyle(NORMAL);
  fill(0, 102, 204);
  text("ELO (公開): " + player.elo, 40, 80);
  fill(204, 0, 102);
  text("MMR (隱藏): " + Math.round(player.mmr), 40, 110);
  
  fill(100);
  text("場次: " + matchCount, 40, 140);
}

function drawMatchArea() {
  fill(255);
  stroke(200);
  rect(240, 20, width - 260, 160, 10);
  
  fill(50);
  noStroke();
  textSize(16);
  text(matchLog, 260, 60);
  
  // 按鈕 UI (簡單繪製，偵測滑鼠點擊)
  fill(76, 175, 80);
  rect(260, 90, 120, 40, 5);
  fill(255);
  text("隨機對戰", 290, 115);
  
  fill(33, 150, 243);
  rect(400, 90, 120, 40, 5);
  fill(255);
  text("故意連勝", 430, 115);
}

function drawChart() {
  push();
  let chartWidth = width - 100;
  let chartHeight = height - 250;
  translate(50, height - 50);
  
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
    let y = map(player.history[i].elo, 800, 2000, 0, -chartHeight);
    vertex(x, y);
  }
  endShape();
  
  // 繪製 MMR 線 (紅色)
  stroke(204, 0, 102);
  beginShape();
  for (let i = 0; i < player.history.length; i++) {
    let x = i * (chartWidth / 20);
    let y = map(player.history[i].mmr, 800, 2000, 0, -chartHeight);
    vertex(x, y);
  }
  endShape();
  
  pop();
  fill(150);
  textSize(12);
  text("藍線: ELO (公開) | 紅線: MMR (隱藏) | 橫軸: 場次", 50, height - 20);
}

// 點擊事件處理
function mousePressed() {
  if (gameState === "intro") {
    // 檢查「開始體驗」按鈕範圍 (居中按鈕的座標計算)
    if (mouseX > width / 2 - 70 && mouseX < width / 2 + 70 &&
        mouseY > height / 2 + 97 && mouseY < height / 2 + 143) {
      gameState = "playing";
    }
    return;
  }

  // 隨機對戰按鈕
  if (mouseX > 260 && mouseX < 380 && mouseY > 90 && mouseY < 130) {
    runMatch(random([0, 1])); // 隨機輸贏
  }
  // 故意連勝按鈕
  if (mouseX > 400 && mouseX < 520 && mouseY > 90 && mouseY < 130) {
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