// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------


// let scoreText = "成績分數: " + finalScore + "/" + maxScore;
// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字

// !!! 新增：用於管理煙火特效的全域陣列 !!!
let fireworks = []; 

window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        const previousPercentage = maxScore > 0 ? (finalScore / maxScore) * 100 : 0; // 計算舊百分比
        
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        const newPercentage = maxScore > 0 ? (finalScore / maxScore) * 100 : 0; // 計算新百分比
        
        // !!! 關鍵步驟：如果分數從 < 90 跳到 >= 90，則清除舊煙火並準備發射新煙火 (可選)
        if (newPercentage >= 90 && previousPercentage < 90) {
            // 清空舊的煙火，讓新的分數狀態重新開始 (可選)
            fireworks = []; 
        }

        // ----------------------------------------
        // 關鍵步驟 2: 呼叫重新繪製 (見方案二)
        // ----------------------------------------
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() { 
    // ... (其他設置)
    createCanvas(windowWidth / 2, windowHeight / 2); 
    background(255); 
    // 移除 noLoop()，因為煙火需要連續繪製動畫。
    // 如果您需要保持 noLoop()，則需要在 firework 啟動時使用 loop()，結束時使用 noLoop()
    // 這裡我們假設使用 loop()
    // noLoop(); 
} 

// score_display.js 中的 draw() 函數片段

function draw() { 
    // 為了煙火軌跡效果，背景用低透明度重新繪製 (0, 25)
    background(0, 0, 0, 25); // 稍微透明的黑色，形成殘影效果

    // 計算百分比
    let percentage = (finalScore / maxScore) * 100;

    textSize(80); 
    textAlign(CENTER);
    
    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        // 滿分或高分：顯示鼓勵文本，使用鮮豔顏色
        fill(0, 200, 50); // 綠色 
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
        // !!! 新增：煙火發射邏輯 !!!
        // 每幀以一定的機率（例如 4%）發射一個新的煙火。
        if (random(1) < 0.04) {
            // 假設 Firework 類別已定義，且 new Firework() 會在畫布底部隨機位置產生煙花火箭
            // 注意：這個類別必須在另一個檔案（如 firework.js）或在 setup/draw 之外定義
            // 為了讓這段程式碼運行，您需要額外實現 Firework 和 Particle 類別。
            // 這裡我們只是將邏輯加入 draw()。
            if (typeof Firework === 'function') {
                 fireworks.push(new Firework()); 
            } else {
                 console.warn("Firework 類別未定義，請補齊相關程式碼。");
            }
        }
        
    } else if (percentage >= 60) {
        // 中等分數：顯示一般文本，使用黃色 
        fill(255, 181, 35); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分：顯示警示文本，使用紅色 
        fill(200, 0, 0); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數或分數為 0
        fill(150);
        text(scoreText, width / 2, height / 2);
    }

    // 顯示具體分數
    textSize(50);
    fill(50);
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 (畫面反映二)
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        // 畫一個大圓圈代表完美 
        fill(0, 200, 50, 150); // 帶透明度
        noStroke();
        circle(width / 2, height / 2 + 150, 150);
        
    } else if (percentage >= 60) {
        // 畫一個方形 
        fill(255, 181, 35, 150);
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
    }
    
    // -----------------------------------------------------------------
    // C. 煙火動畫更新與繪製
    // -----------------------------------------------------------------
    
    // 遍歷所有煙火，更新其狀態並繪製
    for (let i = fireworks.length - 1; i >= 0; i--) {
        // 假設 Firework 實例有 update() 和 show() 方法
        fireworks[i].update(); 
        fireworks[i].show();
        
        // 假設 Firework 實例有 isFinished() 方法來判斷是否結束
        if (fireworks[i].isFinished()) {
            // 如果煙火完成，則從陣列中移除
            fireworks.splice(i, 1);
        }
    }
    // =================================================================
// 步驟三：煙火粒子系統定義 (Firework 和 Particle 類別)
// -----------------------------------------------------------------

// 全域重力向量
const gravity = 0.2; 
const colors = [];

// 在 setup() 中初始化顏色
function initColors() {
    for (let i = 0; i < 255; i++) {
        // 使用 HSB 色彩模式創建彩虹色
        colors.push(color(random(255), 255, 255)); 
    }
}

// 粒子類別 (Particle Class) - 構成爆炸碎片
class Particle {
    constructor(x, y, hu, firework) {
        this.pos = createVector(x, y);
        this.firework = firework; // 是否為發射中的火箭 (true) 或爆炸後的碎片 (false)
        this.lifespan = 255; 
        this.hu = hu;
        
        if (this.firework) {
            // 火箭向上發射
            this.vel = createVector(random(-1.5, 1.5), random(-10, -15));
        } else {
            // 爆炸碎片向外發散
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 10)); // 隨機速度
        }
        this.acc = createVector(0, 0);
    }

    // 施加力 (例如重力)
    applyForce(force) {
        this.acc.add(force);
    }

    // 更新粒子狀態
    update() {
        if (!this.firework) {
            // 碎片會衰減並受到重力影響
            this.vel.mult(0.95); // 摩擦力/空氣阻力
            this.lifespan -= 4; // 壽命減少
            this.applyForce(createVector(0, gravity));
        }
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // 清除加速度
    }

    // 判斷粒子是否結束
    isFinished() {
        return this.lifespan < 0;
    }

    // 繪製粒子
    show() {
        colorMode(HSB);
        
        if (!this.firework) {
            // 碎片
            strokeWeight(2);
            stroke(this.hu, 255, 255, this.lifespan);
        } else {
            // 火箭
            strokeWeight(4);
            stroke(this.hu, 255, 255);
        }
        point(this.pos.x, this.pos.y);
        colorMode(RGB); // 恢復 RGB 模式，避免影響其他繪圖
    }
}

// 煙火類別 (Firework Class) - 代表一個完整的煙火從發射到爆炸
class Firework {
    constructor() {
        // 隨機發射位置在畫布底部
        this.hu = random(255); // 隨機顏色
        this.firework = new Particle(random(width), height, this.hu, true); // 火箭粒子
        this.exploded = false;
        this.particles = [];
    }

    // 檢查煙火是否完成 (火箭爆炸且所有碎片都消失)
    isFinished() {
        return (this.exploded && this.particles.length === 0);
    }

    // 爆炸
    explode() {
        // 產生 100 個碎片粒子
        for (let i = 0; i < 100; i++) {
            let p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hu, false);
            this.particles.push(p);
        }
    }

    // 更新煙火狀態
    update() {
        if (!this.exploded) {
            this.firework.update();

            // 如果火箭速度開始向下 (到達最高點)
            if (this.firework.vel.y >= 0) {
                this.exploded = true;
                this.explode();
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].isFinished()) {
                this.particles.splice(i, 1);
            }
        }
    }

    // 繪製煙火
    show() {
        if (!this.exploded) {
            this.firework.show();
        }

        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].show();
        }
    }
}


// --- 警告：您還需要在 setup() 中加入顏色模式設定！ ---
// 請修改您的 setup 函數，讓顏色模式能夠支援煙火的 HSB 顏色。

/* 您的 setup() 應該修改為：
function setup() { 
    createCanvas(windowWidth / 2, windowHeight / 2); 
    background(0); // 將背景設為黑色，煙火效果更明顯
    colorMode(HSB, 255); // 設定為 HSB 顏色模式，H:0-255, S:0-255, B:0-255
    // noLoop(); // 由於需要動畫，此行應移除或註解
} 
*/

    // 如果您想要更複雜的視覺效果，還可以根據分數修改線條粗細 (strokeWeight) 
    // 或使用 sin/cos 函數讓圖案的動畫效果有所不同 
}

// *** 警告/提醒：為了讓上述煙火邏輯 (C 部分) 正常運行，您必須定義以下類別：***
// class Particle { ... }
// class Firework { ... }
// 這些類別應包含必要的屬性 (位置、速度、顏色等) 和方法 (update, show, isFinished)。
// 由於篇幅限制，這裡不提供完整的粒子系統程式碼。
